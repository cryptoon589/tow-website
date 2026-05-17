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
  maxPostsPerHour: 5,
  adminSecret: process.env.NEXT_PUBLIC_ADMIN_SECRET || "tow-admin-2026",
};

export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export function formatHandle(value: string): string {
  const normalized = normalizeHandle(value);
  return normalized ? `@${normalized}` : "";
}

export function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDays = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNum}`;
}

export function validateXUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    return (
      (host === "x.com" || host === "twitter.com") &&
      parts.length >= 3 &&
      parts[1] === "status"
    );
  } catch {
    return false;
  }
}
