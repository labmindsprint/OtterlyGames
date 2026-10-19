# Space Academy fuel monetisation (Android)

The Android host exposes ads and Play Billing to the web game as `window.OtterlyNative`. The website itself never
has ads or purchases. This file covers the contract, build properties, testing and the accounts you must set up.

## Contract

`js\space-academy\pitstop\fuel-bridge.mjs` is the consumer. The host provides exactly:

```text
window.OtterlyNative = {
  rewardedAd: { available(): Promise<boolean>, show(): Promise<{ rewarded: boolean }> },
  billing:    { products(): Promise<{ id, price }[]>, buy(id): Promise<{ ok: boolean }>, restore(): Promise<{ ids: string[] }> },
}
```

- Every promise resolves. Errors, timeouts, a missing Play Store or no ad all become `false`,
  `{ rewarded: false }`, `[]`, `{ ok: false }` or `{ ids: [] }`. Nothing throws into the page.
- Product ids: `fuel-5`, `fuel-15` (consumable) and `remove-ads` (one time, INR 150).
- `price` is Play's localised `formattedPrice`. Products Play does not return are left out.
- The daily ad cap (2 per day) is enforced by the web game. Native only loads and shows.

### How it is wired

| Piece | File |
| --- | --- |
| JS shim that creates `window.OtterlyNative` | `app\src\main\res\raw\otterly_native_shim.js` |
| `@JavascriptInterface` host (`OtterlyNativeHost.request`) | `MonetisationHost.kt` |
| Rewarded ad (Google Mobile Ads SDK) | `RewardedAdController.kt` |
| Play Billing Library 9.1.0 | `PlayBilling.kt` |
| Pure, unit-tested logic (protocol, purchase rules, ad slot) | `MonetisationLogic.kt` |

The shim is added with `WebViewCompat.addDocumentStartJavaScript` for the bundled origin only, so
`window.OtterlyNative` exists before the game's modules run. WebViews without that feature get the same script on page
start (it is idempotent and the game reads the bridge lazily). Each page load has a random token, so an answer for an
old page can never settle a request on a new one. The host only answers the trusted bundled game URL.

### Rewarded ads

- `available()` is true only while an ad is loaded and fresh (under 55 minutes). If a load is in flight it waits up to 3 s.
- `show()` resolves `rewarded: true` only if the reward callback fired, after the ad is dismissed. Any show failure,
  dismissal without the reward, or a second `show()` while one is open gives `rewarded: false`.
- The next ad is preloaded after every show. Failed loads back off 5 s, 10 s, 20 s, 40 s, then 60 s.
- Child-safe config, set before the SDK initialises: age treatment CHILD, `tagForChildDirectedTreatment = TRUE`,
  `tagForUnderAgeOfConsent = TRUE`, `maxAdContentRating = G`, plus `npa=1` on every request. No personalised ads.
  No consent form (UMP) is used because requests are child-treated; there is no EEA personalisation to consent to.

### Billing

- `buy(id)` resolves `ok: true` only after the purchase is **consumed** (fuel packs) or **acknowledged** (`remove-ads`),
  because the game grants fuel as soon as it resolves.
- A pending payment (slow payment method) resolves `ok: false` with no grant. If the child pays later, the purchase is
  recovered the next time they tap buy for the same product (Play answers "already owned"; the host consumes or
  acknowledges it and resolves `ok: true` without charging again). `remove-ads` is also returned by `restore()`.
- `restore()` queries purchases and returns owned, completed non-consumable ids (just `remove-ads`), acknowledging any
  that were paid but never acknowledged. The host also does this quietly at start-up so the 3 day auto-refund for
  unacknowledged purchases cannot trigger.
- Purchases are not verified against a server. For a one-time Rs 150 purchase in a kids app this is accepted; add a
  backend and Play Developer API checks if fraud becomes a problem.
- Refunds are not revoked: the web game keeps supporter status once granted.

## Build properties

| Property | Meaning |
| --- | --- |
| `OTTERLY_ADMOB_APP_ID` | AdMob **app** id, `ca-app-pub-<publisher>~<app>` |
| `OTTERLY_ADMOB_REWARDED_UNIT_ID` | Rewarded **ad unit** id, `ca-app-pub-<publisher>/<unit>` |

Set them with `-P` on the command line, in `~\.gradle\gradle.properties`, or in the git-ignored
`android\space-academy\local.properties`. Never commit real ids with your own keystore.

```properties
# local.properties
OTTERLY_ADMOB_APP_ID=ca-app-pub-0000000000000000~0000000000
OTTERLY_ADMOB_REWARDED_UNIT_ID=ca-app-pub-0000000000000000/0000000000
```

- **Debug builds always use Google's test ids** (`ca-app-pub-3940256099942544~3347511713` and
  `ca-app-pub-3940256099942544/5224354917`), so a developer cannot click a live ad by accident.
- **Release builds fail** in `verifyReleaseMonetisation` (wired into `preReleaseBuild`) unless both properties are
  supplied, match the id formats, are not Google's test ids, and share the same publisher.

```powershell
.\gradlew.bat :app:assembleRelease "-POTTERLY_ADMOB_APP_ID=ca-app-pub-...~..." "-POTTERLY_ADMOB_REWARDED_UNIT_ID=ca-app-pub-.../..."
```

## Advertising ID (Families policy)

Space Academy is for children, so it falls under Google Play's Families policy: apps whose audience includes only
children must not transmit the advertising ID, and may only use ad SDKs certified for children (AdMob is, when
child-directed treatment is on). The manifest therefore:

- removes `com.google.android.gms.permission.AD_ID` (the Ads SDK adds it when merging) with `tools:node="remove"`, plus
  `ACCESS_ADSERVICES_AD_ID`, `ACCESS_ADSERVICES_ATTRIBUTION` and `ACCESS_ADSERVICES_TOPICS`;
- adds only `INTERNET` (the Ads SDK and Play Billing also bring `ACCESS_NETWORK_STATE`, `WAKE_LOCK`,
  `FOREGROUND_SERVICE` and `com.android.vending.BILLING`).

In Play Console, answer the **Advertising ID** declaration with "No, my app does not use advertising ID". Do not add
mediation adapters unless each network is on Google's Families self-certified list.
Policy changes over time; re-read the Families policy before every release.

## Testing

Unit tests and static checks (no device needed):

```powershell
node --test scripts\space-academy-native-shim.test.mjs      # JS shim against a mocked host + the real fuel-bridge.mjs
cd android\space-academy
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:assembleDebug
```

**Test ads:** install the debug build (`.\gradlew.bat :app:installDebug`) on a device or emulator with Google Play
services and internet. Open Space Academy, finish a class, open the fuel box. The ad button appears once an ad has
loaded; the ad is labelled "Test Ad". With `chrome://inspect` you can also run
`await OtterlyNative.rewardedAd.available()` and `await OtterlyNative.rewardedAd.show()` on the page.

**Billing:** Play only serves products to an app installed from a Play track. Upload a release build signed with your
upload key to **Internal testing**, add your Google account under *Settings > License testing*, then install through the
opt-in link. License testers get test cards, including "always approves" and "always declines" and slow-payment
(pending) cases. Check: prices show localised; buying `fuel-5` adds 5 fuel once; buying again works (consumed);
`remove-ads` buys once, then `restore()` returns it after reinstall; a declined or cancelled payment grants nothing.

## What you must provide

1. **AdMob account**: register the app (package `com.otterlygames.spaceacademy`), create one **Rewarded** ad unit, set
   the app to child-directed treatment in AdMob, set the maximum ad content rating to G and block sensitive
   categories. Supply the app id and unit id with the properties above.
2. **Google Play Console app** with the same package and a release keystore (kept out of git; there is no signing config
   in this repo).
3. **In-app products** (Monetize > One-time products), all active:
   - `fuel-5` (suggested INR 49) and `fuel-15` (suggested INR 99), purchase option "Buy" (the host consumes them, so
     they behave as consumables);
   - `remove-ads` at INR 150, one-time, not consumed.
4. **Play Console declarations**: contains ads = yes; target audience includes children (Families programme);
   Advertising ID = no; Data safety (ad SDK collects device/diagnostic data); a payments profile and merchant account.
5. **License testers** and an Internal testing track for billing tests.
6. A **privacy policy** that covers the ad SDK and purchases, and parent contact details for the Families listing.

## Not verified here

No emulator or device was available (the machine had about 0.3 GB of free disk), so ad rendering, Play Billing flows
and document-start injection on a real WebView were not run. The Gradle build, unit tests, lint, release gating, merged
manifest and the JS shim logic were.
