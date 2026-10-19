# Ads declaration, target audience, Families and AdMob

All answers match what the code does today: Google AdMob **rewarded** ads only, child-directed, non-personalised,
no mediation, no banner or interstitial, advertising ID not read. Source files: `RewardedAdController.kt`,
`AndroidManifest.xml`, `MONETISATION.md`. Re-read the live Families policy before each release.

## 1. Play Console: Ads declaration

Play Console > **Policy and programs > App content > Ads**

| Question | Answer |
| --- | --- |
| Does your app contain ads? | **Yes** |

Declare ads **before** filling in Target audience; the Console requires that order.

## 2. Play Console: Target audience and content

Play Console > **Policy and programs > App content > Target audience and content**

| Question | Answer |
| --- | --- |
| Target age groups | **5 and under, 6-8, 9-12** (tick exactly these three. PP1 is about age 4 to 5, Class 5 about age 10 to 11. Do **not** tick 13+) |
| Does your app appeal to children? | **Yes** (cartoon otter mascot, rocket-building, simple maths for ages 4 to 11) |
| Does the app have a mix of audiences (children and adults)? | Not asked once only under-13 groups are ticked |
| Is this app a "Designed for Families" / Teacher Approved candidate? | Leave the optional Teacher Approved enrolment **off** for launch; it can be applied for later |

Consequences: the app is a **Families** app. The Families policy then applies to the ads, the data, the
purchases and the store listing. Honour the Console's own warning: Google can reclassify the audience from
imagery and wording, so the listing must not target older users.

### Families-specific answers the Console may ask

| Topic | Answer | Evidence |
| --- | --- | --- |
| Ads shown to children come from a Families self-certified ad SDK | **Yes, Google AdMob only** (no mediation adapters). Do not add a mediation network unless it is on Google's current Families self-certified list | `build.gradle.kts` has only `play-services-ads` and `billing` |
| Advertising ID used | **No** (see section 4) | Manifest removes `AD_ID` and `ACCESS_ADSERVICES_*` |
| Child-directed treatment | **On** | `setTagForChildDirectedTreatment(TRUE)`, `setAgeRestrictedTreatment(CHILD)` |
| Under-age-of-consent tag | **On** | `setTagForUnderAgeOfConsent(TRUE)` |
| Max ad content rating | **G** | `setMaxAdContentRating(G)` |
| Personalised ads | **None** | `npa=1` on every request |
| Location collected | **No** | No location permission |
| Account creation or social features | **None** | |
| Ad format | **Rewarded video, opt-in** | Child taps "Watch an ad for +1 fuel"; never auto-plays. Cap of 2 a day, enforced in `fuel.mjs` (`MAX_ADS = 2`). Skipping costs nothing: 2 free fuel come back every day |
| Is any purchase possible without a parent? | The Fuel shop sits behind the grown-ups area, but the gate is a **two-second press-and-hold**, not a maths question. See "Parental gate risk" below | `views.mjs` `grownups()` |

### Parental gate risk (read before submitting)

The privacy page and the original brief mention a maths-question gate. The **Space Academy** build actually uses a
press-and-hold-for-two-seconds button, which a child can pass by holding a finger down. Google's Families
guidance lists examples of adult actions such as a PIN, password, birthdate, email verification, photo ID or
credit card, and a simple hold is not among them. Reviewers are inconsistent, so treat this as a rejection risk.

Recommended before the first submission (AGENT task in `CHECKLIST.md`): replace or add to the hold with a
randomised adult-level arithmetic or "type the digits in words" challenge in front of the Fuel shop, then update
`privacy.html` section 2.4 to match. Until then every disclosure in this folder says "press and hold"
because that is the truth. Google Play's own purchase authentication (Settings > Require authentication for
purchases) still applies to every Play Billing purchase.

## 3. Play Console: other App content items

| Item | Answer |
| --- | --- |
| Privacy policy URL | `https://otterlygames.com/privacy.html` (must be live with the new Android sections before you submit) |
| App access | All functionality available without login (see `APP-ACCESS-NOTES.md`) |
| Government app | No |
| Financial features | No |
| Health | No |
| News | No |
| COVID-19 | Not applicable |
| Data safety | `DATA-SAFETY.md` |
| Content rating | `CONTENT-RATING.md` |

## 4. Advertising ID declaration

Play Console > **App content > Advertising ID**: **No, my app does not use advertising ID.**
(The manifest strips the permission; `MONETISATION.md` explains why. If the Console flags the AD_ID permission
from the Ads SDK merge, check the merged manifest of the release build:
`android\space-academy\app\build\intermediates\merged_manifests\release\...\AndroidManifest.xml`.)

## 5. AdMob set-up (USER; account actions)

Publisher account on record: `pub-5489426086320283` (same as `app-ads.txt` in the website root, used for Math Tank and
Clock Master). Add Space Academy as a **new app inside this account**. App id and ad unit id are per app, not shared.

### 5a. Register the app
1. Sign in at <https://admob.google.com> with the account that owns `pub-5489426086320283`.
2. **Apps > Add app**.
3. Platform: **Android**.
4. "Is the app listed on a supported app store?": choose **No** (it is not published yet). Name it
   **Otterly Space Academy** and note the package `com.otterlygames.spaceacademy`. Click **Add app**.
   After the app is live on Play, return to **App settings > App details > Link to a store** and link it
   (needed for app-ads.txt to be associated).
5. Copy the **App ID** (`ca-app-pub-5489426086320283~XXXXXXXXXX`; the part after `~` is 10 digits).
6. Skip the "Add SDK / mediation" wizard steps; the SDK is already integrated.

### 5b. Set the child-directed and under-age settings at app level
1. **Apps > Otterly Space Academy > App settings** (the exact label may read *Settings > Ad serving / Child-directed settings*).
2. Set **Tag for child-directed treatment (TFCD) = Yes**, and **Tag for users under the age of consent (TFUA) = Yes**.
   The app already sets these per request in code; the console setting makes the policy explicit at account level.
3. Do **not** enable the EEA consent messaging (UMP) for this app. The app does not call UMP because every
   request is child-treated and non-personalised.

### 5c. Block unsuitable ads
1. **Blocking controls > Ad content rating**: set the app's maximum to **G / "Family-friendly"** if the control is shown (the code also requests G).
2. **Blocking controls > Sensitive categories**: block every category (Dating, Gambling, Alcohol, Politics, Religion, Weight loss, etc.).
3. **Blocking controls > General categories**: block anything not suitable for ages 4 to 11, including Games (to avoid in-app game promotion stealing attention), Shopping, Dating, Finance.
4. In **Ad review center**, leave auto-review on; check it weekly for the first month.

### 5d. Create the rewarded ad unit
1. **Apps > Otterly Space Academy > Ad units > Add ad unit**.
2. Format: **Rewarded**.
3. Ad unit name: `space-academy-fuel-rewarded`.
4. Reward settings: **Reward amount 1**, **Reward item "fuel"**. (These are informational; the game grants +1 fuel itself
   when the SDK reports the reward. Leave "Apply to all ads" as default.)
5. If asked for eCPM floors or mediation: leave default (**no mediation**).
6. Click **Create ad unit**. Copy the **Ad unit ID** (`ca-app-pub-5489426086320283/XXXXXXXXXX`).
   Do not click **Done** until you have copied both IDs; both can be re-found under the app later.

Credit/payments: check **Payments > Payment info** and that your tax profile is complete (not done by the agent).

## 6. Where to paste the IDs in the repo

Release builds refuse to build without them (`verifyReleaseMonetisation`), they must not be Google's test ids,
and both must share publisher `5489426086320283`.

Option A (recommended): git-ignored `android\space-academy\local.properties`

```properties
OTTERLY_ADMOB_APP_ID=ca-app-pub-5489426086320283~XXXXXXXXXX
OTTERLY_ADMOB_REWARDED_UNIT_ID=ca-app-pub-5489426086320283/XXXXXXXXXX
```

Option B: `~\.gradle\gradle.properties` with the same two lines, or pass them on the command line:

```powershell
.\gradlew.bat :app:bundleRelease "-POTTERLY_ADMOB_APP_ID=ca-app-pub-5489426086320283~XXXXXXXXXX" "-POTTERLY_ADMOB_REWARDED_UNIT_ID=ca-app-pub-5489426086320283/XXXXXXXXXX"
```

Nothing else to edit: the manifest placeholder `${admobAppId}` and `BuildConfig.REWARDED_AD_UNIT_ID` pick them up.
**Debug builds always use Google's test ids** (so you never click a live ad by accident). Never test a release build on your own device with live ads;
use a debug build or add your device under AdMob **Settings > Test devices**.

## 7. app-ads.txt

`app-ads.txt` in the website root already contains `google.com, pub-5489426086320283, DIRECT, f08c47fec0942fa0`. No new line is needed.
Set the Play listing **website** to `https://otterlygames.com` (see `LISTING.md`) so AdMob can match the app to that domain.
Allow up to 24 hours after the Play listing is live. AdMob **Apps > app > app-ads.txt** should then say "Verified".

## Not verified here

- AdMob console labels move around; the settings above are described by purpose. I could not log in.
- Whether the publisher account already has a verified payment profile.
- No device ran a real ad. `MONETISATION.md` says the same.
