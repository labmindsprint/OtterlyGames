# Play Console and AdMob onboarding checklist

Owner key: **USER** = needs your login, identity, money, signing key or the submit button. **AGENT** = can be done in the repo by the coding agent.
Work top to bottom; later steps depend on earlier ones. Nothing in this list has been done in any account.

Paste-ready material for each step is in this folder:
`DATA-SAFETY.md`, `CONTENT-RATING.md`, `ADS-AND-AUDIENCE.md`, `LISTING.md`, `BILLING-PRODUCTS.md`, `APP-ACCESS-NOTES.md`.

## A. Accounts (USER)

- [ ] 1. **USER**: Sign in to Play Console. Open **Settings > Developer account > Account details**. Note: account type (organisation or personal), creation date, verification status, payments profile. Needed to decide step 14.
- [ ] 2. **USER**: Clear any open banners (identity verification, payments profile, tax info, contact details). Publishing and payouts are blocked until done.
- [ ] 3. **USER**: Sign in to AdMob with the account that owns `pub-5489426086320283`. Check **Payments** has a complete profile.
- [ ] 4. **USER**: Decide and write down the public **support email** (a monitored mailbox). Needed for IARC, Play store settings and the Data safety deletion contact. The repo has only a contact form.

## B. Code and policy fixes before any build goes up (AGENT)

- [ ] 5. **AGENT**: Strengthen the parental gate in front of the Fuel shop. Today it is a two-second press-and-hold (`views.mjs`), which Google's Families reviewers may reject. Replace or add a randomised adult-level challenge, update tests, and update `privacy.html` 2.4/2.6 and `APP-ACCESS-NOTES.md` step 2. **Decision for USER**: accept the risk and ship as-is, or have this done. All current docs say "press and hold" because that is true today.
- [ ] 6. **AGENT**: Add a release signing config in `app\build.gradle.kts` that reads the git-ignored `keystore.properties` (the repo currently has none, see `README.md`). Skip if you prefer the manual signing in step 12B.
- [ ] 7. **AGENT**: Install the staged store icons into the project (`store-assets\README.md` "Install into the Android project") and set `android:roundIcon`.
- [ ] 8. **AGENT**: Confirm free-roam and every feature named in `LISTING.md` ship in the release build; confirm the 16 KB page-size check (APK Analyzer) with the final bundle.
- [ ] 9. **USER**: Publish the website changes so `https://otterlygames.com/privacy.html` shows sections 2.5 and 2.6 (this repo's edits are uncommitted). Open the URL in a private window to confirm.

## C. Keystore and ids (USER, with AGENT help)

- [ ] 10. **USER**: Create the **upload keystore** once, keep it outside the repo and back it up in two places (a password manager and an offline drive). Losing the upload key means a support request with Google.

```powershell
keytool -genkeypair -v -keystore "$env:USERPROFILE\otterly-upload.jks" -alias otterly-upload -keyalg RSA -keysize 2048 -validity 10000
```

- [ ] 11. **USER**: In AdMob, register the app and create the rewarded ad unit (`ADS-AND-AUDIENCE.md` section 5). Put the two ids in `android\space-academy\local.properties` (git-ignored) as shown in section 6 of that file.

## D. Signed bundle

- [ ] 12. **AGENT or USER**: Build the signed AAB.

Prereqs: Node on PATH (the build bundles the website game), JDK 17, the Android SDK. Run in `android\space-academy`.

12A. If step 6 was done, with `keystore.properties` holding the store path, alias and passwords:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug
.\gradlew.bat :app:bundleRelease
```

12B. Manual signing (works today without a signing config). The release build fails unless both AdMob ids are
supplied (`local.properties` or `-P`):

```powershell
.\gradlew.bat :app:bundleRelease "-POTTERLY_ADMOB_APP_ID=ca-app-pub-5489426086320283~XXXXXXXXXX" "-POTTERLY_ADMOB_REWARDED_UNIT_ID=ca-app-pub-5489426086320283/XXXXXXXXXX"
jarsigner -keystore "$env:USERPROFILE\otterly-upload.jks" -sigalg SHA256withRSA -digestalg SHA-256 app\build\outputs\bundle\release\app-release.aab otterly-upload
jarsigner -verify -verbose -certs app\build\outputs\bundle\release\app-release.aab | Select-String "jar verified"
```

Output: `app\build\outputs\bundle\release\app-release.aab`. `versionCode` is 1 in `build.gradle.kts`: raise it for every upload.

- [ ] 13. **AGENT**: Inspect the release merged manifest: `INTERNET` present; `AD_ID` and `ACCESS_ADSERVICES_*` **absent**; `com.android.vending.BILLING` present; the AdMob app id is the real one, not Google's test id.

## E. Play Console app and declarations (USER)

- [ ] 14. **USER**: **Create app**: name `Otterly Space Academy`, default language English (India), **App**, **Free**, accept declarations. (Free app with in-app purchases cannot later become a paid app.)
- [ ] 15. **USER**: **Policy and programs > App content**: complete in this order, pasting from this folder:
  - [ ] a. Privacy policy URL `https://otterlygames.com/privacy.html`
  - [ ] b. **Ads** = Yes (`ADS-AND-AUDIENCE.md` section 1)
  - [ ] c. **App access** (`APP-ACCESS-NOTES.md`)
  - [ ] d. **Target audience and content** (ages 5 and under, 6-8, 9-12)
  - [ ] e. **Content rating** (`CONTENT-RATING.md`, remember the cartoon combat)
  - [ ] f. **Data safety** (`DATA-SAFETY.md`)
  - [ ] g. **Advertising ID** = No
  - [ ] h. Government apps, financial features, health, news: No / not applicable
- [ ] 16. **USER**: **Grow users > Store presence > Main store listing**: paste from `LISTING.md`; upload `store-assets\icon-512.png`, `feature-graphic-1024x500.png` and at least 2 phone screenshots.
- [ ] 17. **USER**: **Store settings**: category Education, support email from step 4, website `https://otterlygames.com`.

## F. Internal testing and billing (USER)

- [ ] 18. **USER**: **Test and release > Testing > Internal testing > Create new release**. Accept Play App Signing, upload the signed AAB, add release notes, save and roll out. Add yourself under **Testers**.
- [ ] 19. **USER**: Create the three one-time products (`BILLING-PRODUCTS.md`) and **Activate** each.
- [ ] 20. **USER**: **Setup > License testing**: add tester accounts. Install from the opt-in link on a real Android device.
- [ ] 21. **USER or AGENT**: Test on that device: rewarded ad appears (debug build for test ads; real ads only on a license-tester device), consumable purchases add fuel and can repeat, `remove-ads` buys once and restores, a declined payment grants nothing, the app works offline, nothing leaves the device except ad and billing traffic.
- [ ] 22. **AGENT**: Fix anything found in step 21, then rebuild with a **higher versionCode** and re-upload.

## G. Closed testing (only if it applies)

The 12-testers-for-14-days rule applies to **personal** developer accounts created after **13 Nov 2023**. An
**organisation** account, or a personal account older than that, is **exempt** and can go straight to production.
Step 1 tells you which you are. Google may change this rule; re-check the live page.

- [ ] 23. **USER, only if the rule applies**: **Testing > Closed testing > Create track**. Create a tester list of **at least 12** real people (parents, teachers, friends; Google accounts), each opted in through the closed-test link.
- [ ] 24. **USER, only if the rule applies**: Keep **12 or more** testers opted in **continuously for 14 days**. If a tester drops out, recruit a replacement straight away so the count never falls below 12. Ask for a bit of real feedback.
- [ ] 25. **USER, only if the rule applies**: After day 14, **Dashboard > Apply for production** and answer the questions about testing (what was tested, what feedback, what was fixed). Google reviews the application (about a week).

## H. AdMob after the app exists in Play (USER)

- [ ] 26. **USER**: Link the AdMob app to the Play listing (**App settings > App details**) once published, and confirm **app-ads.txt** shows "Verified" (allow 24 hours; website must be `https://otterlygames.com` in Store settings).

## I. Production

- [ ] 27. **USER**: **Release > Production > Create new release**: choose the tested AAB or a rebuilt one, countries (start with India), release notes.
- [ ] 28. **USER**: **Publishing overview > Send changes for review**. Leave **Managed publishing** on so you control the go-live moment.
- [ ] 29. **USER**: Watch the **Policy status** page and your email for policy messages. Reply with the facts if Google queries the parental gate, ads or Data safety.
- [ ] 30. **AGENT**: Handle any rejection: change code or text, bump `versionCode`, re-upload (the AAB step 12 again).

## J. After launch

- [ ] 31. **USER**: Make one real small purchase and refund it from Play Console to check the production path; see one live ad on a license-tester device.
- [ ] 32. **USER**: Re-check Data safety, content rating and `privacy.html` against the live build after each SDK or feature change.
- [ ] 33. **USER**: Add reminders for the yearly Google deadlines (target API level, Play Billing Library version, 16 KB page size). The app currently targets API 36, uses Billing 9.1.0 and Ads 25.5.0.

## Not verified here

Everything involving Google's live consoles (labels, the exact tester rule for your account, review times) and every
device flow. No build was run for this checklist.
