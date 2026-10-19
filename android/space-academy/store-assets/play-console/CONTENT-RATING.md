# IARC content rating answers

Play Console > **Policy and programs > App content > Content rating > Start questionnaire**.

Answer for the app as it ships. IARC issues the rating itself; the table is what to select.
Ads and in-app purchases are declared here **and** in the separate Ads declaration (`ADS-AND-AUDIENCE.md`).

## IMPORTANT: the game has cartoon combat

`js\space-academy\pitstop\roam.mjs` and `gear.mjs` ship a **free-roam mode**: the child's rocket fires
lasers, plasma and pulses at cartoon drones, zig-zag stars and flying saucers ("POW!"). Enemies drift in, can fire
back, the ship has hearts and "nothing can fail": at zero hearts the ship simply reboots. No blood, no humans,
no animals, no realistic weapons. That is **mild fantasy/cartoon violence** and must be declared. Answering "No
violence" would be a misdeclaration. Expect the final rating to be a little above the lowest tier
(about **IARC 7+ / PEGI 7 / ESRB Everyone 10+ or Everyone with Mild Fantasy Violence**) and let IARC decide.

## Step 1: Email and category

| Field | Answer |
| --- | --- |
| Email address for IARC certificates | The publisher's real contact email (USER to supply) |
| Category | **Game** (it is an educational game with a free-roam mode). If the Console offers only generic categories, "All other app types" gives the same content questions |

## Step 2: Questionnaire

| Question | Answer | Basis |
| --- | --- | --- |
| Violence: does the app contain violence? | **Yes, fantasy / cartoon violence only** | Free-roam turrets shoot cartoon robots and saucers, which pop. No blood, no gore, no humans or animals, no realistic weapons, no graphic or frequent-realistic violence, no violence against children or animals. Select the lowest "mild / cartoon fantasy" option wherever the form offers an intensity |
| Violence against human-like characters | **No** | Enemies are drones, a star-shaped robot and a saucer |
| Blood or gore | **No** | |
| Fear / horror content | **No** | Space facts are shown as wonder. Black holes are observed from a safe distance in the game's wording |
| Sexuality or nudity | **No** | |
| Crude humour | **No** | |
| Profanity | **No** | |
| Controlled substances (drugs, alcohol, tobacco) | **No** | |
| Gambling, simulated gambling, or loot boxes / random paid items | **No** | Fuel packs are fixed (5 or 15 fuel). Ad rewards are a fixed +1 fuel. Free-roam drops are earned by play, not bought |
| Users interact or exchange content with each other | **No** | No chat, friends, profiles or user content |
| Shares the user's physical location with others | **No** | No location access |
| Digital purchases | **Yes** | Fuel packs and Remove ads via Google Play (`BILLING-PRODUCTS.md`) |
| Contains ads | **Yes** | Optional rewarded ads, child-directed settings |
| Unrestricted internet access / browsing | **No** | The WebView loads only the bundled offline game. Links to the website, NASA and others open the user's own browser |
| Real-money gambling or contests | **No** | |
| News or health/medical app | **No** | |

## Step 3: Expected result and what to do with it

- Expect low maturity ratings across authorities, probably a notch above the minimum because of the cartoon combat.
  Do not publish a rating claim in the listing text until the certificate arrives.
- The IARC certificate is emailed to the address above. Check **Content rating** has no unresolved items.
- Re-run the questionnaire whenever combat changes (for example realistic enemies, blood or a chat feature)
  or if the game adds user content, location, or a different ad type.

## Not verified here

- The live questionnaire's exact category names and wording change. The answers above state the *content*
  truthfully; map each to the nearest label. Where ambiguous, answer **Yes** and let IARC lower it.
- I read the free-roam source and not the compiled Android build visually; confirm the free-roam mode is
  reachable in the build you submit, and play it once to double-check there is nothing more intense than the above.
