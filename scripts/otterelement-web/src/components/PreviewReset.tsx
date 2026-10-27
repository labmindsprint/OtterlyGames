import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { eraseLocalData } from '../game/storage';
import { gameStore } from '../game/store';
// The real Settings loads these rules through its privacy section, which the preview does not have; the save backup and
// recovery notices share them.
import './privacy-settings.css';

// The website preview keeps its progress in this browser only. Resetting removes that progress and nothing else: the
// preview's storage is scoped (see previewEnv.ts), so the other games on this site are not touched.
export function PreviewReset({ disabled = false }: { disabled?: boolean }) {
  const [asking, setAsking] = useState(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState('');
  const reset = async (): Promise<void> => {
    setWorking(true);
    setStatus('');
    try {
      await gameStore.halt();
      await eraseLocalData();
      window.location.reload();
    } catch (error) {
      gameStore.resume();
      setStatus(error instanceof Error ? error.message : 'The preview could not be reset.');
      setWorking(false);
    }
  };
  return <>
    <button type="button" className="setting-link is-danger" disabled={disabled || working} aria-expanded={asking} onClick={() => setAsking(true)}><Trash2 size={16} aria-hidden="true" /> Reset this preview</button>
    {asking && <div className="recovery-confirm" role="alertdialog" aria-modal="true" aria-labelledby="preview-reset-title" aria-describedby="preview-reset-body">
      <strong id="preview-reset-title">Reset this preview?</strong>
      <div id="preview-reset-body" className="delete-body">
        <p>This removes the progress this preview saved in this browser and starts again from the first fight. Nothing else on this site is changed. It cannot be undone.</p>
      </div>
      <div className="boot-actions">
        <button type="button" className="button danger" disabled={working} onClick={() => void reset()}>Reset preview</button>
        <button type="button" className="button" disabled={working} onClick={() => setAsking(false)}>Cancel</button>
      </div>
    </div>}
    {status && <p className="recovery-status" role="status">{status}</p>}
  </>;
}
