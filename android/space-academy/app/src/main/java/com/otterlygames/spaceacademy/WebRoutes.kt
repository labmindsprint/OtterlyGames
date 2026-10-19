package com.otterlygames.spaceacademy

import java.net.URI
import java.net.URISyntaxException
import java.util.Locale

internal object WebRoutes {
    const val ASSET_HOST = "appassets.androidplatform.net"
    const val ASSET_ORIGIN = "https://$ASSET_HOST"
    const val PUBLIC_ORIGIN = "https://otterlygames.com"
    const val GAME_PATH = "/play/pit-stop.html"
    const val ENTRY_URL = "$ASSET_ORIGIN$GAME_PATH"

    sealed interface Navigation {
        data class Local(val url: String) : Navigation
        data class External(val url: String) : Navigation
        data object Blocked : Navigation
    }

    fun navigation(url: String): Navigation {
        val uri = parse(url) ?: return Navigation.Blocked
        if (trustedOrigin(uri)) {
            return if (uri.rawPath == GAME_PATH) {
                Navigation.Local(url)
            } else {
                Navigation.External(PUBLIC_ORIGIN + pathAndSuffix(uri))
            }
        }
        return if (uri.scheme?.lowercase(Locale.ROOT) in setOf("https", "http") &&
            !uri.host.isNullOrBlank() && uri.rawUserInfo == null
        ) {
            Navigation.External(url)
        } else {
            Navigation.Blocked
        }
    }

    fun isTrustedGame(url: String?): Boolean {
        val uri = url?.let(::parse) ?: return false
        return trustedOrigin(uri) && uri.rawPath == GAME_PATH
    }

    fun isBundledRequest(url: String, mainFrame: Boolean): Boolean {
        val uri = parse(url) ?: return false
        if (!trustedOrigin(uri)) return false
        val path = uri.path ?: return false
        if (path.any { it == '\\' || it.isISOControl() } ||
            path.split('/').any { it == "." || it == ".." } ||
            Regex("%2f|%5c", RegexOption.IGNORE_CASE).containsMatchIn(uri.rawPath.orEmpty())
        ) return false
        if (mainFrame) return uri.rawPath == GAME_PATH
        return uri.rawPath == GAME_PATH || path == "/favicon.ico" ||
            path == "/academy-assets-manifest.json" ||
            listOf("/js/", "/css/", "/games/", "/images/", "/fonts/", "/audio/").any(path::startsWith)
    }

    fun localMissionLink(url: String?): String? {
        val uri = url?.let(::parse) ?: return null
        if (uri.scheme != "https" || !uri.host.equals("otterlygames.com", ignoreCase = true) ||
            uri.rawUserInfo != null || uri.port !in setOf(-1, 443) || uri.rawPath != GAME_PATH
        ) return null
        // Pit Stop has no mission links; the public query (test/demo switches) is deliberately not carried into the app.
        return ASSET_ORIGIN + GAME_PATH
    }

    fun mimeType(path: String): String? = when (path.substringAfterLast('.', "").lowercase(Locale.ROOT)) {
        "mjs", "js" -> "text/javascript"
        "css" -> "text/css"
        "json" -> "application/json"
        "html" -> "text/html"
        "svg" -> "image/svg+xml"
        "webp" -> "image/webp"
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "ico" -> "image/x-icon"
        "woff2" -> "font/woff2"
        "wav" -> "audio/wav"
        "woff" -> "font/woff"
        "ttf" -> "font/ttf"
        "otf" -> "font/otf"
        else -> null
    }

    private fun trustedOrigin(uri: URI): Boolean =
        uri.scheme == "https" && uri.host.equals(ASSET_HOST, ignoreCase = true) &&
            uri.rawUserInfo == null && uri.port in setOf(-1, 443)

    private fun pathAndSuffix(uri: URI): String = buildString {
        append(uri.rawPath?.takeIf(String::isNotEmpty) ?: "/")
        uri.rawQuery?.let { append('?').append(it) }
        uri.rawFragment?.let { append('#').append(it) }
    }

    private fun parse(value: String): URI? = try {
        URI(value)
    } catch (_: URISyntaxException) {
        null
    }
}
