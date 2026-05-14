export async function sendToTelegram(
  username: string,
  postUrl: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return false;
  }

  const message =
    `🚨 New TOW raid post by @${username}\n\n` +
    `Raid it:\n${postUrl}`;

  const url =
    `https://api.telegram.org/bot${botToken}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: false,
    }),
  });

  return res.ok;
}
