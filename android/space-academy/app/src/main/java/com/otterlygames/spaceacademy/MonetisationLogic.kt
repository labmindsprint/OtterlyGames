package com.otterlygames.spaceacademy

import com.android.billingclient.api.Purchase
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import kotlin.math.min

/** The three Play Console products. Ids must match js/space-academy/pitstop/fuel.mjs. */
internal object Products {
    const val FUEL_5 = "fuel-5"
    const val FUEL_15 = "fuel-15"
    const val REMOVE_ADS = "remove-ads"

    val ALL = listOf(FUEL_5, FUEL_15, REMOVE_ADS)
    val CONSUMABLE = setOf(FUEL_5, FUEL_15)

    fun isKnown(id: String?): Boolean = id != null && id in ALL
    fun isConsumable(id: String): Boolean = id in CONSUMABLE
}

internal enum class NativeMethod(val wire: String) {
    AD_AVAILABLE("rewardedAd.available"),
    AD_SHOW("rewardedAd.show"),
    PRODUCTS("billing.products"),
    BUY("billing.buy"),
    RESTORE("billing.restore"),
    TTS_SPEAK("tts.speak"),
    TTS_STOP("tts.stop"),
}

internal data class NativeRequest(val token: String, val id: Long, val method: NativeMethod, val arg: String?)

/** Wire format between the injected shim (res/raw/otterly_native_shim.js) and the Kotlin host. */
internal object NativeProtocol {
    private val TOKEN = Regex("[A-Za-z0-9]{1,64}")
    private const val MAX_PAYLOAD = 2048
    private const val MAX_ARG = 64

    fun parse(payload: String?): NativeRequest? {
        if (payload == null || payload.length > MAX_PAYLOAD) return null
        val json = try {
            JSONObject(payload)
        } catch (_: JSONException) {
            return null
        }
        val token = json.optString("token", "").takeIf { TOKEN.matches(it) } ?: return null
        val id = (json.opt("id") as? Number)?.toLong()?.takeIf { it > 0 } ?: return null
        val method = NativeMethod.entries.firstOrNull { it.wire == json.optString("method", "") } ?: return null
        val limit = if (method == NativeMethod.TTS_SPEAK) SpeechText.MAX_CHARS else MAX_ARG
        val arg = (json.opt("arg") as? String)?.takeIf { it.length <= limit }
        return NativeRequest(token, id, method, arg)
    }

    fun available(value: Boolean): String = value.toString()
    fun shown(rewarded: Boolean): String = JSONObject().put("rewarded", rewarded).toString()
    fun bought(ok: Boolean): String = JSONObject().put("ok", ok).toString()
    fun spoke(ok: Boolean): String = JSONObject().put("ok", ok).toString()
    fun restored(ids: List<String>): String = JSONObject().put("ids", JSONArray(ids)).toString()
    fun products(list: List<ProductPrice>): String = JSONArray().also { array ->
        list.forEach { array.put(JSONObject().put("id", it.id).put("price", it.price)) }
    }.toString()

    /** Failure value for a method, used when the native side cannot do better. */
    fun fallback(method: NativeMethod): String = when (method) {
        NativeMethod.AD_AVAILABLE -> available(false)
        NativeMethod.AD_SHOW -> shown(false)
        NativeMethod.PRODUCTS -> products(emptyList())
        NativeMethod.BUY -> bought(false)
        NativeMethod.RESTORE -> restored(emptyList())
        NativeMethod.TTS_SPEAK -> spoke(false)
        NativeMethod.TTS_STOP -> available(false)
    }

    /** JavaScript that settles one shim promise. The JSON value is a trusted literal produced above. */
    fun settleScript(request: NativeRequest, valueJson: String): String =
        "globalThis.__otterlyNativeSettle(${JSONObject.quote(request.token)},${request.id},$valueJson);"
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
}

internal data class ProductPrice(val id: String, val price: String)

internal object ProductCatalog {
    /** Keeps only known products that have a localised price, in the fixed catalogue order. */
    fun prices(found: List<ProductPrice>): List<ProductPrice> {
        val byId = found.filter { Products.isKnown(it.id) && it.price.isNotBlank() }.associateBy { it.id }
        return Products.ALL.mapNotNull(byId::get)
    }
}

internal enum class PurchaseAction {
    /** Consumable bought: consume it, then grant. */
    CONSUME,
    /** One-time product bought but not acknowledged yet: acknowledge, then grant. */
    ACKNOWLEDGE,
    /** One-time product already acknowledged: grant, nothing to call. */
    GRANT_ONLY,
    /** Payment not completed (slow payment method): never grant. */
    PENDING,
    /** Unknown product, unspecified or cancelled state. */
    IGNORE,
}

internal object PurchaseLogic {
    fun plan(productId: String, state: Int, acknowledged: Boolean): PurchaseAction = when {
        !Products.isKnown(productId) -> PurchaseAction.IGNORE
        state == Purchase.PurchaseState.PENDING -> PurchaseAction.PENDING
        state != Purchase.PurchaseState.PURCHASED -> PurchaseAction.IGNORE
        Products.isConsumable(productId) -> PurchaseAction.CONSUME
        acknowledged -> PurchaseAction.GRANT_ONLY
        else -> PurchaseAction.ACKNOWLEDGE
    }

    /** Non-consumable ids the child owns now (purchased, not pending), without duplicates. */
    fun ownedOneTimeIds(purchases: List<OwnedPurchase>): List<String> =
        purchases.filter { it.state == Purchase.PurchaseState.PURCHASED }
            .flatMap { it.products }
            .filter { Products.isKnown(it) && !Products.isConsumable(it) }
            .distinct()
}

internal data class OwnedPurchase(val products: List<String>, val state: Int)

/**
 * Tracks one preloaded rewarded ad. Pure so the load/expire/retry rules are unit tested. The ad is available only
 * while READY and younger than [ttlMs] (Google expires loaded rewarded ads after about an hour).
 */
internal class RewardedAdSlot(
    private val ttlMs: Long = 55 * 60_000L,
    private val retryDelayMs: (failures: Int) -> Long = ::defaultRetryDelayMs,
) {
    enum class State { EMPTY, LOADING, READY, SHOWING }

    var state = State.EMPTY
        private set
    private var loadedAt = 0L
    private var failures = 0
    private var retryAt = 0L

    val isLoading: Boolean get() = state == State.LOADING

    fun isAvailable(now: Long): Boolean = state == State.READY && now - loadedAt < ttlMs

    /** True when a new load should start now: nothing usable is held and any retry back-off has elapsed. */
    fun mayLoad(now: Long): Boolean =
        (state == State.EMPTY || (state == State.READY && !isAvailable(now))) && now >= retryAt

    fun beginLoad() {
        state = State.LOADING
    }

    fun loaded(now: Long) {
        state = State.READY
        loadedAt = now
        failures = 0
        retryAt = 0L
    }

    fun failed(now: Long) {
        state = State.EMPTY
        failures++
        retryAt = now + retryDelayMs(failures)
    }

    fun beginShow(now: Long): Boolean {
        if (!isAvailable(now)) return false
        state = State.SHOWING
        return true
    }

    /** After a show the slot is empty with no back-off, so the next ad is requested immediately. */
    fun finishShow() {
        state = State.EMPTY
    }
}

/** 5s, 10s, 20s, 40s, then 60s between failed loads. */
internal fun defaultRetryDelayMs(failures: Int): Long = min(60_000L, 5_000L shl (failures - 1).coerceIn(0, 4))
