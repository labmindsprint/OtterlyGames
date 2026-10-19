# Shared Ranking Service Guideline — Otterly Games

The Otterly ranking service is a small, ranking-only backend that any Otterly app can use for weekly or
all-time leaderboards. Every app that adds a leaderboard **must** follow the steps below so that privacy,
cost and anti-cheat promises stay the same across games.

The website itself is unchanged: `otterlygames.com` stays static HTML on GitHub Pages and does not call this
service. Only apps and games (for example the Android build of Otter Element) call it.

> This page is public. It must never contain keys, secrets, subscription ids, admin settings or personal data.
> Those live in the owner's private operator notes.

---

## 1. What it is

- One shared HTTPS API: `https://otterly-rank-rqvoeb.azurewebsites.net` (public base URL, no trailing slash).
- Ranking only. No accounts, no wallet, no purchases, no email, no personal data.
- Each app is a tenant identified by a public `appId` (for example `otter-element`). Every partition key,
  rate limit, quota and kill switch is scoped by `appId`, so one app cannot read, write or exhaust another.
- Optional by design: if the service is off, unreachable or over quota, the app falls back to local-only
  ranking (for example par bands) and keeps working.
- First tenant: **Otter Element Lab Siege** (`appId` = `otter-element`), a weekend skill event. Its replays are
  re-simulated on the server.

## 2. Hosting, region and cost cap

| Item | Value |
| --- | --- |
| Platform | Azure Functions v4 (TypeScript, Node 22), **Consumption** plan |
| Region | Central India |
| Storage | Azure Table Storage, one table set per purpose, partitioned by app and event/board period |
| Monitoring | Application Insights with 5 % sampling and a small daily log cap |
| Hard budget | about **Rs 1,000 per month (about US$12)** for the whole service |
| Typical cost | about US$0.5 per month at 10,000 weekly players; well inside the cap |

Guards that actually limit spend (an Azure budget only sends alerts, see section 10):

1. Platform daily compute quota (a GB-second cap per UTC day). When it is reached the platform stops the
   service for the rest of that day and clients use local-only ranking.
2. Scale-out limit of 2 instances.
3. Request size cap (8 KB by default) and strict JSON shape checks.
4. Rate limits per install id and per IP, per app.
5. Daily submit caps per install, per app and global.
6. Kill switches: one for the whole service and one per app.
7. Short response caching (45 s) on leaderboards, so reads are cheap.

## 3. Endpoints

All requests and responses are JSON over HTTPS. `appId` is public. Apps send it in the body, or as `?app=` on
GET routes. Unknown app → `404 {"error":"unknown-app"}`; disabled → `503`.

### `GET /api/time`

Server UTC for the event clock (the app keeps an offset so a wrong device clock cannot open an event early).

```json
{ "serverMs": 1792411463493, "apiVersion": 1 }
```

### `POST /api/session`

Gets a short-lived signed token for an anonymous install id. The token is scoped to one app and one install.

```json
// request
{ "appId": "quiz-rush", "installId": "9f3c0c1e2b7a4d58", "appVersion": "1.0.0" }
// response
{ "nickname": "QuickMole29", "eventId": "*", "expiresMs": 1793016264504, "rankingEnabled": true }
```

Otter Element also sends `simVersion`; an unsupported version gets `426` so old clients stay local-only.

### `POST /api/submit`

```json
// request (trusted-score app)
{ "appId": "quiz-rush", "token": "<from /api/session>", "bracket": "solo", "score": 640, "durationMs": 61000 }
// response
{ "status": "accepted", "best": 640, "improved": true, "attemptsUsed": 1, "total": 640 }
```

- One best score per install id per app, board/stage, bracket and period.
- Rejections: `400 invalid-replay` (failed validation), `401` (bad or foreign token), `413` (too big),
  `429` (rate limited or daily cap), `503` (kill switch). Clients must treat all non-2xx as "stay local".
- Lab Siege sends a compact replay instead of `score`; the server re-simulates it with the same simulation
  code as the game and accepts it only if the score matches.

### `GET /api/board/{event-or-board}/{bracket}?app=<appId>&n=<top N>`

Cached for about 45 seconds. `current` means the current event or the board `main`.

```json
{
  "eventId": "2026-10-19~main", "bracket": "default", "key": "total", "updatedMs": 1792411466550, "players": 5,
  "top": [ { "rank": 1, "nickname": "QuickMole29", "total": 640, "stages": [640, 0, 0], "theme": "" } ],
  "histogram": [[120, 4], [640, 1]],
  "cuts": [ { "percent": 1, "score": 640 }, { "percent": 10, "score": 640 }, { "percent": 50, "score": 120 } ],
  "percentilesActive": false
}
```

`percentilesActive` turns true only when enough players exist (200); below that apps should show par bands.

### `GET /api/rank/{event-or-board}/{bracket}?app=<appId>`

Header `Authorization: Bearer <token>`.

```json
{ "eventId": "2026-10-19~main", "bracket": "default", "players": 5, "ranked": true, "score": 640, "rank": 1, "percent": 20, "exact": true }
```

`percent` is the position from the top (20 means top 20 percent).

## 4. Event-week and board model

- **Event-week apps** (such as Lab Siege): the server owns the event windows. An event runs a fixed time
  (Lab Siege: Friday 14:30 UTC for 48 hours, three stages opening at +0 h, +16 h and +32 h, 10 minutes grace).
  Data is partitioned per app and event week. Old weeks are purged after 8 weeks.
- **Free-board apps**: the app declares boards (default `main`) and a period: `day`, `week`, `month` or `all`.
  The period key (for example `2026-W42`) comes from the server clock. `all` boards are never purged.
- **Brackets** are named groups with separate rankings (for example `kit` and `open`, or `solo`). Each app lists
  its allowed brackets; anything else is rejected.

## 5. Anti-cheat modes and their limits

| Mode | What the server checks | Strength | Limit |
| --- | --- | --- | --- |
| `replay` (built in for Otter Element Lab Siege) | Re-simulates the submitted replay with the same simulation code, event seed and version; the claimed score must equal the simulated score | Strong: a score cannot be faked without a valid playthrough | Only possible for deterministic games; bots that play validly are still valid |
| `trusted` (declared per app) | Score within configured bounds (minimum, maximum, optional maximum points per second, optional minimum duration), plus rate limits, attempt caps and one-best-score rules | Stops casual abuse and absurd values | A modified client can submit any value inside the bounds. Use it for friendly boards, never for prizes |
| Custom validator (registered in code) | Whatever the app's validator checks (for example replays or a server-issued challenge) | Depends on the validator | Needs a code change in the service and a redeploy |

Honest threat model:

- The `appId` is public and is **not** a secret. Anyone can use any public `appId`. The mitigations are limits
  (rate, size, daily caps, bounds), not secrecy.
- Install ids are anonymous and user-resettable. A determined user can create many installs; per-IP limits
  and daily caps bound the damage, not eliminate it.
- Rate limits are per server instance (at most 2 instances), so the effective limit can be up to twice the
  configured number during a burst.
- Apps that need stronger trust can mint sessions from their own backend using an app server key (the service
  stores only a hash of it). The key never goes into a client.

## 6. Quotas

Defaults per app (an app can be given tighter or looser values by the service owner):

| Quota | Default |
| --- | --- |
| Request body | 8 KB |
| Submit attempts per install per stage/board and period | 4 |
| Submits per install per day | 40 |
| Submit burst per install / per hour | 6 / 30 |
| Submit burst per IP / per hour | 60 / 600 |
| Read burst per IP / per hour | 120 / 3600 |
| Submits per app per day | set per app (a global daily cap also applies) |

## 7. Anonymous install id: privacy and Google Play data-safety wording

- The install id is a random value the app creates locally. It is not derived from the device, the Google
  account, the advertising id, a phone number or an email. Clearing app data or resetting it creates a new id.
- The service stores: the install id, a generated nickname (a random adjective and animal plus digits),
  score values, and for Lab Siege the replay of the run that set the best score. It stores no names, emails,
  locations, contacts or payment data.
- Data is sent over HTTPS. Event boards are deleted after about 8 weeks; `all` boards stay until the app
  asks the owner to remove them.
- Deletion: players reset their install id in the app; the old entry ages out. The owner can delete an app's
  data on request.

Suggested Play Console data-safety answers for an app that uses the service:

- Data collected: **Device or other IDs** (an anonymous app-generated install id) and **App activity**
  (in-game scores for leaderboards).
- Purpose: **App functionality** (leaderboards) only. Not used for advertising, not sold.
- Shared with third parties: **No** (processed by our own cloud service).
- Encrypted in transit: **Yes**. Data deletion request: **Yes** (reset the install id; contact support).
- Add one sentence to the app's privacy policy: "Leaderboards use a random anonymous install id and your
  scores; no personal information is collected."

## 8. Onboarding a new app

1. **Pick an `appId`**: lowercase letters, digits and hyphens, 2 to 31 characters (for example `quiz-rush`).
2. **Pick a mode**:
   - Deterministic game that can record inputs → ask for a custom validator or reuse the replay approach.
   - Everything else → `trusted` with sensible bounds.
3. **Send the owner the registry entry** (public information only):

   ```json
   {
     "id": "quiz-rush",
     "name": "Quiz Rush",
     "schedule": { "kind": "free", "period": "week" },
     "brackets": ["solo"],
     "boards": ["main"],
     "bounds": { "min": 0, "max": 5000, "maxPerSecond": 200 },
     "quotas": { "dailySubmits": 20000, "installDailySubmits": 30 }
   }
   ```

   The owner adds it to the service registry and redeploys the settings. Nothing else is needed on the server.
4. **Set the build-time API URL** in the app: `VITE_TD_API=https://otterly-rank-rqvoeb.azurewebsites.net`
   (no `/api` suffix). With no value the app stays local-only.
5. **Client code**:
   - Otter Element–style replay games can reuse `src/game/td/net.ts` from the Otter Element repo (it has an
     `appId` option, offline queue, retry with backoff, timeouts and the server-time offset).
   - Trusted-score apps use this snippet (fully optional, ignores failures):

   ```js
   const API = import.meta.env.VITE_TD_API;           // empty → local only
   const APP = 'quiz-rush';
   async function call(path, init) {
     if (!API) return null;
     try {
       const r = await fetch(API + path, { ...init, signal: AbortSignal.timeout(8000),
         headers: { 'content-type': 'application/json', ...(init && init.headers) } });
       return r.ok ? await r.json() : null;
     } catch { return null; }
   }
   async function submitScore(installId, bracket, score, durationMs) {
     const s = await call('/api/session', { method: 'POST', body: JSON.stringify({ appId: APP, installId, appVersion: '1.0.0' }) });
     if (!s) return null;
     return call('/api/submit', { method: 'POST', body: JSON.stringify({ appId: APP, token: s.token, bracket, score, durationMs }) });
   }
   ```
6. **Fall back** gracefully on any failure (`null` above): show local best or par bands, never block play.
7. **Declare** the install id and score data in Play data safety and the privacy policy (section 7).

## 9. Kill switch and quotas in practice

- Global kill switch: the whole API answers `503`. Clients must switch to local-only silently.
- Per-app kill switch: only that app answers `503`; other apps are unaffected.
- Daily caps (per install, per app, global) return `429` once reached and reset at 00:00 UTC.
- If the platform compute quota is reached the platform pauses the service until the next UTC day.

## 10. Budget alerts and monitoring cost

- An Azure budget sends alert emails at 50 %, 80 % and 100 % of the monthly amount. **A budget does not stop
  spending.** The real caps are the compute quota, instance limit, rate limits, daily caps and kill switches
  listed in section 2.
- Check cost in the Azure portal: Cost Management, Cost analysis, filtered to the ranking resource group.
  Operators can also run the cost command of the admin script in the Otter Element repo (it lags about a day).
- Watch for sudden growth in requests in Application Insights; if traffic is abusive, disable the app first,
  investigate afterwards.

## 11. Runbook

Operators use the scripts in the Otter Element repo (`server\deploy.ps1` and `server\admin.ps1`). They check the
signed-in Azure account first and never store credentials.

- **Deploy or update**: run the deploy script. It validates the templates, builds the bundle with the same
  simulation code as the game, creates or updates the resources, applies settings, publishes, then runs smoke
  tests against the live URL. It is safe to re-run.
- **Onboard or tune an app**: edit the registry file, then run the deploy script with `-SettingsOnly`.
- **Rotate secrets**: run the deploy script with `-SettingsOnly -RotateSecrets`. All players get a new session
  once; if the replay claim key changes, rebuild the Otter Element client with the new public claim key.
- **Disable**: admin script `disable` (everything) or `disable-app <appId>` (one app). `enable` and
  `enable-app` reverse it. Effective within seconds.
- **Roll back**: admin script `rollback` redeploys the previous package. If data is bad, disable the app,
  fix, and let the affected weekly board expire or purge it.
- **After an incident**: check cost, re-enable one app at a time, then re-run the smoke tests.

## 12. Integrate in 30 minutes: checklist

- [ ] Choose an `appId` and a mode (`trusted` with bounds, or ask for a validator) — 5 min
- [ ] Send the registry entry (section 8) to the service owner and wait for "registered" — 5 min
- [ ] Add `VITE_TD_API` to the build configuration; leave it unset for local-only builds — 2 min
- [ ] Generate a random install id once and store it locally — 3 min
- [ ] Copy the snippet or reuse `net.ts`; call `submitScore` at the end of a run — 5 min
- [ ] Show the board with `GET /api/board/current/<bracket>?app=<appId>`, fall back to local data on failure — 5 min
- [ ] Test: submit an in-bounds score (accepted), an out-of-bounds score (`400`), turn the API URL off (app still works) — 3 min
- [ ] Update Play data safety and the privacy policy wording (section 7) — 2 min
