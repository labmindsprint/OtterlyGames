# Maths Path naming inventory

Internal audit, 2026-11-10. This is a **pre-rollout snapshot**, not a claim that the concurrently rebuilt pages still contain these strings. No public files were changed by this audit.

## Scope and policy

Searched the entire repository, including hidden files, excluding `node_modules`, `.git`, `games\otterelement`, `Math-Tank`, and this audit's own reports/data. Search:

```powershell
rg --json --hidden -g '!node_modules/**' -g '!.git/**' -g '!games/otterelement/**' -g '!Math-Tank/**' '\bIMO\b|\bSOF\b|sofworld|imo[-_/]|IMO_|SOF_|Science Olympiad Foundation|International Mathematics Olympiad' .
```

Word boundaries avoid false positives such as “soft”; lower-case URL segments and `IMO_RENDERERS` were searched separately from visible copy. A second case-insensitive search checked `official`, `endorsed`, `aligned to`, `exam preparation`, `affiliated`, plus source-note acronyms such as `UIMO`.

**99 files, 166 matching lines** before remediation. Counts are matching lines, not token occurrences. A line containing a title, link and disclaimer has multiple concerns but is counted once.

| Primary classification | Lines | Files |
|---|---:|---:|
| PUBLIC-PAGE-COPY/METADATA | 108 | 69 |
| PUBLIC-JS-DATA-visible-to-users, including generator templates | 17 | 5 |
| FILENAME/URL only | 5 | 4 |
| CODE-COMMENT | 13 | 13 |
| INTERNAL-ref, including import symbols | 23 | 9 |

File counts overlap between categories. Public terminology must be **“Olympiad-style”**, not provider acronyms, even inside a negative disclaimer. A disclaimer does not make an acronym suitable for titles or SEO.

Replacement keys below:

- **A:** Replace `IMO-style` with `Olympiad-style`; headings with “Olympiad-style maths practice for Class N”. Use the same wording in title, description, Open Graph, breadcrumbs and FAQ JSON-LD.
- **B:** Replace provider-branded disclosures with: “Original Otterly Olympiad-style practice. Independently created; not affiliated with or endorsed by any competition organiser. Topic coverage and difficulty have not been independently certified.”
- **C:** Replace provider-branded reference labels with the transparent sources wording below. Keep external destination URLs intact if sources remain.
- **D:** Replace old internal link with `/learn/maths/` or the matching new class/chapter route; preserve old URLs via redirects.

## Public page copy and metadata: exact locations

Paths are repository-relative. These are exact snapshot line numbers; generated single-line reference lists can contain many separate mentions.

| File | Line(s) | Action |
|---|---|---|
| `learn\imo-preparation.html` | 6, 7, 10, 11, 20, 21, 45, 48, 49, 85, 89 | A/B; replace named-exam preparation with a Maths Path parent guide; update both structured-data blocks |
| `learn\index.html` | 142 | B; no “reference public SOF IMO syllabi” in course pitch |
| `learn\olympiad-mock-test.html` | 50, 85 | A/D |
| `learn\olympiad\index.html` | 7, 8, 11, 12, 59, 61, 62, 63 | A/B/C/D; line 62 contains all provider source links and UIMO |
| `learn\olympiad\class-1\index.html` | 7, 8, 11, 12, 81 | A/C |
| `learn\olympiad\class-2\index.html` | 7, 8, 11, 12, 81 | A/C |
| `learn\olympiad\class-3\index.html` | 7, 8, 11, 12, 81 | A/C |
| `learn\olympiad\class-4\index.html` | 7, 8, 11, 12, 81 | A/C |
| `learn\olympiad\class-5\index.html` | 7, 8, 11, 12, 81 | A/C |
| `learn\olympiad\pp1\index.html` | 81 | C; readiness, not a named exam level |
| `learn\olympiad\pp2\index.html` | 81 | C |
| `parents\index.html` | 170 | C; move research/provenance detail to a modest source note, not a certification claim |
| `tools\worksheet-builder.html` | 58, 225 | B; also update JS-generated printable wording |
| `learn\olympiad\pp1\counting.html` | 110 | C |
| `learn\olympiad\pp1\patterns.html` | 110 | C |
| `learn\olympiad\pp1\shapes.html` | 110 | C |
| `learn\olympiad\pp1\sorting.html` | 110 | C |
| `learn\olympiad\pp1\position.html` | 110 | C |
| `learn\olympiad\pp1\comparing.html` | 110 | C |
| `learn\olympiad\pp2\numbers.html` | 110 | C |
| `learn\olympiad\pp2\operations.html` | 110 | C |
| `learn\olympiad\pp2\patterns.html` | 110 | C |
| `learn\olympiad\pp2\shapes.html` | 110 | C |
| `learn\olympiad\pp2\measurement.html` | 110 | C |
| `learn\olympiad\pp2\reasoning.html` | 110 | C |
| `learn\olympiad\class-1\numbers.html` | 110 | C |
| `learn\olympiad\class-1\operations.html` | 110 | C |
| `learn\olympiad\class-1\patterns.html` | 110 | C |
| `learn\olympiad\class-1\geometry.html` | 110 | C |
| `learn\olympiad\class-1\measurement.html` | 110 | C |
| `learn\olympiad\class-1\time.html` | 110 | C |
| `learn\olympiad\class-1\money.html` | 110 | C |
| `learn\olympiad\class-1\reasoning.html` | 110 | C |
| `learn\olympiad\class-2\numbers.html` | 110 | C |
| `learn\olympiad\class-2\operations.html` | 110 | C |
| `learn\olympiad\class-2\patterns.html` | 110 | C |
| `learn\olympiad\class-2\geometry.html` | 110 | C |
| `learn\olympiad\class-2\measurement.html` | 110 | C |
| `learn\olympiad\class-2\time.html` | 110 | C |
| `learn\olympiad\class-2\money.html` | 110 | C |
| `learn\olympiad\class-2\data.html` | 110 | C |
| `learn\olympiad\class-3\numbers.html` | 110 | C |
| `learn\olympiad\class-3\operations.html` | 110 | C |
| `learn\olympiad\class-3\fractions.html` | 110 | C |
| `learn\olympiad\class-3\geometry.html` | 110 | C |
| `learn\olympiad\class-3\measurement.html` | 110 | C |
| `learn\olympiad\class-3\time.html` | 110 | C |
| `learn\olympiad\class-3\money.html` | 110 | C |
| `learn\olympiad\class-3\data.html` | 110 | C |
| `learn\olympiad\class-3\reasoning.html` | 110 | C |
| `learn\olympiad\class-4\numbers.html` | 110 | C |
| `learn\olympiad\class-4\operations.html` | 110 | C |
| `learn\olympiad\class-4\fractions.html` | 110 | C |
| `learn\olympiad\class-4\geometry.html` | 110 | C |
| `learn\olympiad\class-4\measurement.html` | 110 | C |
| `learn\olympiad\class-4\time.html` | 110 | C |
| `learn\olympiad\class-4\money.html` | 110 | C |
| `learn\olympiad\class-4\data.html` | 110 | C |
| `learn\olympiad\class-4\reasoning.html` | 110 | C |
| `learn\olympiad\class-5\numbers.html` | 110 | C |
| `learn\olympiad\class-5\operations.html` | 110 | C |
| `learn\olympiad\class-5\fractions.html` | 110 | C |
| `learn\olympiad\class-5\decimals.html` | 110 | C |
| `learn\olympiad\class-5\geometry.html` | 110 | C |
| `learn\olympiad\class-5\measurement.html` | 110 | C |
| `learn\olympiad\class-5\time.html` | 110 | C |
| `learn\olympiad\class-5\money.html` | 110 | C |
| `learn\olympiad\class-5\data.html` | 110 | C |
| `learn\olympiad\class-5\reasoning.html` | 110 | C |

## Public JS/data and generated-copy sources

Fix sources before regenerating outputs; editing generated HTML alone will reintroduce the wording.

| File:line(s) | Classification and action |
|---|---|
| `js\space-academy\app.mjs:747` | PUBLIC-JS-DATA-visible-to-users; B, grown-up report disclosure |
| `js\space-academy\curriculum-v1.mjs:134,135` | Visible reference title / external URL. C; preserve frozen gameplay compatibility and do not rewrite question data merely for cosmetic labels |
| `js\space-academy\curriculum.mjs:218,222,224` | Visible readiness/source titles and URL. C; title can be neutral while URL remains an accurate source destination |
| `js\worksheet-builder.js:342,372` | PUBLIC-JS-DATA-visible-to-users; B in printable sheets and disclosures |
| `scripts\build-space-academy.mjs:37,38` | Public reference-note template; C |
| `scripts\build-space-academy.mjs:195,197,225,226` | Generated title/description templates; A |
| `scripts\build-space-academy.mjs:238` | Generated guide link; A/D |
| `scripts\build-space-academy.mjs:240,242` | Public research and source claims; B/C; remove named-exam alignment implication |

## Filenames and URLs

| Exact location | Recommendation |
|---|---|
| `learn\imo-preparation.html` (filename); lines 8, 12, 20, 21 | Move content to the approved `/learn/maths/` parent-facing hub, or a separately chosen neutral guide URL. Old URL must resolve to one canonical destination, not a 404 |
| `_data\public-pages.json:61` | Replace listed route after the new page exists |
| `sitemap.xml:175` | List new canonical route; omit redirect-only old route |
| `scripts\check-site-growth.py:22` | Update expected canonical route; separately test old redirect |
| `blog\maths-olympiad-practice-at-home-classes-1-5.html:134` | Existing anchor text is neutral, but destination is old; D |
| `learn\olympiad-mock-test.html:50,85` | Old route plus branded anchor; A/D |
| `learn\olympiad\index.html:59` and generator line 238 | Same old route; A/D |
| `js\space-academy\bank3-class-3-imo-art.mjs` (filename) | Internal module URL, not a course title. Optional rename to `bank3-class-3-paper-art.mjs` atomically with imports; no public-page redirect needed |
| `js\space-academy\bank3-class-3-logic.mjs:6`; `bank3-class-3-puzzles.mjs:5`; `bank3-class-3-shapes.mjs:6`; `bank3-class-3.mjs:7` | Import paths for that module; update only if renamed |
| `js\space-academy\bank3-class-3-imo-art.mjs:218`; `bank3-class-3.mjs:7,147` | INTERNAL-ref symbol `IMO_RENDERERS`; optional `PAPER_RENDERERS` rename, not displayed copy |

All **64** old `/learn/olympiad/` pages (hub + seven class indexes + 56 chapters) also need their approved Maths Path equivalents. Keep exact old `.html` chapter URLs and directory indexes resolving. For renamed chapter IDs use an explicit alias map, not a guess. Redirect without dropping query strings; update canonical/OG/breadcrumb URLs and internal links. Prefer host-level permanent redirects where supported; static redirect pages need canonical and visible fallback links. Do not remove Space Academy launch URLs or change saved mission versions.

## Code comments and internal references

CODE-COMMENT hits (no page redirects; optional neutral provenance phrasing):

- `js\space-academy\bank3-class-1-text.mjs:3`
- `js\space-academy\bank3-class-2-real.mjs:1`
- `js\space-academy\bank3-class-2-real2.mjs:1`
- `js\space-academy\bank3-class-2-real3.mjs:2`
- `js\space-academy\bank3-class-3-frac.mjs:1`
- `js\space-academy\bank3-class-3-skills.mjs:1`
- `js\space-academy\bank3-class-4-real-figures.mjs:1`
- `js\space-academy\bank3-class-4-real-maths.mjs:1`
- `js\space-academy\bank3-class-4-real-reasoning.mjs:1`
- `js\space-academy\bank3-class-5-real.mjs:1`
- `js\space-academy\bank3-class-5-real3.mjs:2`
- `js\space-academy\bank3-pp1-real.mjs:1`
- `js\space-academy\bank3-pp2.mjs:4`

The PP1 comment says “taken from the official … sample papers”; that is an authorship/provenance risk even though it is not shown to children. Replace with an accurate “original tasks informed by public format review” only after confirming provenance. This audit found no evidence establishing copying and makes no legal determination.

INTERNAL-ref documents may retain accurate source names:

- `README.md:233,237,239`
- `ARCHITECTURE.md:237,242,243`
- Approved plan `guidelines\maths-learning-path.md:9,24,46,70,75,77,122,124,130,143`
- Module import/symbol references listed above.

## Other affiliation-sensitive wording

Many hits are **negative disclosures**, not endorsements. Preserve the independence meaning while removing unnecessary names and “official exam” phrasing:

- `apps\space-academy.html:152`; `play\space-academy.html:93`; `blog\maths-olympiad-practice-at-home-classes-1-5.html:105,141`.
- `learn\olympiad-mock-test.html:21,62,79,87`; `learn\imo-preparation.html:56,90,99`.
- `parents\index.html:145,157,170`; `tools\worksheet-builder.html:58,225`; `js\worksheet-builder.js:342,371,372`.
- Every old chapter's lines **110,114** and each old class index's **81,84** contain source/independence language; Class 1-5 indexes also have line **76**.
- Hub `learn\olympiad\index.html:61-64,69` includes “primary … grade reference”, “official sample”, “exam preparation”, and provider acronyms; do not promote those as curriculum certification.
- `UIMO official sample index` at hub line 62 should become “Additional independent sample source”. It is a different acronym, but still unsuitable as course branding.
- `play\space-academy.html:93` says “35 questions in Classes 1 to 5”, contradicting the production 50-question Class 5 paper. Correct in rollout; not a naming-only issue.

No positive “endorsed by” or “aligned to” claim was established in the inspected maths pages. Describing an **external** official document accurately is not the same as claiming Otterly is official; nevertheless the approved public-copy rule is stricter.

### Transparent sources note

> **Sources, not affiliation.** We reviewed independently published topic lists and sample formats to understand common primary maths skills. Otterly lessons and questions are independently created and are not endorsed by any competition organiser. These links describe external sources, not a claim of complete syllabus coverage.

Neutral link labels: “Class 2 published topic list — external source”, “Class 2 sample formats — external source”, “Junior KG readiness sample — external source”. Preserve the real `sofworld.org` or other destination in the href, not in titles, navigation or lesson claims. If the literal no-acronym rule is applied to source URLs as well as visible wording, keep the full provenance list internal rather than masking or falsifying destinations.

## Acceptance checks for the rollout owner

Search regenerated HTML, JSON-LD, print output and browser-visible strings again; do not count internal source references or external-source hrefs as copy failures. Check old redirects, absence from sitemap, canonical destinations, and source-note independence. This inventory does not perform that remediation.
