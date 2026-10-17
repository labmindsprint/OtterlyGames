import { useSyncExternalStore } from 'react';

let visible = false;
let cleanup: (() => void) | undefined;
const listeners = new Set<() => void>();
let elapsedActive = 0;
let activeStartedAt = 0;

export function getWebsiteVisibility(): boolean {
  return visible;
}

// Legacy WebsiteDemo owns its pause state and does not subscribe to this store.
export function isWebsitePaused(): boolean {
  return typeof document === 'undefined' || document.hidden || (cleanup !== undefined && !visible);
}

export function getWebsiteActiveTime(): number {
  return elapsedActive + (visible ? performance.now() - activeStartedAt : 0);
}

export function subscribeWebsiteVisibility(listener: () => void): () => void {
  listeners.add(listener);
  if (!cleanup && typeof document !== 'undefined') {
    let parentActive = window.parent === window;
    let intersecting = window.parent === window;
    const update = () => {
      const next = !document.hidden && parentActive && intersecting;
      if (next !== visible) {
        if (visible) elapsedActive += performance.now() - activeStartedAt;
        if (next) activeStartedAt = performance.now();
        visible = next;
        for (const notify of [...listeners]) notify();
      }
    };
    const message = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== 'pauseAudio' && event.data?.type !== 'resumeAudio') return;
      parentActive = event.data.type === 'resumeAudio';
      update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    });
    observer.observe(document.documentElement);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('message', message);
    cleanup = () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('message', message);
    };
    update();
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'mathReady' }, window.location.origin);
    }
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      cleanup?.();
      cleanup = undefined;
      if (visible) elapsedActive += performance.now() - activeStartedAt;
      visible = false;
    }
  };
}

/** Shared visibility also includes same-origin host pause messages and iframe clipping. */
export function useAppVisibility(): boolean {
  return useSyncExternalStore(subscribeWebsiteVisibility, getWebsiteVisibility, () => false);
}
