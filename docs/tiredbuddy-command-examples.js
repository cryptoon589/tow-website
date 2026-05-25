// Example TiredBuddy command handlers for Proof of Tiredness.
// Adapt these into your existing Telegram bot structure.

const WEBSITE_URL = process.env.TOW_WEBSITE_URL;

function maskWallet(wallet) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

async function api(path, options = {}) {
  const response = await fetch(`${WEBSITE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "API request failed.");
  }

  return data;
}

// /link rWallet
async function handleLinkCommand(bot, msg, args) {
  const walletAddress = args[0];
  const telegramUsername = msg.from?.username || null;

  if (!walletAddress) {
    return bot.sendMessage(
      msg.chat.id,
      "Usage: /link rWalletAddress"
    );
  }

  try {
    const data = await api("/api/tired-register", {
      method: "POST",
      body: JSON.stringify({
        walletAddress,
        telegramUsername,
      }),
    });

    await bot.sendMessage(
      msg.chat.id,
      `😴 Wallet linked.\n\nWallet: ${maskWallet(walletAddress)}\nVerification code: ${data.verificationCode}\n\nStill here.`
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
  }
}

// /verify rWallet CODE
async function handleVerifyCommand(bot, msg, args) {
  const walletAddress = args[0];
  const verificationCode = args[1];

  if (!walletAddress || !verificationCode) {
    return bot.sendMessage(
      msg.chat.id,
      "Usage: /verify rWalletAddress CODE"
    );
  }

  try {
    await api("/api/tired-verify", {
      method: "POST",
      body: JSON.stringify({
        walletAddress,
        verificationCode,
      }),
    });

    await bot.sendMessage(
      msg.chat.id,
      "✅ Verified. Officially still here."
    );
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
  }
}

// /status rWallet
async function handleStatusCommand(bot, msg, args) {
  const walletAddress = args[0];

  if (!walletAddress) {
    return bot.sendMessage(
      msg.chat.id,
      "Usage: /status rWalletAddress"
    );
  }

  try {
    const data = await api(
      `/api/tired-status?wallet=${encodeURIComponent(walletAddress)}`
    );

    const message = [
      `💀 Too Tired To Quit`,
      ``,
      `Wallet: ${maskWallet(data.walletAddress)}`,
      `State: ${data.tiredLevel.emoji} ${data.tiredLevel.label}`,
      `Still Here: ${data.alivePositions}`,
      `Days Still Here: ${data.holdDays}`,
      `Committed: ${Number(data.totalTowAmount).toLocaleString()} TOW`,
      `Unlocked: ${Number(data.unlockedRewardTow).toLocaleString()} TOW`,
      `Remaining: ${Number(data.remainingRewardTow).toLocaleString()} TOW`,
      `Activity Score: ${data.activityScore}`,
      ``,
      `Selling ends eligibility.`,
    ].join("\n");

    await bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
  }
}

// /leaderboard
async function handleLeaderboardCommand(bot, msg) {
  try {
    const data = await api("/api/tired-leaderboard");

    const lines = ["🏆 Too Tired To Quit", ""];

    for (const entry of data.entries.slice(0, 10)) {
      lines.push(
        `#${entry.rank} ${maskWallet(entry.walletAddress)} — ${entry.tiredLevel.emoji} ${entry.tiredLevel.label} — ${entry.activityScore} pts`
      );
    }

    await bot.sendMessage(msg.chat.id, lines.join("\n"));
  } catch (error) {
    await bot.sendMessage(msg.chat.id, `❌ ${error.message}`);
  }
}

module.exports = {
  handleLinkCommand,
  handleVerifyCommand,
  handleStatusCommand,
  handleLeaderboardCommand,
};
