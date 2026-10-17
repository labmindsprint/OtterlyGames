import { useEffect, useState } from 'react';
import { scheduleWhenVisible, type VisibilityTimer } from './websiteTimers';
import { getWebsiteActiveTime } from './useAppVisibility';

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;
type TimerCallback = (...args: unknown[]) => void;

/** A component-scoped facade: freeze active-play delays and cancel them on navigation. */
export function createWebsiteTimers() {
  const pending = new Map<TimerHandle, { timer?: VisibilityTimer; cancelled: boolean }>();
  let nextId = 1;

  const clear = (handle: TimerHandle | undefined | null) => {
    if (handle == null) return;
    const item = pending.get(handle);
    if (!item) return;
    item.cancelled = true;
    item.timer?.cancel();
    pending.delete(handle);
  };
  const schedule = (repeat: boolean, callback: TimerCallback, delay = 0, ...args: unknown[]): TimerHandle => {
    // Browser timer handles are numeric; Node's ambient typings describe them as objects.
    const handle = nextId++ as unknown as TimerHandle;
    const item: { timer?: VisibilityTimer; cancelled: boolean } = { cancelled: false };
    pending.set(handle, item);
    const arm = () => {
      item.timer = scheduleWhenVisible(() => {
        if (item.cancelled) return;
        if (!repeat) pending.delete(handle);
        callback(...args);
        if (repeat && !item.cancelled) arm();
      }, Math.max(0, delay));
    };
    arm();
    return handle;
  };

  return {
    setTimeout: ((callback: TimerCallback, delay?: number, ...args: unknown[]) =>
      schedule(false, callback, delay, ...args)) as typeof globalThis.setTimeout,
    clearTimeout: clear as typeof globalThis.clearTimeout,
    setInterval: ((callback: TimerCallback, delay?: number, ...args: unknown[]) =>
      schedule(true, callback, delay, ...args)) as typeof globalThis.setInterval,
    clearInterval: clear as typeof globalThis.clearInterval,
    now: getWebsiteActiveTime,
    cancelAll: () => { for (const handle of [...pending.keys()]) clear(handle); },
  };
}

export function useWebsiteTimers(managed = true) {
  const [timers] = useState(createWebsiteTimers);
  useEffect(() => () => timers.cancelAll(), [timers]);
  return managed ? timers : {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
    now: Date.now,
    cancelAll: timers.cancelAll,
  };
}
