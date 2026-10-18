# Otterly Games 🦦

**Learning like no otter.**

Browser-first educational games, free practice tools, guided learning paths and
printable worksheets for families. Android app links are optional.

## Live Site

The public site is **https://otterlygames.com/**, hosted as static files on
GitHub Pages. There is no application server or account system for browser play.

## Build and preview

The website uses HTML, CSS and vanilla JavaScript, with a small dependency-free
Node build for shared chrome, discovery and policy consistency. Use Node 22 or
newer; no `npm install` is needed for this build.

```powershell
node .\scripts\build-space-academy.mjs --write
node .\scripts\build-site.mjs --write
node .\scripts\build-space-academy.mjs --check
node .\scripts\build-site.mjs --check
node --test .\scripts\build-site.test.mjs
python -m http.server 4195 --bind 127.0.0.1
```

Open `http://127.0.0.1:4195/`. Wait until other contributors finish editing
public pages before running `--write`. `--check` (also the default when no
mode is given) never writes and exits nonzero for stale generated content or
validation errors. Tests use isolated fixtures under the ignored `build`
directory and clean them up; they do not rebuild the website in place.

Commit the generated HTML and `sitemap.xml` together with their source changes
when publication is authorized. GitHub Pages serves those checked-in files:
it does **not** run this script automatically. Keep the root `.nojekyll` so
`_data` and the optional runtime `_includes` fallback remain available.

### Editing public content

- `_data\public-pages.json` explicitly defines indexable routes, the few
  custom-chrome Arcade games, and marketing pages eligible for static AdSense
  account verification. Directory indexes canonicalize to trailing-slash URLs.
- `_includes\nav.html` and `_includes\footer.html` are the only site-chrome
  sources. The build bakes them into existing pages between `og:nav` and
  `og:footer` start/end comment markers; do not hand-edit those generated blocks.
- `_includes\arcade-games.html` is the shared game-card source for `play\index.html`
  and `Arcade\index.html`. The build bakes its `og:arcade-games` blocks so both
  collections remain discoverable without JavaScript.
- New content pages opt in with `<body data-og-includes="nav,footer">` and should
  provide `<main id="main-content">`, a unique title and description, and a
  self-referencing canonical. Add the route to the public inventory.
- Add tools/posts to `_data\tools.json` or `_data\blogs.json` as well. The build
  regenerates the hub noscript fallbacks, tool counts and tools `ItemList`, and
  fails if the registries and public detail routes disagree.
- Re-run the build after changing any shared include or registry. A page's
  content outside generated blocks remains ordinary editable HTML.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the marker contract, strict transform
rules, archive/runtime exclusions and remaining deployment checks.

## Site Structure

```
index.html                  — Browser-first home
play\                       — Browser-game hub and full-game launchers
apps\                       — Optional Android app information
tools\                      — Practice tools and printable worksheet builder
learn\                      — Telling-time, times-tables, division, spelling paths
parents\                    — Adult guidance and local-progress information
blog\                       — Registry-backed articles and listing (Theme B: `css\blog.css`, `js\blog.js`, `js\article.js`)
Arcade\                     — Kid-led canvas games with touch and keyboard controls
support.html                — Optional adult support/sponsor information
about.html, contact.html    — About and contact
privacy.html, terms.html    — Policies
_includes\, _data\          — Shared HTML sources and explicit registries
css\, js\, fonts\, images\ — Static styles, enhancement and local assets
games\                      — Separately generated production game runtimes
scripts\build-site.mjs       — Public-site generator/checker
sitemap.xml, robots.txt      — Search discovery
```

## Tech Stack

- Pure HTML5 + CSS3 + Vanilla JavaScript
- No website framework migration or build-time package dependencies
- Checked-in, statically baked navigation/footer; JavaScript enhances behavior
- Self-hosted Nunito and Inter; optimized brand WebP assets
- Separate production-game export scripts (not run by the website build)

## Hosting

Designed for **GitHub Pages** (free):

Run the build/check commands before any authorized deployment. The site uses
root-relative URLs and the custom domain in `CNAME`; it is not configured for
an arbitrary `/repository-name/` URL prefix. Preserve the current Pages source,
custom-domain configuration, `.nojekyll`, `ads.txt` and `app-ads.txt`.
Local implementation or a successful build is not permission to push or publish.

## Learning paths and printable practice

The four `learn` paths connect readiness checks, worked examples, existing tools,
full browser games and paper practice. `parents` provides short-session and
classroom guidance without creating learner accounts or collecting progress.
The hub and the four skill pages use Theme B (`css\tokens.css` + `css\learn.css`,
scoped under `.learn-page`); the hub routes each skill as Learn → Try → Play, and
spelling honestly has no game (Spelling Bee is the practice). The tools hub
(`js\tools-hub.js`, grouped by skill from `_data\tools.json`), every tool page
and the worksheet builder use Theme B via `css\tools.css`; the legacy widget and
print styles (`css\style.css`, `css\worksheet-builder.css`) still apply. The
Parents page uses Theme B via `css\parents.css` and `js\parents.js`: a contents
list plus `<details>` accordions, all opened when printing.

`tools\worksheet-builder.html` generates multiplication, exact-division and
analogue-clock sheets in the browser. Shared URLs contain settings and a seed,
not answers, saved progress or student information. Questions are reproducible;
fixed-table activities cap at their unique fact bank rather than repeat items.
Printing supports A4 or Letter and an optional separate answer key.

```powershell
node --test .\scripts\worksheet-generator.test.mjs
python .\scripts\check-growth-learning.py --url http://127.0.0.1:4195 --output <outside-repo-folder>
python .\scripts\check-site-growth.py --url http://127.0.0.1:4195 --output <outside-repo-folder> --lab
```

The site checker covers every sitemap page on laptop and phone, core pages at
the seven game viewports, keyboard navigation, no-JavaScript discovery, local
links and full-game entry journeys. Its optional throttled result is a local
lab sample, not field Core Web Vitals or a ranking/revenue forecast.

## Games-first discovery and game introductions

Home is a curated brand page, not a second catalogue. `css\home.css`
(scoped under `.home-page`, with `js\home.js` for the clock and times-table
tiles) presents the original Otterly voice, familiar mascot, flagship learning
games, tools, lessons, parent guides and family story. Creative Arcade is
secondary and labelled "Just for fun".
`css\tokens.css` is the opt-in "Playful Dark, Evolved" (Theme B) foundation:
tokens, `.btn`/`.chip`/`.eyebrow`/`.section-head`/`.text-link`/`.surface`
primitives and the restyled shared nav and footer. Nothing in it applies until a
page adds `theme-b` (full theme) or `shell-b` (tokens plus nav/footer only) to
`<body>`. Home, the Play hub and game landing pages (`css\play-hub.css`,
`js\play-hub.js`; chrome around the games only) and the About, Contact,
Support, Privacy, Terms, 404 and `apps\` pages (`css\pages.css`, scoped by
`.page-*` body classes) use it. Icons come from `images\icons.svg`.
Keep Home's editorial choices distinct
from the complete collection on Play online.
Clock Master and Math Tank lead the hero and first feature section. Small
learning tools and guided lesson paths follow, ahead of the recreational Arcade.
Parent guides are also linked directly from Home and the main navigation.
The core journey is a parent finding useful guidance, trying a lesson or tool,
and choosing a related learning game or printable activity. Tools and original
blog articles are organic-search entry points, not secondary filler.

Play online is generated from `_data\games.json`. Add a game's public landing
page, local artwork, categories, description and content note there, then rebuild
to generate cards and matching ItemList metadata. `js\game-catalogue.js` adds
search, combined category filters (including Creative Arcade) and reset without
fetching a second catalogue. All game links also work without JavaScript.
Existing `#creative-arcade` and `#learning-games` links select the corresponding
collection when filtering is available; without JavaScript all links remain listed.

Clock Master and Math Tank lead with actual gameplay previews and their
original punchlines. The player comes before optional practice links.
Play is available immediately and through the practice, compact player
placeholder and contextual return-to-game dock.
Only a deliberate Play click loads the game, and returning never reloads it.
Both pages retain the prominent, optional official Google Play badge.

The four Creative Arcade introduction pages link to the original standalone
games, preserving their full-viewport controls. They explain controls and
cartoon-content notes rather than imposing lessons. Space Academy retains its
own welcome, chapter choices and Open gesture.

Marketing compositions are static: no assembly/parallax script, scroll gate or
game autoplay. `/apps/` demos and runtime race/battle query modes remain.
Shared navigation gives Play online the primary action, keeps Creative Arcade
visible and leaves printing with the learning resources.

```powershell
node --test .\scripts\build-site.test.mjs .\scripts\site-games.test.mjs
python .\scripts\check-site-growth.py --url http://127.0.0.1:4196 --output <outside-repo-folder> --only "brand-home|catalogue|intro-static|launch-controls|journey"
```

The site checker covers responsive layouts, no-JavaScript discovery, search and
filter/reset behavior, distinct Home/Play roles, static previews, optional
practice ordering and every launch control. The existing game
checkers still exercise real gameplay, iframe/fullscreen layouts, local saves,
offscreen pause, app demos and completion messages.
Every public inventory route is checked at 1366, 800, 390 and 320px widths,
including descendant overflow that a clipped body could otherwise conceal.

## Our Games

- **Space Academy** — Original PP1-Class 5 maths/reasoning missions, local skill
  feedback, seven distinct grade campaigns, chapter-linked craft and a shared
  30-object Universe Passport
- **Clock Master** — Learn to tell time through racing games & space exploration
- **Math Tank** — Master multiplication & division through tank battles
- **Creative Arcade** — Ninja Shuriken, Zombie Hide & Seek, Captain Pigeon Pooper
  and Dog Shepherd: recreational games imagined by kids, built and tested with
  parent support and AI-assisted coding

All seven have browser entry points. Clock Master and Math Tank also have
optional Android versions. Browser saves are local to the current browser and
device.

### Space Academy

Open `play\space-academy.html`; browse original worked examples at
`learn\olympiad\index.html`. Question bank v2 keeps seven grades, 56 stable
chapter IDs/routes and three challenge levels: Explore for foundations, Reason
for paper-style connections, and Stretch for higher-order linked conditions.
Grade-specific plans include original abacuses, marked grids, embedded figures,
cube nets, routes, measurement scales, calendars, price boards, fraction changes
and graph updates; Class 5 also has factors/multiples and decimal statements.
Each chapter page lists its actual formats at each level, not just number ranges.

The October 2026 reference review covered official SOF IMO Class 1-5 samples
(2026-27), CREST CMO Class 1-5 previous-year papers (2023-24 Set A), CREST
Junior/Senior KG samples and a Unified Council UIMO Class 5 sample: 13 documents,
63 pages and 18 representative rendered pages visually inspected. Samples are
not administered past examinations. SOF topic syllabi remain the primary grade
anchor; provider topic boundaries differ. PP1/PP2 are Otterly readiness
activities, not official SOF levels. Questions and diagrams are independently
authored deterministic families, not copied papers, publisher images or a live
AI service. Source links and limits are on the collection and grade pages.
This is neither provider-endorsed nor complete exam preparation; independent
educator calibration of difficulty and breadth is still required.

All game source is under `js\space-academy`; this is a standalone browser game,
not a native adaptation. `curriculum.mjs` owns grade/chapter/level family plans
and `FAMILIES` metadata. `questions.mjs` generates and checks versioned sets;
`question-display.mjs` supplies visible choice labels/descriptions and `art.mjs`
renders diagrams and graphical answer choices. Internal option keys are not
learner-facing labels. `progress.mjs` owns the validated state machine;
`storage.mjs` commits to its own IndexedDB database. Anonymous explorer slots
and grade journeys stay separate. There are no accounts, analytics or ad SDKs
in the game.

New missions use content version 2. Frozen `curriculum-v1.mjs` and
`questions-v1.mjs` reproduce earlier saved missions and reviews; earned rewards
and history remain, while current-version skill evidence is kept separate.
Share links include `bank=1` or `bank=2` along with an anonymous seed to recreate
questions, never a learner's answers. Hints and repeated questions do not inflate
independent evidence. Unsupported or corrupt saves block rather than reset;
future content/schema changes still need deliberate migration policies.

`campaigns.mjs` partitions the 30 objects across seven different grade campaigns:
Moon Camp, Planet Hopper, Mars Rover Rescue, Outer Planet Voyager, Star
Navigator, Nebula Research Station and Galaxy Command. `campaign-crafts.mjs`
draws their six-system modular craft; `campaign-activities.mjs` owns deterministic,
persisted collection, pattern, rover, cargo, route, station and probe boards.
Chapter objectives count different questions in finished missions, including
mistakes and hints, independently of skill accuracy. Every finished set adds a
charge. Three fitted core systems permit the first departure; later stages use
more systems and always require their actual activity to be completed.

Save schema 2 atomically migrates valid schema-1 backups through the frozen
`progress-v1.mjs` rules. Existing parts, questions, reviews, charges and pending
flights survive. Each explorer has one Passport across grades; new discoveries
cost a charge, but grade-activity revisits to already collected objects do not.
Explorers remain isolated. `art.mjs` reuses the existing read-only Clock Master /
Math Tank posters and actual animation atlases. Travel and artwork are
make-believe and not to scale. Native source and advertising SDKs are unchanged.

The interface is game-first rather than a dashboard. Play is a launchpad: a
grade-themed sky, the craft with its next part highlighted, a mascot and one large
Play button. Picture answers are compact tiles, Build fits parts onto a glowing
craft with check badges and colour swatches, Explore, flight and discovery are
full-screen moments (Explore names the one next step while a launch is blocked;
on phones the panel leads when Explore opens with a solved puzzle so Launch is
never buried, and live board moves never reorder it),
and Worlds is a star-map Passport that opens on the current adventure. Progress is
a skills board:
a Try-this-next banner plus one medallion per skill, whose ring shows independent
answers and which opens to a tip and a Practise button. Sources, privacy, grown-up
guidance, share codes and reports sit behind Help, Share and Progress.
`coaching.mjs` supplies display-only encouragement and never touches questions,
answers or saves. Text stays at 12px or larger and decorative animation respects
`prefers-reduced-motion`.

`scripts\build-space-academy.mjs` generates the collection, seven grade indexes
and 56 chapter pages (64 pages total) from those same sources. Samples use
level-specific plans and reproducible seeds, including diagram answer choices
and worked methods readable without JavaScript. Add new routes explicitly to
`_data\public-pages.json`; the generator refuses unknown/unowned output. Use the
regeneration commands above after all content modules are ready, before the
main site build; do not run either generator during concurrent source edits.
Neither command publishes anything.

```powershell
$academyTests = (Get-ChildItem -LiteralPath .\scripts -Filter 'space-academy*.test.mjs').FullName
node --test $academyTests .\scripts\worksheet-generator.test.mjs
python -X utf8 .\scripts\check-space-academy.py --url http://127.0.0.1:4198 --output <outside-repo-folder>
```

The browser checker exercises real question completion, part earning, assembly,
flight, reports, local backup/restore and scoped resets; all seven actual
activities, chapter-linked systems and the shared Passport; all
grade/chapter/level entry points; seven viewports and the actual Fullscreen API; read/write/delete
failures and stale-tab conflicts. Late/final map layouts use explicitly labelled
reducer-generated fixtures, not claims of UI-earned progress. Hidden and
persisted-page lifecycle injections are event-level checks, not OS tab-switch or
guaranteed browser-cache coverage. Read-aloud checks invoke the browser service
but do not assess a physical speaker or voice quality. Reports and screenshots
belong outside the repository.

### Kids' Creative Arcade

`play\index.html` presents the learning games and the four kid-led Arcade projects
together. The Arcade story describes children choosing characters and rules,
with parent support, AI-assisted implementation and shared playtesting. It does
not offer child accounts, a publishing service or unsupervised access to AI tools.

`js\arcade-controls.js` supplies the shared thumbstick, action buttons, responsive
camera, status, help and pause UI. Each authored game calls its original gameplay
functions directly; no synthetic keyboard shim or replacement game is used.
Canvas backing size may change for the display, but physics stays in its original
world coordinates. Pointer coordinates are converted through that same camera.
Pigeon keeps the street visible; Zombie adds a whole-maze overview.

Actions retain cooldowns, earned unlocks and limited uses. New round/replay and
Garage controls are also touch-accessible. Runs are not saved after reloading.
The learning launchers use the official, unmodified Google Play badge, hosted
locally in `images\google-play-badge.png`; installation is optional and browser
saves do not sync to Android. The image comes from the
[official Google Play badge asset](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png).
Google Play and its logo are Google LLC trademarks.

```powershell
python .\scripts\check-arcade-mobile.py --url http://127.0.0.1:4195 --output <outside-repo-folder>
```

This check uses real browser touch contacts for movement, simultaneous actions,
cancellation and aiming, at the seven standard viewports plus a 320px phone.
Headless Chromium keeps its tabs focused/visible, so
the lifecycle cases explicitly deliver blur/visibility signals and verify that
the actual game state and timers freeze. Late-progress/position fixtures are
labelled in the checker; they are not manufactured in production gameplay.
Launcher checks also cover real game entry, normal iframe bounds and the actual
Fullscreen API on laptop and short landscape. Only muted audio and a synthetic
age preference are seeded for those checks, not saved progress or rewards.

## Full Clock Master browser game

Open `/play/clock-master.html` and choose **Play Clock Master** for all lessons,
race difficulties, space journeys, customization and parent settings.
`/games/clockmaster/?mode=race` retains the existing race embed contract.
Progress stays in the current browser, not an account or Android save. Storage
failure blocks gameplay. Native ads and ad rewards are unavailable; earned
rewards and daily limits are retained. The new game/landing load no tracking SDK.

Regenerate using `node .\scripts\sync-clockmaster.mjs`. This builds an isolated
copy of the adjacent production source without editing its dirty worktree.
See [`scripts\clockmaster-web\README.md`](scripts/clockmaster-web/README.md)
for the inventory, skill application, exact checks and evidence.

## Full Math Tank browser game

`/play/math-tank.html` is the website entry point. `/games/mathtank/` runs the
production game home and its modes with browser-local saves; `?mode=battle` retains
the existing short battle embeds. No application server, account, or database
service is required. Clearing browser site data removes saved progress.

To regenerate the static game, use an adjacent Math Tank source checkout with
its existing dependencies installed:

```powershell
node .\scripts\sync-mathtank.mjs "..\Math Tank"
```

The export runs in a temporary workspace. Website-only overlays in
`scripts\mathtank-web` do not modify the Android source. Commit the resulting
`games\mathtank` files along with the website changes when publishing.

For a local browser check, serve the repository with
`python -m http.server 4195 --bind 127.0.0.1`, then run
`python .\scripts\check-mathtank-universe.py`. The existing demo regression check
is `python .\scripts\check-mathtank.py --url http://127.0.0.1:4195 --output <folder>`.
The browser checks use Python Playwright.

For screenshots and geometry checks of every game screen at laptop, tablet,
phone, and short-landscape sizes, run
`python .\scripts\check-mathtank-layout.py --verify --output <folder>`.
Add `--embedded --width 1366 --height 768` to check the normal website frame
instead of actual iframe fullscreen. Screenshots and `metrics.json` go to the
chosen folder; keep those artifacts outside the repository.

### Public-site privacy and monetization defaults

The public-page build removes recognized unconditional GA4 and AdSense scripts,
GA4 initialization, Ko-fi overlay scripts/init, and remote Google font links.
It refuses unknown or mixed tracking/game scripts rather than deleting gameplay
code. Ordinary external links are retained; following them or deliberately
submitting the contact form may involve the linked provider.

Selected marketing routes retain the static
`google-adsense-account` verification meta tag. This does not load an ad SDK,
serve an ad, establish approval or implement consent. Legacy archive files are
excluded from public discovery and get `noindex,follow`; their old code is not
rewritten by this build.

Google AdSense is the only selected provider for website display advertising.
Alternative ad networks are out of scope.

The existing publisher `ca-pub-5489426086320283` has two registered responsive
Display units, recorded in the disabled configuration:

| Placement | AdSense unit name | Slot ID |
| --- | --- | --- |
| `blogArticleEnd` | Otterly Blog Article End | `8415103601` |
| `parentGuideEnd` | Otterly Parent Guide End | `1983311217` |

Auto ads was switched off in AdSense; verify it remains off before any SDK
activation so automatic placement cannot bypass the editorial-only scope.
Creating these units does not approve the site or activate advertising.

Display-ad configurations remain disabled in `_data\web-ads.json`.
`enabled`, `siteApprovalVerified`, `privacySetupVerified` and both placement
switches are false. The manual AdSense/Google Privacy & messaging adapter is
implemented locally, but has not been activated or verified against live Google
serving. Site approval, age-appropriate privacy arrangements, published messages
and the privacy-policy update remain independent activation prerequisites.
An operator flag is not visitor consent. No native AdMob, simulated rewarded
ad, payment overlay or paid campaign is enabled here.
Google's current [age-treatment guidance](https://support.google.com/adsense/answer/3248194?hl=en)
specifies `data-tag-for-age-treatment="1"` for child treatment on display units.
This does not replace applicable consent or establish that Parents pages have
adult-only visitors.
The shared build adds one hidden editorial placement after the content of each
registered blog article and the Parents page, immediately before the site
footer. `_includes\editorial-ad.html` owns the markup; `css\web-ads.css` and
`js\web-game-ads.js` provide its local styling and guarded serving.
It is not inserted into blog listings, lessons, practice tools or game controls.
The existing Math Tank launcher placement remains separate.

Disabled placements leave no empty visible box, create no provider queue or
privacy controls, and make no third-party request. For an eligible, explicitly
enabled placement with both operator gates verified, the adapter:

- Sets Google's documented `pauseAdRequests=1` and non-personalized treatment
  **before** loading the single AdSense script. That script bootstraps the
  published Google consent messages; there is no circular wait for an unloaded
  CMP, custom consent grant or separate ad-block recovery tag.
- Subscribes to TCF and GPP updates through `googlefc.callbackQueue`.
  API readiness alone does not grant permission. European requests require
  Google vendor disclosure, Purpose 1 consent and the legal bases for Google's
  other non-personalized-ad purposes, respecting publisher restrictions.
  US National, California and Florida GPP sections are supported; unknown
  regions, missing data, opt-outs and consent errors do not permit an ad.
- Checks the browser's Global Privacy Control, re-fetches the first-party kill
  switch after consent, then requests at most one responsive unit with child
  treatment, restricted data processing and no personalization. There is no
  automatic refresh or limited-ads fallback after refusal.
- Provides European privacy revision and a per-page keep-ads-off control.
  Google's own US Do Not Sell or Share link is retained, not overridden.
  Privacy changes pause requests and remove the unit; once requested, it cannot
  be resurrected on that page. Empty/unfilled units collapse.

Paused loading is **not** zero third-party contact: Google documents that
scripts still load and existing Google-domain cookies may be read, although no
new cookies are set and those data are not used for ad serving or measurement
while paused. Privacy review and disclosures must cover that bootstrap.
Child treatment is not age or guardian verification, nor a substitute for any
required parental consent. If Google suppresses messaging or cannot supply a
valid privacy decision, the placement stays off. No page currently serves ads.
Better discovery and internal linking are not proof of traffic or revenue.

Before activation: verify site approval, Auto ads OFF, the existing European
message and the applicable US message publication/settings; review child and
parental-consent requirements and update the public policy. Creating/publishing
new account messages and turning on website serving require separate approval.
Local code completion does not authorize either action.

Protocol references: [AdSense pause/NPA](https://support.google.com/adsense/answer/7670312?hl=en),
[Google messaging API](https://developers.google.com/funding-choices/fc-api-docs),
[Google TCF requirements](https://support.google.com/adsense/answer/9804260?hl=en),
and [GPP API](https://github.com/InteractiveAdvertisingBureau/Global-Privacy-Platform/blob/main/Core/CMP%20API%20Specification.md).
Checks intercept the provider with `scripts\fixtures\web-ads-provider.js`; that
fixture is never loaded by production pages and never requests a live ad.

```powershell
node --test .\scripts\web-ads.test.mjs .\scripts\build-site.test.mjs
python .\scripts\check-web-ads.py
```
