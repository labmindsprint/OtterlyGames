---
name: ship-browser-game
description: Bring a production Otterly mobile game to the static website, preserving real gameplay and local saves. Use for browser exports, full-game launchers, desktop/mobile layout fixes, or verifying an online game end to end.
---

# Ship a full browser game

Read [the lessons](references/lessons.md) before implementation. Use this skill
as an execution checklist, not as permission to publish or enable advertising.

## 1. Establish the real source and scope

- Inspect repository guidance, the worktree, existing sync scripts and browser
  checks. Do not overwrite another contributor's work.
- Locate the actual production source and its installed dependencies. An old
  nested checkout or a compiled demo is not the authoritative game.
- Inventory every reachable mode, tab, modal, reward, save key, asset request,
  native API, timer, audio source and advertisement/reward entry point.
- Establish whether the existing website build is a full game or a limited
  demo. Retain existing embeds and query modes unless explicitly replaced.
- Keep the source inventory and verification evidence in a task-specific
  report. Name omissions and blockers; do not claim parity based on a home page.

## 2. Adapt in isolation

- Reuse the actual React/game implementation, questions, artwork, progression
  and rules. Do not recreate an approximation or try to run an Android APK.
- Copy source/configuration into a unique temporary build directory; reuse its
  installed dependencies without changing the native project.
- Apply tracked website overlays with exact-context, occurrence-count guards.
  Fail if source drift or repeated application would produce a partial patch.
- Rebase all asset, manifest and audio URLs for the game's subdirectory.
  Exclude native originals, credentials, development-only routes and large
  unused masters. Build successfully before replacing the generated export.
- Reject source, repository-root and generated-export paths as overlay targets.
  Delete only the task's own temporary directory and explicitly scoped stale
  generated files. Never commit temporary build or screenshot directories.

## 3. Preserve honest browser behavior

- Open the full game through a deliberate Play gesture. Keep useful settings,
  help, accessible controls and an optional Android installation link.
- Probe local storage before mounting save-dependent gameplay. Show an
  explicit blocking error when saves are unavailable; do not report success
  after failed persistence. Test later read, write and removal failures as well
  as startup denial. Explain local-only saves and private-mode limits.
- Retain earned rewards, daily limits, purchases with earned coins, unlocks and
  progression. Native/rewarded ads must be genuinely unavailable, not mocked
  into free rewards. Adapt native share/review/haptics honestly.
- Verify that a new round draws from the production question generator rather
  than resetting a fixed sample sequence. A random question can repeat.
- Pause gameplay, pending callbacks, animation, audio and delayed speech when
  hidden or offscreen. Resume remaining active time, not elapsed wall time.
  Cancel callbacks when navigating away.
- Trust iframe messages only from the expected same-origin parent/frame.
  Preserve existing completion-message contracts.
- Do not add analytics or ad SDKs to the game. Reuse the site's disabled,
  separate display placement if appropriate. Account approval, a real unit,
  applicable child-directed treatment and privacy/consent readiness are
  independent gates. An operator flag is not a consent platform.

## 4. Design for attention, not just fit

- Scope browser layout changes to the website; preserve native source.
- Give grids `minmax(0, 1fr)` tracks and children zero minimum sizes where
  content could otherwise widen the viewport.
- Distinguish a desktop from short landscape by both width and height.
  Do not treat every wide laptop as a sideways phone.
- Make collectible previews and manipulable clock hands large enough to use,
  not merely their surrounding cards.
- Group the question, controls and game action within a comfortable eye line.
  Move the terrain, aim/hit anchors, effects canvas and feedback together.
- Centre the active map destination and scale to available space. Keep future
  discoveries anonymous. Test the final destination and completed state too.
- Fit embedded frames below the site navigation without fixed tall minimums.
  Reveal clipped focused controls after interaction, not between pointer-down
  and pointer-up. Inspect native dialogs inside the actual iframe.
- Honor zoom, touch/pointer input, keyboard focus and reduced motion.

## 5. Prove the outcome with the real exported build

Serve the repository using its existing local static preview. Install or restore
dependencies only after a missing-tool failure or a manifest change.

Use Playwright with fresh contexts and screenshot artifacts outside the repo:

| Surface | Required evidence |
| --- | --- |
| Viewports | 1366x768, 1440x900, 1920x1080, 1280x600, 800x1000, 390x844, 844x390 |
| Embedding | Normal website iframe and actual Fullscreen API, not just a large viewport |
| Navigation | Every reachable mode/tab, meaningful sub-screen and modal |
| Gameplay | Real correct and incorrect answers, clock drag/pointer controls when present, round completion, replay and exit |
| Progress | Earned reward, purchase/customization if present, reload persistence, initial/late/completed map states |
| Lifecycle | Offscreen/hidden pause during a countdown or shot, resume, navigation cancellation, muted and enabled audio |
| Failure | Denied storage, missing assets, console/page errors, disabled ad/reward APIs |
| Geometry | App bounds, actionable controls, preview/art size and action-to-question alignment |
| Visual review | Inspect representative laptop and short-window screenshots; geometry alone is insufficient |
| Compatibility | Existing homepage/app demos and their message/pause behavior |

Use semantic locators and observable production states. Do not force clicks,
remove failing assertions, accept tracking by stubbing it silently, assume
random questions must differ, or click controls behind an open modal.

Run the framework's existing build/type/lint checks and focused runtime checks.
If a check fails, fix the real issue or explain a verified test-specific cause;
then rerun the affected checks. Update this skill when a reusable omission is
found.

## 6. Finish and keep evidence

- Document source/entry points, exact regenerate/verification commands,
  screens exercised, screenshots inspected, exclusions and remaining gates.
- Confirm generated files are persistent and the native source is unchanged
  by this task. Report local completion separately from live publication.
- Commit only when requested. A commit is not approval to push, publish,
  submit ad-account forms, accept terms or spend money.

Repository examples:

- `scripts\sync-mathtank.mjs`, `scripts\prepare-mathtank-web.mjs`
- `scripts\mathtank-web\README.md`
- `scripts\check-mathtank-layout.py`, `scripts\check-mathtank-universe.py`
- `scripts\sync-clockmaster.mjs`, `scripts\check-clockmaster.py`
- `scripts\clockmaster-web\README.md`, `scripts\check-clockmaster-full.py`
