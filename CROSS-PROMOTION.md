# Otterly Games — Cross-App Promotion Standard

> **One JSON. All apps. No app updates needed.**

This document defines the standard for how all Otterly Games apps discover, display, and cross-promote each other through a single remotely-hosted configuration file.

---

## Table of Contents

1. [Overview](#overview)
2. [The Config File — `apps.json`](#the-config-file--appsjson)
3. [Hosting on otterlygames.com](#hosting-on-otterlygamescom)
4. [How to Add / Update / Remove an App](#how-to-add--update--remove-an-app)
5. [Client-Side Integration (Per App)](#client-side-integration-per-app)
6. [Display Rules (UI)](#display-rules-ui)
7. [Caching & Offline Behaviour](#caching--offline-behaviour)
8. [Checklist for New Apps](#checklist-for-new-apps)

---

## Overview

```
┌──────────────────────────────┐
│  otterlygames.com/api/       │
│    apps.json  ← SINGLE      │
│               SOURCE OF      │
│               TRUTH          │
└──────────┬───────────────────┘
           │  fetched at runtime
    ┌──────┴──────┬──────────────┐
    ▼             ▼              ▼
Clock Master   Math Tank    Future App
(reads JSON,   (reads JSON,  (reads JSON,
 shows list)    shows list)   shows list)
```

Every app fetches the same `apps.json`, identifies itself by package ID, and renders the "Our Games" section in its Settings / About screen.

---

## The Config File — `apps.json`

### Location

```
https://www.otterlygames.com/api/apps.json
```

In the website repo this is: `api/apps.json`

### Schema

```jsonc
{
  "apps": [
    {
      "id": "com.clockmaster.timeforjuniors",   // REQUIRED — Android package name
      "name": "Clock Master",                    // REQUIRED — Display name
      "emoji": "🕐",                             // REQUIRED — Icon emoji
      "tagline": "Race to learn time!",          // REQUIRED — Short description
      "playStoreUrl": "https://play.google.com/store/apps/details?id=com.clockmaster.timeforjuniors",  // OPTIONAL
      "order": 1                                 // OPTIONAL — Sort priority (lower = first)
    }
  ],
  "updatedAt": "2026-03-01T00:00:00Z"           // OPTIONAL — When last edited
}
```

### Field Reference

| Field          | Type     | Required | Description |
|----------------|----------|----------|-------------|
| `id`           | `string` | **Yes**  | Android package name (e.g. `com.namasya.mathtank`). Used to identify "this is me" in each app. |
| `name`         | `string` | **Yes**  | Human-readable app name. |
| `emoji`        | `string` | **Yes**  | Single emoji used as the app icon in the list. |
| `tagline`      | `string` | **Yes**  | One-line description (keep under 40 chars). |
| `playStoreUrl` | `string` | No       | Full Play Store link. **Omit entirely** for unreleased apps. |
| `order`        | `number` | No       | Lower numbers appear first. Defaults to `999` if omitted. |

> **Note:** `isCurrent` is **never set in the JSON**. Each app determines this locally by comparing `id` against its own package name.

---

## Hosting on otterlygames.com

The otterlygames.com site is hosted via **GitHub Pages**. The `api/` folder sits at the repo root.

```
api/
└── apps.json        ← THIS FILE
```

After editing `apps.json`, just push to the `main` branch. GitHub Pages will serve the updated file within minutes at `https://www.otterlygames.com/api/apps.json`.

### CORS

GitHub Pages serves files with permissive CORS headers by default. No extra configuration is needed for Capacitor/WebView apps.

---

## How to Add / Update / Remove an App

### Add a new app (not yet on Play Store)

Add an entry **without** `playStoreUrl`:

```json
{
  "id": "com.newgame.app",
  "name": "Spelling Safari",
  "emoji": "🦁",
  "tagline": "Spell your way through the wild!",
  "order": 3
}
```

This will show with a **"COMING SOON"** badge in all apps.

### Publish to Play Store

Add the `playStoreUrl` field:

```json
{
  "id": "com.newgame.app",
  "name": "Spelling Safari",
  "emoji": "🦁",
  "tagline": "Spell your way through the wild!",
  "playStoreUrl": "https://play.google.com/store/apps/details?id=com.newgame.app",
  "order": 3
}
```

Now it will show **"Get it →"** in all other apps, and **"YOU'RE HERE"** inside Spelling Safari itself.

### Update app info

Just edit the `name`, `emoji`, `tagline`, or `order` fields. Changes propagate to all apps within 1 hour (cache TTL).

### Remove / hide an app

Delete its entry from the `apps` array. Do **not** leave empty objects.

### Reorder apps

Change the `order` values. The current app always sorts to the top regardless of `order`.

---

## Client-Side Integration (Per App)

Each app needs **one file** and **one constant change**.

### Step 1 — Copy `useOtterlyApps.ts`

Copy the hook file into your app's `lib/` folder:

```
src/app/lib/useOtterlyApps.ts
```

### Step 2 — Set `THIS_APP_ID`

Change the constant to match your app's package name:

```typescript
// In useOtterlyApps.ts
const THIS_APP_ID = 'com.namasya.mathtank';  // ← your app's package ID
```

### Step 3 — Update `FALLBACK_APPS`

Set the hardcoded fallback to include at minimum **your own app** and any currently published apps. This is used when offline or before the remote config loads:

```typescript
const FALLBACK_APPS: OtterlyApp[] = [
  {
    id: 'com.clockmaster.timeforjuniors',
    name: 'Clock Master',
    emoji: '🕐',
    tagline: 'Race to learn time!',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.clockmaster.timeforjuniors',
    order: 1,
  },
  {
    id: 'com.namasya.mathtank',
    name: 'Math Tank',
    emoji: '🎯',
    tagline: 'Multiply. Divide. Conquer!',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.namasya.mathtank',
    order: 2,
  },
];
```

### Step 4 — Use in Settings/About screen

```tsx
import { useOtterlyApps } from '@/app/lib/useOtterlyApps';

function SettingsScreen() {
  const { apps, loading } = useOtterlyApps();

  return (
    <div>
      <h3>Our Games</h3>
      {apps.map(app => (
        app.isCurrent ? (
          <div key={app.id}>
            <span>{app.emoji}</span>
            <span>{app.name}</span>
            <span>{app.tagline}</span>
            <span className="badge-green">YOU'RE HERE</span>
          </div>
        ) : app.playStoreUrl ? (
          <button key={app.id} onClick={() => window.open(app.playStoreUrl, '_blank')}>
            <span>{app.emoji}</span>
            <span>{app.name}</span>
            <span>{app.tagline}</span>
            <span>Get it →</span>
          </button>
        ) : (
          <div key={app.id} style={{ opacity: 0.75 }}>
            <span>{app.emoji}</span>
            <span>{app.name}</span>
            <span>{app.tagline}</span>
            <span className="badge-muted">COMING SOON</span>
          </div>
        )
      ))}
    </div>
  );
}
```

### Reference `useOtterlyApps.ts` Implementation

```typescript
import { useState, useEffect } from 'react';

// ─── CONFIG ──────────────────────────────────────────────
const CONFIG_URL = 'https://www.otterlygames.com/api/apps.json';
const CACHE_KEY = 'otterly_apps_config';
const CACHE_TS_KEY = 'otterly_apps_config_ts';
const CACHE_TTL = 3_600_000; // 1 hour
const FETCH_TIMEOUT = 5_000; // 5 seconds

// ⚠️ CHANGE THIS per app
const THIS_APP_ID = 'com.example.yourapp';

// ─── TYPES ───────────────────────────────────────────────
export interface OtterlyApp {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  playStoreUrl?: string;
  order?: number;
  isCurrent?: boolean;
}

interface AppsConfig {
  apps: Omit<OtterlyApp, 'isCurrent'>[];
  updatedAt?: string;
}

// ─── FALLBACK (offline / first launch) ───────────────────
// ⚠️ UPDATE THIS when adding new published apps
const FALLBACK_APPS: OtterlyApp[] = [
  {
    id: 'com.clockmaster.timeforjuniors',
    name: 'Clock Master',
    emoji: '🕐',
    tagline: 'Race to learn time!',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.clockmaster.timeforjuniors',
    order: 1,
  },
  {
    id: 'com.namasya.mathtank',
    name: 'Math Tank',
    emoji: '🎯',
    tagline: 'Multiply. Divide. Conquer!',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.namasya.mathtank',
    order: 2,
  },
];

// ─── HELPERS ─────────────────────────────────────────────
function enrichApps(raw: Omit<OtterlyApp, 'isCurrent'>[]): OtterlyApp[] {
  const enriched = raw.map(app => ({
    ...app,
    order: app.order ?? 999,
    isCurrent: app.id === THIS_APP_ID,
  }));

  return enriched.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return (a.order ?? 999) - (b.order ?? 999);
  });
}

function getCached(): OtterlyApp[] | null {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!ts || Date.now() - Number(ts) > CACHE_TTL) return null;
    const data = localStorage.getItem(CACHE_KEY);
    if (!data) return null;
    const config: AppsConfig = JSON.parse(data);
    return enrichApps(config.apps);
  } catch {
    return null;
  }
}

function setCache(config: AppsConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch { /* quota exceeded — ignore */ }
}

async function fetchConfig(): Promise<AppsConfig | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(CONFIG_URL, { signal: controller.signal });
    if (!res.ok) return null;
    const config: AppsConfig = await res.json();
    setCache(config);
    return config;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── HOOK ────────────────────────────────────────────────
export function useOtterlyApps() {
  const [apps, setApps] = useState<OtterlyApp[]>(() => {
    return getCached() ?? enrichApps(FALLBACK_APPS);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchConfig().then(config => {
      if (cancelled) return;
      if (config) setApps(enrichApps(config.apps));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { apps, loading };
}
```

---

## Display Rules (UI)

Every app **must** render these three states consistently:

| Condition | Badge | Clickable? | Opacity |
|-----------|-------|------------|---------|
| `app.isCurrent === true` | **YOU'RE HERE** (green) | No | 100% |
| `app.playStoreUrl` exists | **Get it →** (yellow) | Yes → opens URL | 100% |
| No `playStoreUrl` | **COMING SOON** (muted) | No | 75% |

**Sort order:**
1. Current app always first
2. Then by `order` field (ascending)
3. Apps without `order` go to the end

---

## Caching & Offline Behaviour

| Behaviour | Detail |
|-----------|--------|
| **Cache store** | `localStorage` keys: `otterly_apps_config`, `otterly_apps_config_ts` |
| **Cache TTL** | 1 hour (3,600,000 ms) |
| **Fetch timeout** | 5 seconds — fails silently |
| **Offline / error** | Uses cached data if available, otherwise hardcoded `FALLBACK_APPS` |
| **First launch** | Shows `FALLBACK_APPS` instantly, then updates from network in background |

This means:
- The app **never blocks** on the network call
- Users always see something immediately
- New apps appear within 1 hour of being added to the JSON

---

## Checklist for New Apps

When creating a new Otterly Games app, follow these steps:

- [ ] **Add to `apps.json`** — add entry to `api/apps.json` in the otterlygames.com repo (omit `playStoreUrl` if not yet published)
- [ ] **Copy `useOtterlyApps.ts`** — into the new app's `src/app/lib/` folder (reference implementation is in this document above)
- [ ] **Set `THIS_APP_ID`** — change the constant to the new app's package name
- [ ] **Set `FALLBACK_APPS`** — include all currently published apps
- [ ] **Build the "Our Games" UI** — follow the three-state display rules above
- [ ] **Test offline** — turn off network, confirm fallback data renders correctly
- [ ] **Test live** — confirm the app fetches and displays the remote config
- [ ] **On Play Store launch** — add `playStoreUrl` to `apps.json` and push
