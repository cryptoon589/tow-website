"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCurrentUser,
  getPosts,
  savePost,
  deletePost,
} from "@/lib/raidStorage";
import { validateXUrl, getCurrentWeekId, RaidPost } from "@/config/raidBoard";

type RaidLeaderboardEntry = {
  xUsername: string;
  wallet: string;
  count: number;
};

export default function RaidBoard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<RaidPost[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const weekId = getCurrentWeekId();

  const leaderboard = useMemo(() => {
    const counts: Record<string, RaidLeaderboardEntry> = {};

    posts.forEach((post) => {
      if (!counts[post.xUsername]) {
        counts[post.xUsername] = {
          xUsername: post.xUsername,
          wallet: post.wallet,
          count: 0,
        };
      }

      counts[post.xUsername].count += 1;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [posts]);

  async function refreshPosts() {
    setLoading(true);

    try {
      const fetchedPosts = await getPosts(weekId);
      setPosts(fetchedPosts);
    } catch {
      setError("Could not load raid posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setUser(getCurrentUser());
    refreshPosts();
  }, [weekId]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please register first.");
      return;
    }

    const cleanUrl = postUrl.trim();

    if (!validateXUrl(cleanUrl)) {
      setError("Invalid X/Twitter URL. Must be x.com or twitter.com.");
      return;
    }

    if (posts.some((p) => p.postUrl === cleanUrl)) {
      setError("This post was already submitted this week.");
      return;
    }

    const recentlyPosted = posts.some((p) => {
      if (p.xUsername !== user.xUsername) return false;

      const minutesSincePost =
        (Date.now() - new Date(p.timestamp).getTime()) / 60000;

      return minutesSincePost < 12;
    });

    if (recentlyPosted) {
      setError("Wait 12 minutes between posts. You're tired, not a bot.");
      return;
    }

    const newPost: RaidPost = {
      id: crypto.randomUUID(),
      xUsername: user.xUsername,
      wallet: user.wallet,
      telegram: user.telegram,
      postUrl: cleanUrl,
      timestamp: new Date().toISOString(),
      weekId,
    };

    setSubmitting(true);

    try {
      await savePost(newPost);
      await refreshPosts();

      setPostUrl("");
      setSuccess("Posted. Still tired.");
    } catch {
      setError("Could not submit post. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    setError("");
    setSuccess("");

    try {
      await deletePost(postId);
      await refreshPosts();
      setSuccess("Post removed.");
    } catch {
      setError("Could not remove post.");
    }
  };

  const totalPosts = posts.length;
  const totalContributors = new Set(posts.map((p) => p.xUsername)).size;
  const userCount = user
    ? posts.filter((p) => p.xUsername === user.xUsername).length
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold md:text-5xl">
        Everyone&apos;s Tired
      </h1>

      <p className="mb-8 text-lg text-gray-600">
        Still posting. Still here. Still tired.
      </p>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border-2 border-black bg-gray-50 p-4 text-center">
          <div className="text-3xl font-bold">{totalPosts}</div>
          <div className="text-sm text-gray-600">Posts This Week</div>
        </div>

        <div className="rounded-lg border-2 border-black bg-gray-50 p-4 text-center">
          <div className="text-3xl font-bold">{totalContributors}</div>
          <div className="text-sm text-gray-600">Still Posting</div>
        </div>

        <div className="rounded-lg border-2 border-black bg-gray-50 p-4 text-center">
          <div className="text-3xl font-bold">{userCount}</div>
          <div className="text-sm text-gray-600">Your Posts This Week</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Most Tired This Week</h2>

        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((entry, i) => (
            <div
              key={entry.xUsername}
              className="flex items-center justify-between rounded-lg border-2 border-black bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-lg font-bold">#{i + 1}</span>
                <span className="font-medium">@{entry.xUsername}</span>
              </div>

              <span className="font-bold">{entry.count} posts</span>
            </div>
          ))}

          {!loading && leaderboard.length === 0 && (
            <p className="text-sm text-gray-500">
              No one&apos;s posted yet. That&apos;s on you.
            </p>
          )}

          {loading && (
            <p className="text-sm text-gray-500">Loading tired posts...</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Drop Your Post</h2>

        {!user ? (
          <Link
            href="/register"
            className="inline-block rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
          >
            Start Posting
          </Link>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Posting as{" "}
              <span className="font-bold">@{user.xUsername}</span>{" "}
              ({user.wallet.slice(0, 6)}...{user.wallet.slice(-4)})
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="Paste X post URL..."
                className="flex-1 rounded border-2 border-black px-4 py-2 focus:outline-none"
              />

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded bg-black px-6 py-2 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Submit"}
              </button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Tired Feed</h2>

        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border-2 border-black bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-bold">@{post.xUsername}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-blue-600 hover:underline"
                  >
                    {post.postUrl}
                  </a>
                </div>

                <button
                  onClick={() => handleDelete(post.id)}
                  className="ml-4 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {!loading && posts.length === 0 && (
            <p className="text-sm text-gray-500">
              Nothing here yet. Be the first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}