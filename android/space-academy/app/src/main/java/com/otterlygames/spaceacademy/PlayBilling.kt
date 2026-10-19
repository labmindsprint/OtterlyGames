package com.otterlygames.spaceacademy

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams

/**
 * Play Billing for fuel-5, fuel-15 (consumable) and remove-ads (one time). Main thread only.
 *
 * buy() reports ok only after the purchase is consumed (fuel packs) or acknowledged (remove-ads), because the game
 * grants as soon as it resolves. Pending payments resolve ok:false and are recovered by buy()/restore() once paid.
 */
internal class PlayBilling(context: Context, private val activity: Activity) {
    private class PendingBuy(val productId: String, val callback: (Boolean) -> Unit)

    private val client: BillingClient = BillingClient.newBuilder(context)
        .setListener { result, purchases -> onPurchasesUpdated(result, purchases.orEmpty()) }
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()
    private val connectWaiters = mutableListOf<(Boolean) -> Unit>()
    private val details = mutableMapOf<String, ProductDetails>()
    private var connecting = false
    private var pendingBuy: PendingBuy? = null
    private var destroyed = false

    /** Quietly acknowledges one-time purchases that were paid but never acknowledged (for example a crash mid-purchase). */
    fun reconcile() = restore { }

    fun products(callback: (List<ProductPrice>) -> Unit) {
        whenReady { ready ->
            if (!ready) return@whenReady callback(emptyList())
            queryDetails { callback(ProductCatalog.prices(it)) }
        }
    }

    fun buy(productId: String, callback: (Boolean) -> Unit) {
        if (destroyed || !Products.isKnown(productId) || pendingBuy != null) return callback(false)
        pendingBuy = PendingBuy(productId, callback)
        whenReady { ready ->
            if (!ready) return@whenReady finishBuy(false)
            queryDetails {
                val product = details[productId] ?: return@queryDetails finishBuy(false)
                launchFlow(product)
            }
        }
    }

    fun restore(callback: (List<String>) -> Unit) {
        whenReady { ready ->
            if (!ready) return@whenReady callback(emptyList())
            queryOwned { purchases ->
                if (purchases == null) return@queryOwned callback(emptyList())
                val owned = PurchaseLogic.ownedOneTimeIds(purchases.map { OwnedPurchase(it.products, it.purchaseState) })
                purchases.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED && !it.isAcknowledged }
                    .filter { purchase -> purchase.products.any { it in owned } }
                    .forEach { acknowledge(it) { } }
                callback(owned)
            }
        }
    }

    fun destroy() {
        destroyed = true
        finishBuy(false)
        connectWaiters.toList().also { connectWaiters.clear() }.forEach { it(false) }
        if (client.isReady) client.endConnection()
    }

    private fun launchFlow(product: ProductDetails) {
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).build()),
            )
            .build()
        val result = try {
            client.launchBillingFlow(activity, params)
        } catch (_: Throwable) {
            return finishBuy(false)
        }
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> Unit
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> recoverOwned()
            else -> finishBuy(false)
        }
    }

    /** The product is already owned (paid earlier but never delivered): finish delivery instead of charging twice. */
    private fun recoverOwned() {
        val wanted = pendingBuy?.productId ?: return
        queryOwned { purchases ->
            val match = purchases.orEmpty().firstOrNull { wanted in it.products }
            if (match == null) finishBuy(false) else deliver(wanted, match)
        }
    }

    private fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>) {
        val wanted = pendingBuy?.productId ?: return
        if (result.responseCode == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) return recoverOwned()
        if (result.responseCode != BillingClient.BillingResponseCode.OK) return finishBuy(false)
        val match = purchases.firstOrNull { wanted in it.products } ?: return finishBuy(false)
        deliver(wanted, match)
    }

    private fun deliver(productId: String, purchase: Purchase) {
        when (PurchaseLogic.plan(productId, purchase.purchaseState, purchase.isAcknowledged)) {
            PurchaseAction.CONSUME -> consume(purchase) { finishBuy(it) }
            PurchaseAction.ACKNOWLEDGE -> acknowledge(purchase) { finishBuy(it) }
            PurchaseAction.GRANT_ONLY -> finishBuy(true)
            PurchaseAction.PENDING, PurchaseAction.IGNORE -> finishBuy(false)
        }
    }

    private fun finishBuy(ok: Boolean) {
        val buy = pendingBuy ?: return
        pendingBuy = null
        buy.callback(ok)
    }

    private fun consume(purchase: Purchase, callback: (Boolean) -> Unit) {
        val params = ConsumeParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()
        client.consumeAsync(params) { result, _ ->
            callback(result.responseCode == BillingClient.BillingResponseCode.OK)
        }
    }

    private fun acknowledge(purchase: Purchase, callback: (Boolean) -> Unit) {
        val params = AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()
        client.acknowledgePurchase(params) { result ->
            callback(result.responseCode == BillingClient.BillingResponseCode.OK)
        }
    }

    private fun queryOwned(callback: (List<Purchase>?) -> Unit) {
        val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()
        client.queryPurchasesAsync(params) { result, purchases ->
            callback(if (result.responseCode == BillingClient.BillingResponseCode.OK) purchases else null)
        }
    }

    private fun queryDetails(callback: (List<ProductPrice>) -> Unit) {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                Products.ALL.map {
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(it)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                },
            )
            .build()
        client.queryProductDetailsAsync(params) { result, queried ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryProductDetailsAsync callback(emptyList())
            val prices = queried.productDetailsList.mapNotNull { product ->
                val price = product.oneTimePurchaseOfferDetails?.formattedPrice ?: return@mapNotNull null
                details[product.productId] = product
                ProductPrice(product.productId, price)
            }
            callback(prices)
        }
    }

    private fun whenReady(action: (Boolean) -> Unit) {
        if (destroyed) return action(false)
        if (client.isReady) return action(true)
        connectWaiters += action
        if (connecting) return
        connecting = true
        try {
            client.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(result: BillingResult) {
                    connecting = false
                    val ok = result.responseCode == BillingClient.BillingResponseCode.OK
                    connectWaiters.toList().also { connectWaiters.clear() }.forEach { it(ok) }
                }

                override fun onBillingServiceDisconnected() = Unit
            })
        } catch (_: Throwable) {
            connecting = false
            connectWaiters.toList().also { connectWaiters.clear() }.forEach { it(false) }
        }
    }
}
