import { raidConfig } from "@/config/raidBoard";

export async function sendToTelegram(username: string, postUrl: string): Promise<boolean> {
  if (!raidConfig.telegramEnabled || !raidConfig.telegramBotToken || !raidConfig.telegramChatId) {
    return false;
  }

  const message = `New TOW post by @${username}\nRaid it: ${postUrl}`;
  const url = `https://api.telegram.org/bot${raidConfig.telegramBotToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: raidConfig.telegramChatId,
        text: message,
        disable_web_page_preview: false,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Telegram send failed:", error);
    return false;
  }
}
