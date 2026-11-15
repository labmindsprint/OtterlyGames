# Otter Element website preview

`games/otterelement/` is a browser preview of the current Otter Element game, limited to the first two nodes (Hydrogen 1 and Helium 2).
It is a standalone, pinned trailer built from the game's own source. It does not need to stay in step with later Android changes.

## How it is built

`node scripts/sync-otterelement.mjs [path-to-Otter-Element]` (the game checkout defaults to `../Otter Element`, and its dependencies must be installed):

1. Copies the game's `src`, `public` and root build files into an isolated workspace. Environment files, tests, the developer pages, the game's privacy page and all Siege and tower-defence art are left behind. The game's working tree is only read.
2. `prepare-otterelement-web.mjs` patches that copy in memory with exact-match replacements. A replacement that no longer matches throws, so a game change that moves the code fails the sync instead of shipping unreviewed.
3. `otterelement-web/src/**` is copied over the workspace: a few whole-file stubs (Siege, shop, developer settings, ultimate sheet, network and settlement hosts) and the preview-only files.
4. The workspace is type-checked and built with the website-owned `otterelement-web/vite.config.mjs`, with every `VITE_*` variable removed. The native release configuration and Android-only release hooks are not copied; the website's exclusion checks and provenance below remain enforced.
5. The build is refused if it contains a left-out folder or a reference to the live service, ads or Play billing.
6. The result is exported to `games/otterelement/` with a `version.json` that records the game commit, whether it had uncommitted changes, a fingerprint of the exact source files, and a hash of this overlay.

Publishing is the website's normal path: commit `games/otterelement/` and push to `main`. GitHub Pages serves it.

## Preview-only files

| File | What it does |
| --- | --- |
| `previewEnv.ts` | The node cap, isolated storage, the "Full game" pill and the page-visibility pause message. |
| `previewCap.ts` | Clamps any save to the node cap: start, reload, import and an older preview save all end at node 2. |
| `components/PreviewEnd.tsx` | The "Helium found" screen with the full-game link, and a "Keep playing the preview" button. |
| `components/PreviewReset.tsx` | "Reset this preview" in Settings. It erases only this preview's data. |
| `components/shop/ShopSheet.tsx` | A shop with the free items and the potions only. No purchase flow. |
| Other stubs | Siege, event chip, event tab, developer settings, ultimate sheet, recipe shop and the network and settlement hosts are empty. A stub keeps any stylesheet import that other screens still use (`SiegeBadge.tsx` keeps the home layout, `PreviewReset.tsx` keeps the privacy-settings rules the save notices share). |

## What the preview does not have

No Siege, purchases, ads, profile, cloud sync, leaderboards, remote service calls or analytics. Progress is kept in this browser only
(IndexedDB `otter-element-web-preview` and `oe-web-preview:` local storage keys). Nothing from the Android app's storage is read.
The entry page also carries a Content-Security-Policy meta tag (`script-src 'self'`, `connect-src 'self' blob: data:`), because
Cloudflare adds its Web Analytics script to the HTML pages this site serves; the policy stops that script from loading in the game.

## Staying in step with the game

Rebuild only when intentionally updating the trailer. Ordinary website checks validate the committed trailer, not its freshness against an adjacent game checkout. `version.json` records its provenance; an older source revision is not a failure.
Before a deliberate rebuild, opt into the source-compatibility check below. If a patch no longer matches, update `prepare-otterelement-web.mjs` for the selected source. Exact-match guards still protect an intentional rebuild from a partial patch.
The host visibility bridge publishes through `native/appState.ts`, so the cached foreground state and its event subscribers agree. Browser refreshes never call the native app-state API; the defining event and Android re-export are both guarded against source drift.

## Tests

- `scripts/otterelement-export.test.mjs` checks the committed export (needed files, node cap, no service address, no Siege files).
- `scripts/otterelement-web.test.mjs` always checks the patch helpers and refusal to write into the game or website. Compatibility with current game source is opt-in, not a website-release dependency.
- `node --test scripts/*.test.mjs` checks the committed trailer without requiring a game checkout or installed game dependencies.
- For an intentional rebuild, run the optional source check in PowerShell:

  ```powershell
  $env:OTTERELEMENT_SOURCE = 'C:\Namasya Development\Otter Element'
  node --test scripts\otterelement-web.test.mjs
  Remove-Item Env:\OTTERELEMENT_SOURCE
  ```
