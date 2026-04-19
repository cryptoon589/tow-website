import { Raider, RaidPost, getCurrentWeekId } from "@/config/raidBoard";

const RAIDERS_KEY = "tow-raiders";
const POSTS_KEY = "tow-raid-posts";
const USER_KEY = "tow-raider-user";

export function saveRaider(raider: Raider): void {
  localStorage.setItem(USER_KEY, JSON.stringify(raider));
  const raiders = getRaiders();
  const existing = raiders.findIndex((r) => r.xUsername === raider.xUsername);
  if (existing >= 0) {
    raiders[existing] = raider;
  } else {
    raiders.push(raider);
  }
  localStorage.setItem(RAIDERS_KEY, JSON.stringify(raiders));
}

export function getCurrentUser(): Raider | null {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function getRaiders(): Raider[] {
  const data = localStorage.getItem(RAIDERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePost(post: RaidPost): void {
  const posts = getPosts();
  posts.unshift(post);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function getPosts(weekId?: string): RaidPost[] {
  const data = localStorage.getItem(POSTS_KEY);
  const all = data ? JSON.parse(data) : [];
  const targetWeek = weekId || getCurrentWeekId();
  return all.filter((p: RaidPost) => p.weekId === targetWeek);
}

export function deletePost(postId: string): void {
  const posts = getPosts();
  const filtered = posts.filter((p: RaidPost) => p.id !== postId);
  localStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
}

export function clearWeek(weekId?: string): void {
  const targetWeek = weekId || getCurrentWeekId();
  const posts = getPosts();
  const filtered = posts.filter((p: RaidPost) => p.weekId !== targetWeek);
  localStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
}

export function getLeaderboard(weekId?: string): { xUsername: string; wallet: string; count: number }[] {
  const posts = getPosts(weekId);
  const counts: Record<string, { wallet: string; count: number }> = {};
  posts.forEach((p: RaidPost) => {
    if (!counts[p.xUsername]) {
      counts[p.xUsername] = { wallet: p.wallet, count: 0 };
    }
    counts[p.xUsername].count++;
  });
  return Object.entries(counts)
    .map(([username, data]) => ({ xUsername: username, wallet: data.wallet, count: data.count }))
    .sort((a, b) => b.count - a.count);
}

export function getUserWeeklyCount(xUsername: string, weekId?: string): number {
  const posts = getPosts(weekId);
  return posts.filter((p: RaidPost) => p.xUsername === xUsername).length;
}

export function hasSubmittedRecently(xUsername: string, minutes = 60): boolean {
  const posts = getPosts();
  const now = Date.now();
  return posts.some((p: RaidPost) => {
    if (p.xUsername !== xUsername) return false;
    const postTime = new Date(p.timestamp).getTime();
    return (now - postTime) / 60000 < minutes;
  });
}

export function isDuplicateUrl(url: string, weekId?: string): boolean {
  const posts = getPosts(weekId);
  return posts.some((p: RaidPost) => p.postUrl === url);
}
