# App access and reviewer notes

## App content > App access

Choose: **All functionality in my app is available without any access restrictions.**
(There is no login, no account and no region lock, so no test credentials are needed.)

## Notes for the reviewer (paste into the free-text box, "Instructions for reviewers" / "Notes for reviewer")

```
Otterly Space Academy is an offline maths and reasoning practice game for children aged 4 to 11 (PP1 to Class 5). There is no login, account or server.

How to try it:
1. Open the app and tap Play. Choose any class (for example Class 2) and complete a short mission.
2. To see the fuel shop: open the For grown-ups link at the bottom of the start screen (or tap "Ask a grown-up for more fuel" on the empty-tank screen). The grown-ups area opens after you press and hold the "Hold to open" button for two seconds. Inside it, the Fuel box shows the in-app products: 5 fuel, 15 fuel and Unlimited fuel (no ads).
3. Purchases use Google Play Billing: fuel-5 (Rs 49) and fuel-15 (Rs 99) are consumable, remove-ads (Rs 150) is a one-time purchase. Use a license-tester account to complete test purchases.
4. Rewarded ads: when the tank is empty a button "Watch an ad for +1 fuel" appears once an ad has loaded. It is optional, capped at 2 per day, and uses Google AdMob configured for child-directed treatment, under-age-of-consent, G content rating and non-personalised ads. The advertising ID is not used.
5. The game keeps progress only on the device. Nothing is sent to us. Backups are only made when an adult chooses Help and saves and saves a file locally.

Family policy points: no accounts, no chat, no location, no external links inside the game without an adult (links open in the browser), ads are rewarded only (no banners or interstitials), purchases are inside the grown-ups area.

Privacy policy: https://otterlygames.com/privacy.html
Contact: https://otterlygames.com/contact.html
```

## How to reach each thing (for the user or a tester)

| Goal | Steps |
| --- | --- |
| Open the grown-ups gate | Start screen > **For grown-ups** (small link at the bottom) > press and hold **Hold to open** for **2 seconds** |
| See the fuel shop | Inside the grown-ups area, the **Fuel** box. On Android (when the Play Billing bridge exists) it shows **5 fuel pack**, **15 fuel pack**, **Unlimited fuel · no ads**, and **Restore purchases** |
| Make the tank empty fast | Start mock tests for a class. The first mock test in each class is free; after that each one uses 1 fuel, and 2 free fuel come each day. So the 4th mock test attempt on a fresh day shows the empty-tank screen (if you did not buy fuel) |
| See the rewarded ad | Empty-tank screen > **Watch an ad for +1 fuel** (appears only when an ad is loaded and ads remain today) |
| Debug-build test ads | Debug builds show Google test ads labelled "Test Ad". Release builds show real ads: use a license-tester device or AdMob test device |
| Website behaviour | The web game has no ads and no purchases: it shows a Ko-fi supporter code box instead. This does not appear in the Android build |

## Why this is truthful

- The gate is a **press-and-hold**, not a maths question. Do not describe it to Google as a maths question. See the risk in `ADS-AND-AUDIENCE.md`.
- If the gate is replaced with a randomised arithmetic challenge before release, update step 2 above to say so.
- Reviewers may not have a working ad fill (new ad units sometimes return "no fill" for hours). The button then stays hidden, which is the
  intended behaviour; say so in the notes if a review comes back "ads not shown".
