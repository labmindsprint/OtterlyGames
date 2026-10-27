// The website preview's environment. main.tsx imports this module first, so everything below is in place before any
// game module reads storage.

/** The preview opens exactly two nodes: 1 Hydrogen and 2 Helium. */
export const PREVIEW_NODE_CAP = 2;
/** A separate database: the preview never reads, writes or deletes a native-style "otter-element" database. */
export const PREVIEW_DB_NAME = 'otter-element-web-preview';
export const PREVIEW_STORAGE_PREFIX = 'oe-web-preview:';
export const PREVIEW_STORE_URL = 'https://play.google.com/store/apps/details?id=com.otterlygames.otterelement';
/** The part of the Otter Element page that says what the browser preview saves, and links the Android privacy notice. */
export const PREVIEW_ABOUT_URL = '/apps/otter-element.html#about-preview';

// otterlygames.com shares one localStorage origin between every game on the site, and the game wipes localStorage when
// the player erases their data. This view keeps every key under one prefix and makes clear() remove only those keys.
function scopedLocalStorage(base: Storage): Storage {
  const own = (key: string): string => PREVIEW_STORAGE_PREFIX + key;
  const names = (): string[] => {
    const found: string[] = [];
    for (let index = 0; index < base.length; index += 1) {
      const key = base.key(index);
      if (key !== null && key.startsWith(PREVIEW_STORAGE_PREFIX)) found.push(key.slice(PREVIEW_STORAGE_PREFIX.length));
    }
    return found;
  };
  const view = {
    get length(): number { return names().length; },
    key: (index: number): string | null => names()[index] ?? null,
    getItem: (key: string): string | null => base.getItem(own(String(key))),
    setItem: (key: string, value: string): void => { base.setItem(own(String(key)), String(value)); },
    removeItem: (key: string): void => { base.removeItem(own(String(key))); },
    clear: (): void => { for (const key of names()) base.removeItem(own(key)); },
  };
  return view as Storage;
}

// A browser that blocks site storage throws when localStorage is read. The preview then keeps its small settings in
// memory for the visit, so the game still starts instead of showing a blank page.
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  const view = {
    get length(): number { return items.size; },
    key: (index: number): string | null => [...items.keys()][index] ?? null,
    getItem: (key: string): string | null => items.get(String(key)) ?? null,
    setItem: (key: string, value: string): void => { items.set(String(key), String(value)); },
    removeItem: (key: string): void => { items.delete(String(key)); },
    clear: (): void => { items.clear(); },
  };
  return view as Storage;
}

function installScopedStorage(): void {
  let base: Storage;
  try { base = window.localStorage; } catch { base = memoryStorage(); }
  const scoped = scopedLocalStorage(base);
  try {
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => scoped });
  } catch {
    // Failing closed: erasing data must never be able to reach the other games on this origin.
    throw new Error('The preview could not isolate its storage from the other games on this site.');
  }
}

installScopedStorage();

// The website page tells the embedded preview when it is scrolled out of view or the tab is hidden. It is passed on as
// the game's own "app is not active" event, which pauses the fight and the audio the same way the Android app does.
// The name must match APP_ACTIVE_EVENT in the game's native/android.ts (prepare-otterelement-web.mjs checks it).
function listenForPageVisibility(): void {
  if (window.parent === window) return;
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const data: unknown = event.data;
    if (typeof data !== 'object' || data === null) return;
    const { type, active } = data as { type?: unknown; active?: unknown };
    if (type !== 'oe-preview-active' || typeof active !== 'boolean') return;
    window.dispatchEvent(new CustomEvent<boolean>('oe:app-active', { detail: active }));
  });
}

listenForPageVisibility();
