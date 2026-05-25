export type TiredLevel = {
  label: string;
  emoji: string;
  minDays: number;
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
  gameBestScore: number;
  gameRuns: number;
  raidPosts: number;
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
export const MAX_REWARD_TOW_RATIO = 0.5;

export const TIRED_LEVELS: TiredLevel[] = [
  { label: "Barely Tired", emoji: "😴", minDays: 0 },
  { label: "Still Here", emoji: "😵‍💫", minDays: 7 },
  { label: "Burnt Out", emoji: "🫠", minDays: 14 },
  { label: "Fully Exhausted", emoji: "💀", minDays: 21 },
  { label: "Too Tired To Quit", emoji: "🏆", minDays: 28 },
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

export function calculateMaxRewardTow(towAmount: number) {
  if (!Number.isFinite(towAmount) || towAmount <= 0) return 0;
  return Number((towAmount * MAX_REWARD_TOW_RATIO).toFixed(6));
}

export function calculateUnlockedRewardTow(maxRewardTow: number, holdDays: number) {
  if (!Number.isFinite(maxRewardTow) || maxRewardTow <= 0) return 0;
  const weeklyUnlocks = Math.min(4, Math.floor(holdDays / 7));
  const unlockRatio = weeklyUnlocks * 0.25;
  return Number((maxRewardTow * unlockRatio).toFixed(6));
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

export function calculateActivityScore(input: {
  holdDays: number;
  gameBestScore: number;
  gameRuns: number;
  raidPosts: number;
  alivePositions: number;
}) {
  const holdScore = Math.min(280, input.holdDays * 10);
  const gameScore = Math.min(250, Math.floor(input.gameBestScore / 10));
  const runScore = Math.min(100, input.gameRuns * 10);
  const raidScore = Math.min(200, input.raidPosts * 25);
  const positionScore = Math.min(100, input.alivePositions * 25);
  return holdScore + gameScore + runScore + raidScore + positionScore;
}
