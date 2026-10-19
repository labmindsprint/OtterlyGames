package com.otterlygames.spaceacademy

import android.content.Context
import android.media.AudioAttributes
import android.os.Handler
import android.speech.tts.TextToSpeech
import java.util.Locale

internal object SpeechText {
    const val MAX_CHARS = 600

    /** Plain, bounded text for the engine: control characters become spaces, whitespace collapses, null when nothing is left to say. */
    fun sanitise(raw: String?): String? {
        if (raw == null) return null
        val text = raw.map { if (it.isISOControl()) ' ' else it }.joinToString("")
            .replace(Regex("\\s+"), " ")
            .trim()
            .take(MAX_CHARS)
            .trim()
        return text.ifEmpty { null }
    }
}

/**
 * Read-aloud for the quiz, exposed to the page as window.OtterlyNative.tts. The engine is created on first use and
 * shut down with the activity. Every method must be called on the main thread (MonetisationHost already posts there).
 * Speaking replaces whatever was being said, so lines never overlap.
 */
internal class NativeSpeech(private val context: Context, private val handler: Handler) {
    private var engine: TextToSpeech? = null
    private var ready = false
    private var failed = false
    private var destroyed = false
    private var pending: Pair<String, (Boolean) -> Unit>? = null
    private var counter = 0

    /** Calls [done] with true once the engine accepted the line, false when it cannot speak. */
    fun speak(raw: String?, done: (Boolean) -> Unit) {
        val text = SpeechText.sanitise(raw)
        if (text == null || destroyed || failed) {
            done(false)
            return
        }
        pending?.second?.invoke(false)
        pending = null
        if (ready) {
            done(say(text))
            return
        }
        pending = text to done
        if (engine == null) start()
    }

    fun stop() {
        pending?.second?.invoke(false)
        pending = null
        try {
            engine?.stop()
        } catch (_: RuntimeException) {
            // The engine service went away; the next speak() reports failure.
        }
    }

    fun destroy() {
        destroyed = true
        pending?.second?.invoke(false)
        pending = null
        try {
            engine?.stop()
            engine?.shutdown()
        } catch (_: RuntimeException) {
            // Already gone.
        }
        engine = null
        ready = false
    }

    private fun start() {
        try {
            engine = TextToSpeech(context.applicationContext) { status -> handler.post { onInit(status) } }
        } catch (_: RuntimeException) {
            fail()
        }
    }

    private fun onInit(status: Int) {
        val tts = engine
        if (destroyed || tts == null) return
        if (status != TextToSpeech.SUCCESS) {
            fail()
            return
        }
        val indian = tts.setLanguage(Locale.forLanguageTag("en-IN"))
        if (indian == TextToSpeech.LANG_MISSING_DATA || indian == TextToSpeech.LANG_NOT_SUPPORTED) {
            tts.setLanguage(Locale.US)
        }
        tts.setSpeechRate(RATE)
        tts.setPitch(PITCH)
        tts.setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build(),
        )
        ready = true
        val waiting = pending
        pending = null
        waiting?.let { (text, done) -> done(say(text)) }
    }

    private fun say(text: String): Boolean = try {
        engine?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "osa-${counter++}") == TextToSpeech.SUCCESS
    } catch (_: RuntimeException) {
        false
    }

    private fun fail() {
        failed = true
        engine?.let {
            try {
                it.shutdown()
            } catch (_: RuntimeException) {
                // Nothing to release.
            }
        }
        engine = null
        pending?.second?.invoke(false)
        pending = null
    }

    private companion object {
        const val RATE = 0.9f
        const val PITCH = 1.05f
    }
}
