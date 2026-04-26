export type TowGameMode = "fun" | "earn";

export type TowPlayerProfile = {
  xUsername: string;
  walletAddress: string;
  createdAt: string;
};

export type TowLeaderboardEntry = {
  id: string;
  xUsername: string;
  walletAddress: string;
  score: number;
  runs: number;
  bestScore: number;
  lastPlayedAt: string;
};

const PROFILE_KEY = "tow_reward_player_profile";
const LEADERBOARD_KEY = "tow_weekly_leaderboard";

export function normalizeXUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

export function isValidXUsername(value: string) {
  const username = normalizeXUsername(value);
  return /^[A-Za-z0-9_]{1,15}$/.test(username);
}

export function isValidXrplWallet(value: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim());
}

export function saveRewardProfile(profile: TowPlayerProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getRewardProfile(): TowPlayerProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as TowPlayerProfile) : null;
  } catch {
    return null;
  }
}

export function getLeaderboard(): TowLeaderboardEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const entries = raw ? (JSON.parse(raw) as TowLeaderboardEntry[]) : [];
    return entries.sort((a, b) => b.bestScore - a.bestScore);
  } catch {
    return [];
  }
}

export function submitLeaderboardScore(score: number) {
  if (typeof window === "undefined") return;

  const profile = getRewardProfile();
  if (!profile) return;

  const entries = getLeaderboard();
  const existingIndex = entries.findIndex(
    (entry) => entry.walletAddress === profile.walletAddress
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = entries[existingIndex];

    entries[existingIndex] = {
      ...existing,
      score,
      runs: existing.runs + 1,
      bestScore: Math.max(existing.bestScore, score),
      lastPlayedAt: now,
    };
  } else {
    entries.push({
      id: crypto.randomUUID(),
      xUsername: profile.xUsername,
      walletAddress: profile.walletAddress,
      score,
      runs: 1,
      bestScore: score,
      lastPlayedAt: now,
    });
  }

  localStorage.setItem(
    LEADERBOARD_KEY,
    JSON.stringify(entries.sort((a, b) => b.bestScore - a.bestScore).slice(0, 50))
  );
}