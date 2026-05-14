import { Raider, RaidPost } from "@/config/raidBoard";

const USER_KEY = "tow-raider-user";

export function saveRaider(raider: Raider): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(USER_KEY, JSON.stringify(raider));
}

export function getCurrentUser(): Raider | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function savePost(post: RaidPost): Promise<void> {
  const response = await fetch("/api/raid-board", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    throw new Error("Could not submit raid post.");
  }
}

export async function getPosts(weekId?: string): Promise<RaidPost[]> {
  const params = weekId
    ? `?weekId=${encodeURIComponent(weekId)}`
    : "";

  const response = await fetch(`/api/raid-board${params}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.posts ?? [];
}

export async function deletePost(postId: string): Promise<void> {
  const response = await fetch(
    `/api/raid-board?id=${encodeURIComponent(postId)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Could not delete raid post.");
  }
}