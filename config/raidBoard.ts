export interface Raider {
  xUsername: string;
  wallet: string;
  telegram?: string;
  registeredAt: string;
}

export interface RaidPost {
  id: string;
  xUsername: string;
  wallet: string;
  telegram?: string;
  postUrl: string;
  timestamp: string;
  weekId: string;
}

export const raidConfig = {
  telegramBotToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || "",
  telegramEnabled: false, // Set to true when bot token and chat ID are configured
  maxPostsPerHour: 5,
  adminSecret: process.env.NEXT_PUBLIC_ADMIN_SECRET || "tow-admin-2026",
};

export function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDays = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNum}`;
}

export function validateXUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "x.com" || parsed.hostname === "twitter.com") &&
      parsed.pathname.split("/").length >= 3
    );
  } catch {
    return false;
  }
}
