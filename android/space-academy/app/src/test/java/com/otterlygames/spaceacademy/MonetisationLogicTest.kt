package com.otterlygames.spaceacademy

import com.android.billingclient.api.Purchase
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MonetisationLogicTest {
    private fun request(method: String, arg: String? = null, token: String = "abc123", id: Any = 7): String =
        JSONObject().put("token", token).put("id", id).put("method", method).put("arg", arg ?: JSONObject.NULL).toString()

    @Test
    fun requestsParseOnlyWhenWellFormed() {
        val parsed = NativeProtocol.parse(request("billing.buy", "fuel-5"))
        assertEquals(NativeRequest("abc123", 7, NativeMethod.BUY, "fuel-5"), parsed)
        assertEquals(NativeMethod.AD_SHOW, NativeProtocol.parse(request("rewardedAd.show"))?.method)
        assertNull(NativeProtocol.parse(null))
        assertNull(NativeProtocol.parse("not json"))
        assertNull(NativeProtocol.parse(request("billing.refund")))
        assertNull(NativeProtocol.parse(request("billing.buy", token = "bad token\"); alert(1);//")))
        assertNull(NativeProtocol.parse(request("billing.buy", id = "7")))
        assertNull(NativeProtocol.parse(request("billing.buy", id = 0)))
        assertNull(NativeProtocol.parse("x".repeat(600)))
    }

    @Test
    fun nonStringArgumentsAreDropped() {
        val payload = JSONObject(request("billing.buy")).put("arg", JSONArray().put("fuel-5")).toString()
        assertNull(NativeProtocol.parse(payload)?.arg)
    }

    @Test
    fun everyMethodHasAFailureValueThatMatchesTheContract() {
        assertEquals("false", NativeProtocol.fallback(NativeMethod.AD_AVAILABLE))
        assertFalse(JSONObject(NativeProtocol.fallback(NativeMethod.AD_SHOW)).getBoolean("rewarded"))
        assertEquals(0, JSONArray(NativeProtocol.fallback(NativeMethod.PRODUCTS)).length())
        assertFalse(JSONObject(NativeProtocol.fallback(NativeMethod.BUY)).getBoolean("ok"))
        assertEquals(0, JSONObject(NativeProtocol.fallback(NativeMethod.RESTORE)).getJSONArray("ids").length())
    }

    @Test
    fun settleScriptQuotesTheTokenAndKeepsTheValueLiteral() {
        val script = NativeProtocol.settleScript(NativeRequest("abc123", 42, NativeMethod.BUY, null), NativeProtocol.bought(true))
        assertEquals("globalThis.__otterlyNativeSettle(\"abc123\",42,{\"ok\":true});", script)
        val priced = NativeProtocol.products(listOf(ProductPrice("fuel-5", "₹49.00\u2028")))
        assertFalse(NativeProtocol.settleScript(NativeRequest("t", 1, NativeMethod.PRODUCTS, null), priced).contains('\u2028'))
    }

    @Test
    fun catalogueKeepsKnownPricedProductsInFixedOrder() {
        val prices = ProductCatalog.prices(
            listOf(
                ProductPrice("remove-ads", "₹150.00"),
                ProductPrice("other", "₹1.00"),
                ProductPrice("fuel-15", ""),
                ProductPrice("fuel-5", "₹49.00"),
            ),
        )
        assertEquals(listOf(ProductPrice("fuel-5", "₹49.00"), ProductPrice("remove-ads", "₹150.00")), prices)
        val json = JSONArray(NativeProtocol.products(prices.take(1)))
        assertEquals(1, json.length())
        assertEquals("fuel-5", json.getJSONObject(0).getString("id"))
        assertEquals("₹49.00", json.getJSONObject(0).getString("price"))
    }

    @Test
    fun consumablesAreConsumedAndOneTimeProductsAcknowledgedBeforeAnyGrant() {
        val purchased = Purchase.PurchaseState.PURCHASED
        assertEquals(PurchaseAction.CONSUME, PurchaseLogic.plan("fuel-5", purchased, false))
        assertEquals(PurchaseAction.CONSUME, PurchaseLogic.plan("fuel-15", purchased, true))
        assertEquals(PurchaseAction.ACKNOWLEDGE, PurchaseLogic.plan("remove-ads", purchased, false))
        assertEquals(PurchaseAction.GRANT_ONLY, PurchaseLogic.plan("remove-ads", purchased, true))
    }

    @Test
    fun pendingUnspecifiedAndUnknownPurchasesNeverGrant() {
        assertEquals(PurchaseAction.PENDING, PurchaseLogic.plan("fuel-5", Purchase.PurchaseState.PENDING, false))
        assertEquals(PurchaseAction.PENDING, PurchaseLogic.plan("remove-ads", Purchase.PurchaseState.PENDING, false))
        assertEquals(PurchaseAction.IGNORE, PurchaseLogic.plan("fuel-5", Purchase.PurchaseState.UNSPECIFIED_STATE, false))
        assertEquals(PurchaseAction.IGNORE, PurchaseLogic.plan("gems-100", Purchase.PurchaseState.PURCHASED, false))
    }

    @Test
    fun restoreReturnsOnlyOwnedNonConsumables() {
        val ids = PurchaseLogic.ownedOneTimeIds(
            listOf(
                OwnedPurchase(listOf("fuel-5"), Purchase.PurchaseState.PURCHASED),
                OwnedPurchase(listOf("remove-ads"), Purchase.PurchaseState.PURCHASED),
                OwnedPurchase(listOf("remove-ads"), Purchase.PurchaseState.PURCHASED),
            ),
        )
        assertEquals(listOf("remove-ads"), ids)
        assertTrue(
            PurchaseLogic.ownedOneTimeIds(listOf(OwnedPurchase(listOf("remove-ads"), Purchase.PurchaseState.PENDING))).isEmpty(),
        )
    }

    @Test
    fun adSlotIsAvailableOnlyWhileLoadedAndFresh() {
        val slot = RewardedAdSlot(ttlMs = 1_000)
        assertFalse(slot.isAvailable(0))
        assertTrue(slot.mayLoad(0))
        slot.beginLoad()
        assertTrue(slot.isLoading)
        assertFalse(slot.mayLoad(0))
        slot.loaded(100)
        assertTrue(slot.isAvailable(1_099))
        assertFalse(slot.isAvailable(1_100))
        assertTrue(slot.mayLoad(1_100))
    }

    @Test
    fun adSlotBacksOffAfterFailuresAndPreloadsImmediatelyAfterAShow() {
        val slot = RewardedAdSlot()
        slot.beginLoad()
        slot.failed(0)
        assertFalse(slot.mayLoad(4_999))
        assertTrue(slot.mayLoad(5_000))
        slot.beginLoad()
        slot.failed(5_000)
        assertFalse(slot.mayLoad(14_999))
        assertTrue(slot.mayLoad(15_000))
        assertEquals(60_000, defaultRetryDelayMs(50))

        slot.beginLoad()
        slot.loaded(20_000)
        assertFalse(slot.beginShow(20_000 + 56 * 60_000))
        assertTrue(slot.beginShow(21_000))
        assertFalse(slot.isAvailable(21_000))
        assertFalse(slot.beginShow(21_000))
        slot.finishShow()
        assertTrue(slot.mayLoad(21_000))
    }
}
