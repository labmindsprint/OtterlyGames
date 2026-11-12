# Otterly Maths Path: PP1 to Class 5

Status: approach approved on 2026-11-10. Nothing here is built yet.

Decisions:

1. The five-step chapter model is approved. Every chapter links to the relevant game: Clock Master, Math Tank or Space Academy.
2. The new chapter pages replace the current `learn\olympiad\...` pages.
3. Public wording is "Olympiad-style". The site must not use "IMO" or "SOF", because Otterly Games is not affiliated with either. Section 3 is an internal planning reference only.

## 1. Problem

The site has many maths assets, but nothing connects them into a course. A parent or child cannot start at a level and see what to learn first, what comes next and when they are ready to move on.

What exists today:

| Asset | What it does | Gap |
| --- | --- | --- |
| Space Academy question bank | 7 grades, 56 chapters, 3 levels (Explore, Reason, Stretch), diagram-rich questions | Practice only. It does not teach. |
| `learn\olympiad\<grade>\<chapter>` pages | 3 sample questions, a parent idea, a common slip and a home activity | One page per chapter, with no lesson sequence or "next" link. |
| Worksheet builder | Printable sheets and answer keys for every grade and chapter, plus 35/50-question papers for Classes 1-5 | Not linked from a lesson. A parent has to find it. |
| Tools | Hour hand, minute hand, AM/PM, clock lessons, times table, long division, column multiplication, practice drills | Cover time and multiplication/division only. |
| Games | Clock Master (time), Math Tank (x and ÷), Space Academy (all grades) | Reinforcement, not instruction. |
| Learn hub, IMO preparation, mock test | Advice and entry points | Describe the syllabus in prose. They do not teach it. |

The result is the experience you described: good pieces, no path.

## 2. Principle

One course per class. Each chapter follows the same five steps, and each step reuses what already exists:

| Step | Purpose | Built from |
| --- | --- | --- |
| 1. See it | A short visual lesson of 2-4 screens. One idea, one picture, one worked example. | New. Uses shared interactive components (section 5). |
| 2. Try it | The child manipulates the idea: drag blocks, move hands, split a bar. No scoring. | New components plus existing tools. |
| 3. Practise | Questions at Explore, Reason and Stretch, with hints and feedback | Existing Space Academy question families. |
| 4. Print it | A worksheet and answer key for the same chapter and level | Existing worksheet builder, with the chapter preselected. |
| 5. Check it | A 5-question mastery check. Passing unlocks the next chapter's "See it". | Existing questions, with a simple local pass rule. |

At the end of each class, an Olympiad-style practice paper (existing) acts as the exit test.

Every chapter also has a "Play it" link in step 2 or 3, chosen from the game map in section 6. A game is only linked where it really practises that chapter's skill.

Rules that follow from the decisions and the current README:

- Use "Olympiad-style" for the course and papers. Never use "IMO" or "SOF", and never say "official", "endorsed", "aligned to" a named exam or "exam preparation" on public pages.
- Progress stays local to the browser. No accounts, analytics or ads inside lessons.
- Questions and diagrams are original. Nothing copied from past papers.

## 3. Syllabus anchor (internal only)

This section is a planning reference for choosing chapters. Do not copy its provider names or wording onto the site. Public pages describe topics in Otterly's own words.

Olympiad-style papers of this kind commonly have four sections: Logical Reasoning, Mathematical Reasoning, Everyday Mathematics (applications of section 2) and Achievers (higher-order questions on section 2). Classes 1-4 have 35 questions; Class 5 has 50. Level 1 draws 60% from the current class and 40% from the previous one.

Topics by class, from public syllabus summaries. Verify them against the provider's published syllabus during the audit (step 0 below):

| Class | Logical Reasoning | Mathematical Reasoning |
| --- | --- | --- |
| 1 | Patterns, odd one out, measuring units, shapes, spatial understanding, grouping, analogy, ranking | Numerals and names, 2-digit numbers, addition and subtraction, length/weight/comparison, time, money, shapes and solids |
| 2 | Adds embedded figures and coding-decoding | 3-digit numbers, add/subtract, simple multiplication, capacity and temperature, lines and solids, pictographs |
| 3 | Adds direction sense | Place and face value, all four operations, fractions, shapes, pictographs, patterns |
| 4 | Adds series completion | 6-7 digit numbers, factors and multiples, fractions, decimals, perimeter and area, data handling |
| 5 | Adds mirror and water images, alphabet test, puzzle test, clock and calendar | 7-8 digit numbers, fractions and decimals, conversions, angles, perimeter and area, symmetry, data handling |

## 4. Course map and what is already covered

Each chapter below already has a question bank, a chapter page and a printable worksheet, so only the lesson steps are missing. "Interactive today" lists the existing tool or game that already teaches part of it.

| Class | Chapters (existing IDs) | Interactive today | Gaps against SOF topics |
| --- | --- | --- | --- |
| PP1 | counting, patterns, shapes, sorting, position, comparing | None | None for readiness. Needs a gentler step 1. |
| PP2 | numbers, operations, patterns, shapes, measurement, reasoning | None | None for readiness. |
| 1 | numbers, operations, patterns, geometry, measurement, time, money, reasoning | Hour hand, minute hand, AM/PM, Clock Master | Check numeral names and 2-digit number sense are explicit. |
| 2 | numbers, operations, patterns, geometry, measurement, time, money, data | Clock lessons, times table, Math Tank | No `reasoning` chapter, but SOF Class 2 includes embedded figures and coding-decoding. Temperature and capacity need a home in measurement. |
| 3 | numbers, operations, fractions, geometry, measurement, time, money, data, reasoning | Times table, division practice, long division, column multiplication, Math Tank | No `patterns` chapter, and direction sense and pictographs need confirming. |
| 4 | numbers, operations, fractions, geometry, measurement, time, money, data, reasoning | Long division, column multiplication | No `decimals` chapter although SOF Class 4 lists decimals. Factors and multiples sit inside operations or numbers. Confirm. |
| 5 | numbers, operations, fractions, decimals, geometry, measurement, time, money, data, reasoning | Calculator | Confirm angles, symmetry, mirror/water images, conversions and factors/HCF/LCM are each reachable. |

The "confirm" items are the chapter audit in step 0. They are likely a handful of new chapters, not a rebuild.

## 5. Interactive components to build once

Most lessons need only a few manipulatives. Building them as reusable components keeps cost down and keeps the look consistent. Each should work by touch and keyboard and honour reduced motion.

| Component | Used for |
| --- | --- |
| Counting mat and ten frame | PP1-Class 1 counting, comparing, add/subtract |
| Number line (hop, skip-count, fractions, decimals) | PP2-Class 5 |
| Place-value blocks and abacus | Classes 1-5 numbers |
| Bar model (part-part-whole, comparison) | Operations and word problems |
| Equal groups and array builder | Multiplication, division, area |
| Fraction bars and circles | Classes 3-5 |
| Coin and note tray | Money, Classes 1-5 |
| Clock (already built) | Time |
| Grid and shape workbench (draw, fold, reflect, measure) | Geometry, symmetry, perimeter, area |
| Chart builder (pictograph, bar chart, tally) | Data |
| Logic board (grouping, ranking, coding key) | Reasoning chapters |

Game links by chapter (initial map, to confirm in the audit):

| Game | Link from these chapters |
| --- | --- |
| Clock Master | Class 1-3 time, and the clock parts of Class 4-5 time |
| Math Tank | Class 2-4 operations (multiplication and division facts) |
| Space Academy | Every class and chapter, at the matching level. It is the general practice game. |

Chapters with no matching game (for example fractions, decimals, data, geometry) link to Space Academy only, and are the strongest candidates for a future game.

Real-art note: lessons that need illustrations must use raster art, not vector drawings or script-drawn images. The manipulatives above are interface elements, not artwork.

## 6. Site structure

Add one learning path rather than more standalone pages:

```
/learn/maths/                      path home: pick a class, see all chapters and your progress
/learn/maths/<class>/              class map: chapters in order, status, class paper
/learn/maths/<class>/<chapter>/    chapter with See, Try, Practise, Print and Check
```

- A single data file, for example `_data\maths-path.json`, lists classes, chapters, order, SOF topic, prerequisites, linked tools, linked games and worksheet settings. Pages and the hub are generated from it, as the games catalogue is today.
- The new chapter pages replace the existing `learn\olympiad\...` pages. Each old URL redirects to its new chapter page, so existing links and search results keep working. The Space Academy game, question bank and worksheet builder stay and are linked from the chapters.
- Public naming clean-up is part of the work. A search finds "IMO" or "SOF" in about 105 files. Most are Space Academy code comments and art, but public pages include `learn\imo-preparation.html`, the `learn\olympiad` index and class pages, and the Space Academy page copy and metadata. The audit lists exactly which are public, and the roll-out renames them (for example `learn\imo-preparation.html` becomes an Olympiad-style preparation page, with a redirect). The README source-review notes may keep provider names as internal references.
- Tools and games stay where they are and are linked from the chapters they support.
- Progress uses the browser's local storage with the same visible failure handling the games use.

## 7. Phasing

0. **Syllabus and sequence audit (about a week).** Check the topics in section 3 against the provider's published syllabus. Confirm the gaps in section 4. List every public "IMO" or "SOF" mention. Fix the chapter order, prerequisites and game links for all 7 classes. Output: `_data\maths-path.json` and a hub page that shows the full map, with chapters marked "lesson coming" where nothing has been built.
1. **Pilot: Class 1 end to end (8 chapters).** Class 1 uses most manipulatives (ten frame, number line, place value, coins, clock, shapes), so it proves the components and the lesson template. Success test: a parent can start at Class 1 chapter 1 and finish the class with no dead ends, using only links on the page.
2. **Shared components.** Harden the section 5 components from the pilot, with tests and screenshot checks like the existing game checkers.
3. **Roll out downward then upward.** PP1-PP2, then Class 2-3, then Class 4-5. Lessons are short and templated, so each class is a content job.
4. **Class papers and review.** Link each class's Olympiad-style paper as the exit test. Get an independent educator to review difficulty and sequence. The README already names this as outstanding.

## 8. Scope and effort

About 56 existing chapters, plus perhaps 4-8 new ones after the audit. At 3-4 lesson screens each, this is roughly 200-250 short lessons. That is large but bounded: reuse of the question bank, worksheets and components is what makes it practical. The pilot should give a real per-chapter cost before committing to the full roll-out.

## 9. Open items

1. Approve Class 1 as the pilot (assumed in the phasing above).
2. Approve the public naming clean-up, including renaming `learn\imo-preparation.html` with a redirect.
