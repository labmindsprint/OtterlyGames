package com.otterlygames.spaceacademy

import org.json.JSONException
import org.json.JSONObject
import org.json.JSONTokener

internal object BackupPayload {
    const val MAX_BYTES = 8 * 1024 * 1024
    private val explorerIds = setOf("explorer-1", "explorer-2", "explorer-3")

    fun validate(json: String): ByteArray {
        require(json.length <= MAX_BYTES) { "This backup is larger than the 8 MB export limit." }
        val bytes = json.toByteArray(Charsets.UTF_8)
        require(bytes.size <= MAX_BYTES) { "This backup is larger than the 8 MB export limit." }
        val root = try {
            val parser = JSONTokener(json)
            val value = parser.nextValue()
            require(value is JSONObject && parser.nextClean() == '\u0000') {
                "This is not a Space Academy backup JSON object."
            }
            value
        } catch (_: JSONException) {
            throw IllegalArgumentException("The backup is not valid JSON.")
        }
        val version = root.opt("version")
        require(version is Number && version.toDouble() in setOf(1.0, 2.0)) {
            "This Space Academy backup version is not supported."
        }
        val revision = root.opt("revision")
        val activeExplorer = root.opt("activeExplorer")
        require(revision is Number && revision.toDouble().isFinite() &&
            revision.toDouble() in 0.0..9_007_199_254_740_991.0 &&
            revision.toDouble() % 1.0 == 0.0 &&
            activeExplorer is String && activeExplorer in explorerIds
        ) { "The Space Academy backup explorer selection is invalid." }
        val explorers = root.optJSONObject("explorers")
        require(explorers != null && explorers.length() == explorerIds.size &&
            explorerIds.all { id ->
                val explorer = explorers.optJSONObject(id)
                explorer != null && explorer.opt("grade") is String &&
                    explorer.opt("level") is Number && explorer.optJSONObject("journeys") != null
            }
        ) { "The backup must contain all three local Space Academy explorers." }
        return bytes
    }
}
