# Main store listing (paste-ready)

Play Console > **Grow users > Store presence > Main store listing** (and **Store settings**).
Language: **English (India) en-IN** as default; copy is plain English and works for en-US/en-GB if you add them.
Limits: app name 30, short description 80, full description 4000 characters (counts checked).

## Fields

| Field | Value | Length |
| --- | --- | --- |
| App name | `Otterly Space Academy` | 21 / 30 |
| Short description | `Olympiad-style maths and reasoning for PP1 to Class 5, in a rocket adventure.` | 77 / 80 |
| App icon | `store-assets\icon-512.png` (512x512 PNG, already built) | n/a |
| Feature graphic | `store-assets\feature-graphic-1024x500.png` | n/a |
| Phone screenshots | At least 2, up to 8 (see "Screenshots" below) | n/a |
| App category | **Education** | n/a |
| Tags | See "Tags" below | n/a |

Application type: Play first asks **App or game**. Choose **App**, then category **Education**, as requested.
The listing wording must describe an educational practice game and nothing else. (`CONTENT-RATING.md` uses the
"Game" questionnaire because of the cartoon free-roam mode; the two choices are independent.)

## Full description (paste exactly; plain text; about 2,300 characters)

```
Otterly Space Academy turns maths and reasoning practice into a rocket adventure for children from PP1 to Class 5 (about ages 4 to 11).

Ringo the otter and the Academy crew guide each child through a class-by-class journey. Answer questions to earn parts, build and paint a rocket, then fly through space and discover real planets, stars and other objects.

WHAT CHILDREN DO
- Choose a class from PP1 to Class 5 and follow its chapters
- Practise Olympiad-style questions in short missions, with hints when stuck
- Build a rocket for each class, paint it and add stickers
- Take mock tests: each one uses 1 fuel
- Fly in free roam, collect gear and zap cartoon drones and saucers (no blood, no real-world characters)
- Discover real objects in space with simple, child-friendly facts

WHAT GROWN-UPS GET
- A Skills page that shows where a child may need more practice (practice observations only, not an IQ score or a diagnosis)
- Questions grouped by chapter for each class so you can follow what is being practised
- Settings for reduced motion and sound
- A simple backup file you can save yourself

THE OLYMPIAD NOTE
The questions are independently written practice items in an Olympiad style. They are not copied past papers. Otterly Games is not affiliated with, endorsed by or sponsored by any Olympiad organiser, board or school. The game does not predict exam results.

FUEL, ADS AND PURCHASES
- The first mock test in each class is free
- 2 free fuel come back every day, so play never has to stop
- A child can choose to watch an optional ad for 1 extra fuel, up to 2 times a day. Nothing happens if they skip it
- A grown-up can buy a 5 fuel pack, a 15 fuel pack, or a one-time Unlimited fuel (Remove ads) purchase inside the app, using Google Play
- Purchases sit in the For grown-ups area. Press and hold to open it

PRIVACY
- Plays offline. No account, no name, no email, no chat
- Progress stays on the device and is not sent to Otterly Games
- Ads are optional rewarded videos from Google AdMob, set to child-directed and non-personalised, and limited to family-friendly content
- Privacy policy: https://otterlygames.com/privacy.html

The cartoon space scenes are make-believe, not a scale map of space.

Questions or feedback from a parent or teacher: https://otterlygames.com/contact.html
```

Prices are not written in the description because Google Play shows the local price in the store.

## Wording rules this copy follows

- No awards, rankings or "#1", no download counts, no ratings quotes, no "approved by" or "recommended by" claims.
- No mention of Google, Android or other brands in the name; "Google AdMob" and "Google Play" appear once as factual notes about payments and ads.
- No call to action like "Download now"; no emoji, all-caps shouting or repeated punctuation. (The few all-caps section labels are a Play-accepted style; remove them if the Console complains.)
- No claim of school or board endorsement, exam score improvement, or learning outcomes that cannot be shown.
- "Real planets, stars and other objects": the game cites public NASA pages for grown-ups but is **not** NASA-endorsed; the listing never says it is.
- Every sentence above is in the current code. If a feature is not in the build you submit (for example free roam), delete that bullet.

## Tags

Play lets you choose from a fixed list (up to five). Choose, in this order if available:

1. **Education**
2. **Educational games** (or **Learning**)
3. **Kids** / **Children** (shown only if offered)
4. **Math** (or **Puzzle** if Math is absent)
5. **Space** (or **Adventure**)

Do not choose tags like "Competitive", "Shooter", "Battle" or "Action": those mislead parents and may conflict with the
Families audience.

## Store settings (Grow users > Store presence > Store settings)

| Field | Value |
| --- | --- |
| Category | Education |
| Contact email | **USER to supply**: a real, monitored address. The repo only has a contact form, no public support email |
| Contact website | `https://otterlygames.com` (the root domain that holds `app-ads.txt`, so AdMob can match it) |
| Contact phone | Optional; leave blank |
| External marketing | Leave **on** only if you want Google to promote the app outside Play |

## Screenshots (USER or AGENT to capture)

- At least 2 phone screenshots; 4 to 8 is better. JPEG or 24-bit PNG, no alpha, 16:9 or 9:16, each side 320 to 3840 px.
- Suggested set, all from a real build with nothing personal on screen:
  1. Class map. 2. A question with the hint chip. 3. Rocket bay or paint screen. 4. Space discovery card.
  5. Skills page. 6. Free roam. 7. The grown-ups panel with the fuel shop (shows the price honestly).
- Tablet screenshots: 7-inch and 10-inch are optional but improve tablet ranking. Add at least 4 if you do.
- Do not show fake reviews, award badges or a device frame that hides the real screen. Existing in-repo screenshots under
  `files\academy-critics` in the session folder are development captures, not store assets; recapture from the release build.

## Release notes (first release, en-IN, 500 characters max)

```
First release of Otterly Space Academy: maths and reasoning missions for PP1 to Class 5, rocket building, free roam and space discoveries. Works offline. Optional rewarded ads and optional fuel purchases.
```

## Not verified here

- Console wording for the App-vs-Game choice, the tag list and the optional fields changes; confirm live.
- I did not run the build, so confirm every feature bullet in the release you upload.
