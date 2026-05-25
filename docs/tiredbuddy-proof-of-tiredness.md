# TiredBuddy Proof of Tiredness Integration

This document explains how the existing TiredBuddy Telegram bot should integrate with the TOW website Proof of Tiredness system.

The website/Supabase backend is the source of truth. TiredBuddy should not calculate reward eligibility locally. It should call the website APIs and format the replies in Telegram.

## Required Bot Environment Variables

```env
TOW_WEBSITE_URL=https://www.tiredofwinningtow.com
TOW_SYNC_SECRET=use-the-same-secret-as-vercel
```

`TOW_SYNC_SECRET` is only needed if the bot or scanner will submit verified buy/sell events to `/api/tired-sync`.

## User Commands

### /link

Usage:

```text
/link rWalletAddress
```

Bot action:

1. Read Telegram username from the message sender.
2. Call `/api/tired-register`.
3. Return the generated verification code.

Request:

```http
POST /api/tired-register
Content-Type: application/json
```

Body:

```json
{
  "walletAddress": "r...",
  "telegramUsername": "telegram_user"
}
```

Success reply example:

```text
😴 Wallet linked for Proof of Tiredness.

Wallet: rabc...1234
Verification code: TOW-ABC123

Keep this code. Verification flow can be activated later.
```

### /verify

Usage:

```text
/verify rWalletAddress ABC123
```

Bot action:

1. Call `/api/tired-verify`.
2. Confirm whether the code matched.

Request:

```http
POST /api/tired-verify
Content-Type: application/json
```

Body:

```json
{
  "walletAddress": "r...",
  "verificationCode": "ABC123"
}
```

Success reply example:

```text
✅ Verified. You are officially still here.
```

### /status

Usage options:

```text
/status
/status rWalletAddress
```

Bot action:

1. If wallet is provided, use it.
2. If no wallet is provided, look up Telegram username in bot-side memory or ask user to run `/link` first.
3. Call `/api/tired-status?wallet=r...`.

Request:

```http
GET /api/tired-status?wallet=r...
```

Success reply example:

```text
💀 Too Tired To Quit

Wallet: rabc...1234
State: 💀 Fully Exhausted
Still Here: 2
Days Still Here: 21
Committed: 250,000 TOW
Unlocked: 93,750 TOW
Remaining: 31,250 TOW
Activity Score: 420

Selling ends eligibility.
```

### /leaderboard

Usage:

```text
/leaderboard
```

Bot action:

Call `/api/tired-leaderboard` and display top 5 or top 10.

Request:

```http
GET /api/tired-leaderboard
```

Success reply example:

```text
🏆 Too Tired To Quit Leaderboard

#1 rabc...1234 — 💀 Fully Exhausted — 520 pts
#2 rxyz...8888 — 🫠 Burnt Out — 460 pts
#3 rdef...4444 — 😵‍💫 Still Here — 390 pts
```

### /stillhere

Alias for `/status`.

This is more on-brand for group chat.

## Admin / Scanner Event Sync

The scanner or admin bot can submit confirmed XRPL events to the website backend.

Endpoint:

```http
POST /api/tired-sync
x-tow-sync-secret: YOUR_SECRET
Content-Type: application/json
```

Buy event body:

```json
{
  "walletAddress": "r...",
  "txHash": "ABC123",
  "eventType": "buy",
  "xrpValue": 50,
  "towAmount": 100000,
  "ledgerIndex": 123456,
  "eventAt": "2026-05-24T00:00:00.000Z"
}
```

If the buy is at least 50 XRP and has a TOW amount, the backend creates a Still Here commitment.

Reward cap:

```text
maxRewardTow = towAmount * 0.5
```

Example:

```text
Buy 100,000 TOW -> max reward 50,000 TOW
```

Sell event body:

```json
{
  "walletAddress": "r...",
  "txHash": "XYZ789",
  "eventType": "sell",
  "xrpValue": 10,
  "towAmount": 20000,
  "ledgerIndex": 123999,
  "eventAt": "2026-05-25T00:00:00.000Z"
}
```

Any sell marks all alive Still Here commitments for that wallet as disqualified.

## Important Safety Rules

- TiredBuddy should never ask for seed phrases.
- TiredBuddy should never request wallet signing for the MVP.
- TiredBuddy only tracks public wallet data.
- Website/Supabase remains the source of truth.
- Selling ends eligibility.
- Rewards are shown in TOW supply, not XRP value.
