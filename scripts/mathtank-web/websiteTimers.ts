import { getWebsiteVisibility, subscribeWebsiteVisibility } from './useAppVisibility';

export interface VisibilityTimer {
  cancel: () => void;
}

/** Freeze gameplay delays, not wall-clock daily resets, while the game is hidden. */
export function scheduleWhenVisible(callback: () => void, delay: number): VisibilityTimer {
  let remaining = delay;
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let unsubscribe = () => {};

  const cancel = () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    unsubscribe();
  };
  const update = () => {
    if (stopped) return;
    if (!getWebsiteVisibility()) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, remaining - (performance.now() - startedAt));
      }
    } else if (timer === undefined) {
      startedAt = performance.now();
      timer = setTimeout(() => {
        timer = undefined;
        if (!getWebsiteVisibility()) {
          remaining = 0;
          return;
        }
        cancel();
        callback();
      }, remaining);
    }
  };
  unsubscribe = subscribeWebsiteVisibility(update);
  update();
  return { cancel };
}
