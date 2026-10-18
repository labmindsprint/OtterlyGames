# Otterly Games — Static website architecture

## Boundaries

This repository remains a GitHub Pages website: HTML, CSS, vanilla JavaScript,
local fonts and static assets. `scripts\build-site.mjs` is a small Node-only
pre-publication step, not a framework, web server or game bundler. Its output is
checked in and served directly. Root `.nojekyll` preserves the current mix of
public pages and underscore-prefixed source/data directories.

The full Math Tank and Clock Master runtimes in `games` have their own
production-source overlay/export pipelines. The website build neither imports
their source nor rewrites their exports. It never changes native projects,
`ads.txt`, `app-ads.txt`, stylesheets, shared JavaScript, assets or account
settings.

## Sources of truth

The site serves parents looking for help with children's learning. Lessons,
useful tools and original parent articles are discovery entry points; Clock
Master and Math Tank are the flagship learning games. Home curates those routes
before recreational Arcade games. Play online owns the full game catalogue.
Website display advertising is AdSense-only and remains a separate, disabled
integration with approval and privacy gates;
content and navigation must remain useful without an ad request or installation.
Useful parent content and tools support organic discovery and the goal of
sustainable advertising revenue, not extra clicks or interruptions to practice.

| Source | Responsibility |
| --- | --- |
| `_data\public-pages.json` | Explicit indexable route inventory, canonical origin, custom-game shell exceptions and static verification eligibility |
| `_includes\nav.html`, `_includes\footer.html` | Canonical site navigation, skip link and footer |
| `_data\games.json`, `scripts\site-games.mjs` | Validated Play online catalogue, game/category ordering, local cover art, content notes and ItemList metadata |
| `_includes\arcade-games.html` | Direct-play cards for the standalone Creative Arcade hub |
| `_data\tools.json` | Tool links, categories, ordering, descriptions and counts |
| `_data\blogs.json` | Article links, titles, excerpts and listing order |
| Public HTML outside generated markers | Page-specific content, tool/game logic and authored metadata |
| `css\fonts.css`, `images\brand` | Locally hosted font and optimized brand assets |
| `js\includes.js` | Shared navigation behavior and optional include fallback, not the primary rendered shell |
| `js\game-catalogue.js`, `css\catalogue.css` | Progressive search/category filters and responsive, games-first discovery |
| `css\tokens.css` | Opt-in Theme B design tokens, primitives and shared nav/footer restyle (only under `.theme-b` / `.shell-b`) |
| `css\learn.css` | Theme B learning hub and four skill pages (`learn\*.html`), scoped to `.learn-page`; Space Academy `learn\olympiad\` keeps its own styles |
| `css\tools.css`, `js\tools-hub.js`, `css\parents.css`, `js\parents.js` | Theme B tools hub (skill groups rendered from `_data\tools.json`), tool pages and worksheet builder (scoped to `.tools-page`; widget logic and print CSS unchanged) and the Parents page (`.parents-page`; contents list + `<details>` accordions) |
| `css\home.css`, `js\home.js`, `css\game-intros.css` | Curated brand homepage (scoped to `.home-page`) with its clock/times-table mini tools, static gameplay previews and optional practice/help layouts |
| `css\blog.css`, `js\blog.js`, `js\article.js` | Theme B blog hub (static image-led cards; topic chips are `#topic-*` anchors filtered by CSS `:target`, `blog.js` upgrades them) and articles (cover header, ~68ch measure, `<h2>` contents list collapsed on mobile by `article.js`, callouts, "Try this together" block, related guides), scoped to `.blog-page` / `.article-page`; editorial ad hooks stay in `css\web-ads.css` |
| `css\play-hub.css`, `js\play-hub.js`, `css\pages.css` | Theme B for the Play hub (flagship tiles, "Just for fun" arcade group), game landing pages (chrome only; iframe/fullscreen geometry stays in `css\web-game.css`) and root/`apps\` pages, scoped by body classes |
| `js\space-academy\curriculum.mjs`, `questions.mjs` | Seven grade maps, original question families, deterministic seeds, answer proofs and content version |
| `js\space-academy\progress.mjs`, `storage.mjs` | Validated explorer/grade progression and atomic, isolated IndexedDB saves |
| `scripts\build-space-academy.mjs` | Indexable grade/chapter examples generated from the actual question engine |

The route inventory covers the homepage, app information, browser-game hub and
launchers, tool hub/details, blog hub/articles, learning hub/paths, parents,
support, about/contact/policies and the Arcade hub/games.
Directory `index.html` routes normalize to `/directory/`; the root normalizes
to `/`. New public HTML in the root or public content directories must be
listed explicitly. The build reports unlisted files rather than silently
publishing them in a sitemap.

Tools and blog detail URLs must exactly match their registry URLs. Adding a
file alone does not make it discoverable. Adding an inventory entry without its
file, metadata or registry entry also fails validation.

## Shared shell contract

New content pages start with:

```html
<body data-og-includes="nav,footer">
  <main id="main-content">
    <!-- Authored page content -->
  </main>
  <script src="/js/includes.js" defer></script>
</body>
```

Keep one unique, nonempty `<title>` and description, and a canonical for the
page's public URL. The build validates unique public titles/descriptions and
ensures exactly one self-referencing canonical.

The build replaces existing `nav.nav` and `footer.footer`, or fills the
explicit include opt-in, with:

```html
<!-- og:nav:start -->
<!-- Exact _includes\nav.html source -->
<!-- og:nav:end -->
```

The footer uses `og:footer:start` / `og:footer:end`. Marker pairs must be
unique and ordered. Future builds replace the whole marked block, so editing a
copied/generated nav is not a lasting change. Breadcrumbs, post navigation and
custom game navigation with other classes are not site chrome and are retained.
Ambiguous duplicate shared nav/footer elements fail rather than being guessed.
Legacy app pages load `components.css` after their older page styles. Legacy
theme rules must not force header font sizes with `!important`; the shared
component stylesheet owns responsive header geometry.

After baking, the build removes `data-og-includes` from `<body>`/`<html>` so
the fallback script does not fetch a second shell. It adds or normalizes exactly
one `/js/includes.js` script with `defer`. Legacy inline mobile-nav click
handlers are retained and reported with path/line; the shared behavior must
arbitrate them without double toggling. The builder never regex-deletes a
script that might also contain game code.

The nav template owns exactly one `a.skip-link[href="#main-content"]`. A first
`<main>` without an ID receives that ID and `tabindex="-1"`. Existing IDs such
as Arcade's `main#games` remain intact, with a focusable alias before the main.
Pages without a main get a safe focusable anchor before their first content
section/article/heading. No tool, game pointer region or script is wrapped.

### Standalone Arcade exceptions

`Arcade\game.html`, `pigeon.html`, `shepherd.html` and `zombie.html` are
full-viewport canvas games with their own top bar and overflow rules. They
remain indexable, but explicitly use `shell: "custom"`: no full website nav or
footer is inserted. They receive the shared skip link, a focusable game-area
target, the deferred behavior script, canonical/policy checks and optimized
asset URLs. Their keyboard controls and game scripts remain authored code.
`js\arcade-controls.js` and `css\arcade-controls.css` add touch movement/actions,
pause/help and a responsive camera around those original game functions. World
dimensions and gameplay rules remain independent of canvas backing resolution.
Pointer mapping uses the camera transform rather than assuming a stretched
canvas. Pausing clears held input; Zombie's trap, stun and elapsed timers use
active game time, not time spent in the background.

Play online includes the four recreational games alongside the three learning
games. Both hubs use `og:arcade-games:start/end` blocks generated from the shared
card include; missing/malformed markers, duplicate or foreign game links, and
embedded script/resource tags fail the build. The Arcade listing uses the normal
website shell and highlights Creative Arcade in its navigation. Personal portfolio pages
remain excluded from the public inventory and preserve their noindex policy.

## Space Academy: original website game

`play\space-academy.html` is a standalone website game, not another native export
or a small iframe demo. Its controller and styles are isolated under
`js\space-academy`, `css\space-academy.css` and `css\campaign-activities.css`. Storage opens only after the
deliberate Open gesture. No server, account, model API, analytics or ad SDK is
involved. `js\seeded-random.mjs` is shared with the worksheet generator without
changing worksheet seed behaviour.

Question bank v2 preserves the seven grade IDs and 56 chapter IDs/routes.
`curriculum.mjs` maps each chapter to separate Explore, Reason and Stretch
family lists and exports their `FAMILIES` metadata. These target foundations,
paper-style reasoning and higher-order linked conditions respectively, not
validated exam difficulty bands. The plans change representations and inference
steps as well as quantities: abacus transfers, linked models, marked grids,
embedded figures, nets, routes, scales, calendars, purchases, fraction changes
and graph updates are assigned by grade/level. Class 5 adds HCF/LCM situations
and decimal statements rather than introducing a separate chapter route.

`questions.mjs` defaults to content version 2 and dispatches version 1 requests
to the frozen `questions-v1.mjs` / `curriculum-v1.mjs` sources. A question retains
`options: string[]`, `correctIndex` and `answer`; optional `optionVisuals` and
choice feedback remain aligned through shuffling. Semantic visual descriptors
include descriptions. `question-display.mjs` owns plain-text
`choiceLabel(question, index)` and `choiceDescription(question, index)`;
`art.mjs` owns `answerChoice(question, index)` for labels plus artwork, including
legacy shape choices. Consumers must not display internal graphical option
keys. Static examples use the same answer renderer as the game.

`otterly-space-academy` / object store `academy` / key `save` is independent of
the existing games. Each of three anonymous explorers has grade-specific
journeys. Transactions validate the current save, enforce a revision check and
resolve only after commit. Open/re-read probes test writes and removal too.
Storage errors block; stale writes abort and visibly load the latest save.
Saved version 1 missions and reviews regenerate against the frozen original
bank. Existing rewards and history are retained, while version 2 skill evidence
is kept separate. Share links carry `bank=1` or `bank=2` plus question settings
and an anonymous seed, never saved answers. Unsupported content snapshots are
not silently replaced; future version changes require an explicit migration
policy.

Answers and hint use persist before moving on. `campaigns.mjs` maps chapters to
six stable system IDs and partitions all 30 worlds into seven different grade
routes. Participation credit is bounded per chapter and counts different
questions only after a mission completes, independent of correctness or hints.
Every completed mission grants one charge, but farming one chapter cannot earn
every system. Stage requirements grow from three core systems to all six.
`campaign-activities.mjs` supplies seven deterministic board reducers, validates
models/state and computes completion from actual placements/routes/resources.
Every move persists through the same revision-checked transaction. Activity and
workbench rerenders retain focus and normal/fullscreen scroll positions.

Presentation is a render-only layer over those rules. `app.mjs` draws each tab
(Play launchpad, Build workshop, Explore with flight and discovery, Worlds
Passport, Progress) as a game scene, and `css\space-academy.css` owns the layout
contexts: desktop, short laptop, phone portrait and short landscape. Decorative
motion lives inside `prefers-reduced-motion: no-preference`, and text stays at
12px or larger. `coaching.mjs` is display-only copy. None of this changes the
frozen question and artwork sources, the progression rules or the anchors that
`scripts\prepare-space-academy-android.mjs` checks in `app.mjs`.

Root save schema 2 validates schema-1 input with frozen `progress-v1.mjs` before
cloning/migrating it. A read persists migration atomically, including its revision
increase; failed transactions leave the old save intact. Old mission snapshots,
earned/fitted systems, paint, review, charges and pending destinations survive.
Legacy chapter completions contribute to appropriate new objectives without
faking skill evidence. A per-explorer Passport unions all legacy and campaign
arrivals, never pending flights or another explorer's collection. New campaign
arrivals advance only that grade's route; already collected objects permit a
free activity-based revisit. The charge invariant is completed missions minus
legacy arrivals, paid campaign arrivals and any reserved paid flight. Legacy
pending flights finish their original route without a second debit.
Duplicate completion/arrival is idempotent. Backups contain all local explorers;
confirmed restore affects this database only. Reset affects one explorer's
grades and Passport, not siblings or other games.

Reports separate content versions and challenge levels, deduplicate repeated
question IDs and exclude hints from independent accuracy. They use up to 20
recent independent questions, require five before suggestions and describe
trends as small samples. They are not IQ scores, diagnoses or validated
competition predictions.

The collection, seven grade indexes and 56 chapter pages under
`learn\olympiad` are generated before the main site build. Every route remains
explicit in the public inventory; generated-file ownership guards prevent
overwriting unrelated pages. Samples use the real seeded generator and render
without JavaScript, including diagram choices, correct-answer artwork and worked
explanations. The 64-page collection lists actual per-level formats from the
curriculum rather than generic difficulty or number-range claims. Regenerate
with `node .\scripts\build-space-academy.mjs --write` before the main site build,
only after concurrent content edits have finished; `--check` verifies freshness.

The October 2026 content rebuild compared SOF's official 2026-27 Class 1-5
samples, CREST's 2023-24 Set A Class 1-5 previous-year papers, Junior/Senior KG
samples and a Unified Council UIMO Class 5 sample. The review covered 13
documents / 63 pages, with 18 representative rendered pages visually inspected.
Only the CREST previous-year papers are administered-paper references; the
others are samples. SOF's topic syllabi remain the primary grade anchor;
provider boundaries differ and PP1/PP2 are readiness, not official SOF levels.
Official source links are public, but downloaded PDFs, screenshots and extracted
paper text are research artifacts, not website assets. All question diagrams
and answer-choice artwork are original. This is neither provider-endorsed nor
complete syllabus coverage. Reference comparison and programmatic answer checks
do not replace independent educator calibration.

`campaign-crafts.mjs` draws seven different modular spacecraft, including a
carrier for the rover in flight. Stable part IDs retain ownership across the
save migration while each grade has its own names, geometry and matching slots.
Flight art includes only fitted parts, not imaginary earned upgrades.
`art.mjs` draws question artwork and reads the existing Clock Master
universe posters/atlases without editing them. It crossfades real atlas frames
rather than rotating a flat poster. Active-time clocks pause for hidden,
offscreen, manually paused and dialog states, and respect runtime reduced-motion
changes. A pending flight survives reload without a second charge. The site
controller handles persisted-page restoration; game exports, app-demo query
modes and same-origin iframe message contracts remain unchanged.

## Game discovery and introductions

`og:game-catalogue:start/end` in the Play online hub is generated
from `_data\games.json`. Each entry needs a unique ID and public landing URL,
known categories, descriptive text, a content note and local art. The build
rejects unlisted landing routes, missing art/symbols and malformed data before
writing anything. All links and ItemList entries are static; search only
enhances the rendered cards. New titles/categories need no hand-edited hub HTML.
The legacy `#creative-arcade` and `#learning-games` entrances select their matching
categories on load and hash navigation rather than pointing to an unrelated mixed list.
The Creative Arcade hub retains its guarded `og:arcade-games` direct-play
fragment; a missing legacy marker is still a build error.

The root is an authored, brand-led page with bounded editorial spotlights,
Creative Arcade entrances, real gameplay imagery and the original family story.
It has no catalogue/search marker. The full collection lives on Play online;
new games do not require expanding Home into another listing. Existing
`/apps/` demos, runtime query modes and completion/pause message contracts remain.

Clock Master and Math Tank use `web-game.js` for a single deliberate launch path
shared by the hero, optional practice, placeholder and contextual dock. It assigns
the iframe source once, retains progress on Return to game, validates readiness
message origin/source and pauses offscreen/hidden gameplay. The dock does not
cover a visible game or compete with another visible launch control. Actual
Fullscreen API behavior and optional Android badges remain independent of the
introduction.

Game introductions are static and use real screenshots rather than replacement
clock parts or arithmetic stickers. Optional practice follows the player, never
an apparent entrance course. The removed scroll-effects script is not loaded
by any page. Layout and typography adapt to phone and short-landscape sizes;
scrolling never starts a game.

Arcade landing pages use original local SVG cover illustrations and link to
untouched standalone games. Their optional how-to-play blocks are not lessons.
Space Academy keeps its independent welcome/Open flow, curriculum and saves.
Do not run native export pipelines for catalogue or landing-page work.

## Static discovery and registry fallbacks

The sitemap is generated only from `_data\public-pages.json`, never a blanket
HTML glob. It omits runtime exports, archives, art generators and the 404 page.
No current-date freshness is invented. `lastmod` is omitted unless a route
explicitly supplies a known, valid `YYYY-MM-DD` value; file mtime and article
publication date are not treated as modification evidence.

The tools and blog hubs retain JavaScript enhancement, but their complete
noscript lists are generated from the same registries:

- `og:tools-fallback:start` / `og:tools-fallback:end`
- `og:blog-fallback:start` / `og:blog-fallback:end`

For the first migration the build replaces the hub's single legacy noscript
listing. Ambiguous/missing fallbacks fail. Generated cards use existing shared
classes without fade-in hiding, and registry text is HTML-escaped. The Theme B
blog hub already ships every card as static HTML, so its generated noscript copy
is kept in the page but visually hidden (`.blog-nojs`).
`data-tool-count` text and the tools hub `ItemList` count/links are regenerated
as well. Changing a title or URL is detected even if the item count is unchanged.

### Legacy index policy

Only the explicit `ARCHIVE_ROUTES` allowlist in the build gets
`<meta name="robots" content="noindex,follow">`:

- `index-old-backup.html`, `index-v2-backup.html`, `index-v3-backup.html`,
  `index-v3.html`
- `sangram.html` and `sangram-v2.html` through `sangram-v6.html`
- `Arcade\index-old.html`
- `math-tank-feature-graphic.html`, `og-image-generator.html`

These files are not deleted, redirected, rebuilt as public pages or included
in the sitemap. Existing `noindex` directives, including `nofollow`, are kept.
Their existing code/art is otherwise unchanged. `noindex` is
not access control and does not disable their historical scripts if visited
directly. Runtime noindex metadata is owned by the corresponding game export
pipeline; running the public-page build cannot repair a runtime export.

## Guarded public-page policy

The build recognizes the existing standalone GA4 SDK/bootstrap, AdSense
SDK/standard queue initialization and Ko-fi overlay SDK/init. It removes only
these validated elements. A source change that combines a tracker with game
code, uses an unrecognized initialization or contains an active inline tracking
handler fails with a path/line diagnostic. All validation finishes before any
output is written. Ordinary external links, affiliate links, contact-form
submission behavior and inactive placement markup are not removed.

Remote Google font `<link>` elements, including matching preconnects, are
removed from public HTML; fonts are self-hosted by the shared stylesheets.
Inline Google font imports/URLs are reported for explicit migration, not
silently erased. This checker does not scan or rewrite external CSS/JavaScript
dependencies, so new third-party integrations still need a separate review.

The five known old brand-art URLs are deterministically rewritten in public
HTML, inline styles and same-site absolute metadata URLs:

| Old URL | Local optimized URL |
| --- | --- |
| `/images/Otter-mascot.png` | `/images/brand/otter-buddy-320.webp` |
| `/images/Otter-tank.png` | `/images/brand/otter-tank-640.webp` |
| `/images/About.png` | `/images/brand/about-800.webp` |
| `/images/Blog.png` | `/images/brand/blog-800.webp` |
| `/images/tool.png` | `/images/brand/tools-800.webp` |

Original assets, foreign URLs, archives and runtime exports are retained.
The navigation template independently chooses its small logo.

Selected marketing routes retain only the static
`google-adsense-account` meta verification for
`ca-pub-5489426086320283`. This is not an advertising SDK, site approval or a
consent platform. Display placements remain disabled; Google publisher/site
approval, applicable child treatment and an actual
privacy/consent implementation must be settled independently before activation. The build does
not change any monetization configuration, create accounts or enable ads.
The two registered responsive editorial units are stored in `_data\web-ads.json`;
their creation is not site approval. Keep account-level Auto ads off so a future
SDK cannot bypass the explicit manual placements.

The editorial placement is generated from `_includes\editorial-ad.html` inside
one `og:editorial-ad:start/end` block immediately before the shared footer.
Only registered blog detail routes and `/parents/` receive it, after all
authored content rather than among learning controls. The build rejects
unmanaged, duplicate, misplaced or ineligible blocks and executable/interactive
template content. It adds one local `web-ads.css` stylesheet and one deferred
`web-game-ads.js` loader; the existing Math Tank placement is preserved.

The aside starts hidden, has an Advertisement label and consumes no layout
space while disabled. Eligibility is a placement decision, not age verification
or permission to serve. `web-game-ads.js` now implements the manual AdSense /
Google Privacy & messaging adapter; all production switches remain false.
`siteApprovalVerified` and `privacySetupVerified` are independent operator gates,
not visitor decisions. Only an eligible opted-in placement can load the Google
tag, with ad requests paused and personalization disabled before loading.
The tag itself bootstraps published Google messages. TCF and GPP listeners,
not an operator flag or Consent Mode for Analytics, authorize the eventual unit.
The adapter checks Google disclosure/purpose permissions, publisher restrictions,
US National/California/Florida choices and Global Privacy Control. Unsupported,
missing, refused or errored privacy data fail closed. It rechecks the kill switch
after consent and uses TFAT child treatment and restricted data processing.
Privacy revision, opt-out, leaving the page and missing fill remove or suppress
the unit without refreshing it. Google's default US opt-out entrypoint remains.
Disabled pages create no controls, queue or SDK and have no layout cost; enabled
paused bootstrap does contact Google and may read existing Google-domain cookies.
Live approval, messaging/child-privacy review and public disclosures are still
required before activation. No consent message or live ad was published by
implementing or testing this code.

## Commands and validation

Use Node 22 or newer. There is no package install for this build:

```powershell
node --test .\scripts\build-site.test.mjs
node .\scripts\build-site.mjs --check
node .\scripts\build-site.mjs --write
node .\scripts\build-site.mjs --check
python -m http.server 4195 --bind 127.0.0.1
```

Wait for concurrent page editing to finish before `--write`. Default invocation
is read-only `--check`. Check mode exits 1 for stale HTML/sitemap or errors and
prints pending recognized policy cleanup with source path/line. Invalid CLI
arguments exit 2. Write mode refuses **all** writes if validation fails; on
success it writes only changed, explicitly scoped public HTML, known archive
robots metadata and `sitemap.xml`. It does not emit a second site tree.

Tests import the pure transforms and exercise the filesystem/CLI using unique
fixtures under the repository's ignored `build\site-build-fixtures` directory.
They clean up their own fixtures and never use the operating system temporary
directory. `--root <fixture-root>` is available for isolated integration tests.
Coverage includes shell idempotence, custom-nav preservation, skip targets,
script deduplication, guarded policy cleanup, mixed-code refusal, asset mapping,
canonical routes, sitemap exclusions, archive-only noindex, fallbacks/counts,
read-only drift detection and refusing partial writes.

The build is a source-consistency check, not proof of browser UX, accessibility
conformance or advertising/privacy approval. Before an authorized publication,
serve the built files and verify no-JavaScript navigation/listings, mobile-nav
keyboard behavior, actual tool controls/printing, full browser-game launch/save
behavior, links, requests and responsive layouts. Game export/regression
commands remain documented in the root README and each game's overlay README.
