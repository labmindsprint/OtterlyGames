package com.otterlygames.spaceacademy

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WebRoutesTest {
    @Test
    fun publicLinksOpenTheBundledGameWithoutTheirQuery() {
        val suffix = "?test=1&demo=roam#chapter"
        assertEquals(
            WebRoutes.ENTRY_URL,
            WebRoutes.localMissionLink(WebRoutes.PUBLIC_ORIGIN + WebRoutes.GAME_PATH + suffix),
        )
        assertTrue(WebRoutes.navigation(WebRoutes.ENTRY_URL + suffix) is WebRoutes.Navigation.Local)
        assertEquals("audio/wav", WebRoutes.mimeType("/audio/starfield.wav"))
    }

    @Test
    fun fakeOriginsAndDifferentPathsCannotEnterTheBundledGame() {
        listOf(
            "http://otterlygames.com/play/pit-stop.html",
            "https://otterlygames.com.evil.invalid/play/pit-stop.html",
            "https://otterlygames.com@evil.invalid/play/pit-stop.html",
            "https://otterlygames.com:444/play/pit-stop.html",
            "https://otterlygames.com/play/%70it-stop.html",
            "https://otterlygames.com/play/pit-stop.html/other",
            "https://otterlygames.com/play/space-academy.html",
            "file:///play/pit-stop.html",
        ).forEach { assertNull(it, WebRoutes.localMissionLink(it)) }
        assertFalse(WebRoutes.isTrustedGame("https://appassets.androidplatform.net.evil.invalid${WebRoutes.GAME_PATH}"))
        assertFalse(WebRoutes.isTrustedGame("https://user@appassets.androidplatform.net${WebRoutes.GAME_PATH}"))
        assertFalse(WebRoutes.isTrustedGame("https://appassets.androidplatform.net:444${WebRoutes.GAME_PATH}"))
    }

    @Test
    fun publicAndNonGameVirtualNavigationAlwaysLeaveTheBridge() {
        assertEquals(
            WebRoutes.Navigation.External("https://otterlygames.com/learn/olympiad/?grade=class-1#content"),
            WebRoutes.navigation("${WebRoutes.ASSET_ORIGIN}/learn/olympiad/?grade=class-1#content"),
        )
        assertEquals(
            WebRoutes.Navigation.External("https://science.nasa.gov/"),
            WebRoutes.navigation("https://science.nasa.gov/"),
        )
        listOf("javascript:alert(1)", "file:///data/data/example", "content://provider/file", "intent://example")
            .forEach { assertEquals(WebRoutes.Navigation.Blocked, WebRoutes.navigation(it)) }
    }

    @Test
    fun onlyTrustedBundledPathsCanBeRequested() {
        assertTrue(WebRoutes.isBundledRequest("${WebRoutes.ASSET_ORIGIN}/js/space-academy/pitstop/main.mjs", false))
        assertTrue(WebRoutes.isBundledRequest("${WebRoutes.ASSET_ORIGIN}/audio/starfield.wav", false))
        assertTrue(WebRoutes.isBundledRequest(WebRoutes.ENTRY_URL + "?demo=roam", true))
        listOf(
            "${WebRoutes.ASSET_ORIGIN}/js/../privacy.html",
            "${WebRoutes.ASSET_ORIGIN}/js/%2e%2e/privacy.html",
            "${WebRoutes.ASSET_ORIGIN}/js/%2foutside.mjs",
            "${WebRoutes.ASSET_ORIGIN}/js/%5coutside.mjs",
            "${WebRoutes.ASSET_ORIGIN}/js/%00module.mjs",
            "${WebRoutes.ASSET_ORIGIN}/privacy.html",
            "https://science.nasa.gov/script.js",
            "file:///android_asset/js/app.mjs",
        ).forEach { assertFalse(it, WebRoutes.isBundledRequest(it, false)) }
        assertFalse(WebRoutes.isBundledRequest("${WebRoutes.ASSET_ORIGIN}/js/space-academy/pitstop/main.mjs", true))
    }
}
