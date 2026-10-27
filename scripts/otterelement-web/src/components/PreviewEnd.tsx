import { useEffect, useSyncExternalStore } from 'react';
import { ExternalLink } from 'lucide-react';
import type { GameState } from '../game/types';
import { PREVIEW_ABOUT_URL, PREVIEW_NODE_CAP, PREVIEW_STORE_URL } from '../previewEnv';
import { Modal } from './shared';
import './preview-end.css';

const SEEN_KEY = 'end-seen';

function readSeen(): boolean {
  try { return window.localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}

let seen = readSeen();
let open = false;
const listeners = new Set<() => void>();
const emit = (): void => { for (const listener of listeners) listener(); };
const subscribe = (listener: () => void): (() => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

function setOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  emit();
}

function dismiss(): void {
  seen = true;
  try { window.localStorage.setItem(SEEN_KEY, '1'); } catch { /* the notice may show again next visit */ }
  setOpen(false);
}

/** True while the end-of-preview dialog is on screen, so the app can pause the fight and hold the tutorial behind it. */
export function usePreviewEndOpen(): boolean {
  return useSyncExternalStore(subscribe, () => open, () => false);
}

// The end of the website preview: a dialog once the Helium find and its celebrations are done, and a small "Full game"
// link from the moment Helium is found. `hold` keeps the dialog behind the game's own discovery and prize screens.
export function PreviewEnd({ game, hold }: { game: GameState; hold: boolean }) {
  const shown = usePreviewEndOpen();
  const reached = game.cleared >= PREVIEW_NODE_CAP;
  const due = reached && !seen && !hold;
  useEffect(() => { if (due) setOpen(true); }, [due]);
  if (!reached) return null;
  return <>
    {shown && <Modal title="Helium found: preview complete" className="oe-preview-end-modal" onClose={dismiss}>
      <div className="oe-preview-end">
        <p>You have reached the end of the website preview: the first two elements, Hydrogen and Helium.</p>
        <p>The full Otter Element game goes on from element 3 through all 118 elements, with the full Lab and Turret.</p>
        <a className="button gold full" href={PREVIEW_STORE_URL} target="_blank" rel="noopener noreferrer">Continue in the full game on Google Play <ExternalLink size={16} aria-hidden="true" /></a>
        <p className="oe-preview-fine">The Google Play release is in closed testing for invited testers, so the listing may not be open to everyone yet.</p>
        <button type="button" className="button full" onClick={dismiss}>Keep playing the preview</button>
        <p className="oe-preview-fine">This preview keeps your progress only in this browser and sends nothing anywhere. <a href={PREVIEW_ABOUT_URL} target="_blank" rel="noopener noreferrer">About the preview and privacy</a></p>
      </div>
    </Modal>}
    {!shown && (seen || hold) && <a className="oe-fullgame-pill" href={PREVIEW_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Continue in the full game on Google Play (opens a new tab)">
      Full game <ExternalLink size={13} aria-hidden="true" />
    </a>}
  </>;
}
