import { isWebsitePaused } from './website';

// A component owns the returned cancellation function, including while paused.
export function activeDelay(action: () => void, milliseconds: number): () => void {
  let remaining = milliseconds;
  let started = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    clearTimeout(timer);
    window.removeEventListener('clock-visibility', sync);
  };
  const sync = () => {
    if (cancelled) return;
    if (timer !== undefined) {
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (performance.now() - started));
      timer = undefined;
    }
    if (isWebsitePaused()) return;
    started = performance.now();
    timer = setTimeout(() => {
      cancel();
      action();
    }, remaining);
  };
  window.addEventListener('clock-visibility', sync);
  sync();
  return cancel;
}
