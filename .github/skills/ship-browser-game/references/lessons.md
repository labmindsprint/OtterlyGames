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

## Tests must follow real interactions

Wait for the destination screen, not a preview label also present on Home.
Close native dialogs before using underlying navigation. Complete the actual
result flow before expecting Home. Randomly generated questions can repeat;
assert streak/progress or question-bank coverage instead of inequality.

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
- A native store-review prompt is not appropriate for browser play. Keep
  optional installation links explicitly labelled and do not embed donation
  or payment widgets in the game.
- Native CRLF source copies should be normalized before exact-context
  overlays, with occurrence counts still enforced. Fail before replacing an
  export when any context drifts.
- Adding another game to the site navigation changes its intrinsic width.
  Recheck tablet landscape chrome too; collapse the navigation before labels
  wrap outside a fixed-height header.
