# Play Billing products

Source of truth: `js\space-academy\pitstop\fuel.mjs` (PACKS, REMOVE_ADS), `PlayBilling.kt` (product type INAPP,
Play Billing Library 9.1.0), `MONETISATION.md`. Ids are case-sensitive and must match exactly.

| Product ID | Name (shown at checkout) | Description (shown at checkout) | India price (INR) | Behaviour in app |
| --- | --- | --- | --- | --- |
| `fuel-5` | `5 fuel` | `Five extra fuel tanks for Otterly Space Academy mock tests.` | **Rs 49** | **Consumable.** The app consumes it after the purchase, then adds 5 fuel. Can be bought again |
| `fuel-15` | `15 fuel` | `Fifteen extra fuel tanks for Otterly Space Academy mock tests.` | **Rs 99** | **Consumable.** Consumed after purchase, adds 15 fuel. Can be bought again |
| `remove-ads` | `Unlimited fuel, no ads` | `One-time purchase: unlimited fuel for mock tests and no more ads in Otterly Space Academy.` | **Rs 150** | **Non-consumable, one time.** The app acknowledges it and never consumes it. Restorable on the same Google account |

In the current one-time-product model, consumable vs non-consumable is not a Console toggle: all three use the
same **Buy** purchase option. The difference is in the app, which consumes `fuel-5` and `fuel-15` and only
acknowledges `remove-ads` (`MonetisationLogic.kt` purchase rules). None of them is a subscription.

Name and description limits in the Console are small (name about 55 characters, description about 200). Every
string above fits; verify against the live form.

## Before you start

1. A Play Console developer account with a **payments profile** / merchant account (USER).
2. The app exists in Play Console and a **signed bundle that includes the billing permission** has been uploaded to at
   least **Internal testing**. The Console may not let you create products until a billing-enabled build exists.
   The Billing library adds `com.android.vending.BILLING` to the merged manifest.
3. Pricing decision confirmed (see "Pricing notes").

## Console click path (repeat for each product)

1. <https://play.google.com/console> > select **Otterly Space Academy**.
2. Left menu **Monetize with Play** > **Products** > **One-time products** (older UI: **Monetize > In-app products**).
3. **Create one-time product**.
4. **Product ID**: the id from the table (for example `fuel-5`). It **cannot be changed or reused** later.
5. **Name** and **Description**: paste from the table.
6. **Purchase option**: add a **Buy** option (a standard one-time purchase). Accept the suggested option id or use `buy`. Leave
   pre-order, rent and offers off.
7. **Price**: set the price, pick **India (INR)**, enter the amount from the table, then **Apply**. For other regions let Google
   convert from INR, or edit them (see notes).
8. **Tax category**: keep the default digital-goods setting unless the Console asks otherwise.
9. **Save**, then **Activate** the purchase option. The status must read **Active**; an inactive product is not returned to the app.
10. Repeat for `fuel-15` and `remove-ads`. All three must be **Active**.

## Verifying

- **Setup > License testing**: add tester Google accounts and keep the license response at **RESPOND_NORMALLY**.
- Install from the Internal testing opt-in link. Billing works only for builds installed from a Play track.
- Check: each button shows a localised price; `fuel-5` adds 5 fuel once and can be bought again; `remove-ads` buys once and
  Restore purchases brings it back after reinstall; a declined or cancelled payment grants nothing. The full list is in `MONETISATION.md`.

## Pricing notes

- The INR prices are the ones the web game already assumes (`fuel-bridge.mjs`). On Android the app shows the price Play returns, never a hard-coded one.
- Check **Pricing template** and tax settings in the Console if the buyer price differs from what you expect.
- Choose countries under **Release > Production > Countries/regions** (or the Closed testing track's countries). For rupee pricing, start with **India only**. If you add other countries, review Play's converted prices.
- Refunds follow Google Play policy. The game does not remove supporter status after a refund (recorded in `MONETISATION.md`).

## Parental controls reminder

Every purchase button is in the grown-ups area (two-second press-and-hold; see the risk in `ADS-AND-AUDIENCE.md`). Google
Play also shows its own purchase confirmation and may require authentication. The reviewer notes mention both.

## Not verified here

No Console access, so the labels above follow Play's documented pattern, not a live screen. No purchase was run on a device
(`MONETISATION.md` says the same).
