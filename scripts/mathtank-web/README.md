# Website-only Math Tank overlay

Call `prepareMathtankWeb(workspace)` from `scripts/prepare-mathtank-web.mjs` **once** after copying production `src` and `tailwind.config.js` into an isolated workspace, before running Next's export build. The helper refuses the production source, nested native source, and generated game export. Source-context changes or repeat application throw instead of silently applying a partial transform. No production files are edited.

- Export with `NEXT_PUBLIC_BASE_PATH=/games/mathtank`. Default entry is the full production home and tabs; `?mode=universe` starts at Universe and `?mode=battle` retains the original `WebsiteDemo` and its pause behavior.
- Ship the source globals and the added website stylesheet. No external fonts, audio preload, advertising script, analytics, native AdMob, or simulated rewarded ads are added.
- Production `GameProvider`, `ToastProvider`, `AppContent`, screen implementations, universe data, save keys, 90 levels / 30 worlds, daily limits and rewards remain authoritative. Storage must be readable and writable before the provider mounts, and `isDataLoaded` must resolve before `AppContent` mounts. Browser save failures produce an actionable alert, not an unsaved-success mode.
- The initial action is named **Play Math Tank** (or **Play Universe** with the focused query). The wrapper's Game home / take a break button unmounts the full app and returns to the gesture screen without resetting completed progress. Music initialization happens only after Play; mute settings persist through the production provider. Native splash/onboarding do not run.
- Settings retain the production parent check, age, audio, progress report, privacy, share/review and reset controls. The native haptic preference is removed; the donation iframe becomes a website support link, and the mobile catalogue uses its existing local cache/fallback without fetching. Reset includes the actual universe save/hint keys as well as the production Math Tank keys, never unrelated site data.
- The home ad CTA becomes an explicit unavailable notice; result-screen rewarded CTAs are hidden and zero-energy setup explains free daily refill and other playable modes. The ad service never rewards or displays anything. No daily fuel limit is bypassed.

## Embedding and pause

Use a same-origin iframe. The universe sends `{type: 'mathReady'}` to `window.parent` and waits for the parent to send `{type: 'resumeAudio'}` or `{type: 'pauseAudio'}`. Parent messages must have the same origin and `event.source === window.parent`. Send a status immediately on `mathReady`, and whenever intersection or document visibility changes. Offscreen iframe intersection also independently pauses.

The website `useAppVisibility` overlay combines the host state, iframe intersection and `document.hidden`. Production celestial animation and `BattleEffects` reuse that hook. The real Battle screen receives its existing `externallyPaused` prop. Gameplay's scheduled callbacks, lessons/practice timers and intro narration freeze their **remaining** delay until visible; component-scoped timer cleanup prevents callbacks after navigation. Charge rounds measure active visible time instead of wall time. Daily-reset logic remains based on actual dates. Audio and TTS stop when paused and honor the saved mute state on resume. A narrow TTS transform also prevents delayed browser speech from restarting after pause, mute, or navigation.

## Browser test hooks and navigation

- `[data-testid="website-game"][data-web-paused="true"]` indicates paused/prestart; `"false"` indicates active play.
- `[data-testid="math-tank-app"][data-screen]` exposes production screen state: `home`, `fightSetup`, `fight`, `saveUniverse`, `lessons`, `practice`, `garage`, `achievements`, `settings`, `progress`, `missileUX`.
- Home buttons have exact accessible labels **Battle**, **Universe**, **Learn**, **Garage**. Achievements uses the source's **Achievements** prefix plus optional unclaimed-reward count. **Settings** opens the production **Parent Check** dialog; fill the input labelled by `#home-parent-answer` with the displayed addition answer and choose **Check**. Settings contains **Progress Report**.
- **Back to Home** labels the setup/garage/achievements/progress return buttons; Settings uses **Go to home**, Lessons uses **Back**, Universe uses **Return home**. Practice uses **Back to Lessons** / **Back to practice selection**. The wrapper's **Game home / take a break** always returns to prestart, not the app home.
- Existing universe/battle/garage/lesson source hooks are retained. Storage failures use an actionable `role="alert"` and prevent app mounting.

## Required exported public assets

All requests below use production `assetPath`, prefixed by `/games/mathtank`:

- `/universe-preview/atlas.json`
- `/universe-preview/*.png` posters, excluding `*-atlas.png`
- `/universe-preview/*-atlas.webp`
- `/art-preview/scout/`, `/art-preview/tanks/`, `/art-preview/decals/`
- `/art-preview/icons/` (PNG game illustrations and test-range target)
- `/images/otter-mascot.png` (Settings/About; exporting the whole images directory is also safe)
- `/sounds/battle/` including missile sounds (exclude its `Original/` masters)
- `/audio/Math Tank Universe.mp3`
- `/audio/Math Tank Home.mp3`
- `/audio/Math Tank Battle.mp3`
- Standard exported `index.html`, `index.txt`, `404.html`, and `/_next/`.

The helper narrowly fixes celestial URLs, all three `sound.ts` audio constructors, GameIllustration, HomeIcons, garage sticker previews, Settings images and the missile test-range SVG image. Production battle audio and tank artwork already use `assetPath`. No other public assets are requested by the reachable runtime; `universeData.image` legacy paths are not rendered by the production celestial component.

## Validation

The `*.web.css` files append scoped desktop rules to the copied CSS modules.
Desktop artwork sizes, side-by-side gameplay and garage workbenches apply only
inside `.web-game`; the legacy demo keeps its existing layout. Phone-landscape
utilities and compact JavaScript layouts are limited to viewports at most 550px
high, rather than treating every wide laptop as a sideways phone. The website
grid uses a zero-minimum column so equipment carousels cannot widen the app.

The website map centres the selected rescue, scales its artwork to available
space, and shows anonymous signals rather than revealing undiscovered worlds.
Nebula motion stops when paused or reduced motion is requested. Desktop combat
raises the tanks towards the question's eye line; the Battle effects canvas
shares the raised stage height so missed shots still land within that stage.

`node --test scripts\mathtank-web\runtime.test.mjs` uses the existing sibling Math Tank TypeScript dependency. It covers frozen/resumed gameplay delays, untrusted message rejection, iframe clipping, cancellation, unavailable reward APIs, one-shot source transforms and delayed speech cancellation. The parent integration owns Next export, source test hooks, persistent-save E2E, asset request checks and browser layout/zoom checks.

Storage probes detect access/quota failures before play and every five seconds / foreground change. They cannot promise survival of browser eviction, private-session termination, later permission revocation or a full disk between probes; the start screen explicitly explains local-only storage. No backend or cross-device synchronization is provided.
