package com.otterlygames.spaceacademy

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.time.LocalDate
import java.util.concurrent.Executors
import kotlin.math.roundToInt

class MainActivity : Activity() {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val documentWorker = Executors.newSingleThreadExecutor()
    private val pendingResults = ArrayDeque<BackupResult>()
    private val popupViews = mutableSetOf<WebView>()
    private lateinit var root: FrameLayout
    private lateinit var gameColumn: LinearLayout
    private lateinit var warningPanel: LinearLayout
    private lateinit var warningText: TextView
    private lateinit var assetLoader: WebViewAssetLoader
    private var game: WebView? = null
    private var errorPanel: View? = null
    private var fullScreenView: View? = null
    private var fullScreenCallback: WebChromeClient.CustomViewCallback? = null
    private var restoreCallback: ValueCallback<Array<Uri>>? = null
    private var backCallback: OnBackInvokedCallback? = null
    private var pendingBackup: ByteArray? = null
    private var backupRunning = false
    private var resumed = false
    private var focused = false
    private var destroyed = false
    private var pageReady = false
    private var loadFailed = false
    @Volatile
    private var loadGeneration = 0
    private var lastTrustedUrl = WebRoutes.ENTRY_URL
    private lateinit var monetisation: MonetisationHost
    private var shimAtDocumentStart = false
    private val nativeShim by lazy {
        resources.openRawResource(R.raw.otterly_native_shim).bufferedReader().use { it.readText() }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_SpaceAcademy)
        super.onCreate(savedInstanceState)
        if (resources.configuration.smallestScreenWidthDp < 600) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        monetisation = MonetisationHost(this, mainHandler) { game }
        monetisation.start()
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain(WebRoutes.ASSET_HOST)
            .setHttpAllowed(false)
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        createLayout()
        configureInsets()
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        val incoming = if (intent.action == Intent.ACTION_VIEW) {
            WebRoutes.localMissionLink(intent.dataString)
        } else null
        if (intent.action == Intent.ACTION_VIEW && incoming == null) {
            toast(R.string.invalid_mission_link)
        }
        lastTrustedUrl = incoming ?: WebRoutes.ENTRY_URL
        createGame(savedInstanceState?.getBundle(WEB_STATE))
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = OnBackInvokedCallback { navigateBack() }.also {
                onBackInvokedDispatcher.registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, it,
                )
            }
        }
    }

    private fun createLayout() {
        root = FrameLayout(this).apply { setBackgroundColor(getColor(R.color.academy_background)) }
        gameColumn = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        warningPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(8), dp(16), dp(8))
            setBackgroundColor(getColor(R.color.academy_warning))
            visibility = View.GONE
        }
        warningText = TextView(this).apply {
            setTextColor(getColor(R.color.academy_background))
            textSize = 14f
            accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
        }
        warningPanel.addView(warningText)
        warningPanel.addView(Button(this).apply {
            setText(R.string.reload_game)
            setTextColor(getColor(R.color.academy_background))
            minHeight = dp(48)
            setOnClickListener { reloadGame() }
        })
        gameColumn.addView(warningPanel, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
        ))
        root.addView(gameColumn, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT,
        ))
        setContentView(root)
    }

    @Suppress("DEPRECATION")
    private fun configureInsets() {
        if (Build.VERSION.SDK_INT >= 28) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false)
        } else {
            window.decorView.systemUiVisibility = layoutFlags()
        }
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (Build.VERSION.SDK_INT >= 30) {
                val safe = insets.getInsets(
                    WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout() or WindowInsets.Type.ime(),
                )
                // The game hides the status bar, so clear only the camera cutout plus a small gap.
                val cutoutTop = insets.getInsets(WindowInsets.Type.displayCutout()).top
                val top = if (cutoutTop > 0) cutoutTop + dp(TOP_GAP_DP) else minOf(safe.top, dp(TOP_GAP_DP))
                view.setPadding(safe.left, top, safe.right, safe.bottom)
            } else if (Build.VERSION.SDK_INT >= 28) {
                val cutout = insets.displayCutout
                view.setPadding(
                    maxOf(insets.systemWindowInsetLeft, cutout?.safeInsetLeft ?: 0),
                    maxOf(insets.systemWindowInsetTop, cutout?.safeInsetTop ?: 0),
                    maxOf(insets.systemWindowInsetRight, cutout?.safeInsetRight ?: 0),
                    maxOf(insets.systemWindowInsetBottom, cutout?.safeInsetBottom ?: 0),
                )
            } else {
                view.setPadding(
                    insets.systemWindowInsetLeft, insets.systemWindowInsetTop,
                    insets.systemWindowInsetRight, insets.systemWindowInsetBottom,
                )
            }
            insets
        }
        root.requestApplyInsets()
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    private fun harden(view: WebView, enableGame: Boolean) {
        view.settings.apply {
            javaScriptEnabled = enableGame
            domStorageEnabled = enableGame
            allowFileAccess = false
            allowContentAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            blockNetworkLoads = true
            javaScriptCanOpenWindowsAutomatically = false
            setGeolocationEnabled(false)
            mediaPlaybackRequiresUserGesture = true
            setSupportMultipleWindows(enableGame)
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            useWideViewPort = true
            textZoom = (resources.configuration.fontScale * 100).roundToInt().coerceAtLeast(1)
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false)
    }

    private fun createGame(state: Bundle? = null) {
        val view = WebView(this)
        game = view
        harden(view, true)
        view.setBackgroundColor(getColor(R.color.splash_background))
        view.addJavascriptInterface(BackupBridge(::requestBackup),         BRIDGE_NAME)
        view.addJavascriptInterface(monetisation, MonetisationHost.BRIDGE_NAME)
        installNativeShim(view)
        view.webViewClient = OfflineClient()
        view.webChromeClient = HostChromeClient()
        view.setDownloadListener { _, _, _, _, _ -> toast(R.string.use_backup_button) }
        gameColumn.addView(view, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        val restored = state?.let(view::restoreState)
        if (restored == null || !WebRoutes.isTrustedGame(restored.currentItem?.url)) {
            view.loadUrl(lastTrustedUrl)
        }
        if (!resumed) view.onPause()
    }

    private fun installNativeShim(view: WebView) {
        // Document-start injection guarantees window.OtterlyNative exists before the game's modules run. Older
        // WebViews fall back to injecting on page start; the shim is idempotent and the game reads the bridge lazily.
        shimAtDocumentStart = false
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return
        try {
            WebViewCompat.addDocumentStartJavaScript(view, nativeShim, setOf(WebRoutes.ASSET_ORIGIN))
            shimAtDocumentStart = true
        } catch (_: RuntimeException) {
            shimAtDocumentStart = false
        }
    }

    private inner class OfflineClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (!request.isForMainFrame) return true
            return when (val destination = WebRoutes.navigation(request.url.toString())) {
                is WebRoutes.Navigation.Local -> false
                is WebRoutes.Navigation.External -> { openExternal(destination.url); true }
                WebRoutes.Navigation.Blocked -> { toast(R.string.blocked_navigation); true }
            }
        }

        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
            if (request.method != "GET" || !WebRoutes.isBundledRequest(request.url.toString(), request.isForMainFrame)) {
                postLoadError(view, request.isForMainFrame, R.string.blocked_resource)
                return errorResponse(403, "Blocked", "This offline app only serves its bundled game.")
            }
            val response = assetLoader.shouldInterceptRequest(request.url)
                ?: errorResponse(404, "Not Found", "The bundled game file is missing.")
            WebRoutes.mimeType(request.url.path.orEmpty())?.let { mime ->
                response.mimeType = mime
                if (mime.startsWith("text/") || mime == "application/json" || mime == "image/svg+xml") {
                    response.encoding = "UTF-8"
                }
            }
            response.responseHeaders = response.responseHeaders.orEmpty() + mapOf(
                "X-Content-Type-Options" to "nosniff",
                "Referrer-Policy" to "no-referrer",
                "Content-Security-Policy" to "frame-src 'none'; object-src 'none'; base-uri 'none'",
                "X-Frame-Options" to "DENY",
                "Cache-Control" to "no-cache",
            )
            if (response.statusCode >= 400) postLoadError(view, request.isForMainFrame, R.string.asset_error)
            return response
        }

        override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
            if (game !== view || !WebRoutes.isTrustedGame(url)) return
            lastTrustedUrl = url
            if (!shimAtDocumentStart) view.evaluateJavascript(nativeShim, null)
            loadGeneration++
            pageReady = false
            loadFailed = false
            warningPanel.visibility = View.GONE
            errorPanel?.visibility = View.GONE
            view.visibility = View.VISIBLE
        }

        override fun doUpdateVisitedHistory(view: WebView, url: String, isReload: Boolean) {
            if (game === view && WebRoutes.isTrustedGame(url)) lastTrustedUrl = url
        }

        override fun onPageFinished(view: WebView, url: String) {
            if (game === view && WebRoutes.isTrustedGame(url) && !loadFailed) {
                checkModuleStarted(view, loadGeneration)
            }
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            postLoadError(view, request.isForMainFrame, R.string.asset_error)
        }

        override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse) {
            postLoadError(view, request.isForMainFrame, R.string.asset_error)
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            if (game === view) {
                exitFullscreen(notify = false)
                pageReady = false
                game = null
                restoreCallback?.onReceiveValue(null)
                restoreCallback = null
                gameColumn.removeView(view)
                view.destroy()
                showError(R.string.renderer_title, R.string.renderer_error, true)
            }
            return true
        }
    }

    private fun checkModuleStarted(view: WebView, generation: Int, attempt: Int = 0) {
        if (destroyed || game !== view || generation != loadGeneration || loadFailed) return
        view.evaluateJavascript("globalThis.__otterlyAcademyNativeReady === true") { result ->
            if (destroyed || game !== view || generation != loadGeneration || loadFailed) return@evaluateJavascript
            if (result == "true") {
                pageReady = true
                dispatchVisibility()
                flushBackupResults()
            } else if (attempt < 10) {
                mainHandler.postDelayed({ checkModuleStarted(view, generation, attempt + 1) }, 200)
            } else {
                showError(R.string.game_unavailable, R.string.module_error, true)
            }
        }
    }

    private inner class HostChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: ValueCallback<Array<Uri>>,
            fileChooserParams: FileChooserParams,
        ): Boolean {
            restoreCallback?.onReceiveValue(null)
            restoreCallback = null
            if (game !== webView || !WebRoutes.isTrustedGame(webView.url) ||
                fileChooserParams.mode != FileChooserParams.MODE_OPEN
            ) {
                filePathCallback.onReceiveValue(null)
                toast(R.string.restore_single_file)
                return true
            }
            restoreCallback = filePathCallback
            val picker = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            try {
                startActivityForResult(Intent.createChooser(picker, getString(R.string.restore_picker_title)), RESTORE_REQUEST)
            } catch (_: ActivityNotFoundException) {
                restoreCallback?.onReceiveValue(null)
                restoreCallback = null
                toast(R.string.restore_unavailable)
            }
            return true
        }

        override fun onShowCustomView(view: View, callback: CustomViewCallback) {
            if (fullScreenView != null) {
                callback.onCustomViewHidden()
                return
            }
            fullScreenView = view
            fullScreenCallback = callback
            gameColumn.visibility = View.GONE
            root.addView(view, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT,
            ))
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            updateSystemBars(true)
        }

        override fun onHideCustomView() = exitFullscreen()

        override fun onPermissionRequest(request: PermissionRequest) = request.deny()

        override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
            callback.invoke(origin, false, false)
        }

        override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
            if (!isUserGesture || game !== view || !WebRoutes.isTrustedGame(view.url)) return false
            val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false
            val popup = WebView(this@MainActivity)
            harden(popup, false)
            popupViews.add(popup)
            popup.webViewClient = object : WebViewClient() {
                private var routed = false

                private fun route(url: String): Boolean {
                    if (url == "about:blank") return false
                    if (!routed) {
                        routed = true
                        when (val destination = WebRoutes.navigation(url)) {
                            is WebRoutes.Navigation.Local -> game?.loadUrl(destination.url)
                            is WebRoutes.Navigation.External -> openExternal(destination.url)
                            WebRoutes.Navigation.Blocked -> toast(R.string.blocked_navigation)
                        }
                        mainHandler.post { disposePopup(popup) }
                    }
                    return true
                }

                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    if (request.isForMainFrame) route(request.url.toString()) else true

                override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                    route(url)
                }

                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse =
                    errorResponse(403, "Blocked", "Popups cannot load content inside this app.")

                override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                    disposePopup(view)
                    return true
                }
            }
            transport.webView = popup
            resultMsg.sendToTarget()
            mainHandler.postDelayed({ disposePopup(popup) }, 5_000)
            return true
        }
    }

    class BackupBridge internal constructor(private val export: (String) -> Unit) {
        @JavascriptInterface
        fun exportBackup(json: String) = export(json)
    }

    private fun requestBackup(json: String) {
        mainHandler.post {
            if (destroyed) return@post
            if (!pageReady || !resumed || !focused || !WebRoutes.isTrustedGame(game?.url)) {
                backupResult(false, getString(R.string.backup_not_visible))
                return@post
            }
            if (backupRunning) {
                backupResult(false, getString(R.string.backup_busy))
                return@post
            }
            backupRunning = true
            documentWorker.execute {
                val result = try {
                    Result.success(BackupPayload.validate(json))
                } catch (error: Exception) {
                    Result.failure(error)
                }
                mainHandler.post validation@{
                    if (destroyed) return@validation
                    val bytes = result.getOrNull()
                    if (bytes == null) {
                        backupRunning = false
                        val message = (result.exceptionOrNull() as? IllegalArgumentException)?.message
                            ?: getString(R.string.backup_failed)
                        backupResult(false, message)
                    } else if (!resumed || !focused || !WebRoutes.isTrustedGame(game?.url)) {
                        backupRunning = false
                        backupResult(false, getString(R.string.backup_not_visible))
                    } else {
                        pendingBackup = bytes
                        val picker = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "application/json"
                            putExtra(Intent.EXTRA_TITLE, "otterly-space-academy-${LocalDate.now()}.json")
                            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                        }
                        try {
                            startActivityForResult(picker, BACKUP_REQUEST)
                        } catch (_: ActivityNotFoundException) {
                            pendingBackup = null
                            backupRunning = false
                            backupResult(false, getString(R.string.picker_unavailable))
                        }
                    }
                }
            }
        }
    }

    @Deprecated("Platform result callback is sufficient for the two single-document operations.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == RESTORE_REQUEST) {
            val callback = restoreCallback ?: return
            restoreCallback = null
            val uri = data?.data ?: data?.clipData?.takeIf { it.itemCount == 1 }?.getItemAt(0)?.uri
            val single = data?.clipData?.itemCount?.let { it <= 1 } ?: true
            if (resultCode == RESULT_OK && uri?.scheme == "content" && single) {
                callback.onReceiveValue(arrayOf(uri))
            } else {
                callback.onReceiveValue(null)
                if (resultCode == RESULT_OK) toast(R.string.restore_single_file)
            }
        } else if (requestCode == BACKUP_REQUEST) {
            val bytes = pendingBackup
            pendingBackup = null
            if (resultCode != RESULT_OK) {
                backupRunning = false
                backupResult(false, getString(R.string.backup_cancelled))
                return
            }
            if (bytes == null) {
                backupRunning = false
                backupResult(false, getString(R.string.backup_interrupted))
                return
            }
            val uri = data?.data
            if (uri?.scheme != "content") {
                backupRunning = false
                backupResult(false, getString(R.string.backup_document_required))
                return
            }
            documentWorker.execute {
                val written = try {
                    val stream = contentResolver.openOutputStream(uri, "w")
                        ?: throw IllegalStateException("The document provider returned no stream.")
                    stream.use { it.write(bytes); it.flush() }
                    true
                } catch (_: Exception) {
                    false
                }
                mainHandler.post {
                    if (!destroyed) {
                        backupRunning = false
                        backupResult(written, getString(if (written) R.string.backup_saved else R.string.backup_failed))
                    }
                }
            }
        }
    }

    private data class BackupResult(val ok: Boolean, val message: String)

    private fun backupResult(ok: Boolean, message: String) {
        pendingResults.addLast(BackupResult(ok, message))
        flushBackupResults()
    }

    private fun flushBackupResults() {
        val view = game ?: return
        if (!pageReady || destroyed || !WebRoutes.isTrustedGame(view.url)) return
        while (pendingResults.isNotEmpty()) {
            val result = pendingResults.removeFirst()
            val message = JSONObject.quote(result.message)
            view.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('otterly-native-backup-result'," +
                    "{detail:{ok:${result.ok},message:$message}}));",
                null,
            )
        }
    }

    private fun dispatchVisibility(visible: Boolean = resumed && focused) {
        val view = game ?: return
        if (destroyed || !pageReady || !WebRoutes.isTrustedGame(view.url)) return
        view.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('otterly-native-visibility',{detail:$visible}));",
            null,
        )
    }

    override fun onResume() {
        super.onResume()
        resumed = true
        focused = hasWindowFocus()
        game?.onResume()
        dispatchVisibility()
    }

    override fun onPause() {
        resumed = false
        monetisation.silence()
        dispatchVisibility(false)
        game?.onPause()
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        focused = hasFocus
        dispatchVisibility()
        if (hasFocus) updateSystemBars(true)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        game?.settings?.textZoom = (newConfig.fontScale * 100).roundToInt().coerceAtLeast(1)
        root.requestApplyInsets()
        if (fullScreenView != null) updateSystemBars(true)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.action != Intent.ACTION_VIEW) return
        val destination = WebRoutes.localMissionLink(intent.dataString)
        if (destination == null) {
            toast(R.string.invalid_mission_link)
            return
        }
        lastTrustedUrl = destination
        reloadGame()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        game?.takeIf { WebRoutes.isTrustedGame(it.url) }?.let { view ->
            val state = Bundle()
            view.saveState(state)
            outState.putBundle(WEB_STATE, state)
        }
        super.onSaveInstanceState(outState)
    }

    @Deprecated("Used only before Android 13; newer versions use OnBackInvokedDispatcher.")
    @SuppressLint("GestureBackNavigation")
    override fun onBackPressed() = navigateBack()

    private fun navigateBack() {
        if (fullScreenView != null) {
            exitFullscreen()
        } else if (game?.canGoBack() == true) {
            game?.goBack()
        } else {
            finishAfterTransition()
        }
    }

    @Suppress("DEPRECATION")
    private fun layoutFlags(): Int = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION

    @Suppress("DEPRECATION")
    private fun updateSystemBars(enabled: Boolean) {
        if (Build.VERSION.SDK_INT >= 30) {
            window.insetsController?.apply {
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                if (enabled) hide(WindowInsets.Type.systemBars()) else show(WindowInsets.Type.systemBars())
            }
        } else {
            window.decorView.systemUiVisibility = if (enabled) {
                layoutFlags() or View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            } else layoutFlags()
        }
        root.requestApplyInsets()
    }

    private fun exitFullscreen(notify: Boolean = true) {
        val view = fullScreenView ?: return
        fullScreenView = null
        root.removeView(view)
        gameColumn.visibility = View.VISIBLE
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        updateSystemBars(true)
        val callback = fullScreenCallback
        fullScreenCallback = null
        if (notify) callback?.onCustomViewHidden()
    }

    private fun postLoadError(view: WebView, fatal: Boolean, message: Int) {
        val generation = loadGeneration
        mainHandler.post {
            if (!destroyed && game === view && generation == loadGeneration) {
                showError(R.string.game_unavailable, message, fatal)
            }
        }
    }

    private fun showError(title: Int, message: Int, fatal: Boolean) {
        if (destroyed) return
        if (!fatal) {
            if (!loadFailed) {
                warningText.setText(message)
                warningPanel.visibility = View.VISIBLE
            }
            return
        }
        dispatchVisibility(false)
        loadFailed = true
        pageReady = false
        game?.onPause()
        game?.visibility = View.INVISIBLE
        exitFullscreen()
        errorPanel?.let(root::removeView)
        errorPanel = ScrollView(this).apply {
            isFillViewport = true
            setBackgroundColor(getColor(R.color.academy_background))
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(24), dp(24), dp(24), dp(24))
                addView(TextView(this@MainActivity).apply {
                    setText(title)
                    textSize = 24f
                    setTextColor(getColor(R.color.academy_text))
                    accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_ASSERTIVE
                })
                addView(TextView(this@MainActivity).apply {
                    setText(message)
                    textSize = 16f
                    setTextColor(getColor(R.color.academy_text))
                    setPadding(0, dp(16), 0, dp(16))
                })
                addView(Button(this@MainActivity).apply {
                    setText(R.string.reload_game)
                    minHeight = dp(48)
                    setOnClickListener { reloadGame() }
                })
            }, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        }.also {
            root.addView(it, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT,
            ))
        }
    }

    private fun reloadGame() {
        exitFullscreen()
        loadFailed = false
        pageReady = false
        errorPanel?.visibility = View.GONE
        warningPanel.visibility = View.GONE
        if (game == null) {
            createGame()
        } else {
            game?.visibility = View.VISIBLE
            if (resumed) game?.onResume()
            game?.loadUrl(lastTrustedUrl)
        }
    }

    private fun openExternal(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE))
        } catch (_: ActivityNotFoundException) {
            toast(R.string.browser_unavailable)
        } catch (_: SecurityException) {
            toast(R.string.browser_unavailable)
        }
    }

    private fun disposePopup(view: WebView) {
        if (popupViews.remove(view)) view.destroy()
    }

    private fun errorResponse(code: Int, reason: String, message: String): WebResourceResponse =
        WebResourceResponse(
            "text/plain", "UTF-8", code, reason, mapOf("Cache-Control" to "no-store"),
            ByteArrayInputStream(message.toByteArray(Charsets.UTF_8)),
        )

    private fun toast(message: Int) = Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).roundToInt()

    override fun onDestroy() {
        dispatchVisibility(false)
        destroyed = true
        if (Build.VERSION.SDK_INT >= 33) {
            backCallback?.let(onBackInvokedDispatcher::unregisterOnBackInvokedCallback)
        }
        exitFullscreen(notify = false)
        restoreCallback?.onReceiveValue(null)
        restoreCallback = null
        popupViews.toList().forEach(::disposePopup)
        game?.let {
            it.stopLoading()
            it.removeJavascriptInterface(BRIDGE_NAME)
            it.removeJavascriptInterface(MonetisationHost.BRIDGE_NAME)
            gameColumn.removeView(it)
            it.destroy()
        }
        game = null
        monetisation.destroy()
        mainHandler.removeCallbacksAndMessages(null)
        documentWorker.shutdown()
        super.onDestroy()
    }

    private companion object {
        const val BRIDGE_NAME = "OtterlyAndroid"
        const val TOP_GAP_DP = 6
        const val WEB_STATE = "academy-webview-state"
        const val BACKUP_REQUEST = 1001
        const val RESTORE_REQUEST = 1002
    }
}
