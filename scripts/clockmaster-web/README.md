# Clock Master full browser export

## Source and scope

The authoritative production checkout is the adjacent
`..\Clock Master\Clock-Master---Time-for-Junior-Olympiad-`, version **2.9.0**:
Vite 6, React 18, Motion 12 and Tailwind 4. Its installed dependencies are reused.
Its already-dirty native worktree is not a build workspace and is never edited,
cleaned, reset or committed by this exporter.

The project skill `.github\skills\ship-browser-game\SKILL.md` and its lessons
were read before implementation and applied to this export. `copilot skill list`
discovers `ship-browser-game` as a project skill. The already-running session's
skill tool did not refresh its list, so the tracked instructions were read
directly rather than treating a stale loader as a reason to recreate them.

### Production inventory

| Entry | Reachable behavior retained or deliberately adapted |
| --- | --- |
| `src\main.tsx`, `src\app\App.tsx` | Save gate before lazy-loading save-dependent modules; full Home by default; existing `?mode=race`, `clockReady` and `gameEnd` contracts |
| `HomeScreen.tsx`, `FoxyTutorial.tsx` | Nine-step tour/replay/skip, Otterly interaction, Learn/Race/Space/Shop, daily challenge, parent arithmetic gate, achievements, optional bonus panel |
| `ClockLessonScreen.tsx`, `clockPointerMath.ts` | All 11 lessons: hour/minute hands, combined time, AM/PM, 24-hour, quarters, addition/subtraction, three angle chapters; real pointer drag, keyboard/sliders, free hints, wrong retry, three-correct completion and earned coins |
| `TimeRaceScreen.tsx`, `RaceTrack.tsx` | Production random easy/medium/hard clock questions and master question bank; countdown, timer, AI, streaks, win/loss, results/details/video-bonus panel, replay, pause/resume/forfeit |
| `AstronomyScreen.tsx`, `celestial\*` | Production five-question checkpoint flights, wrong-answer retry, discovery/trivia/history, 30 celestial objects, daily discovery limit, late and completed states |
| `CustomizationScreen.tsx`, `cars\*`, `avatars\*` | 41 approved cars, original paint/colors/accessories, five avatars, previews, earned-coin unlock/equip and persistence; no invented catalog |
| `AchievementsScreen.tsx` | Scrollable collection, locked/unlocked state and spoken descriptions |
| `SettingsScreen.tsx`, `ConfigScreen.tsx` | Parent gate, sounds/music/voice levels, haptics where browser supports them, More settings, About, reset confirmation, all five configuration groups and their pages |
| `lib\storage.ts`, `GameContext.tsx` | Native save keys, progression, earned rewards, daily challenge, fuel and achievement rules remain the production implementation |
| `lib\sound.ts`, `ttsService.ts`, `website.ts` | Rebased music/assets, saved mute, browser speech, trusted parent + hidden pause, navigation cancellation |
| `lib\ads.ts`, `components\ui\AdButton.tsx` | Complete browser adapter preserving all exported types/functions; every caller inventoried below; no SDK, fake ad timer or reward |
| `lib\useOtterlyApps.ts` | Same-origin optional app catalog; no background external configuration request |

Ad exports retained: `AdType`, `RewardType`, `AdReward`, `AD_PLACEMENTS`,
`AdPlacement`, `canShowAd`, `getAdReward`, `getRemainingAdsToday`,
`getAdCooldownRemaining`, `formatAdCooldown`, `isAdMobAvailable`,
`initializeAds`, `showRewardedAd`, `loadAd`, `cleanupAds`, `useRewardedAd`,
`showBannerAd`, `hideBannerAd`, `removeBannerAd`, `BannerAdPlaceholder`.

Ad callers audited: Home daily bonus; lesson ad hint; race extra fuel, banner
and after-race bonus; shop bonus; Astronomy continue after a wrong answer.
The last caller previously bypassed the reward when AdMob was unavailable.
The browser overlay removes that bypass and offers only an honest retry.
Production free race fuel remains **3 per day**, maximum **10** daily races
under the original configurable rules; browser ad refills are unavailable.
Lessons and space journeys remain available independently of race fuel.

Native store rating prompts are suppressed for browser race wins. Settings
labels Google Play as the optional Android version. Sharing uses the browser
share API or a copyable link. Support is a deliberate external parent link, not
a payment/widget iframe. Unsupported “Zero Data”/certification badges are not
carried into the browser About modal.

## Rebuild

From the website repository:

```powershell
node .\scripts\sync-clockmaster.mjs
# Optional explicit checkout:
node .\scripts\sync-clockmaster.mjs "..\Clock Master\Clock-Master---Time-for-Junior-Olympiad-"
```

The exporter creates a unique `.clockmaster-build-*` directory **inside this
repository**, copies only source/public/build configuration and junctions the
installed `node_modules`. `prepare-clockmaster-web.mjs` only accepts this
isolated destination. Every textual overlay normalizes CRLF and checks exact
context occurrence counts. Source drift fails before website files are touched.

Vite builds the copy first. Only after success is `games\clockmaster` updated;
stale generated files are removed only within that export. The task's junction
and isolated workspace are unlinked in `finally`. Native/public art masters,
promotional feature-graphic HTML/SVG and manifest release screenshots are not
runtime requirements and are excluded. The game ships no native source tree,
credentials, development `/src` routes or added tracking scripts.

`BrowserEntry.tsx` probes read/write/remove before importing App. Later storage
operation failures block and unmount gameplay, including getter failures that
the production storage library otherwise catches and replaces with defaults.
Previously persisted data is not cleared by the gate. There is no unsaved
fallback that pretends to save.

Website-only lifecycle adaptations retain active countdown ticks, feedback
delays and race duration. Space flight accumulates active animation time and
resets timestamps across hidden gaps. Lesson intro/narration delays own a
cancellable active-time scheduler. Delayed audio resume is canceled on
navigation and uses the current screen's music.

The full launcher is `play\clock-master.html`. Shared `js\web-game.js` uses
optional per-frame metadata, retaining Math Tank's existing defaults.
The expanded site navigation collapses before its new links wrap on tablets.
No changes enable `_data\web-ads.json` or either game's ads.

## Verification commands

Initial checks used `http://127.0.0.1:4195`. That preview later stopped returning
responses. Final parallel reruns used a verified HTTP-200 preview at
`http://127.0.0.1:4196`; connection failures from the old server were not treated
as game failures or passing checks. Use a responsive local preview and pass its
origin to the commands below.
Existing Python Playwright, Chromium, Node and production dependencies were
used without installing packages.

Use an artifact directory outside the repository:

```powershell
$out = "$HOME\.copilot\session-state\30356ea4-438d-4301-8d14-3bbc0d69791c\files"
node --check .\scripts\sync-clockmaster.mjs
node --check .\scripts\prepare-clockmaster-web.mjs
node --check .\js\web-game.js
python .\scripts\check-clockmaster-full.py --url http://127.0.0.1:4195 --output "$out\clockmaster-final-full"
python .\scripts\check-clockmaster.py --url http://127.0.0.1:4195 --output "$out\clockmaster-final-legacy"
node --experimental-strip-types --test "..\Clock Master\Clock-Master---Time-for-Junior-Olympiad-\src\app\components\clockPointerMath.test.mjs"
python "..\Clock Master\Clock-Master---Time-for-Junior-Olympiad-\scripts\check_ui.py" --url http://127.0.0.1:4195/games/clockmaster/ --output "$out\clockmaster-final-production" --only '^(chapter-[0-9]+-full|race-(390|844|medium|hard|master|loss|feedback-pause)|shop-persistence|lesson-touch-sweep|home-art-motion|accepted-car-catalog)$'
copilot skill list
```

`check-clockmaster-full.py --only '<test-name-regex>'` supports focused reruns.
It bundles the production TypeScript question bank locally as a test answer
oracle using the existing esbuild dependency. The game itself still runs
unmodified production random selection. Repeated questions are allowed.

### Coverage and evidence

- Seven sizes: **1366×768, 1440×900, 1920×1080, 1280×600, 800×1000,
  390×844, 844×390**, each in the actual website iframe **and real Fullscreen
  API**. Every lesson, shop tab, settings/About/support/reset modal,
  configuration group/page, achievement collection, race and Universe screen
  has screenshot/geometry evidence.
- Full production pointer math suite and all 11 actual lesson tutorial/practice
  completions, including wrong answers, touch dragging and earned rewards.
- Real random races and wins at all four difficulties, actual replay question,
  loss, result subpanels, pause/feedback continuation and cancellation on exit.
- Wrong space answer/retry, two full earned five-question discoveries,
  **20 earned coins → Dune purchase for 15 → 5 remaining**, equip and reload;
  late (28) and complete (29) map fixtures plus an actual final discovery.
  Late/completed fixtures are explicit storage setup, not fake earned progress.
- Startup-denied storage, later read/write/remove failure, saved progress
  reload, initial/replayed tour, incorrect parent-gate answer and normal reset.
- Trusted parent message pause, rejected wrong-source message, genuine
  offscreen pause, controlled `document.hidden` lifecycle events, enabled
  native browser media playback/pause/resume, and paused lesson intro delay.
- The new checker does **not** stub network requests. It fails on console/page
  errors, HTTP errors and observed tracking requests. The legacy checker
  retains its documented exclusions for unrelated existing site third parties.
  Production lesson checks record speech at the browser API boundary; they
  do not claim acoustic TTS quality or real Android execution.
- New full-game play gesture and existing Math Tank launcher/fullscreen
  regression; legacy homepage/app demo at 320×740, 390×844 and 1280×900,
  existing completion messages, assets/manifest and enabled-audio rebasing.

Final artifacts are under the session `files` directories named above.
The interrupted final matrix retained nine passing cases in
`clockmaster-final-full`. Final reruns completed the remaining five in
`clockmaster-expedite-matrix` (5/5), the six gameplay/save/lifecycle groups in
`clockmaster-expedite-functional` (6/6), and the Math Tank launcher in
`clockmaster-expedite-launcher` (1/1): **21/21 named groups passed** overall.
`clockmaster-expedite-legacy` contains the successful three-size legacy embed
and enabled-audio regression evidence. These final reruns completed on
October 17, 2026, with the latest matrix results at 12:43 PM IST.
Representative screenshots were visually inspected, not just bounds:
`1366x768-embed-home.png`, `1366x768-embed-shop-Types.png`,
`1366x768-fullscreen-shop-Types.png`, `1366x768-embed-race-playing.png`,
`1280x600-embed-lesson-1.png`, `1280x600-embed-shop-Types.png`,
`1280x600-embed-universe.png`, `844x390-embed-race-paused.png`,
`844x390-embed-universe-question.png`. Review found a clipped short-iframe pause
action and undersized laptop car previews; both received scoped browser fixes
and rerun assertions. Race action is kept near the question with enlarged cars,
not stretched into two mostly-empty full-height lanes.

The native before/after SHA-256 inventory is kept with those session artifacts,
not committed: **415 source/configuration/public/script files matched exactly**.
The native Git status also matched the supplied dirty-worktree baseline.
Installed dependencies, Android build outputs and native `dist` were not build
destinations for this task.

## Remaining gates

This is a locally verified static export and requested local commit, **not**
a push, publication, ad-account operation or certification. Browser saves are
local-only and not backups. Native SDK behavior, physical audio/TTS quality,
non-Chromium/device-specific behavior and live production hosting still need
their own release/device checks. No absolute “no issues” claim is made.
