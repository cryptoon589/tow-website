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

export function normalizeXUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

export function isValidXUsername(value: string) {
  const username = normalizeXUsername(value);

  return /^[A-Za-z0-9_]{1,15}$/.test(username);
}

export function isValidXrplWallet(value: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(
    value.trim()
  );
}

export function saveRewardProfile(
  profile: TowPlayerProfile
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      ...profile,
      xUsername: normalizeXUsername(
        profile.xUsername
      ),
      walletAddress: profile.walletAddress.trim(),
    })
  );
}

export function getRewardProfile():
  | TowPlayerProfile
  | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PROFILE_KEY);

    return raw
      ? (JSON.parse(raw) as TowPlayerProfile)
      : null;
  } catch {
    return null;
  }
}

export async function getLeaderboard():
  Promise<TowLeaderboardEntry[]> {
  try {
    const response = await fetch(
      "/api/leaderboard",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Leaderboard failed");
    }

    const data = (await response.json()) as {
      entries: TowLeaderboardEntry[];
    };

    return data.entries ?? [];
  } catch {
    return [];
  }
}

export async function submitLeaderboardScore(
  score: number
) {
  const profile = getRewardProfile();

  if (!profile) return;

  const response = await fetch(
    "/api/leaderboard",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        xUsername: normalizeXUsername(
          profile.xUsername
        ),
        walletAddress:
          profile.walletAddress.trim(),
        score,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Could not submit leaderboard score."
    );
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("tow-leaderboard-update")
    );
  }
}