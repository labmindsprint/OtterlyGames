package com.otterlygames.spaceacademy

import android.app.Activity
import android.os.Bundle
import android.os.Handler
import android.os.SystemClock
import com.google.ads.mediation.admob.AdMobAdapter
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AgeRestrictedTreatment
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * One preloaded rewarded ad, child-safe. All methods run on the main thread. The web layer owns the daily cap; this
 * class only loads, shows and preloads the next ad.
 */
internal class RewardedAdController(
    private val activity: Activity,
    private val handler: Handler,
    private val adUnitId: String,
    private val now: () -> Long = SystemClock::elapsedRealtime,
) {
    private class Waiter(val callback: (Boolean) -> Unit) {
        var done = false
    }

    private val slot = RewardedAdSlot()
    private val waiters = mutableListOf<Waiter>()
    private var worker: ExecutorService? = null
    private var ad: RewardedAd? = null
    private var sdkReady = false
    private var destroyed = false

    fun start() {
        if (worker != null || destroyed) return
        val executor = Executors.newSingleThreadExecutor()
        worker = executor
        executor.execute {
            try {
                // Must be set before initialize so no request ever goes out untagged.
                MobileAds.setRequestConfiguration(childSafeConfiguration())
                MobileAds.initialize(activity.applicationContext) {
                    handler.post {
                        sdkReady = true
                        load()
                    }
                }
            } catch (_: Throwable) {
                // The ad SDK is optional: without it available() stays false and the game carries on.
            }
        }
    }

    /** Resolves true only if an ad is loaded. If a load is in flight it waits briefly so a fresh start is not a false "no". */
    fun available(callback: (Boolean) -> Unit) {
        if (destroyed) return callback(false)
        if (slot.isAvailable(now())) return callback(true)
        load()
        if (!slot.isLoading && sdkReady) return callback(false)
        val waiter = Waiter(callback)
        waiters += waiter
        handler.postDelayed({ settle(waiter) }, AVAILABLE_WAIT_MS)
    }

    /** Resolves true only if the child earned the reward; always false on any failure. Preloads the next ad. */
    fun show(callback: (Boolean) -> Unit) {
        val shown = ad
        if (destroyed || shown == null || !slot.beginShow(now())) {
            load()
            return callback(false)
        }
        ad = null
        var earned = false
        var finished = false
        fun finish() {
            if (finished) return
            finished = true
            slot.finishShow()
            callback(earned)
            load()
        }
        shown.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() = finish()

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                earned = false
                finish()
            }
        }
        try {
            shown.show(activity) { earned = true }
        } catch (_: Throwable) {
            earned = false
            finish()
        }
    }

    fun destroy() {
        destroyed = true
        ad?.fullScreenContentCallback = null
        ad = null
        worker?.shutdown()
        worker = null
        waiters.toList().forEach(::settle)
    }

    private fun load() {
        if (destroyed || !sdkReady || !slot.mayLoad(now())) return
        slot.beginLoad()
        try {
            RewardedAd.load(activity, adUnitId, childSafeRequest(), object : RewardedAdLoadCallback() {
                override fun onAdLoaded(loaded: RewardedAd) {
                    if (destroyed) return
                    ad = loaded
                    slot.loaded(now())
                    settleAll()
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    if (destroyed) return
                    ad = null
                    slot.failed(now())
                    settleAll()
                }
            })
        } catch (_: Throwable) {
            slot.failed(now())
            settleAll()
        }
    }

    private fun settleAll() = waiters.toList().forEach(::settle)

    private fun settle(waiter: Waiter) {
        if (waiter.done) return
        waiter.done = true
        waiters.remove(waiter)
        waiter.callback(!destroyed && slot.isAvailable(now()))
    }

    companion object {
        private const val AVAILABLE_WAIT_MS = 3_000L

        /**
         * Child-directed, under the age of consent, G-rated. These tags also turn personalised ads off. The legacy
         * TFCD/TFUA tags are deprecated in favour of age treatment but remain honoured; Google applies the most
         * conservative combination, so both are set.
         */
        @Suppress("DEPRECATION")
        fun childSafeConfiguration(): RequestConfiguration = RequestConfiguration.Builder()
            .setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)
            .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
            .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
            .build()

        /** Explicit non-personalised flag as a second guard on top of the child tags. */
        fun childSafeRequest(): AdRequest = AdRequest.Builder()
            .addNetworkExtrasBundle(AdMobAdapter::class.java, Bundle().apply { putString("npa", "1") })
            .build()
    }
}
