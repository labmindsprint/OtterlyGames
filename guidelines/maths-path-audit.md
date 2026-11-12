# Maths Path: step 0 audit

Internal working evidence, **2026-11-10**. Scope: syllabus, sequence, production-bank diversity and naming. No live course, generator bank, CSS, JS application, build pipeline or public page was edited by this audit.

## Decisions

1. Keep **See → Try → Practise → Print → Check**. Use **Olympiad-style** publicly. Provider names below are research citations, not public branding or an affiliation claim.
2. The live bank is **56 chapters across seven grades**, not merely the older curriculum table. Bank3 overrides v2 family routes; a family existing somewhere in source is not proof that a child can reach it.
3. Recommend **59 teaching homes**: retain the 56, add **PP2 time**, **Class 2 reasoning**, and a discoverable **Class 3 patterns** split. The last reuses existing questions; it is not a content deficit. The audit JSON has ordered prerequisites, parent lines, 3–5 child outcomes each, exact reachable families, source chapter IDs, games and tools.
4. **Refute the Class 4 required-decimals gap.** The current fetched primary list says number sense **more than four digits**, not specifically six/seven digits, and does **not** list decimals. The second provider says five digits and also does not list decimals. Its sample includes decimal currency: teach that within money; an optional decimal bridge is not a verified missing mandatory chapter.
5. **Confirm Class 2 code/embedded-figure gaps in the live plan.** V2 routes `code-key`, `code-infer`, `embedded-grid`; bank3 replaces those rows and does not route them. Numeric analogy labelled `coding` and counting hidden shapes do not replace those formats.
6. **Refute most suspected Class 5 absences:** angles, symmetry, conversions, HCF/LCM, mirror clocks and restricted water-word tasks exist. A deeper check found an unanticipated **eight-digit number gap**: the description claims eight digits, but core generators cap at seven and the place chart has no crore column. Other gaps are exact embedded/NOT-embedded choices, logical sequences of words, broader mirror/water pictures and more HCF applications.
7. PP1/PP2 stay **readiness**. Published KG ranges are not a mandate to turn the course into a timed competition or increase its number range.

## Evidence and limits

Read `curriculum.mjs`, frozen `curriculum-v1.mjs`, `bank3-index.mjs`, all seven integrated bank3 `FAMILIES`/`PLAN` modules and relevant delegated family engines, plus `questions.mjs` and the worksheet adapter. Current routes were imported and checked programmatically. Generic source families and frozen banks are distinguished from current routes.

Fetched all five linked primary syllabus pages and all seven secondary sample pages. The simplified primary pages initially showed only navigation/footer; **raw HTML contains the actual syllabus** around the main content, so a blank simplified extraction was not treated as missing evidence. Read primary sample PDF text in memory using the download links from the corresponding sample pages, plus both KG PDF texts and the secondary provider's inline Class 1–5 examples. **No provider questions, diagrams or papers are reproduced in these deliverables.** PDF diagrams were not independently visually graded in this bounded audit.

Source keys and URLs are recorded in `_data\maths-path-audit.json`:

- **S1–S5:** [Class 1](https://sofworld.org/imo/class-1/imo-syllabus/imo-syllabus-class-1), [Class 2](https://sofworld.org/imo/class-2/imo-syllabus/imo-syllabus-class-2), [Class 3](https://sofworld.org/imo/class-3/imo-syllabus/imo-syllabus-class-3), [Class 4](https://sofworld.org/imo/class-4/imo-syllabus/imo-syllabus-class-4), [Class 5](https://sofworld.org/imo/class-5/imo-syllabus/imo-syllabus-class-5).
- **K1/K2:** [Junior KG](https://www.crestolympiads.com/maths-olympiad-cmo-sample-papers-junior-kg), [Senior KG](https://www.crestolympiads.com/maths-olympiad-cmo-sample-papers-senior-kg).
- **C1–C5:** `https://www.crestolympiads.com/maths-olympiad-cmo-sample-papers-class-N`, N=1…5. These published lists match the primary mathematical topics closely, but not its four-section structure.
- [Secondary marking scheme](https://www.crestolympiads.com/marking-scheme).
- Primary sample pages: `https://sofworld.org/imo/class-N/sample-model-test-papers/imo-sample-papers-class-N`; linked PDFs `https://sofworld.org/download/file/fid/73711` through `73715`.

Access date is 2026-11-10. Public pages may change; a source URL is not a guarantee of lasting topic wording.

### Actual section structure and weighting

| Source/class | Sections in paper order: questions × marks each | Total | Duration |
|---|---|---|---|
| S1–S4 | Logical Reasoning 10×1; Mathematical Reasoning 10×1; Everyday Mathematics 10×1; Achievers 5×2 | 35 questions, 40 marks | 60 min |
| S5 | Logical Reasoning 15×1; Mathematical Reasoning 20×1; Everyday Mathematics 10×1; Achievers 5×3 | 50 questions, 60 marks | 60 min |
| K1/K2 | Practical Mathematics 20×1; Achievers 5×2 | 25 questions, 30 marks | 45 min |
| C1–C4 | Practical Mathematics 25×1; Achievers 10×2 | 35 questions, 45 marks | 60 min |
| C5 | Practical Mathematics 40×1; Achievers 10×2 | 50 questions, 60 marks | 60 min |

Primary section 3 applies **section-2 topics in everyday contexts**; section 4 uses **higher-order section-2 topics**. These are not four separate lists of mathematical content. The published Level-1 note specifies **60% current class / 40% previous class**, with Achievers from the current syllabus. That does not mean Otterly's Explore/Reason/Stretch levels correspond to provider exam levels.

**Production-paper caveats:** question counts and section counts match the primary shape, but the generator selects from one current grade, not a measured 60/40 source-grade mixture. Existing arithmetic can incidentally review earlier material; this is not evidence that the specified ratio is met. `questions.mjs` permits Achievers picks from all chapters, including reasoning-only chapters. In 20 deterministic Level-2 paper seeds per class, reasoning-chapter picks occupied **28/100, 11/100, 14/100, 10/100, 14/100** Achievers slots for Classes 1–5 respectively. Do not market exam equivalence. Correct the source-pool policy only in a separately owned generator change with saved-version compatibility considered.

## Complete published-topic coverage matrix

**C** = reachable task exists, not independently certified full mastery. **P/M** = partial, medium-priority breadth/literacy gap. **G/H** = missing live format, high priority. **G/M** = missing, medium priority. **D/L** = deliberate readiness/reference difference, low urgency. Topic names are factual syllabus labels; grouped labels below each map to the stated source family. No topic was inferred solely from its chapter title.

Family IDs in tables are exact. A source route is `grade/chapter`. Sections 3/4 inherit **every mathematical row**, but require application and reasoning variants rather than a new chapter per topic.

### PP1 readiness: actual K1 published list

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Big/small; tall/short | `pp1/comparing` → `pp1-cmp-extreme` | C |
| Heavy/light | `pp1/comparing` → `pp1-cmp-seesaw` | C |
| Full/empty | `pp1/comparing` → `pp1-cmp-jars` | C; explicit full/empty endpoints should be present in lessons |
| Same/different | `pp1/comparing` → `pp1-cmp-same`; `pp1/sorting` → `pp1-sort-twin` | C |
| Numbers 1–50 | `pp1/counting` → count/frame/near families mainly within 20 | D/L: upper reference range intentionally not claimed |
| Greater than; less than; equal to | `pp1/comparing` → `pp1-num-bigger`, `pp1-cmp-equal` | C conceptually; spoken comparison before symbol notation |
| Number names 1–20 | No current numeral ↔ written-name family | G/M relative to reference; adult-led spoken names, no reading gate |
| Before; after | `pp1/counting` → `pp1-num-near` | C |
| Circle; square; triangle; rectangle; heart; star; oval | `pp1/shapes` → `pp1-shape-find`, `pp1-shape-shadow`, `pp1-shape-name`; shape pool explicitly includes all seven across levels | C; **not** a shape-coverage gap |
| Achievers: same section-1 topics | Same chapters at Stretch | C structurally; suitability requires educator review |

The misleading family ID `pp1-num-name` now generates count-on/back and tens/ones, **not** reading number words (`bank3-pp1-numbers.mjs`). Do not claim name literacy based on that ID.

### PP2 readiness: actual K2 published list

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Big/small; heavy/light; tall/short | `pp2/measurement` → `pp2-size-compare` | C |
| Full/empty; more/less | `pp2/measurement` → `pp2-cup-jug`; `pp2/operations` → `pp2-match-rows` | C |
| Front/back; in/out; right/left; top/bottom | `pp2/reasoning` → `pp2-alien-line`, `pp2-rover-map`; spatial language in shapes/reasoning | P/M: row/map tasks do not systematically assess every position word; add explicit picture prompts |
| Same/different | `pp2/reasoning` → `pp2-odd-one`, `pp2-shape-changes`, `pp2-two-marks` | C |
| Thick/thin | No explicit PP2 thickness family; PP1 has `pp1-cmp-thick` but is not in PP2 routing | G/M: reuse lesson manipulative, add PP2 practice |
| Number names 1–50 | No PP2 written-name family; numeric `MAX()` is 20 | D/L upper range; G/M literacy format |
| Before, after, between 1–20 | `pp2/numbers` → `pp2-before-after`, `pp2-trail-gap` | C |
| Skip-counting by 2 and 5 | `pp2/numbers` → `pp2-skip-stones` | C |
| One-digit addition; subtraction | `pp2/operations` → `pp2-join-gardens`, `pp2-cross-out`, `pp2-story-sum` | C |
| >, <, = signs | `pp2/numbers` → `pp2-sign-order` supports order; comparison concept in operations | P/M: explicit sign-choice variant desirable |
| Days of week; months of year | No current PP2 time row | G/M; new `time` teaching home |
| Square; rectangle; triangle; circle | `pp2/shapes` → `pp2-shape-scene`, `pp2-sides-count` | C |
| Oval | Not in PP2 shape selection pools inspected | G/M; PP1 coverage does not automatically transfer |
| Sphere; cone; cube; cylinder | `pp2/shapes` → `pp2-solid-choice`, with ball/box/can/cone representations | C with everyday names; explicitly connect formal names in See |
| Achievers: same section-1 topics | Existing Stretch plus unsupported topics above | P/M |

K2's inline sample also asks for a whole-hour clock, despite its short syllabus saying days/months. The proposed time chapter includes that format as sample-informed enrichment, not a newly invented official requirement.

### Class 1: S1 logical topics and S1/C1 mathematical topics

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Patterns | `class-1/patterns` → `class-1-bead-string-gap`, `class-1-growing-tile-stage`, `class-1-letter-gap` | C |
| Odd One Out | `class-1/reasoning` → `class-1-odd-signal-badge`, `class-1-word-odd` | C |
| Measuring Units | `class-1/measurement` → `class-1-unit-chain`, `class-1-choose-unit` | C |
| Geometrical Shapes | `class-1/geometry` → `class-1-shape-outpost`, `class-1-corner-badge` | C |
| Spatial Understanding | `class-1/reasoning` → `class-1-rover-grid-route`, `class-1-stack-order` | C |
| Grouping of Figures | `class-1/reasoning` → `class-1-odd-signal-badge`; geometry shape selection | C |
| Analogy | `class-1/reasoning` → `class-1-signal-analogy`, `class-1-word-analogy` | C |
| Ranking Test | `class-1/reasoning` → `class-1-queue-rank` | C |
| Problems based on Figures | geometry scene/corner families; `class-1-sample-change-compare` in operations | C |
| Numerals; Number Names; Number Sense (2 digits) | `class-1/numbers` → `class-1-base-ten-build`, `class-1-number-name`, `class-1-compare-numbers`, `class-1-expanded-form` | C; suspected name/2-digit absence refuted |
| Addition; Subtraction | `class-1/operations` → `class-1-add-story`, `class-1-part-whole-repair`, `class-1-number-sentence` | C |
| Lengths; Weights; Comparisons | `class-1/measurement` → `class-1-ruler-span`, `class-1-sample-mass`, `class-1-length-story` | C |
| Time | `class-1/time` → `class-1-clock-read`, `class-1-clock-choice`, `class-1-mission-calendar` | C |
| Money | `class-1/money` → `class-1-coin-pouch`, `class-1-supply-shop-pair`, `class-1-shopping-change` | C |
| Geometrical Shapes and Solids | `class-1/geometry` → `class-1-solid-motion`, `class-1-real-solids`, shape families | C |
| C1 additionally names Patterns in maths | Same pattern chapter | C |

### Class 2: S2 logical topics and S2/C2 mathematical topics

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Patterns | `class-2/patterns` → `class-2-bead-rule`, `class-2-growing-tiles`, `class-2-number-series` | C |
| Odd One Out | `class-2/patterns` → `class-2-odd-text` | C |
| Measuring Units | `class-2/measurement` → `class-2-unit-sense`, `class-2-clip-length` | C |
| Geometrical Shapes | geometry → `class-2-shape-riddle`, `class-2-hidden-shapes`; patterns → `class-2-shape-lines` | C |
| Analogy | patterns → `class-2-analogy`; geometry → `figure-analogy` | C; analogy's skill label is not code-key evidence |
| Ranking Test | patterns → `class-2-row-position`, `class-2-cardinal-ordinal` | C |
| Grouping of Figures | patterns → `class-2-matrix-cell`; geometry → `class-2-picture-facts` | C |
| Embedded Figures | `class-2-hidden-shapes` counts composites; v2 `embedded-grid` is no longer routed | **G/H exact embedded figure choices** |
| Coding-Decoding | Neither `code-key` nor `code-infer` in bank3 Class 2 PLAN; symbol equations solve quantities, not a message code | **G/H** |
| Numerals; Number Sense (3 digits) | numbers → `class-2-place-blocks`, `class-2-number-line`, `class-2-order-four` | C |
| Number Names | patterns → `class-2-place-words` uses “N hundreds, N tens…”; no full written numeral-name matching located | P/M |
| Computation Operations | operations → `class-2-regroup-story`, `class-2-array-grid`, `class-2-missing-digit` | C; division progression should be taught explicitly, not inferred from arrays |
| Length | measurement → `class-2-clip-length`, `class-2-unit-sense` | C |
| Weight | measurement → `class-2-pan-compare`, `balance-missing` | C |
| Capacity | measurement → `class-2-jug-pour`, `class-2-cylinder-diff` | **C; suspected absence refuted** |
| Time | time → `class-2-clock-match`, `class-2-timeline-bar`, `class-2-calendar-span` | C |
| Temperature | measurement → `class-2-thermometer-diff` | **C; suspected absence refuted** |
| Money | money → `class-2-note-combo`, `class-2-receipt-missing`, `shopping-change` | C |
| Lines, Shapes and Solids | patterns → `class-2-shape-lines`, `class-2-roll-slide`; geometry → `class-2-shape-riddle` | C |
| Pictographs | data → `pictograph`, `class-2-pictograph-half`, `class-2-picto-pair` | C |
| Patterns, in section 2 also | same pattern families | C |

### Class 3: S3 logical topics and S3/C3 mathematical topics

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Patterns | reasoning → `class-3-number-series`, `class-3-figure-pattern` | **C; chapter discoverability gap only** |
| Analogy and Classification | reasoning → `class-3-figure-analogy`, `class-3-odd-out`, `class-3-pair-rule` | C |
| Alphabet Test | reasoning → `class-3-alpha-step`, `class-3-word-jumble`, `class-3-word-form` | C |
| Coding-Decoding | reasoning → `class-3-signal-code`, `class-3-word-code` | C |
| Ranking Test | reasoning → `class-3-queue-rank`, `class-3-order-clues` | C |
| Grouping of Figures and Figure Matrix | reasoning → `class-3-figure-places`, `class-3-figure-analogy`, `class-3-figure-pattern` | C for grouped-picture rules; broaden matrix transformations |
| Mirror Images | geometry → `class-3-mirror-pick`; reasoning → `class-3-mirror-sign` | C |
| Geometrical Shapes | geometry → `class-3-shape-pick`, `class-3-solid-riddle` | C |
| Embedded Figures | reasoning → `class-3-embedded-letter` | P/M: hidden letters are narrower than general embedded shapes |
| Possible Combinations | reasoning → `class-3-pick-ways`, `class-3-ways-menu` | C |
| Clock and Calendar | time → `class-3-clock-face`, `class-3-calendar-grid`, `class-3-month-days` | C |
| Numerals; Number Names; Number Sense (4 digits) | numbers → `class-3-bead-count`, `class-3-number-words`, `class-3-order-digits` | C |
| Computation Operations | operations → `class-3-times-story`, `class-3-divide-story`, `class-3-add-story`, `class-3-long-division` | C |
| Fractions | fractions → shaded/line/group/equivalence families | C |
| Length; Weight; Capacity; Temperature | measurement → `class-3-ruler-gap`, `class-3-balance-pan`, `class-3-jug-fill`, `class-3-dial-read` | C |
| Time | time → elapsed/timetable/calendar families | C |
| Money | money → `class-3-change-slip`, `class-3-best-buy`, `class-3-budget-rule` | C |
| Geometry | geometry → `class-3-shape-perimeter`, `class-3-grid-edge`, `class-3-symmetry-lines` | C |
| Data Handling | data → `class-3-picto-key`, `class-3-bar-scale`, `class-3-table-read` | **C; pictograph absence refuted** |

Direction sense is **not explicitly in the current S3 list**. It is nevertheless reachable as Stretch `class-3-compass-walk`. “Adds direction sense in Class 3” in the approved plan is not verified by this current published list; teach it as useful enrichment.

### Class 4: S4 logical topics and S4/C4 mathematical topics

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Patterns | reasoning → `class-4-number-series`, `class-4-pattern-complete`; numbers → `class-4-alternating-lock` | C |
| Alphabet Test | reasoning → `class-4-alphabet-position`, `class-4-letter-arrange`, `class-4-dictionary-order` | C |
| Coding-Decoding | reasoning → `class-4-word-code`; measurement → `class-4-code-machine` | C |
| Ranking Test | reasoning → `class-4-row-order`; data → `class-4-rank-repair` | C, scattered |
| Mirror Images | reasoning → `class-4-mirror-word`; geometry → `class-4-mirror-panel` | C |
| Geometrical Shapes and Solids | geometry → `class-4-solid-facts`, `class-4-folded-cube` | C |
| Embedded Figures | reasoning → `class-4-embedded-figure` | C |
| Direction Sense Test | reasoning → `class-4-compass-turn`, `class-4-rover-program` | C |
| Possible Combinations | route counts exist, but no current menu/pair Cartesian-choice family in Class 4 PLAN | **G/M specific pair-combination format** |
| Analogy and Classification | reasoning → `class-4-figure-analogy`; numbers → `class-4-odd-one-out` | C |
| Clock and Calendar | time → `class-4-lab-calendar`, `class-4-clock-repair`; reasoning → `class-4-day-count` | C |
| Numerals; Number Names | numbers → `class-4-words-place`, `class-4-place-value-gap` | P/M: full written words occur in a four-digit subtraction variant; larger-number name matching remains thin |
| Number Sense (more than four digits; C4 says five digits) | numbers → digit/place/compare families | C at five digits; **no published basis for requiring six/seven specifically** |
| Computation Operations | operations → story, division, split-product, column-repair families | C |
| Fractions | fractions → equivalents, fraction quantities, claims/leftovers | C |
| Length; Weight; Capacity | measurement → `class-4-unit-log`, `class-4-mass-units`, `class-4-measure-share` | C |
| Time | time → timeline/timetable/duration families | C |
| Money | money → bill/change/budget/paise families | C |
| Geometry; Perimeter of Various Shapes | geometry → `class-4-perimeter-word`, `class-4-perimeter-unknown` | C |
| Symmetry | geometry → `class-4-mirror-panel`; reasoning → `class-4-symmetry-letters` | C |
| Conversions | measurement → `class-4-unit-log`, `class-4-mass-units`; time → `class-4-time-units` | C |
| Data Handling | data → scaled bars, half-pictographs, paired surveys, transfer families | C |

**Decimals is absent from both fetched Class 4 topic lists.** Factors/multiples are not separately named there, but **do occur in the primary Class 4 sample**, and current numbers routes include `class-4-factor-facts`, `class-4-multiple-facts`, `class-4-factor-trays`. Roman numerals occur in a digit-clue sample and are covered by `class-4-roman-tablets`. No duplicate chapters are needed for those verified formats.

### Class 5: S5 logical topics and S5/C5 mathematical topics

| Published topic | Current route → family evidence | Status |
|---|---|---|
| Patterns | reasoning → `class-5-number-series`, `class-5-alpha-series`, `class-5-figure-matrix-analogy` | C |
| Analogy | reasoning → `class-5-figure-matrix-analogy` | C |
| Classification | reasoning → `class-5-odd-one-out`, `class-5-venn-survey` | C |
| Geometrical Shapes | geometry → `class-5-count-rectangles-grid`, `class-5-cube-net-fold`; reasoning → `class-5-count-grid` | C; parallel-line pair counting needs expansion |
| Mirror and Water Images | reasoning → `class-5-mirror-water-word` | P/M: mirror words and water-invariant words, not general water-picture transformation |
| Direction Sense Test | reasoning → `class-5-walk-distance`, `class-5-compass-map`, `class-5-grid-route-turns` | C |
| Ranking Test | reasoning → `class-5-rank-queue-twoends`, `class-5-row-swap-rank` | C |
| Alphabet Test | reasoning → `class-5-alpha-series`, `class-5-letter-code` | C |
| Logical Sequence of Words | Person ordering and number ordering are not meaning-based word sequences | **G/M** |
| Puzzle Test | reasoning → `class-5-blood-relation`, `class-5-order-people`, `class-5-truth-teller`, combinations | C |
| Coding-Decoding | reasoning → `class-5-letter-code` | C |
| Clock and Calendar | time → `class-5-calendar-weekday-calc`; reasoning → `class-5-mirror-clock`, `class-5-day-sequence` | C; mirror clocks already present |
| Numerals; Number Sense (7/8 digits) | numbers → `class-5-place-value-expand`, digit-card/compare families | **P/H: seven digits present; eight-digit construction/place-value/comparison missing** |
| Number Names | Place chart and digit riddles do not establish full written-name fluency | P/M; add explicit name matching |
| Computation Operations | operations → multistep bars, missing-digit columns, big-number stories | C |
| Fractions and Decimals | separate fractions/decimals chapters with models, compare, quantities and calculations | C; breadth/difficulty still needs educator review |
| Measurement of Length; Weight; Capacity | measurement → dial/convert/word-problem/unit-comparison families | C |
| Time | time → elapsed/24-hour/timetable/error families | C |
| Temperature | measurement → `class-5-thermometer-change` | C |
| Money | money → price/budget/value/discount/receipt families | C |
| Conversions | measurement → `class-5-unit-conversion-compare`, `class-5-dial-read-convert` | C |
| Angles | geometry → `class-5-angle-chase`; reasoning → `class-5-mirror-clock` also hand angles | **C; suspected absence refuted** |
| Perimeter of Various Shapes | geometry → `class-5-perimeter-missing-side` | C |
| Area of Rectangle and Square | geometry → `class-5-composite-area`, `class-5-field-rounds-area` | C |
| Symmetry | geometry → `class-5-symmetry-count` | **C; suspected absence refuted** |
| Data Handling | data → pictographs, scaled bars, two-chart, average, statement, line-graph families | C |

The primary **sample** additionally demands exact NOT-embedded figure selection and comparing HCF/LCM/factor facts. HCF/LCM are covered by `class-5-hcf-lcm-mix`, `class-5-factor-multiple-sort`, `class-5-greatest-of-four`; repeated schedules by `class-5-schedule-meet-again`. Exact embedded choices are **G/H** in Class 5; counting all triangles/rectangles is different.

**Range verification:** inspected Class 5 `digit-card-extreme` (5/6/7 cards by level), `digit-riddle` (up to 9,999,999), `compare-order-grid` (5 or 7 digits), and `place-value-expand` (5/6/7 columns). `PLACE_NAMES` ends at ten lakhs. A further 200 seeds per numbers level gave maximum prompt integer lengths **5/7/7**, with **zero eight-digit tokens**. Class 4 gave **4/5/5**. This additional range check is distinct from the main quality report and confirms why curriculum descriptions alone are insufficient coverage evidence.

## Recommended course sequence

Full machine-readable detail is in `_data\maths-path-audit.json` (59 chapters, 183 outcomes). It is **not** the live `_data\maths-path.json`; provider metadata is internal-only. Source references were validated against current production families, and every tool/game path exists.

| Class | Ordered chapter IDs |
|---|---|
| PP1 | counting → comparing → shapes → sorting → position → patterns |
| PP2 | numbers → operations → shapes → measurement → patterns → reasoning → **time (new)** |
| 1 | numbers → operations → patterns → geometry → measurement → time → money → reasoning |
| 2 | numbers → operations → patterns → geometry → measurement → time → money → data → **reasoning (new home + formats)** |
| 3 | numbers → operations → fractions → geometry → measurement → time → money → data → **patterns (new home, reused families)** → reasoning |
| 4 | numbers → operations → fractions → geometry → measurement → time → money → data → reasoning |
| 5 | numbers → operations → fractions → decimals → geometry → measurement → time → money → data → reasoning |

Arrows show suggested presentation order, not arbitrary dependencies. The JSON prerequisites form a verified acyclic earlier-chapter graph. Shape/position branches can start before arithmetic. Class 5 measurement follows decimals because conversions can include decimal quantities. Class 3 patterns should be available early once numbers/geometry are comfortable, even though its map position preserves a mostly familiar subject order.

Every ordinary existing chapter links to Space Academy at its **source** grade/chapter/level. The three new teaching IDs must **not** be sent to a generator that has no matching row. PP2 time needs new families before scored practice/print/check can honestly pass its outcomes. Class 2 reasoning and Class 3 patterns can link their existing source chapters, with unsupported Class 2 outcomes explicitly pending.

- **Clock Master:** time chapters only, for hands and reading time. Calendars, 24-hour conversion, reflected clocks and elapsed-time stories still use Space Academy. PP2 use is adult-supported; no readiness paper.
- **Math Tank:** Classes 2–4 operations, specifically taught multiplication/division facts. Not addition/regrouping, reasoning, money or fractions.
- **Existing tools:** hour/minute hands, AM/PM and clock lessons for time; times tables/practice, long division and column multiplication for applicable operations. Calculator in later money/decimals is a checking aid, not a substitute for See/Try.
- **Print:** use the worksheet builder's Academy mode with the source chapter and matching level. A mixed sheet is not evidence of mastery of an unsupported outcome.
- **Check:** five questions must sample the chapter's taught outcomes, not five random instances of its easiest family. All unanswered/missing-format outcomes must remain pending, not silently counted as learned.

## Question-quality measurement

Read-only script: `scripts\audit-academy-questions.mjs`. It imports **the same production `createMission` API** used by `js\worksheet-academy.mjs`, without modifying any question modules or public assets.

```powershell
node scripts\audit-academy-questions.mjs --seeds 200 --output C:\Users\smaharana\.copilot\session-state\cdd37ffb-b159-413f-ba4c-789bc82d796f\files\maths-audit\question-quality.json
```

Result: **7 grades × 56 chapters × 3 levels × 200 seeds = 33,600 successful missions, 247,200 questions; zero generation errors**. The final report also persists **100 paper probes** (3,800 additional questions), with zero errors; final runtime was about 140 seconds. Each question passes the production solver/choice consistency checks during generation. This does not constitute an independent proof of mathematics, child readability or diagram accessibility.

Measured per chapter/level:

- Unique exact questions, ignoring shuffled choice order but retaining prompt, diagram and answer.
- Unique raw prompts; prompts normalised by numeric-literal replacement.
- Visual-aware structure count: family + normalised prompt + recursive diagram/option schema.
- Exact repeat rate and normalised-prompt near-duplicate rate across the sample, plus within-mission near-duplicate rate.
- Observed/planned family counts and per-family use; missing planned families.
- Answer-position counts by number of options; descriptive chi-square and a conservative bias flag (>8 percentage-point deviation from uniform with at least 100 answers).
- Prompt numeral lengths for range checks, plus the paper-section/source-grade probes described above.

**All planned families were observed.** Every chapter/level used **4–12 families**. **Zero answer-position bias flags.** **Five** chapter/levels exceed 50% exact repeated instances over the cumulative 200-seed sample:

| Rank | Chapter / level | Questions | Exact unique | Exact repeat | Raw prompts | Visual-aware structures | Families |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Class 5 fractions / Explore | 1,600 | 581 | 63.69% | 530 | 13 | 4 |
| 2 | Class 1 time / Explore | 1,600 | 586 | 63.38% | 296 | 109 | 5 |
| 3 | Class 1 measurement / Explore | 1,600 | 752 | 53.00% | 162 | 162 | 6 |
| 4 | Class 2 geometry / Explore | 1,600 | 790 | 50.63% | 380 | 372 | 6 |
| 5 | Class 1 patterns / Explore | 1,600 | 781 | 51.19% | 306 | 509 | 5 |

Ranking uses the script's reproducible combined priority score, not repeat rate alone. Next review candidates: Class 2 geometry Stretch (40.38% repeat), PP2 shapes Explore (43%), PP2 measurement Explore (41.7%), Class 5 geometry Explore (35.25%), Class 5 measurement Explore (41.81%).

**Interpret carefully:** these are saturation rates after hundreds of missions, not the percentage of repeated questions a child necessarily sees in one sitting. Numeric-normalised prompt duplication is deliberately very high for diagram tasks (e.g. Class 5 fractions Explore 99.31%); identical words can refer to distinct pictures. It is not a plagiarism detector or a valid standalone thinness verdict. Structural normalisation is a heuristic, not semantic equivalence, and raw exact metrics can still distinguish incidental visual labels. The JSON report preserves definitions, raw counts, all 168 rows, family frequencies and SHA-256 hashes of source modules.

### Ranked authoring work

1. **Class 2 reasoning / geometry / patterns and Class 5 numbers:** restore exact embedded figures/code-key formats and add eight-digit/crore place value. These are high-priority coverage gaps, regardless of statistical rank.
2. **Class 5 fractions Explore:** largest template/saturation concern, with only 13 structures. Add non-bar equal-part shapes, mixed-whole number lines, inverse shading, compare-the-same-whole and fair-share pictures with genuine different reasoning actions.
3. **Class 1 time Explore:** add daily-routine matching, place/move hands, order event times and pair clock/digital representations. Avoid simply choosing more hour values.
4. **Class 1 measurement Explore:** add start-offset comparison, same-object/different-unit diagnosis, balanced versus tilted scales and capacity-before/after pictures.
5. **Class 2 geometry Explore:** add exact embedded line figures, rotated-versus-reflected selection and shared-boundary/composite-shape reasoning; expand distinct configurations.
6. **Class 1 patterns Explore:** add repeating-unit identification, wrong-tile repair, two-attribute cycles and transfer-to-new-objects tasks rather than new colours only.
7. **PP2 time / spatial vocabulary / shape breadth:** build the missing teaching and practice bridge without forcing reading, >20 numbers or a timer.
8. **Class 5 reasoning:** exact NOT-embedded choices and meaning-based word sequence; extend water-image tasks beyond special symmetric words. Add parallel/perpendicular line-pair tasks to geometry.
9. **Class 4 reasoning:** constrained pair combinations, not just paths. Broaden full written-number-name tasks in Classes 2, 4 and 5.

## Format comparison against public samples

Observed sample formats are described, not copied. “Present” means live routing, not that every desired variant already exists.

| Format | Evidence/demand | Live status and action |
|---|---|---|
| Figure series; missing picture | Primary Class 1 sample; reasoning syllabi | Present PP1–Class 5, with families such as bead/pattern/figure-pattern/number-series. Expand Explore rules where saturated |
| Mirror picture; water image | S3–S5 topic lists | Mirrors present; Class 5 `mirror-water-word` has limited water-invariant word tasks. Add arbitrary picture water-reflections |
| Exact embedded and NOT-embedded figure | Primary Classes 2 and 5 sample PDFs | Class 4 exact embedded present; Class 3 letters partial; Class 2/5 missing live exact choices |
| Coding-decoding | S2–S5; primary Class 4 sample digit/symbol table | Class 3–5 present. Restore Class 2 key/inference route. Numeric analogy is not sufficient |
| Direction sense; turns | S4/S5 explicitly | Present Class 3 compass enrichment and Class 4/5 routes. No new Class 3 gap |
| Ranking and row swaps | S1–S5 | Present; Class 2 mostly filed under patterns |
| Roman numerals | Primary Class 4 sample digit clue | Class 4/5 present; not a missing chapter |
| Calendar; date intervals | S3–S5; secondary Class 2 inline calendar | Class 1–5 present, PP1 weekday enrichment; PP2 lacks home/families |
| Symmetry; angles | S4 symmetry; S5 angles/symmetry; secondary Class 5 inline examples | Present. Add parallel/perpendicular pair counting demanded by primary Class 5 sample |
| Reflected clocks | Broader S5 clock/mirror topics | Present `class-5-mirror-clock`; no blanket missing-format claim |
| Pictographs; bar charts; line graphs | Primary Class 2 pictograph, Class 5 line graph; secondary charts | Present Class 2–5, including scaled/half-symbol variants and Class 5 line graphs |
| Money change; missing prices | Secondary Classes 1–5 application samples | Present. Do not conflate values in paise with a full decimal curriculum |
| Unit conversion and mixed units | S4/S5; secondary Class 3/5 inline examples | Present length/mass/capacity/time routes. Add cross-representation variants, not duplicate chapters |
| HCF/LCM facts and applications | Primary Class 5 sample; computation scope | Facts/comparisons and LCM schedules present. HCF equal-packet/greatest-length word contexts are thin |
| Estimation and rounding | Number/measurement applications | Present near-round, rounding-line, sensible-unit families. Broaden error-check/estimate-before-compute variants |
| Magic squares | Useful enrichment; **not verified in the specific samples reviewed** | Grid-rule/triangle-rule tasks are not necessarily equal-row/column magic squares. Optional original constrained sums, not a claimed syllabus omission |
| Missing digits; written algorithms | Secondary Class 4 inline sample; computation | Present Classes 2–5; keep multiple-digit constraints and carries within taught methods |
| Paired true/false statements | Primary Classes 1/4/5 samples | Present picture facts, fraction claims, Class 5 statement-pair families |
| Match two columns | Primary Class 1 and secondary Class 3 samples | Related matching tasks exist, but explicit multi-row matching-as-one-choice is thinner. Add original matched representations |
| Logical word sequence | S5 explicit | Missing meaning-based process/order choices; ordering people or numbers is not a substitute |

The existing bank is much broader than the plan's suspected gaps suggest. Most improvements are **routing, discoverability, outcome-specific checks and format variants**, not a wholesale replacement question bank.

## Naming and rollout risks

See `guidelines\maths-path-naming-inventory.md`: **99 files / 166 matching lines**, including **108 public HTML copy/metadata lines in 69 files**, plus visible runtime data and generator templates. This is a pre-rollout snapshot. It lists every public file/line, neutral replacements, source-note policy and redirects.

All 64 old `/learn/olympiad/` pages plus the old named-preparation URL need explicit replacement/redirect decisions. Fix generator templates and printable JS, not just generated HTML. External sources can remain as clearly labelled references with neutral text and an independence note; never imply Otterly's endorsement, official status or complete exam coverage.

## Validation and outstanding work

- Production audit ran successfully over 247,200 questions; report is outside the repository at the requested `...\files\maths-audit\question-quality.json`.
- Proposed JSON parsed and validated: seven classes, **59 chapters / 183 outcomes**, three new teaching homes, all existing source IDs/family IDs/tools/games reachable; each prerequisite refers to an earlier chapter and all chapters have 3–5 outcomes.
- No extra server was started; existing `127.0.0.1:4195` was not stopped or modified.
- No commits/push. Only the four audit-owned files were created.
- Not completed by an analysis-only task: visual PDF/diagram calibration, independent educator review, new question authoring, generator paper-policy changes, lesson implementation, redirect/naming remediation. Those are explicit next-owner work, not silently assumed fixes.
