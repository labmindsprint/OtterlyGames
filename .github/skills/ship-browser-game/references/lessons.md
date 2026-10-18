# Lessons from shipping Math Tank in the browser

## Reuse beats recreation

The production React game can run from a static export with local saves. An
APK is not a browser application. A limited advertising playable is also not
the full game: check every actual mode, tab and progression surface.

An isolated source copy plus guarded overlays keeps browser fixes out of
Android releases. A successful export must precede replacing website assets.
Guard URL rewrites and component transforms against source drift.

## Save failures must be visible

Storage can be denied or become unavailable. Test a real denied-storage browser
context, not only a successful save/reload. Do not offer unsaved gameplay while
implying progress is safe. Browser-local progress does not sync to Android or
other devices and is not a backup.

Unavailable advertisements cannot grant coins, energy or hints. Preserve real
daily limits and offer other playable modes rather than manufacturing rewards.

## Pausing is a gameplay requirement

Stopping sound does not stop countdowns, enemy turns, charge rounds or delayed
rewards. Freeze remaining active time, clean up on unmount and test pausing in
the middle of a shot/countdown. Delayed speech must not restart after mute or
navigation. Verify enabled audio as well as muted screenshots.

## Bounds are necessary, not sufficient

- Hidden overflow can mask a grid widened far beyond the screen. Check app
  bounds as well as document scroll width.
- A clock can fit the viewport while spilling out of its card. Check the
  parent's padded content box and interact with widgets below the first screen.
- A large preview card can still contain tiny artwork. Measure and inspect the
  rendered art or its sizing wrapper.
- Setting only a canvas's CSS size does not necessarily resize the artwork;
  its component may size the canvas from a parent.
- Wide laptops must not inherit phone-landscape layouts. Include a height cap.
- A layout can pass every fit check and still be poor: tanks at the bottom
  remain difficult to follow while the child answers a question at the top.
  Put action near the question and move terrain/effects with it.
- A sparse map should not look incomplete. Centre and enlarge the active world,
  add restrained depth and anonymous signals, and retain discovery rules.
- Check late/completed maps. Entrance transforms can temporarily shorten the
  scrollable extent and clamp a scroll-to-centre request. Wait for sufficient
  scroll extent, cancel pending work on navigation, and verify the final world.

## A small canvas is not a touch game

Resizing artwork does not replace keyboard-only movement or abilities. Use real
pointer controls that call the game's own actions, not synthetic keyboard-event
shims. Exercise simultaneous movement and actions, cancellation, release outside
the button, replay, upgrades and every limited-use or locked ability.

Preserve physics in the original world coordinates. A responsive camera can
enlarge sprites without stretching the scene; map input through the same camera
and device-pixel ratio. Keep essential status outside cropped world-space HUDs.
Check short landscape as well as portrait, including controls over scene edges.

Clear held input when pausing, but guard pause toggles with `event.repeat`, not
just a pressed-key map: clearing that map also removes its repeat lock. Test a
held pause key across resume, plus Help focus and scrolling in short landscape.

When dragging redraws SVG children, capture Pointer Events on a stable wrapper.
A touch sequence stays attached to its original target; replacing that target
can prevent document-level touch-move listeners from receiving later events.
Verify real mouse and touch drags after the redraw, not just the initial tap.

Save-driven board redraws must restore the logical focused control and scroll,
including the inner scroll container in fullscreen. Do not move focus back to
the page heading after every placement, step or resource change.

Inline SVG artwork can have its own accessible `title`. Static-page metadata
checks must inspect the document head, not count SVG titles as duplicate page
titles or remove useful artwork descriptions to make a build pass.

Headless automation can keep every tab artificially visible and focused. Inspect
the actual document state and events before claiming real tab-switch coverage.
Explicitly injected lifecycle signals are event-level checks; label them as such
and still prove that game state, active-time clocks and held inputs really stop.

## Embedded pages are a distinct layout

Real fullscreen tests do not cover a normal iframe below a fixed website nav.
Native dialogs may be centred in the iframe but outside the visible page.
Browser focus scrolling can expose one button while clipping the rest.

Do not fix that by force-clicking or removing the test. Reveal the frame after
click/key completion; moving it during pointer-down can cancel the intended
click. Fit its height to available space instead of imposing a tall minimum.

Short phone-landscape embeds can be shorter than fullscreen. Keep minimum
usable tap targets and compact the surrounding chrome/spacing, question and
answer layout. Inspect screenshots of these cases.

Scope sticky-header offsets to real anchor targets, not every element with an
ID: iframe scroll margins can clip otherwise usable native dialogs. Generated
skip-link targets must be outside `noscript` and `template` content. Exercise
the link in the rendered page, not just a source-token check.

Observe the actual preview player, not its long explanatory section. Pause
hidden games and resume the correct active game after switching tabs. Centre
the player after switching rather than scrolling a tall heading to the top
and leaving dialog actions below the viewport.

## Tests must follow real interactions

Wait for the destination screen, not a preview label also present on Home.
Close native dialogs before using underlying navigation. Complete the actual
result flow before expecting Home. Randomly generated questions can repeat;
assert streak/progress or question-bank coverage instead of inequality.

Check welcome-screen geometry before the Play gesture, not only the mounted
game. Contain overflowing decorative artwork locally rather than hiding
overflow on the entire app or page.

Scope shared-navigation assertions to its labelled landmark or `nav.nav`.
Legitimate breadcrumbs can repeat the same learning-hub link.

Write screenshots and metrics incrementally, including failed screens, outside
the repository. Add a focused regression for each real failure. Do not hide
unexplained console/asset errors behind broad exception filters.

## Advertising and publishing have separate gates

An inactive AdSense account, completed onboarding, site review, approved site,
real display unit and privacy/consent readiness are different states. Never
infer approval from "getting your site ready." Do not create a duplicate
account or silently enable ads.

Display ads belong outside children's game controls unless a separate approved
game-ad integration is implemented. Unsupported privacy/certification claims
must be corrected before relying on them in a review.

A local commit is not a push. A pushed default branch may publish the site.
Keep these permissions explicit.

Audit the outer website too: a disabled game placement does not disable legacy
analytics, advertising, donation overlays or community SDKs on the host page.
Static ownership-verification metadata is separate from an ad-serving script.
Do not restore tracking just to keep an account-verification marker.

Make the full browser game the primary route, not a phone-sized preview or an
Android upsell. Explain local saves consistently on every entry point. Shared
navigation must work with a keyboard, Escape and no JavaScript; an iframe's
correct geometry does not establish the accessibility of its surrounding page.
Use website-sized artwork and self-host licensed fonts where appropriate;
reusing a megabyte source illustration as a tiny logo can dominate page loading.

## Clock Master follow-up

- Audit every native-ad caller, not only the ads service. A caller may bypass
  the service when the SDK is unavailable and still advance a wrong answer.
  An unavailable reward must never continue a journey or mint fuel.
- Probe storage before the game module initializes, and block on later reads,
  writes and removals too. Getter catch/default paths can otherwise silently
  overwrite a valid save after a transient storage failure.
- Animation pausing needs an active-time accumulator. Canceling frames alone
  is insufficient if resuming uses the original wall-clock timestamp.
- An iframe can remain partly visible at both ends of a short landing page.
  Prove that an offscreen test actually moves its rectangle out of view; do
  not assume `scrollTo(0, 0)` did so.
- Test against compiled exports. A development-server checker that imports
  `/src/...` for answer data needs a separate local production-source oracle
  on a static host. Never ship development routes to satisfy that checker.
- Measure frame rate for animated scenes, not just layout. Animating
  `background-position` on a layer of many radial-gradient stars repainted the
  whole flight scene (about 10 fps in headless Chromium, which also overshot a
  timing assertion); the same drift on a wide `::before`/`::after` using
  `transform: translate3d` ran at 60 fps. Keep large `box-shadow`, `filter:
  blur` and shadow keyframes off moving scenes (use gradients and an
  opacity-pulsed pseudo-element). Compare variants one at a time with a
  requestAnimationFrame probe, add CDP CPU throttling to approximate a phone, and
  confirm the animation is still mid-run when sampling.
- A native store-review prompt is not appropriate for browser play. Keep
  optional installation links explicitly labelled and do not embed donation
  or payment widgets in the game.
- Native CRLF source copies should be normalized before exact-context
  overlays, with occurrence counts still enforced. Fail before replacing an
  export when any context drifts.
- Adding another game to the site navigation changes its intrinsic width.
  Recheck tablet landscape chrome too; collapse the navigation before labels
  wrap outside a fixed-height header.
- A disabled primary action is a dead end unless the screen names the one
  blocker. Tie the button to a visible "Next:" line with `aria-describedby`
  that names the missing item, and promote the button that resolves it. Prove
  every locked state (nothing earned, earned but not fitted, finished) at
  laptop, phone and short-landscape sizes.
- Open long scrolling collections, such as a world map, on the learner's
  current section by scrolling only the inner scroller after render, and keep
  that section when returning from a detail view. Never call `scrollIntoView`
  on the window.
- A "Correct" badge placed inline beside a short unbreakable answer, such as an
  eight-digit number, splits the digits across lines. Stamp it on the tile
  corner instead and test the longest realistic answer at 390px.
- Celebration screens need a height-based variant. Scale the art from the
  viewport height and use a two-column layout on short landscape so the title,
  name and primary action stay on screen; check 1280x600 and 844x390.
- Do not reorder a stacked layout in response to the player's own move (a
  solved puzzle lifting its next-step panel above the board). Decide the order
  when the screen opens and keep it through live interaction; otherwise the
  board shifts under their hands, or a scroll-retention check fails because any
  compensating scroll changes the offset it protects. Test both the arrival
  state and the moment of the move.
