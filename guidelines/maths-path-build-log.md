# Otterly Maths Path build log (Class 1 pilot)

## Built
- `_data/maths-path.json` is the single source. Class 1 is fully authored (8 chapters: numbers, operations, patterns, geometry, measurement, time, money, reasoning; 3-4 See-it screens, vocab, 1-3 Try-it activities, outcomes). PP1, PP2 and Classes 2-5 hold the audit's chapter plan only.
- `scripts/build-maths-path.mjs` (`--write|--check`) emits `/learn/maths/`, 7 class maps, 8 Class 1 chapter pages and 9 redirect pages. Deterministic; refuses to overwrite pages it does not own.
- `js/maths-path/`: ten-frame, place-value, number-line, bar-model, coin-tray, clock, sorter, pattern-builder, balance (all generic, keyboard and pointer), `widgets.mjs` registry, `progress.mjs`, `check.mjs`, `app.mjs`.
- `css/maths-path.css`; art in `images/maths-path/` (Blender renders of coins, notes and solids as WebP) plus the existing Ringo raster art.
- Wired: `public-pages.json`, `ARCHIVE_ROUTES`, `build-space-academy.mjs` (skips archived routes), `learn/index.html`, README, ARCHITECTURE, `website-checks.yml`.
- Tests: `scripts/maths-path.test.mjs` (8). `build-site.test.mjs` and `space-academy.test.mjs` fixtures now exclude archived routes.

## Decisions
- Old `/learn/olympiad/class-1/*` become generated noindex meta-refresh redirects (ARCHIVE_ROUTES) to the new pages. Other grades are untouched. Game pages are untouched.
- Soft lock: the next chapter says "Pass X first" but stays a link; a gentle note, never a hard block.
- Check = first 5 of 8 questions from the production `createMission` (level 1, fresh seed per attempt); pass 4/5; progress key `otterly.mathsPath.v1`, local only.
- Storage unavailable: page-level `role=alert` banner; the check needs an explicit "Take the check without saving"; save failures show a warning. No fake rewards.
- Later classes show "Lesson coming" and no chapter pages. Practice links go to the existing `/learn/olympiad/...` page when a source chapter exists.
- Worksheet deep link `/tools/worksheet-builder.html?activity=academy&grade=class-1&chapter=<id>&level=1` already works; no parser change.
- Public copy says "Olympiad-style"; tests reject `\bIMO\b` and `\bSOF\b` in generated output.
- Bug found in browser testing: Try-it did not mount because `#mp-activities` sits outside the chapter container; fixed in `app.mjs`.

## Verification
- `node scripts/build-site.mjs --check`, `build-space-academy.mjs --check`, `build-maths-path.mjs --check`: green (144 public pages). Full `node --test scripts/*.test.mjs`: 414 pass after the fixture fixes.
- Playwright (Edge) at 1366x768, 1440x900, 800x1000, 390x844, 844x390 over hub, class 1, class 3 plan and all 8 chapters: no horizontal overflow, no console or page errors (the local python server occasionally refuses a connection under parallel loads; the page shows its "check could not load" message in that case).
- Real input: clock minute-hand drag, slider arrow keys, clock buttons, coin tray (exact-coin-count validation), sorter, place value; See-it Back/Next and arrow keys; check flow (fail path, review) with working and with throwing localStorage; reduced motion (transitions ~0); no-JS (all 4 screens visible, no overflow). Screenshots: session `files/maths-pilot/`.
- Not exercised in a browser: a passing run that unlocks the next chapter (covered by the `progress` unit tests only).

## Audit findings to record (not fixed here)
- Class 5 claims 7/8-digit numbers but bank3 caps at 7 digits and has no crore place name.
- `play/space-academy.html:93` says 35 questions for Classes 1-5; Class 5 has 50.
- Class 2 codes/inference and embedded grids missing live; PP2 time missing; Class 3 patterns is navigation only.
- Exact-repeat >50%: Class 1 time/measurement/patterns Explore, Class 2 geometry Explore, Class 5 fractions Explore.

## Remaining roll-out
- Author lessons for PP1, PP2, Classes 2-5; then set `live` and add redirects for the remaining 56 olympiad pages (add to ARCHIVE_ROUTES).
- Public IMO/SOF naming cleanup per `maths-path-naming-inventory.md` (including `learn/index.html` copy and `learn/imo-preparation.html`).
- Optional: unused `toTen` var in `ten-frame.mjs`; the coin renders are near-identical apart from the number.

## Per-class authoring guide (refactor)
**Files.** `_data/maths-path.json` = `{version:2, classes:[ids]}` (order = display order). Content: `_data/maths-path/<id>.json` (`pp1`, `pp2`, `class-1`..`class-5`). One agent per class file; no shared-file edits needed except via the commands below.

**Class**: `{id,label,name,ages,blurb,live?,grade?,chapters[]}`. `live:true` is all-or-nothing and needs `grade` (e.g. `class-3`); every chapter must then be fully authored.

**Chapter** (live): `id,title(<=60),tagline(<=140),outcomes[>=3, each "I can ..." <=80],source:"<grade>/<space-academy chapter id>",vocab[{term,meaning}],see[3-5],try[>=1],play:{game:space-academy|clock-master|math-tank},tools[],parents?{idea,slip,tryAtHome{title,steps[]}}`. `parents` is required unless `scripts/academy-guides` already has the chapter. Non-live chapters need only the plan fields.
- **See screen**: `{title,art,text[] (short sentences <=150 chars),widget?:{w,c}}`. `art` must be an existing raster in `images/`.
- **Try activity**: `{prompt,widget:{w,c},target,success,hint}`; `target` is checked by the widget's `matches()`.
- Never write IMO or SOF; say "Olympiad-style". Validator: `scripts/maths-path-schema.mjs` (runs on every build; also a test).

**Widgets** (`js/maths-path/widgets.mjs`, config `c` -> target):
tenFrame, numberLine, placeValue, barModel, coins, clock, sorter, pattern, balance (Class 1) plus:
- `fractionBars` `{bars:[{label,parts,shaded,editable}]}` -> `{shaded:n|[..]}` or `{sameAs:true}`
- `array` `{rows,cols,editable,max,word:'rows'|'groups'}` -> `{rows,cols}` or `{total}`
- `grid` `{rows,cols,filled,editable,mirror,showMeasures,labels}` -> `{cells}`, `{count}`, `{area,perimeter}`, `{symmetric:true}`
- `chart` `{kind:'bar'|'picture',title,unit,max,categories:[{id,label,value,color}],editable}` -> `{values:{id:n}}`
- `calendar` `{month,year,days,startDay(0=Mon),highlights,editable}` -> `{date}` or `{weekday}`
- `logicBoard` `{rows,cols,start:{r,c,dir},goal,walls,commands:'turtle'|'compass',maxCommands}` -> `{reach:true,maxCommands?}`
Each module exports `type`, `render(config)` (DOM-free, used by the generator for no-JS text), `mount(root,config,hooks)` returning `{getState,matches,reset}`, and a `sample`. New widgets: add a module, register it in `widgets.mjs`, add CSS and a test.

**Workflow per class**: edit the class JSON, set `live:true`+`grade`; run `node scripts/build-maths-path.mjs --sync-inventory --write` (updates `_data/public-pages.json`, pages and the `/learn/` class picker), then `node scripts/build-site.mjs --write` (sitemap, nav bake), then `--check` for both, then `node --test (Get-ChildItem scripts\*.test.mjs).FullName`. Old `/learn/olympiad/<grade>/*` stubs are produced automatically for live classes (redirects point to the chapter whose `source` matches, else the class map). Parallel agents may race on `public-pages.json`, `learn/index.html` and `sitemap.xml`: they are generated, so rerun the commands rather than merging by hand.

**Per-class sequence (from `_data/maths-path-audit.json`; `*` = new home for an audit gap)**
- PP1: counting, comparing, shapes, sorting, position, patterns
- PP2: numbers, operations, shapes, measurement, patterns, reasoning, time*
- Class 1: numbers, operations, patterns, geometry, measurement, time, money, reasoning (authored)
- Class 2: numbers, operations, patterns, geometry, measurement, time, money, data, reasoning* (codes, exact embedded shapes)
- Class 3: numbers, operations, fractions, geometry, measurement, time, money, data, patterns*, reasoning
- Class 4: numbers (factors, Roman numerals, >4 digits; no decimals needed), operations, fractions, geometry, measurement, time, money, data, reasoning
- Class 5: numbers (8-digit place value gap in generator: record, don't fix), operations, fractions, decimals, geometry, measurement, time, money, data, reasoning
Full outcomes/families/kid titles per chapter: `_data/maths-path-audit.json`.

**Privacy audit.** Maths pages use only localStorage; zero cookies/external requests (Playwright-verified). `/learn/` keeps the `google-adsense-account` verification meta (inventory flag, not a script or cookie). No consent banner needed for Maths Path.

## Class 4/5
- **Built**: `_data/maths-path/class-4.json` (9 chapters) and `class-5.json` (10, incl. decimals) are `live:true`. Each chapter has 4-5 See-it screens each with a widget, 2-3 Try-it activities (fractionBars, array, grid with mirror/area, chart, calendar, clock, bar model, number line, balance, sorter, pattern builder, logic board, coin tray as fits), >=3 "I can" outcomes, vocabulary, game links (Math Tank for operations, Clock Master for time, Space Academy elsewhere), tool links, and Practise/Print/Check wired by `grade` + `source` to the production generator. For-parents text comes from `scripts/academy-guides/chapters.mjs`.
- **Art**: real Blender (Cycles) renders, one per chapter, from `scripts/maths-path-art/class-4-5.py` (`blender --background --python ... -- <png dir>`), converted with `to-webp.py` into `images/maths-path/class-4|class-5/<chapterId>.webp`.
- **Shared-file edits (minimal, report)**: See-it `art` may now also be a raster path `/images/maths-path/...webp|png|jpg` (schema check in `maths-path-schema.mjs`, `screenArt()` in `build-maths-path.mjs`, `.mp-screen-art .mp-art` 112px in `css/maths-path.css`); Ringo names still work. Removed the `/learn/olympiad/class-4|5/*` lines from `_data/public-pages.json` (they are now generated redirects/archive routes).
- **Question-bank gaps (lesson + Try-it authored, Practise/Check link to nearest families)**: Class 4 five-digit number names and "list the possible pairs" (nearest: `words-place`; `combinations-count` exists only in Class 5). Class 5 crore/eight-digit numbers and Indian grouping (nearest: `class-5/numbers` families, which also format commas inconsistently), angles (taught with a bar model 76+104=180; no protractor widget), logical word ordering, exact hidden shapes.
- **Widget gaps**: `chart` has no scale or half-symbol, so "each symbol = 2" is shown in the title with a picture chart; `placeValue` supports tens/ones only, so 5+ digit numbers use pattern builder/sorter instead.
- **Verification**: schema validator clean; `build-maths-path --check` and `build-site --check` current. Playwright (Edge) over both class maps and all 19 chapters at 1366x768, 390x844 and 844x390 (63 pages): no console/network errors, no horizontal overflow, See-it Back/Next, Try-it pointer/keyboard + Check/Reset, Practise feedback, in-page print worksheet (window.print called), 5-question check flow all pass. Screenshots in the session `files/path-c4-c5/shots`. Full test run had unrelated failures from other classes in progress (pp2 counts/images, class-2 perf timing).

## Class 2/3

Built: `_data/maths-path/class-2.json` (9 chapters: numbers, operations, patterns, geometry, measurement, time, money, data, reasoning) and `class-3.json` (10 chapters: numbers, operations, fractions, geometry, measurement, time, money, data, patterns, reasoning), both `live:true`. Each has 3-5 See-it screens, 3 Try-it activities, 3+ "I can" outcomes, game links (Clock Master for time, Math Tank for multiplication/division, Space Academy chapter) and a For-parents box. Practise, Print and Check use the production generator. Old Space Academy discovery pages for both classes now redirect (their routes were removed from `_data/public-pages.json`).

Art: existing rasters only (Ringo busts plus `images/maths-path/solid-*.webp` in sorters); no new Blender renders. No vector or procedural art.

Shared-file fixes (minimal, tested):
- `scripts/build-maths-path.mjs`: `playLink` sent every non-clock game to Space Academy with the game's label (Math Tank was wrong). It now links the real game and adds a Space Academy link. The chapter div also gets `data-source` when the chapter id differs from its Space Academy source.
- `js/maths-path/check.mjs` and `app.mjs`: the Check used the Maths Path chapter id for `createMission`, so chapters whose `source` differs (Class 2 reasoning, Class 3 patterns) threw "Unknown Academy chapter". It now uses `source`. Progress is still recorded against the chapter id.
- `scripts/maths-path.test.mjs`: tests hard-coded Class 1 (grade attribute, "Back to Class 1 map", 9 redirects). They now use each live class.

Question-bank gaps (another wave adds families):
- Class 2 `reasoning` has no code-key or exact embedded-figure families (audit severity high). Its Practise/Check/Print uses `class-2/patterns`, so it matches the Patterns chapter.
- Class 3 `patterns` and `reasoning` share the `class-3/reasoning` bank. Class 3 embedded figures are letter-only. Direction sense is lesson and Try-it only.
- The Check is the first 5 of 8 level-1 questions, pass 4/5.

Widget gaps: no hundreds or thousands place-value widget (`placeValue` is tens and ones only). Used a 10 by 10 array, bar models and number-line windows instead. Number lines make one tap target per integer, so interactive ones are kept to 16 ticks or fewer (about 20 px on a phone). Chart pictures are 1 picture = 1 unit only.

Verification: schema valid; build and site `--check` clean; 426 tests pass. Edge/Playwright at 1366x768, 390x844 and 844x390 on all 19 chapter pages: loads, no console errors, no horizontal overflow, real pointer clicks on every Try-it with hint, check and reset, Practise answer, in-page Print (print called, sheet rendered), 5-question Check ran to a result. Screenshots are in the session `files/path-c2-c3/` folder.

## PP1/PP2
- Content: `_data/maths-path/pp1.json` (counting, comparing, shapes, sorting, position, patterns) and `pp2.json` (numbers, operations, shapes, measurement, patterns, reasoning, time). Both live. 3-4 See screens, 2-3 Try-its, parents box and a Space Academy link on every chapter; PP2 time links Clock Master and the hour-hand tool.
- Art: 31 Blender renders in `images/maths-path/pp1|pp2/` (WebP, 240 px), made by `scripts/maths-path-art/render-pp.py` (run with `-- <abs out dir> [names]`, then `to-webp.py`). They enter pages as sorter items and pattern tiles (the `art` field only accepts Ringo busts). Tall/short and long/short sizes come from per-item `size`.
- Shared change (additive): optional `size` (px) on sorter items (`sorter.mjs`) and pattern tiles (`pattern-builder.mjs`). Items inside bins keep the same size.
- `pp2/time` has no Space Academy chapter, so it uses `source: "class-1/time"`. Practise, Print and Check then run Class 1 time level 1, and the page's `data-grade` is `class-1`. The Check includes an elapsed-minutes question that is hard for age 5. Gap: a dedicated PP2 time question family.
- Tests changed: `maths-path.test.mjs` (redirect count uses old Space Academy chapters, so PP2 time has none; grade attribute comes from `source`), `space-academy.test.mjs` (no unowned Olympiad-style page is left, so the guard test uses the Olympiad index and accepts an empty inventory).
- Old `/learn/olympiad/pp1|pp2/*` entries removed from `_data/public-pages.json` (they now redirect).
- Verified: schema, build and `--check` clean. Edge/Playwright at 1366x768, 390x844, 844x390 on all 13 chapters: no console errors or overflow, every Try-it solved with real pointer clicks (sorters also by keyboard at 1366), a wrong-first check does not pass, Practise and the Check start. Screenshots in session `files/path-pp/`.
- Gaps: Practise, Print and Check questions use the production text prompts, so a grown-up should read them to PP1 children. Renders have a faint shadow patch on the cream cards.

## Question bank gaps
- Class 2/3 reasoning (done): new data-driven modules `bank3-gap-kit.mjs` (shared edge-figure and embedded-figure helpers), `bank3-class-2-gaps.mjs` (`class-2-code-key`, `class-2-code-shift`, `class-2-grid-find`) and `bank3-class-3-gaps.mjs` (`class-3-way-finder`, `class-3-embed-shape`). Registered in `bank3-class-2.mjs` and `bank3-class-3.mjs` (families, feedback codes, draft/solve/render, plan rows). Pictures come from the existing question-display path, with no new image assets.
- Class 2 patterns and Class 3 reasoning rows now include the new families, so Maths Path chapters (which pick questions by `source`) get them without JSON changes.
- No CONTENT_VERSION bump: Bank 3 is edited in place and the golden tests cover versions 1 and 2 only.
- Row width stays at about 12 families so each family keeps 20 or more distinct questions; every family sits in a plan row. Class 2/3 bank3 batteries pass.
- `play/space-academy.html` now says Class 5 has 50 questions.
- Class 4/5 and PP2 time were handed to other agents. `curriculum.mjs` now accepts an optional `ADDED_CHAPTERS` export from a grade module, used for the PP2 time chapter.


## Question bank gaps PP2
- PP2 time chapter (done): dedicated module `js/space-academy/bank3-pp2-time.mjs` (`ADDED_CHAPTERS`, families, feedback codes, draft/solve/render), registered in `bank3-pp2.mjs`. Families: `pp2-oclock`, `pp2-half-past`, `pp2-clock-match`, `pp2-day-part`, `pp2-time-order` (day/part before, after, between), `pp2-time-sense` (quickest or longest). No elapsed-minutes question anywhere; prompts are short plain text.
- Pictures use the existing question-display path: a main clock (`v3-pp2-time-clock`) and picture choices (`v3-pp2-time-small`). The shared `clockFace` has 60 ticks and breaks the 5000-character choice limit, so the module draws a light clock with 12 numbers only.
- Repetition fixes: `pp2-time-order` and `pp2-day-part` had too few distinct questions (15 and 16 at Explore), so prompts gained alternate wordings (tomorrow, yesterday, missing day) and each day part has six items. Day-part prompts no longer rely on verb grammar ("When do we school starts"). Quickest/longest uses 11 ordered activities, wider gaps at Explore.
- `_data/maths-path/pp2.json` time chapter no longer sets `source: "class-1/time"`; Practise, Print and Check now run `pp2/time` (page `data-grade` is `pp2`). Old `/learn/olympiad/pp2/time` becomes a redirect to `/learn/maths/pp2/time/`.
- Browser check (Edge, 1366x768 and 390x844, three Check rounds each): no console or network errors, no overflow, picture choices render, no minutes question. Bank battery for pp2 passes (determinism, unique answer, distractors, no duplicates, position balance, phone speed).
- PP1/PP2 repetition review (60 seeds per level, `audit-academy-questions`): PP1 exact-repeat rates are 0 to 6 percent. PP2 is higher at Explore: shapes 24 percent, measurement 19, operations 15 to 19, numbers 13, time 39 (small space: 12 hours and a few phrasings). Biggest remaining gaps: add variety to `pp2-sides-count`/`pp2-corner-choice` (shapes), `pp2-cup-jug`/`pp2-size-compare` (measurement) and `pp2-join-gardens`/`pp2-cross-out` (operations). Number-normalised near-duplicate rates are 0.7 to 0.9 for most PP1/PP2 chapters, so a different number in the same wording is the main source of sameness.
- Known unrelated test failure: `maths-path.test.mjs` redirect-count test expects 64 but counts 66 after the naming cleanup added two stubs; that test belongs to that work.

### PP2 variety
- Exact-repeat rate at Explore/Practice/Challenge (60 seeds), before to after: numbers 13/12/8 to 7/5/5, operations 15/19/6 to 5/4/3, patterns 10/5/3 to 5/2/2, measurement 19/9/9 to 8/4/3, shapes 24/23/14 to about 15/12/10. Time, reasoning unchanged (time is owned elsewhere).
- Added many more wordings and contexts in `bank3-pp2.mjs` (unit-rod, cup-jug, balance-box, match-rows, join-gardens, cross-out, bar-missing, hop-count, ten-frame, bundle-pods, before-after, growing-tiles, pattern tail/hole, broken-chain, corner-choice, size-compare, solid-choice, sides-count). Same ids and answer contract; `solve` still reads `proof.givens`, never the prompt.
- New structures: sides-count can total two different shapes (`givens.other`) and 1 to 3 copies; solid-choice uses thing frames per clue; size-compare gains a `speed` scale and more items; hop-count L2 includes back hops; growing-tiles target 4 to 5; join-gardens first group 2 to 7.
- PP1: extra stems for `pp1-num-skip`, `pp1-cmp-seesaw`, `pp1-cmp-extreme` (all PP1 families were already under 5 percent except these).
- Test: `space-academy-bank3-pp2.test.mjs` checks at least 5 distinct wordings per repeated family/level and exact repeats under 30 percent.
- The `pp2-sides-count` worked guide in `scripts/academy-guides/families-b.mjs` says "multiply for several shapes"; it is slightly loose for the two-different-shapes variant. Left untouched (another agent owns that folder); tighten later.
- Edge check on a static server (port 4197): PP2 shapes, measurement and operations Check flows at 1366x768 render, picture choices show, no overflow. The 390x844 pass hit a flaky local connection refusal and was not completed.

## Naming cleanup

- Public copy, metadata and JSON-LD now say "Olympiad-style"; no `IMO`/`SOF`/`CREST`/`UIMO` appears in public HTML or user-visible JS strings (`app.mjs`, `worksheet-builder.js`, `curriculum*.mjs` reference titles now read "(external source)"; external hrefs unchanged).
- `learn/imo-preparation.html` renamed to `learn/olympiad-style-maths-preparation.html` (new `#sources` "Sources, not affiliation" note, links point to `/learn/maths/...`). Old URL is a generated noindex redirect stub; `_data/public-pages.json`, `sitemap.xml` and `scripts/check-site-growth.py` use the new route.
- `scripts/maths-path-routes.mjs` `redirects()` now also emits `/learn/olympiad/` -> `/learn/maths/` and the old guide stub; the old hub left the public inventory and the sitemap (same convention as Class 1-5). Remaining internal links to `/learn/olympiad/...` in public pages were rewritten to Maths Path routes.
- `scripts/build-space-academy.mjs` templates (archived discovery pages) were reworded to the same neutral text so regeneration cannot reintroduce the names.
- Tests: `scripts/maths-path.test.mjs` gained redirect/sitemap and a public-HTML/JS "no IMO or SOF" test.
- Verified: build-site --check, maths-path tests, Edge/Playwright link check of changed pages (54 links, 0 broken, redirects OK). `build-space-academy --check` currently fails only on another agent's in-progress `pp2-*` worked-reasoning families, not on this work.
- Left as-is: code comments, bank file names, `_data/maths-path-audit.json` and internal docs.
## Question bank gaps C4/C5
- Families already existed in `bank3-class-4-gaps.mjs` (`class-4-number-name`, `class-4-pair-list`) and `bank3-class-5-gaps.mjs` (`class-5-crore-places`, `class-5-angle-sense`, `class-5-word-order`, `class-5-hidden-count`, `class-5-hidden-figure`), registered in `bank3-class-4.mjs` / `bank3-class-5.mjs` plan rows (numbers, geometry, reasoning) using `bank3-gap-kit.mjs` and the existing question-display path. No second module was added, to avoid duplicates.
- Fixes made while verifying: `class-5-angle-sense` hint leaked the answer ("right angle") and had a "1 hour gap" grammar slip; the level-1 reasoning row lost `class-5-rank-queue-twoends` (so feedback `class-5-queue-total` was unused), now restored in place of `class-5-mirror-clock`.
- Chapter JSON needed no change: each chapter's `source` is its own Space Academy chapter, and Practise/Print/Check pick questions by plan row, so Class 4 numbers and Class 5 numbers/geometry/reasoning now serve the new families.
- Verified: Class 4 and 5 bank3 batteries, bank lint (class-4, class-5), audit script (no flags on class-4/5 rows), `build-maths-path --sync-inventory --write` and `build-site --check` current. Edge/Playwright Check flow on class-4/numbers, class-5/numbers, geometry, reasoning at 1366x768 and 390x844: three rounds each, new-family questions seen (number names, pair lists, crore, angles, word order, hidden squares), no console errors or overflow.
- Unrelated failures seen: PP2 and Class 2 bank lint, `pp2-oclock` worked-reasoning test (other agents' work).
## Docs and OG image
- README.md gained a "Maths Path" section and ARCHITECTURE.md's Maths Path paragraph was rewritten from the code: per-class data plus index, schema validator, generator flags (`--check`, `--write`, `--sync-inventory`), widgets/practice/check/print/progress modules, olympiad redirects, source-chapter and bank3 gap relationship, localStorage-only privacy, SEO, naming rule and verification commands. All seven classes are live.
- New social image `images/maths-path/og-maths-path.png` (1200x630) rendered in Blender 5.2 by `scripts/maths-path-art/render-og.py` (Ringo raster on a lit plane, 3D title text and number blocks). `build-maths-path.mjs` now uses it for og:image/twitter:image on the hub, class and chapter pages, with new alt text.
- Verified: `build-maths-path --sync-inventory --write` (133 pages, 67 updated), `build-site --check` current, `maths-path.test.mjs` 22/22.

## Angle and place-value widgets

- New `angle` widget (`js/maths-path/angle.mjs`): round protractor, fixed base arm plus an arm built by pointer drag (snaps to `step`, default 5°, sticks at 0°/360° instead of jumping) or keyboard (arrows ±step, Shift+arrow or PageUp/PageDown ±15°, Home 0°, End 360°; `role="slider"`, live-region readout). Buttons ±5°/±15° for touch. Modes: `build` (target `{angle}` or `{kind}`) and `name` (fixed angle, pick acute/right/obtuse/straight/reflex/full; target `{kind}`; `kinds` limits the choices).
- New `placeValueBig` widget (`js/maths-path/place-value-big.mjs`): 3-9 columns (ones to crores or hundred millions), +/- per column with automatic regrouping (10 in a column trades for 1 in the next, announced), Indian/international comma toggle (shown when `cols > 5`), optional `goal` chip, words readout (lakh/crore or thousand/million). Target `{value}`. The old `placeValue` (tens and ones) is unchanged.
- Both registered in `widgets.mjs` (the schema validates through that registry), have `sample` exports, and styles at the end of `css/maths-path.css` (reduced-motion safe; no animation).
- Chapters (Try-it only): class-2 numbers activity 3 (10x10 array workaround -> build 100 by trading tens), class-3 numbers activity 1 (build 4265), class-4 numbers (new first activity, build 40,605), class-5 numbers (new first activity, build 24,05,000 and switch grouping), class-5 geometry (new first two activities: build 135°, name a 150° angle).
- Tests: `scripts/maths-path-widgets-extra.test.mjs` (render, kinds/grouping/words, shipped data, and a real Edge pointer + keyboard + target-number test that skips when Edge or playwright-core is missing).
- Verified: `node --test scripts/maths-path.test.mjs` and the new test pass; `build-maths-path --sync-inventory --write` and `build-site --check` current. Edge/Playwright with reduced motion at 1366x768, 390x844, 844x390 on class-2/3/4/5 numbers and class-5 geometry: real pointer and keyboard, Check answers pass, no console errors, no page or widget overflow. Screenshots in session `files/widgets-extra/`.
- Note: the local 4195 server refused some Edge connections during the check, so pages were served from disk through Playwright routing instead (same files).
