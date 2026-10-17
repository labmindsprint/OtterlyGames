# Otterly Games 🦦

**Otterly Smart. Learning Through Play.**

The brand website for Otterly Games — educational mobile games built by a mom for kids aged 4-9.

## Live Site

Deploy to GitHub Pages from this repository for free hosting.

## Site Structure

```
index.html              — Landing page
apps/
  clock-master.html     — Clock Master app page
  math-tank.html        — Math Tank app page
tools/
  index.html            — Free tools hub
  multiplication-table  — Interactive 12×12 times table
  math-quiz             — 30-second timed math quiz
  spelling-bee          — Listen & spell practice
  calculator            — Kid-friendly calculator
blog/
  index.html            — Blog listing
  3 starter posts       — Origin story, math tips, screen time guide
about.html              — Mom's story & values
privacy.html            — Privacy policy
404.html                — Fun otter 404 page
css/style.css           — Single stylesheet
js/main.js              — Interactive tools & navigation
sitemap.xml             — SEO sitemap
robots.txt              — SEO robots
```

## Tech Stack

- Pure HTML5 + CSS3 + Vanilla JavaScript
- No frameworks, no build tools, no dependencies
- Google Fonts (Nunito + Inter)
- SVG otter mascot illustrations
- Ko-fi donation widget

## Hosting

Designed for **GitHub Pages** (free):

1. Push this repo to GitHub
2. Settings → Pages → Source: Deploy from branch → `main` → `/ (root)`
3. Your site is live at `https://username.github.io/repo-name/`
4. (Optional) Add custom domain `otterlygames.com` for ~$12/year

## Our Games

- **Clock Master** — Learn to tell time through racing games & space exploration
- **Math Tank** — Master multiplication & division through tank battles

Both safe. Both built with love. No in-app purchases. 🦦

## Full Math Tank browser game

`/play/math-tank.html` is the website entry point. `/games/mathtank/` runs the
production game home and its modes with browser-local saves; `?mode=battle` retains
the existing short battle embeds. No application server, account, or database
service is required. Clearing browser site data removes saved progress.

To regenerate the static game, use an adjacent Math Tank source checkout with
its existing dependencies installed:

```powershell
node .\scripts\sync-mathtank.mjs "..\Math Tank"
```

The export runs in a temporary workspace. Website-only overlays in
`scripts\mathtank-web` do not modify the Android source. Commit the resulting
`games\mathtank` files along with the website changes when publishing.

For a local browser check, serve the repository with
`python -m http.server 4195 --bind 127.0.0.1`, then run
`python .\scripts\check-mathtank-universe.py`. The existing demo regression check
is `python .\scripts\check-mathtank.py --url http://127.0.0.1:4195 --output <folder>`.
The browser checks use Python Playwright.

For screenshots and geometry checks of every game screen at laptop, tablet,
phone, and short-landscape sizes, run
`python .\scripts\check-mathtank-layout.py --verify --output <folder>`.
Add `--embedded --width 1366 --height 768` to check the normal website frame
instead of actual iframe fullscreen. Screenshots and `metrics.json` go to the
chosen folder; keep those artifacts outside the repository.

### Website advertising

The new game frame has no analytics or advertising SDK. Its landing page has
a separate, labelled display-ad placement, disabled by default in
`_data\web-ads.json`. Before enabling it, supply a real AdSense display unit ID
as `mathTankSlot`, complete the applicable publisher approval and privacy/consent
configuration (including any required Google-certified consent platform), and
set `privacySetupVerified` and `enabled` to `true`. The verification flag is an
operator gate, not a consent-management implementation.

Requests from that placement use child-directed treatment and non-personalized
ads. Ad blocking or lack of fill must not prevent gameplay. Native AdMob and
simulated rewarded ads are not used by the browser export. In-game rewarded
formats require a separately approved games-ad integration; this change does not
enable them or start a paid campaign.
