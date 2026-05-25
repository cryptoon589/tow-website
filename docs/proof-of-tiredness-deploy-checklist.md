# Proof of Tiredness Deployment Checklist

Branch: `proof-of-tiredness-system`

## 1. Supabase setup

Run this SQL file in the Supabase SQL editor:

```text
supabase/proof-of-tiredness.sql
```

This creates:

- `tow_players`
- `tow_wallet_events`
- `tow_buy_positions`

## 2. Vercel environment variables

Add these to the Vercel project settings.

```env
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TOW_SYNC_SECRET=your_private_random_secret
TOW_WEBSITE_URL=https://www.tiredofwinningtow.com
XRPL_RPC_URL=https://s1.ripple.com:51234
TOW_ISSUER=rstXMYib49TXTv69QioDhADxwxqSNrqRmV
TOW_CURRENCY=TOW
```

Important:

- Keep `SUPABASE_SERVICE_ROLE_KEY` private.
- Keep `TOW_SYNC_SECRET` private.
- Do not expose the service role key in client-side code.

## 3. Vercel cron

`vercel.json` is included and triggers:

```text
/api/tired-scan-all
```

every 15 minutes.

Because the scan routes are protected, Vercel Cron or any external caller must include:

```http
x-tow-sync-secret: YOUR_SECRET
```

If Vercel Cron cannot send custom headers on your plan/config, use one of these alternatives:

1. Trigger `/api/tired-scan-all` from TiredBuddy admin command.
2. Trigger it from a GitHub Action cron.
3. Add a Vercel-only cron bypass secret using a query param, if needed later.

## 4. Test order

### A. Deploy preview branch

Deploy the `proof-of-tiredness-system` branch in Vercel.

### B. Open dashboard

```text
/too-tired-to-quit
```

Expected:

- Page loads.
- Wallet input appears.
- No crash when empty.

### C. Register test wallet

Call:

```http
POST /api/tired-register
```

Body:

```json
{
  "walletAddress": "r...",
  "xUsername": "testuser",
  "telegramUsername": "testtelegram"
}
```

Expected:

- returns `ok: true`
- returns verification code
- creates row in `tow_players`

### D. Submit manual buy event

Call:

```http
POST /api/tired-sync
x-tow-sync-secret: YOUR_SECRET
```

Body:

```json
{
  "walletAddress": "r...",
  "txHash": "TEST_BUY_001",
  "eventType": "buy",
  "xrpValue": 50,
  "towAmount": 100000,
  "eventAt": "2026-05-24T00:00:00.000Z"
}
```

Expected:

- creates one `tow_wallet_events` row
- creates one `tow_buy_positions` row
- max reward is `50000` TOW

### E. Check status

Open:

```text
/too-tired-to-quit
```

or call:

```http
GET /api/tired-status?wallet=r...
```

Expected:

- `totalTowAmount = 100000`
- `maxRewardTow = 50000`
- `alivePositions = 1`

### F. Submit sell event

Call:

```http
POST /api/tired-sync
x-tow-sync-secret: YOUR_SECRET
```

Body:

```json
{
  "walletAddress": "r...",
  "txHash": "TEST_SELL_001",
  "eventType": "sell",
  "xrpValue": 10,
  "towAmount": 20000,
  "eventAt": "2026-05-25T00:00:00.000Z"
}
```

Expected:

- alive positions become `disqualified`
- status page shows no active Still Here commitment

## 5. TiredBuddy integration

Use:

```text
docs/tiredbuddy-command-examples.js
```

Commands prepared:

- `/link`
- `/verify`
- `/status`
- `/leaderboard`

Required bot env var:

```env
TOW_WEBSITE_URL=https://www.tiredofwinningtow.com
```

## 6. Launch notes

Public wording should avoid:

- APY
- yield
- ROI
- guaranteed returns

Use:

- Proof of Tiredness
- Still Here
- Too Tired To Quit
- community rewards
- TOW unlocks
- selling ends eligibility

## 7. Known MVP limitations

- XRPL parsing should be tested with real TOW buy/sell transactions before public rewards launch.
- The scanner currently uses recent account transactions; deeper historical backfills may need repeated scans or marker support later.
- If Vercel Cron cannot send the sync secret header, use TiredBuddy or GitHub Actions to trigger scans.
