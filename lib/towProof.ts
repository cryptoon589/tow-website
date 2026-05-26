export type TiredLevel = {
  label: string;
  emoji: string;
  minDays: number;
};

export type RewardBreakdown = {
  basePercent: number;
  recentActivityPercent: number;
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
  status: "alive" | "disqualified";
  createdAt: string;
  disqualifiedAt?: string | null;
  sellTxHash?: string | null;
};

export const MIN_QUALIFYING_BUY_XRP = 50;
export const MAX_REWARD_TOW_RATIO = 0.15;
export const RECENT_ACTIVITY_WINDOW_DAYS = 30;

export const TIRED_LEVELS: TiredLevel[] = [
  { label: "Barely Tired", emoji: "😴", minDays: 0 },
  { label: "Still Here", emoji: "😵‍💫", minDays: 28 },
  { label: "Burnt Out", emoji: "🫠", minDays: 56 },
  { label: "Fully Exhausted", emoji: "💀", minDays: 84 },
  { label: "Too Tired To Quit", emoji: "🏆", minDays: 120 },
];

export function normalizeXUsername(value: string) {
  return value.trim().replace(/^@+/, "");
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
  const basePercent = input.holdDays >= 84 ? 10 : input.holdDays >= 56 ? 7.5 : input.holdDays >= 28 ? 5 : 0;

  const recentGamePercent = Math.min(2.5, Math.floor(input.recentGameRuns / 10) * 0.5);
  const recentRaidPercent = Math.min(2.5, Math.floor(input.recentRaidPosts / 3) * 0.5);
  const recentActivityPercent = Number((recentGamePercent + recentRaidPercent).toFixed(2));

  const lifetimeRunPercent = Math.min(1, Math.floor(input.gameRuns / 100) * 0.25);
  const lifetimeRaidPercent = Math.min(0.75, Math.floor(input.raidPosts / 25) * 0.25);
  const lifetimeScorePercent = Math.min(0.25, Math.floor(input.gameBestScore / 1000) * 0.25);
  const historyPercent = Number((lifetimeRunPercent + lifetimeRaidPercent + lifetimeScorePercent).toFixed(2));

  const totalPercent = Math.min(15, Number((basePercent + recentActivityPercent + historyPercent).toFixed(2)));

  return {
    basePercent,
    recentActivityPercent,
    historyPercent,
    totalPercent,
  };
}

export function calculateMaxRewardTow(towAmount: number) {
  if (!Number.isFinite(towAmount) || towAmount <= 0) return 0;
  return Number((towAmount * MAX_REWARD_TOW_RATIO).toFixed(6));
}

export function calculateUnlockedRewardTow(input: number | { towAmount: number; rewardPercent: number }, holdDays?: number) {
  if (typeof input === "number") {
    const maxRewardTow = input;
    if (!Number.isFinite(maxRewardTow) || maxRewardTow <= 0 || !holdDays) return 0;
    const weeksHeld = Math.floor(holdDays / 7);
    const legacyRatio = Math.min(1, weeksHeld / 5);
    return Number((maxRewardTow * legacyRatio).toFixed(6));
  }

  const towAmount = input.towAmount;
  const rewardPercent = input.rewardPercent;

  if (!Number.isFinite(towAmount) || towAmount <= 0) return 0;
  if (!Number.isFinite(rewardPercent) || rewardPercent <= 0) return 0;

  return Number((towAmount * (rewardPercent / 100)).toFixed(6));
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
  const holdScore = input.holdDays * 10;
  const commitmentScore = input.alivePositions * 100;
  const towScore = Math.sqrt(Math.max(0, input.totalTowAmount) / 1000);
  const raidScore = input.raidPosts * 2;
  const runScore = input.gameRuns;
  const bestScore = Math.floor(input.gameBestScore / 20);

  return Math.floor(holdScore + commitmentScore + towScore + raidScore + runScore + bestScore);
}

export const calculateActivityScore = calculateSurvivalScore;