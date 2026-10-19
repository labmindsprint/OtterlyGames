# Otterly Space Academy — offline Android host

This is the complete website game bundled locally, not a remote-site launcher.
The package ID is `com.otterlygames.spaceacademy`; Android 8.0/API 26 or newer
and a current Android System WebView/Chrome are required.

## Local debug build

Use JDK 17 or 21, Node.js 22+, Android SDK Platform 36 and Build Tools 35.0.0.
Set `JAVA_HOME` and `ANDROID_HOME` to your existing installations, or configure
the SDK with an ignored `local.properties`. Do not commit machine paths or keys.
No script accepts SDK licenses on your behalf.

From this directory:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:assembleDebug
```

The debug APK is `app\build\outputs\apk\debug\app-debug.apk`. Gradle's
`prepareWebAssets` task calls the repository's
`scripts\prepare-space-academy-android.mjs --output <absolute-directory>` before
`preBuild`. The output is `app\build\generated\academy-assets`, included directly
in the app's assets source set. No copied game bundle is committed.

## Host boundaries

- The fixed local origin is `https://appassets.androidplatform.net`; the entry is
  `/play/pit-stop.html`, the PIT STOP game itself (not the website wrapper page).
  The prepare script bundles that page and every module, stylesheet, font and
  audio file it imports, found by parsing imports, and refuses source drift.
  Explicit module/font/wav MIME types keep ES modules working on older WebViews.
  Missing assets and failed module startup show a recoverable native error.
- Branding: a native launch splash (Android 12+ system splash, with a
  `Theme.SpaceAcademy.Launch` window background below that) uses the OSA icon on
  the Otterly Games teal. It hands over to an in-app Otterly Games splash (mascot,
  wordmark, tagline, then the game title, "&copy; Otterly Games", about 3.8 s,
  reduced-motion aware) that waits for PIT STOP to finish booting. Its sources are
  in `scripts\space-academy-android\`; Fredoka is OFL. The grown-ups page carries
  an Otterly Games credit. Phones are locked to portrait.
- App-only overlays (website Ko-fi supporter codes removed, Android lifecycle
  hidden-page signal, the splash) are applied to copies by the prepare script.
- Only the bundled game stays in the bridge-enabled WebView. Public site,
  curriculum, parent, privacy, contact and NASA links open an external browser.
  Exact public mission links can open locally; their raw query is passed to the
  game's existing validator. This is not a verified Android App Link claim.
- `OtterlyAndroid.exportBackup(json)` accepts a supported three-explorer save up
  to 8 MiB and opens Android's create-document picker with a fixed suggested
  JSON filename. It returns immediately. Completion is reported through
  `otterly-native-backup-result` with `{ok, message}`; cancellation is not success.
  Restore uses one temporarily granted document and the game's own validation
  and confirmation. There are no storage permissions or persistent URI grants.
- `otterly-native-visibility` carries a Boolean on activity/window lifecycle
  changes. The exported game gates its active-time clocks independently of
  document visibility. Orientation changes retain the WebView; renderer recovery
  replaces only the screen, never IndexedDB.
- All three explorers, old-bank migration and campaigns remain local to this
  app origin. Website and app saves do not automatically transfer or cloud-sync.
  Use explicit JSON Backup/Restore; uninstalling or clearing app data removes
  local progress. Platform automatic backup is disabled.
- There is an Internet permission only for the rewarded ad (Google Mobile Ads SDK,
  child-directed, no advertising ID) and Play Billing; the bundled game itself stays
  offline and its WebView still blocks network loads. See `MONETISATION.md` for the
  `window.OtterlyNative` bridge, AdMob properties, testing and Play Console steps.
  There is no analytics, account integration, release-signing configuration or store
  publication. External browsers and user-selected document providers operate
  outside this offline host.
