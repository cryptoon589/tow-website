export type TiredLevel = {
  label: string;
  emoji: string;
  minDays: number;
};

export type RewardBreakdown = {
  basePercent: number;
  survivalUnlockPercent: number;
  raidBonusPercent: number;
  gameBonusPercent: number;
  recentActivityPercent: number;
  loyaltyBonusPercent: number;
  historyPercent: number;
  totalPercent: number;
};

export type TiredStatus = {
  walletAddress: string;
  xUsername?: string | null;
  telegram?: string | null;
  eligible: boolean;
  disqualified: boolean;
  tiredLevel: TiredLevel;
  holdDays: number;
  alivePositions: number;
  disqualifiedPositions: number;
  totalQualifyingXrp: number;
  totalTowAmount: number;
  maxRewardTow: number;
  unlockedRewardTow: number;
  remainingRewardTow: number;
  rewardBreakdown: RewardBreakdown;
  gameBestScore: number;
  gameRuns: number;
  raidPosts: number;
  recentGameRuns: number;
  recentRaidPosts: number;
  survivalScore: number;
  activityScore: number;
  lastSellAt?: string | null;
  positions: TiredPosition[];
};

export type TiredPosition = {
  id: string;
  walletAddress: string;
  buyTxHash: string;
  buyValueXrp: number;
  towAmount: number;
  maxRewardTow: number;
  unlockedRewardTow: number;
  status: "alive" | "claimed" | "disqualified" | "paid";
  rewardStatus?: string | null;
  createdAt: string;
  claimedAt?: string | null;
  disqualifiedAt?: string | null;
  sellTxHash?: string | null;
};

export const MIN_QUALIFYING_BUY_XRP = 50;
export const MAX_REWARD_PERCENT = 20;
export const RECENT_ACTIVITY_WINDOW_DAYS = 30;
export const RECENT_GAME_RUN_CAP = 50;

export const TIRED_LEVELS: TiredLevel[] = [
  { label: "Barely Tired", emoji: "😴", minDays: 0 },
  { label: "Still Here", emoji: "😵‍💫", minDays: 28 },
  { label: "Burnt Out", emoji: "🫠", minDays: 56 },
  { label: "Fully Exhausted", emoji: "💀", minDays: 84 },
  { label: "Too Tired To Quit", emoji: "🏆", minDays: 120 },
];

export function normalizeXUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function isValidXUsername(value: string) {
  return /^[A-Za-z0-9_]{1,15}$/.test(normalizeXUsername(value));
}

export function isValidXrplWallet(value: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value.trim());
}

export function getHoldDays(isoDate?: string | null) {
  if (!isoDate) return 0;
  const then = new Date(isoDate).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86400000));
}

export function getTiredLevel(days: number) {
  return [...TIRED_LEVELS].reverse().find((level) => days >= level.minDays) ?? TIRED_LEVELS[0];
}

export function calculateRewardBreakdown(input: {
  holdDays: number;
  recentGameRuns: number;
  recentRaidPosts: number;
  gameRuns: number;
  raidPosts: number;
  gameBestScore: number;
}) {
  // Core commitment unlock progression
  const survivalUnlockPercent =
    input.holdDays >= 84
      ? 15
      : input.holdDays >= 56
      ? 7
      : input.holdDays >= 28
      ? 2.5
      : 0;

  /**
   * RAID BONUS
   * Primary ecosystem activity.
   */
  const raidBonusPercent = Math.min(
  3,
  Number(
    (input.recentRaidPosts * 0.5).toFixed(2)
  )
);

  /**
   * GAME BONUS
   * Secondary ecosystem participation.
   */
  const cappedRecentGameRuns = Math.min(
    RECENT_GAME_RUN_CAP,
    Math.max(0, input.recentGameRuns)
  );

  const gameBonusPercent = Math.min(
  1,
  Number(
    (
      cappedRecentGameRuns * 0.1
    ).toFixed(2)
  )
);

  /**
   * RECENT ACTIVITY BONUS
   * Separate from raid/game totals.
   * Represents current ecosystem presence.
   */
  const recentActivityPercent =
  input.recentRaidPosts > 0 ||
  input.recentGameRuns > 0
    ? 1
    : 0;

  /**
   * LOYALTY BONUS
   * Long-term veteran consistency.
   */
  const loyaltyBonusPercent = Math.min(
  1,
  Number(
    (
      Math.floor(input.holdDays / 28) *
      0.25
    ).toFixed(2)
  )
);

  const activityBonusPercent = Math.min(
  5,
  raidBonusPercent +
  gameBonusPercent +
  recentActivityPercent +
  loyaltyBonusPercent
);

const totalPercent = Math.min(
  MAX_REWARD_PERCENT,
  Number(
    (
      survivalUnlockPercent +
      activityBonusPercent
    ).toFixed(2)
  )
);

  return {
    basePercent: survivalUnlockPercent,
    survivalUnlockPercent,

    raidBonusPercent,
    gameBonusPercent,

    recentActivityPercent,

    loyaltyBonusPercent,
    historyPercent: loyaltyBonusPercent,

    totalPercent,
  };
}

export function calculateMaxRewardTow(towAmount: number) {
  if (!Number.isFinite(towAmount) || towAmount <= 0) return 0;
  return Number((towAmount * (MAX_REWARD_PERCENT / 100)).toFixed(6));
}

export function calculateUnlockedRewardTow(input: {
  towAmount: number;
  holdDays?: number;
  rewardPercent?: number;
  recentGameRuns?: number;
  recentRaidPosts?: number;
  gameRuns?: number;
  raidPosts?: number;
  gameBestScore?: number;
}) {
  const towAmount = Number(input.towAmount ?? 0);

  if (!Number.isFinite(towAmount) || towAmount <= 0) {
    return 0;
  }

  let rewardPercent = Number(input.rewardPercent ?? NaN);

  if (!Number.isFinite(rewardPercent)) {
    const breakdown = calculateRewardBreakdown({
      holdDays: input.holdDays ?? 0,
      recentGameRuns: input.recentGameRuns ?? 0,
      recentRaidPosts: input.recentRaidPosts ?? 0,
      gameRuns: input.gameRuns ?? 0,
      raidPosts: input.raidPosts ?? 0,
      gameBestScore: input.gameBestScore ?? 0,
    });

    rewardPercent = breakdown.totalPercent;
  }

  if (!Number.isFinite(rewardPercent) || rewardPercent <= 0) {
    return 0;
  }

  return Number(
    (
      towAmount *
      (Math.min(MAX_REWARD_PERCENT, rewardPercent) / 100)
    ).toFixed(6)
  );
}

export function maskWallet(wallet: string) {
  if (!wallet) return "";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function formatTow(amount: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

export function calculateSurvivalScore(input: {
  holdDays: number;
  gameBestScore: number;
  gameRuns: number;
  raidPosts: number;
  alivePositions: number;
  totalTowAmount: number;
}) {
  const holdScore = input.holdDays * 2;

  const commitmentScore =
    input.alivePositions * 25;

  const towScore = Math.min(
  25,
  Math.floor(
    Math.sqrt(
      Math.max(0, input.totalTowAmount)
    ) / 50
  )
);

  const raidScore =
    input.raidPosts * 2;

  const runScore = Math.floor(
    input.gameRuns * 0.25
  );

  const bestScore = Math.floor(
    input.gameBestScore / 100
  );

  return Math.floor(
    holdScore +
      commitmentScore +
      towScore +
      raidScore +
      runScore +
      bestScore
  );
}

export const calculateActivityScore = calculateSurvivalScore;
