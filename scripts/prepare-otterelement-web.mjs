import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Turns an isolated copy of the Otter Element project into the website preview: the first two elements of the real
// game, with everything the preview must not offer taken out of the build. The edits are small exact patches over the
// game's own source, so a change in the game that touches one of them fails loudly here instead of shipping silently.
const overlays = join(dirname(fileURLToPath(import.meta.url)), 'otterelement-web', 'src');
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function count(source, text) {
  return source.split(text).length - 1;
}

function replaceExact(source, before, after, expected = 1, where = '') {
  const found = count(source, before);
  if (found !== expected) {
    throw new Error(`Otter Element source changed${where ? ` in ${where}` : ''} (${found} matches, expected ${expected}): ${before.slice(0, 120)}`);
  }
  return source.split(before).join(after);
}

/** Replaces from a unique start marker through the first end marker after it. */
function replaceRegion(source, start, end, replacement, where = '') {
  const from = source.indexOf(start);
  const to = from < 0 ? -1 : source.indexOf(end, from + start.length);
  if (from < 0 || to < 0 || count(source, start) !== 1) {
    throw new Error(`Otter Element source changed${where ? ` in ${where}` : ''} (region not found or not unique): ${start.slice(0, 120)}`);
  }
  const span = source.slice(from, to + end.length);
  return source.slice(0, from) + (typeof replacement === 'function' ? replacement(span) : replacement) + source.slice(to + end.length);
}

const readSource = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const CAP = "import { PREVIEW_NODE_CAP as PLAYABLE_ELEMENTS } from '../previewEnv';";
const PREVIEW_CSP = "script-src 'self'; connect-src 'self' blob: data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'";

/** The patches, by file. Each one is a function of the file's text; nothing is written until every one has matched. */
function patches() {
  return {
    'src/main.tsx': (s, w) => {
      s = replaceExact(s, "import { StrictMode, useCallback, useState } from 'react';", "import './previewEnv';\nimport { StrictMode, useCallback, useState } from 'react';", 1, w);
      return replaceExact(s, "  if (import.meta.env.DEV) void import('./devDemo').then((demo) => { demo.startSiegeDemo(); });\n", '', 1, w);
    },
    // Cloudflare adds its analytics script to every HTML page the site serves. The game page allows scripts and
    // connections from its own origin only, so the preview really does send nothing to a third party.
    'index.html': (s, w) => replaceExact(s, '    <meta name="color-scheme" content="dark" />\n', `    <meta name="color-scheme" content="dark" />\n    <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}" />\n`, 1, w),
    // The node cap: the loop and the battle see the preview's last node as the last node of the game.
    'src/game/loop.ts': (s, w) => replaceExact(s, "import { PLAYABLE_ELEMENTS, chapterOf } from './data';", `import { chapterOf } from './data';\n${CAP}`, 1, w),
    // A request past the cap (the farming-rate estimate asks for the next node of a finished preview) is fought as the last node, so no later encounter is ever simulated.
    'src/game/battle.ts': (s, w) => {
      s = replaceExact(s, "import { POWERS, PLAYABLE_ELEMENTS, chapterOf } from './data';", `import { POWERS, chapterOf } from './data';\n${CAP}`, 1, w);
      return replaceExact(s, "    if (!Number.isInteger(stage) || stage < 1 || stage > PLAYABLE_ELEMENTS) throw new Error('Unavailable encounter.');", "    if (!Number.isInteger(stage) || stage < 1) throw new Error('Unavailable encounter.');\n    stage = Math.min(stage, PLAYABLE_ELEMENTS);", 1, w);
    },
    'src/game/model.ts': (s, w) => {
      s = `import { PREVIEW_NODE_CAP } from '../previewEnv';\n${s}`;
      s = replaceExact(s, "if (action.node !== state.cleared + 1 || action.node > PLAYABLE_ELEMENTS) return reject(", "if (action.node !== state.cleared + 1 || action.node > PREVIEW_NODE_CAP) return reject(", 1, w);
      return replaceExact(s, "!integer(value.cleared, PLAYABLE_ELEMENTS)) return false;", "!integer(value.cleared, PREVIEW_NODE_CAP)) return false;", 1, w);
    },
    // Own storage, and every save that is read or imported is brought back to the cap first.
    'src/game/storage.ts': (s, w) => {
      s = `import { PREVIEW_DB_NAME } from '../previewEnv';\nimport { capPreviewSave } from '../previewCap';\n${s}`;
      s = replaceExact(s, "indexedDB.open('otter-element', DATABASE_VERSION)", 'indexedDB.open(PREVIEW_DB_NAME, DATABASE_VERSION)', 1, w);
      s = replaceExact(s, 'export const saveTools = new IndexedDbRepository();', 'export const saveTools = new IndexedDbRepository(null);', 1, w);
      s = replaceExact(s, "throw new Error('Full Lab Siege transfer is not supported by this build.');", "throw new Error('That backup is not supported by this preview.');", 1, w);
      return replaceExact(s, 'const migrate = (value: unknown): unknown => migrateSave(migrateReceiptRecords(value));', 'const migrate = (value: unknown): unknown => capPreviewSave(migrateSave(migrateReceiptRecords(value)));', 1, w);
    },
    // Switched off for the website: dev mode, ad offers and the profile and leaderboard identity.
    'src/game/devFlag.ts': (s, w) => {
      s = replaceExact(s, "  if (modeCached === null) modeCached = readStore(MODE_KEY) === '1';\n  return modeCached;", '  return false;', 1, w);
      return replaceExact(s, 'export function setDevMode(on: boolean, realNow: number = Date.now()): void {\n  if (on === devModeOn()) return;', 'export function setDevMode(on: boolean, realNow: number = Date.now()): void {\n  if (on || on === devModeOn()) return;', 1, w);
    },
    'src/game/ads.ts': (s, w) => replaceExact(s, '  return context.now - context.firstPlayAt >= AD_FREE_MINUTES * 60_000;', '  return false;', 1, w),
    'src/game/profile.ts': (s, w) => replaceExact(s, 'export const PROFILE_ENABLED = true;', 'export const PROFILE_ENABLED = false;', 1, w),
    'src/components/shop/v2/shopV2Model.ts': (s, w) => replaceExact(s, "export const SHOP_TAB_ORDER: readonly ShopTabId[] = ['starter', 'boost', 'powers', 'ultimate'];", "export const SHOP_TAB_ORDER: readonly ShopTabId[] = ['starter', 'boost'];", 1, w),
    'src/components/ChapterMapV2.tsx': (s, w) => {
      s = replaceExact(s, "import { CHAPTERS, ELEMENTS, PLAYABLE_ELEMENTS } from '../game/data';", "import { CHAPTERS, ELEMENTS, PLAYABLE_ELEMENTS } from '../game/data';\nimport { PREVIEW_NODE_CAP } from '../previewEnv';", 1, w);
      s = replaceExact(s, 'const finished = game.cleared >= PLAYABLE_ELEMENTS;', 'const finished = game.cleared >= PREVIEW_NODE_CAP;', 1, w);
      s = replaceExact(s, 'const frontier = Math.min(game.cleared + 1, PLAYABLE_ELEMENTS);', 'const frontier = Math.min(game.cleared + 1, PREVIEW_NODE_CAP);', 1, w);
      s = replaceExact(s, 'const next = num === game.cleared + 1;', 'const next = num === game.cleared + 1 && num <= PREVIEW_NODE_CAP;', 1, w);
      return replaceExact(s, 'Your frontier stays at node {Math.min(game.cleared + 1, PLAYABLE_ELEMENTS)}.', 'Your frontier stays at node {Math.min(game.cleared + 1, PREVIEW_NODE_CAP)}.', 1, w);
    },
    // The Elements tab keeps the real 118-tile table, but only the preview's elements can be opened or reached.
    'src/components/Panels.tsx': (s, w) => {
      s = replaceExact(s, "import './touch-targets.css';", "import './touch-targets.css';\nimport { PREVIEW_NODE_CAP } from '../previewEnv';", 1, w);
      s = replaceRegion(s, '      <span data-number={ULTIMATE_ELEMENT.number} className={`pt-mini-cell ult-mini', '</span>\n', '', w);
      s = replaceRegion(s, "      <li className={`ult-legend ${ultimateOwned ? 'is-owned' : ''}`}>", '</button></li>\n', '', w);
      s = replaceExact(s, 'element.number === game.cleared + 1 ?', '(element.number === game.cleared + 1 && element.number <= PREVIEW_NODE_CAP) ?', 3, w);
      s = replaceExact(s, '{shown.filter((element) => !classPick.length || classPick.includes(element.family as Family)).map(', '{shown.filter((element) => element.number <= PREVIEW_NODE_CAP && (!classPick.length || classPick.includes(element.family as Family))).map(', 1, w);
      s = replaceExact(s, '{shown.length === 0 && <p role="status">No elements found</p>}', '{!shown.some((element) => element.number <= PREVIEW_NODE_CAP) && <p role="status">No elements found</p>}', 1, w);
      return replaceExact(s, 'disabled={picked >= 118}', 'disabled={picked >= PREVIEW_NODE_CAP}', 1, w);
    },
    // Settings keep a link to what the preview saves, Export and Import save, and a reset that only touches this preview.
    'src/components/SaveRecovery.tsx': (s, w) => {
      s = replaceExact(s, "import { AdChoicesRow, DeleteDataFlow, PrivacyNoticeRow } from './PrivacySettings';\nimport type { DeletionHost } from './PrivacySettings';\nimport { getPurchaseProvider } from '../game/iap';",
        "import { PreviewReset } from './PreviewReset';\nimport type { DeletionHost } from './PrivacySettings';\nimport { PREVIEW_ABOUT_URL } from '../previewEnv';", 1, w);
      s = replaceExact(s, '  const port = remoteDeletion === undefined ? getRemoteDeletionPort() : remoteDeletion;\n', '', 1, w);
      s = replaceRegion(s, '    <PrivacyNoticeRow />\n', 'Restore purchases</button>\n',
        `    <a className="setting-link" href={PREVIEW_ABOUT_URL} target="_blank" rel="noopener noreferrer"><Shield size={16} aria-hidden="true" /> About the preview and privacy</a>\n`, w);
      return replaceExact(s, '<DeleteDataFlow port={port} disabled={busy} host={deletionHost} />', '<PreviewReset disabled={busy} />', 1, w);
    },
    // The guide shows the game and chemistry sections only; the shop, boost, event and Siege cards are not part of the preview.
    'src/components/Guide.tsx': (s, w) => {
      s = replaceExact(s, "import { WIZARD } from './tdCopy';\nimport { WizardScene } from './TdWizard';\n", '', 1, w);
      s = replaceExact(s, "const SECTIONS: readonly GuideSection[] = ['game', 'siege', 'chemistry'];", "const SECTIONS: readonly GuideSection[] = ['game', 'chemistry'];", 1, w);
      s = replaceRegion(s, 'const SIEGE_IDS: readonly GuideCardId[] = [', '  return current ? { ...card, title: current.title, line: current.text } : card;\n});\n',
        "const PREVIEW_HIDDEN_CARDS: readonly GuideCardId[] = ['shop', 'boosts', 'event', 'phases', 'roster', 'blueprint', 'allowance', 'bossgems', 'supplies', 'market'];\nconst CURRENT_CARDS = GUIDE_CARDS.filter((card) => card.section !== 'siege' && !PREVIEW_HIDDEN_CARDS.includes(card.id));\n", w);
      s = replaceExact(s, "{card.section === 'siege' ? <WizardScene scene={WIZARD.cards[SIEGE_IDS.indexOf(card.id)]!.scene} reducedMotion={still} /> : <GuideScene id={card.id} still={still} />}", '<GuideScene id={card.id} still={still} />', 1, w);
      return replaceExact(s, "{card.section !== 'siege' && <FactStrip fact={factForTopic(card.topic, turn)} />}", '<FactStrip fact={factForTopic(card.topic, turn)} />', 1, w);
    },
    'src/components/GuideScenes.tsx': (s, w) => {
      for (const line of ["      case 'shop': return <ShopScene />;\n", "      case 'boosts': return <BoostsScene />;\n", "      case 'event': return <EventScene />;\n",
        "      case 'phases': return <PhasesScene />;\n", "      case 'roster': return <RosterScene />;\n", "      case 'blueprint': return <BlueprintScene />;\n",
        "      case 'allowance': return <AllowanceScene />;\n", "      case 'bossgems': return <BossGemsScene />;\n", "      case 'supplies': return <SuppliesScene />;\n", "      case 'market': return <MarketScene />;\n"]) {
        s = replaceExact(s, line, '', 1, w);
      }
      return s;
    },
    // Not changed: the preview page pauses the game through this event name (see previewEnv.ts), so a rename must fail here.
    'src/native/android.ts': (s, w) => {
      replaceExact(s, "export const APP_ACTIVE_EVENT = 'oe:app-active';", "export const APP_ACTIVE_EVENT = 'oe:app-active';", 1, w);
      return s;
    },
    'src/game/guide.ts': (s, w) => replaceExact(s, "line: 'Your goal: find all 118. Each discovery lights up a tile.'", "line: 'The full game hides 118. This preview opens the first two. Each discovery lights up a tile.'", 1, w),
    // The backup notice and its refusal text speak about the preview's own save; they do not mention the event the preview leaves out.
    'src/game/saveEnvelope.ts': (s, w) => {
      s = replaceExact(s, "'Campaign-only backup. Lab Siege plans, progress, checkpoints, pending uploads and paid supplies are NOT included. Import and Undo change only the campaign; existing Lab Siege data on this device is unchanged. Do not use this file to move an ongoing Siege.'",
        "'Backup of the progress in this preview only. Import replaces the progress saved in this browser, and Undo last import brings the earlier progress back.'", 1, w);
      return replaceExact(s, "'Full Lab Siege transfer is not supported by this build. Nothing has been imported.'", "'That backup is not supported by this preview. Nothing has been imported.'", 1, w);
    },
    // The helper otter's pictures live with the guide, not with the Siege art that the preview leaves out.
    'src/components/HeliumGuide.tsx': (s, w) => replaceExact(s, 'art/siege/otter/${view.pose}.png', 'art/guide-otter/${view.pose}.png', 1, w),
    'src/App.tsx': (s, w) => {
      s = replaceExact(s, "import type { ShopTabId } from './components/shop/v2';", "import type { ShopTabId } from './components/shop/v2/shopV2Model';\nimport { PreviewEnd, usePreviewEndOpen } from './components/PreviewEnd';\nimport { PREVIEW_NODE_CAP } from './previewEnv';", 1, w);
      s = replaceExact(s, '  const paused = saveBlocked ||', '  const previewEndOpen = usePreviewEndOpen();\n  const paused = previewEndOpen || saveBlocked ||', 1, w);
      s = replaceExact(s, 'Math.min(current.cleared + 1, PLAYABLE_ELEMENTS)', 'Math.min(current.cleared + 1, PREVIEW_NODE_CAP)', 1, w);
      s = replaceExact(s, 'String(Math.min(game.cleared + 1, PLAYABLE_ELEMENTS))', 'String(Math.min(game.cleared + 1, PREVIEW_NODE_CAP))', 1, w);
      s = replaceExact(s, 'mode && telemetry ? telemetry.stage : Math.min(game.cleared + 1, PLAYABLE_ELEMENTS);', 'mode && telemetry ? telemetry.stage : Math.min(game.cleared + 1, PREVIEW_NODE_CAP);', 1, w);
      s = replaceRegion(s, '  const heliumCover = guide !== null ||', 'needsNamePrompt(profile));',
        (span) => `${span.replace('const heliumCover =', 'const heliumBusy =')}\n  const heliumCover = heliumBusy || previewEndOpen;`, w);
      s = replaceExact(s, '    <TipHost />\n', '    <TipHost />\n    <PreviewEnd game={game} hold={heliumBusy || loot !== null || shopOpen} />\n', 1, w);
      return replaceRegion(s, '<label className="setting-row"><span>Hide ad offers</span>', '</label>', '', w);
    },
  };
}

/** Apply once to an isolated, writable copy of the game; never to the game itself or to the website. */
export function prepareOtterelementWeb(workspace, source) {
  const root = realpathSync(workspace);
  const prohibited = [site, resolve(site, '..', 'Otter Element'), ...(source ? [resolve(source)] : [])];
  for (const path of prohibited) {
    const rel = relative(path, root);
    if (!rel || (!rel.startsWith('..') && !rel.startsWith('\\') && !rel.includes(':'))) {
      throw new Error(`Refusing to apply website overlays to the game source or the website: ${root}`);
    }
  }
  const edited = new Map();
  for (const [file, patch] of Object.entries(patches())) {
    edited.set(file, patch(readSource(join(root, file)), file));
  }
  for (const [file, text] of edited) writeFileSync(join(root, file), text);
  cpSync(overlays, join(root, 'src'), { recursive: true });
}

export { replaceExact, replaceRegion };
