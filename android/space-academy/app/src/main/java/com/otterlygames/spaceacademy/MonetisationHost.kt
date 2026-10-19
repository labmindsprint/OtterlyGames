package com.otterlygames.spaceacademy

import android.app.Activity
import android.os.Handler
import android.webkit.JavascriptInterface
import android.webkit.WebView

/**
 * Exposed to the page as window.OtterlyNativeHost.request(json). The injected shim (res/raw/otterly_native_shim.js)
 * turns it into window.OtterlyNative. Requests are answered by calling window.__otterlyNativeSettle(token, id, value).
 * Nothing here ever throws into the page: any problem settles with the method's failure value.
 */
internal class MonetisationHost(
    activity: Activity,
    private val handler: Handler,
    private val gameView: () -> WebView?,
) {
    private val ads = RewardedAdController(activity, handler, BuildConfig.REWARDED_AD_UNIT_ID)
    private val billing = PlayBilling(activity.applicationContext, activity)
    private val speech = NativeSpeech(activity.applicationContext, handler)
    private var destroyed = false
    private var showing = false

    fun start() {
        ads.start()
        billing.reconcile()
    }

    /** Called when the app leaves the foreground so nothing keeps talking. */
    fun silence() = speech.stop()

    fun destroy() {
        destroyed = true
        ads.destroy()
        billing.destroy()
        speech.destroy()
    }

    @JavascriptInterface
    fun request(payload: String?) {
        val request = NativeProtocol.parse(payload) ?: return
        handler.post {
            if (destroyed) return@post
            val view = gameView()
            if (view == null || !WebRoutes.isTrustedGame(view.url)) return@post
            try {
                dispatch(request, view)
            } catch (_: Throwable) {
                settle(view, request, NativeProtocol.fallback(request.method))
            }
        }
    }

    private fun dispatch(request: NativeRequest, view: WebView) {
        val reply = { json: String -> settle(view, request, json) }
        when (request.method) {
            NativeMethod.AD_AVAILABLE -> ads.available { reply(NativeProtocol.available(it)) }
            NativeMethod.AD_SHOW -> {
                if (showing) return reply(NativeProtocol.shown(false))
                showing = true
                ads.show {
                    showing = false
                    reply(NativeProtocol.shown(it))
                }
            }
            NativeMethod.PRODUCTS -> billing.products { reply(NativeProtocol.products(it)) }
            NativeMethod.BUY -> billing.buy(request.arg.orEmpty()) { reply(NativeProtocol.bought(it)) }
            NativeMethod.RESTORE -> billing.restore { reply(NativeProtocol.restored(it)) }
            NativeMethod.TTS_SPEAK -> speech.speak(request.arg) { reply(NativeProtocol.spoke(it)) }
            NativeMethod.TTS_STOP -> {
                speech.stop()
                reply(NativeProtocol.available(true))
            }
        }
    }

    private fun settle(view: WebView, request: NativeRequest, valueJson: String) {
        handler.post {
            if (destroyed || gameView() !== view || !WebRoutes.isTrustedGame(view.url)) return@post
            view.evaluateJavascript(NativeProtocol.settleScript(request, valueJson), null)
        }
    }

    companion object {
        const val BRIDGE_NAME = "OtterlyNativeHost"
    }
}
