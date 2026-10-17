import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

const App = lazy(() => import('./app/App'));
let failed = false;
const failure = () => {
  failed = true;
  window.dispatchEvent(new Event('clock-storage-failure'));
};
const methods = ['getItem', 'setItem', 'removeItem', 'clear'] as const;
for (const method of methods) {
  const original = Storage.prototype[method];
  Object.defineProperty(Storage.prototype, method, {
    configurable: true,
    value: function (...args: string[]) {
      try { return original.apply(this, args as never); }
      catch (error) { failure(); throw error; }
    },
  });
}
try {
  const key = `clock_master_probe_${crypto.randomUUID()}`;
  localStorage.setItem(key, key);
  if (localStorage.getItem(key) !== key) throw new Error('Save verification failed');
  localStorage.removeItem(key);
} catch { failed = true; }

function SaveError() {
  return <main role="alert" style={{ padding: 'max(24px, 5vw)', color: '#fff', background: '#17152f', minHeight: '100dvh' }}>
    <h1>Clock Master cannot save progress</h1>
    <p>Browser storage is unavailable or a save failed. Gameplay has stopped so it cannot pretend your progress was saved.</p>
    <p>Allow this site's local storage and reload. Clearing site data removes local progress. Private browsing may not keep saves.</p>
    <button onClick={() => location.reload()}>Reload and check storage</button>
  </main>;
}
class Boundary extends Component<{children: ReactNode}, {error: boolean}> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (!this.state.error) return this.props.children;
    return failed ? <SaveError /> : <main role="alert"><h1>Clock Master could not continue</h1>
      <p>An unexpected game error occurred. Reload to retry; previously saved local progress is kept.</p>
      <button onClick={() => location.reload()}>Reload game</button></main>;
  }
}
function BrowserEntry() {
  const [blocked, setBlocked] = useState(failed);
  useEffect(() => {
    const block = () => {
      setBlocked(true);
      document.querySelectorAll('audio,video').forEach(node => (node as HTMLMediaElement).pause());
      window.speechSynthesis?.cancel();
    };
    window.addEventListener('clock-storage-failure', block);
    return () => window.removeEventListener('clock-storage-failure', block);
  }, []);
  return blocked ? <SaveError /> : <Boundary><Suspense fallback={<p role="status">Checking saved progress…</p>}><App /></Suspense></Boundary>;
}
createRoot(document.getElementById('root')!).render(<BrowserEntry />);
