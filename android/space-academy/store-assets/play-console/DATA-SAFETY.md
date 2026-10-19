# Data safety form: exact answers

Play Console > your app > **Policy and programs > App content > Data safety**.

Basis: this repo (`AndroidManifest.xml`, `RewardedAdController.kt`, `PlayBilling.kt`, `MONETISATION.md`) and Google's
Mobile Ads SDK disclosure page for v25.5.0 (<https://developers.google.com/admob/android/privacy/play-data-disclosure>).
The form is global and must describe the sum of what any live version does. Re-check it on every SDK upgrade.
Google holds you accountable for the answers; read each one against the live form before submitting.

## What the app really does

| Fact | Evidence |
| --- | --- |
| Progress, fuel, settings and purchase status are saved only on the device (WebView IndexedDB). Nothing is uploaded by Otterly Games. No backend, no accounts, no analytics SDK | `README.md`, `privacy.html` 2.5; no analytics dependency in `build.gradle.kts` |
| Android auto-backup is off | `allowBackup="false"`, `fullBackupContent="false"` |
| Only network users are the Google Mobile Ads SDK (rewarded ads) and Play Billing (Google Play) | `build.gradle.kts` dependencies |
| Ad ID is not read: `AD_ID`, `ACCESS_ADSERVICES_*` permissions removed | `AndroidManifest.xml` |
| Ads: child-directed, under-age-of-consent, max rating G, `npa=1`, no UMP, no mediation | `RewardedAdController.kt` |
| Purchase tokens stay on the device, are consumed or acknowledged locally, and are not sent to any Otterly server | `PlayBilling.kt`, `MONETISATION.md` |
| Optional backup file is written only where an adult picks, via the system file picker | `MainActivity.kt` (`ACTION_CREATE_DOCUMENT`) |

## Section 1: Data collection and security

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** (the Google Mobile Ads SDK does it automatically) |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (Google states SDK data is encrypted in transit with TLS; Otterly sends none of its own) |
| Which of the following methods of account creation does your app support? | **My app does not allow users to create an account** |
| Do you provide a way for users to request that their data is deleted? | **Yes**. Remember that Otterly holds no user data. Use: in-app deletion by uninstalling or clearing app data, plus the contact form. Put the deletion URL as `https://otterlygames.com/privacy.html` (section 4 explains deletion) |
| Committed to follow the Play Families Policy? | **Yes** (appears because children are targeted) |
| Independent security review? | **No** (do not claim one) |

## Section 2: Data types (tick only these)

Everything not listed here is **not collected**: Location (precise), Personal info (name, email, user IDs,
address, phone, race, political, sexual orientation, other), Financial info, Health and fitness, Messages,
Photos and videos, Audio, Files and docs, Calendar, Contacts, Web browsing, Search history, Installed apps,
Crash logs from your own code, Other user-generated content.

| Category | Data type | Collected | Shared | Optional? | Purposes | Why |
| --- | --- | --- | --- | --- | --- | --- |
| Location | **Approximate location** | Yes | Yes | Required | Advertising or marketing; Fraud prevention, security, and compliance | The Ads SDK collects the device IP address, which Google says "may be used to estimate the general location". Google's own guidance says to declare IP address by how it is used. Declaring is the conservative choice |
| App activity | **App interactions** | Yes | Yes | Required | Advertising or marketing; Analytics | Ads SDK collects "app launch, taps, and video views" |
| App info and performance | **Diagnostics** | Yes | Yes | Required | Analytics; Fraud prevention, security, and compliance | Ads SDK collects app launch time, hang rate, energy usage |
| Device or other IDs | **Device or other IDs** | Yes | Yes | Required | Advertising or marketing; Fraud prevention, security, and compliance | Ads SDK collects the **app set ID** and any other device identifiers. The Android advertising ID is **not** read because the permission is removed. Still declare the category |

Notes on the cells:

- **Shared = Yes** because ad requests go to Google AdMob, which is a separate legal entity from Otterly Games and may use the data for its own advertising and fraud purposes. Do not tick "service provider" exemption.
- **Required, not optional**, because the SDK preloads an ad as soon as the game starts, whether or not the child watches one. Google says to mark a type required if any user cannot opt out.
- **Do not tick "Personalization"** as a purpose: ads are non-personalised, child-directed.
- If, after reading the live form, a purpose is not offered for a type, pick the closest and keep it consistent with `privacy.html` 2.5.

## Things you must NOT declare, and why

| Item | Reason |
| --- | --- |
| Game progress, fuel, skills, answers, explorer names/slots | Stored on device only and never transmitted. Data that never leaves the device is not "collected" |
| Payment card, name on card, billing address | Google Play collects these directly from the buyer and the app never sees them. Google's Data safety FAQ says you need not declare them when the payment service collects it and your app never accesses it |
| Purchase history | The app reads owned products from Google Play on the device to consume or acknowledge them, and never transmits them. Not collected under the form's definition. Revisit if you ever add a server or analytics that receives purchase tokens |
| Advertising ID | Permission removed in the manifest; the app does not read it |

## Section 3: Preview and submit

- Check the **preview** shows exactly: "Data shared: Approximate location, App activity, App info and performance, Device or other IDs" and "Data collected" the same set; and "No data is required to create an account" style wording.
- Save and publish the declaration. It is reviewed together with the first release.

## Consistency checks before you click Submit

- `privacy.html` section 2.5 says Google receives IP address, device/OS details, app and SDK version, ad requests and interactions, diagnostics. Matches the table.
- Target audience answers (ADS-AND-AUDIENCE.md) say children are included, ads yes, advertising ID **no**.
- No mediation adapter, no Firebase, no analytics in the build. If any is added later, update this form before shipping.

## Not verified here

- Whether the live Console form wants IP address under "Approximate location" or "Device or other IDs": the page above lets the developer decide by use. The answer above is deliberately the more disclosing one.
- Real network traffic was not captured on a device. Before submitting, capture an ad load on a debug build with a proxy or `adb` and confirm no other identifiers leave the phone.
