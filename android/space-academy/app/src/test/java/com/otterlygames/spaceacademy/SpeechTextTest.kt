package com.otterlygames.spaceacademy

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SpeechTextTest {
    private fun request(method: String, arg: String?): String =
        JSONObject().put("token", "abc123").put("id", 3).put("method", method).put("arg", arg ?: JSONObject.NULL).toString()

    @Test
    fun textIsCleanedAndBounded() {
        assertEquals("What is two plus two?", SpeechText.sanitise("  What is\n two\tplus two?\u0000 "))
        assertTrue(SpeechText.sanitise("word ".repeat(400))!!.length <= SpeechText.MAX_CHARS)
        assertNull(SpeechText.sanitise("   \n\t "))
        assertNull(SpeechText.sanitise(null))
    }

    @Test
    fun speakAcceptsLongTextButOtherMethodsKeepTheShortLimit() {
        val line = "a".repeat(SpeechText.MAX_CHARS)
        assertEquals(line, NativeProtocol.parse(request("tts.speak", line))?.arg)
        assertNull(NativeProtocol.parse(request("tts.speak", line + "a"))?.arg)
        assertNull(NativeProtocol.parse(request("billing.buy", "a".repeat(65)))?.arg)
        assertEquals(NativeMethod.TTS_STOP, NativeProtocol.parse(request("tts.stop", null))?.method)
    }

    @Test
    fun speechFailureValuesMatchTheShimContract() {
        assertFalse(JSONObject(NativeProtocol.fallback(NativeMethod.TTS_SPEAK)).getBoolean("ok"))
        assertEquals("false", NativeProtocol.fallback(NativeMethod.TTS_STOP))
        assertEquals("{\"ok\":true}", NativeProtocol.spoke(true))
    }
}
