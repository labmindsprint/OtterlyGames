package com.otterlygames.spaceacademy

import org.json.JSONObject
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class BackupPayloadTest {
    @Test
    fun currentAndLegacyThreeExplorerBackupsCanBeExportedUnchanged() {
        for (version in listOf(1, 2)) {
            val json = save(version).toString(2)
            assertArrayEquals(json.toByteArray(Charsets.UTF_8), BackupPayload.validate(json))
        }
    }

    @Test
    fun unrelatedJsonAndUnsupportedOrIncompleteRootsAreRejected() {
        listOf(
            "[]",
            "{\"version\":2}",
            save(3).toString(),
            save(2).put("version", "2").toString(),
            save(2).put("revision", -1).toString(),
            save(2).put("activeExplorer", "other").toString(),
            save(2).apply { getJSONObject("explorers").remove("explorer-3") }.toString(),
            save(2).toString() + "{}",
        ).forEach { json ->
            assertThrows(IllegalArgumentException::class.java) { BackupPayload.validate(json) }
        }
    }

    @Test
    fun byteLimitAlsoRejectsMultibyteJsonUnderTheCharacterLimit() {
        val json = save(2).put("padding", "€".repeat(BackupPayload.MAX_BYTES / 3)).toString()
        assertThrows(IllegalArgumentException::class.java) { BackupPayload.validate(json) }
    }

    private fun save(version: Int): JSONObject = JSONObject()
        .put("version", version)
        .put("revision", 0)
        .put("activeExplorer", "explorer-1")
        .put("explorers", JSONObject().apply {
            for (id in 1..3) {
                put("explorer-$id", JSONObject()
                    .put("grade", "class-1")
                    .put("level", 1)
                    .put("journeys", JSONObject()))
            }
        })
}
