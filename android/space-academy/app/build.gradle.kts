import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// AdMob ids come from -P / ~/.gradle/gradle.properties or the ignored local.properties. Google's official test ids are
// the default; release builds refuse to build with them (see verifyReleaseMonetisation).
val localProperties = Properties().apply {
    rootProject.file("local.properties").takeIf { it.isFile }?.inputStream()?.use(::load)
}

fun monetisationSetting(name: String): String? =
    (providers.gradleProperty(name).orNull ?: localProperties.getProperty(name))?.trim()?.takeIf { it.isNotEmpty() }

val testAdmobAppId = "ca-app-pub-3940256099942544~3347511713"
val testRewardedUnitId = "ca-app-pub-3940256099942544/5224354917"
val suppliedAdmobAppId = monetisationSetting("OTTERLY_ADMOB_APP_ID")
val suppliedRewardedUnitId = monetisationSetting("OTTERLY_ADMOB_REWARDED_UNIT_ID")

val websiteRoot = rootProject.projectDir.parentFile.parentFile
val webExporter = websiteRoot.resolve("scripts").resolve("prepare-space-academy-android.mjs")
val generatedWebAssets = layout.buildDirectory.dir("generated").map { it.dir("academy-assets") }

val prepareWebAssets by tasks.registering(Exec::class) {
    group = "build"
    description = "Bundle the complete website game and native-only host overlays for offline play."
    workingDir(websiteRoot)
    commandLine("node", webExporter.absolutePath, "--output", generatedWebAssets.get().asFile.absolutePath)
    inputs.file(webExporter)
    outputs.dir(generatedWebAssets)
    outputs.upToDateWhen { false }
}

android {
    namespace = "com.otterlygames.spaceacademy"
    compileSdk = 36
    buildToolsVersion = "35.0.0"

    defaultConfig {
        applicationId = "com.otterlygames.spaceacademy"
        minSdk = 26
        targetSdk = 36
        versionCode = 2
        versionName = "1.0.0"
    }

    sourceSets["main"].assets.srcDir(generatedWebAssets)

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    val signingProps = Properties().apply {
        rootProject.file("keystore.properties").takeIf { it.isFile }?.inputStream()?.use(::load)
    }
    signingConfigs {
        if (signingProps.isNotEmpty()) {
            create("release") {
                storeFile = rootProject.file(signingProps.getProperty("storeFile"))
                storePassword = signingProps.getProperty("storePassword")
                keyAlias = signingProps.getProperty("keyAlias")
                keyPassword = signingProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        // Debug builds always show Google's test ads so a developer can never click a live ad by accident.
        debug {
            manifestPlaceholders["admobAppId"] = testAdmobAppId
            buildConfigField("String", "REWARDED_AD_UNIT_ID", "\"$testRewardedUnitId\"")
        }
        release {
            signingConfigs.findByName("release")?.let { signingConfig = it }
            manifestPlaceholders["admobAppId"] = suppliedAdmobAppId ?: testAdmobAppId
            buildConfigField("String", "REWARDED_AD_UNIT_ID", "\"${suppliedRewardedUnitId ?: testRewardedUnitId}\"")
        }
    }

    buildFeatures {
        buildConfig = true
    }
}

val verifyReleaseMonetisation by tasks.registering {
    group = "verification"
    description = "Fails release builds unless real AdMob ids are supplied (never ships Google's test ids)."
    val appId = suppliedAdmobAppId
    val unitId = suppliedRewardedUnitId
    val testIds = setOf(testAdmobAppId, testRewardedUnitId)
    doLast {
        val problems = mutableListOf<String>()
        if (appId == null) problems += "OTTERLY_ADMOB_APP_ID is not set."
        if (unitId == null) problems += "OTTERLY_ADMOB_REWARDED_UNIT_ID is not set."
        if (appId != null && !Regex("""ca-app-pub-\d{16}~\d{10}""").matches(appId)) {
            problems += "OTTERLY_ADMOB_APP_ID must look like ca-app-pub-0000000000000000~0000000000."
        }
        if (unitId != null && !Regex("""ca-app-pub-\d{16}/\d{10}""").matches(unitId)) {
            problems += "OTTERLY_ADMOB_REWARDED_UNIT_ID must look like ca-app-pub-0000000000000000/0000000000."
        }
        if (appId in testIds || unitId in testIds) problems += "Google's test ids cannot be used in a release build."
        if (appId != null && unitId != null &&
            appId.substringAfter("ca-app-pub-").substringBefore('~') != unitId.substringAfter("ca-app-pub-").substringBefore('/')
        ) {
            problems += "The AdMob app id and ad unit id belong to different publisher accounts."
        }
        if (problems.isNotEmpty()) {
            throw GradleException(
                "Release build blocked: " + problems.joinToString(" ") +
                    " Supply both with -P, ~/.gradle/gradle.properties or the ignored local.properties; see MONETISATION.md.",
            )
        }
    }
}

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    dependsOn(verifyReleaseMonetisation)
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

tasks.named("preBuild") {
    dependsOn(prepareWebAssets)
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("com.google.android.gms:play-services-ads:25.5.0")
    implementation("com.android.billingclient:billing:9.1.0")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
