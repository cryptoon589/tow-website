"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser, getPosts, getLeaderboard, getUserWeeklyCount, savePost, deletePost, clearWeek, isDuplicateUrl, hasSubmittedRecently } from "@/lib/raidStorage";
import { validateXUrl, getCurrentWeekId, RaidPost } from "@/config/raidBoard";
import { sendToTelegram } from "@/lib/telegram";

export default function RaidBoard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<RaidPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const weekId = getCurrentWeekId();

  useEffect(() => {
    setUser(getCurrentUser());
    setPosts(getPosts(weekId));
    setLeaderboard(getLeaderboard(weekId));
  }, [weekId]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!user) {
      setError("Please register first.");
      return;
    }

    if (!validateXUrl(postUrl)) {
      setError("Invalid X/Twitter URL. Must be x.com or twitter.com.");
      return;
    }

    if (isDuplicateUrl(postUrl, weekId)) {
      setError("This post was already submitted this week.");
      return;
    }

    if (hasSubmittedRecently(user.xUsername, 12)) {
      setError("Please wait 12 minutes between submissions.");
      return;
    }

    const newPost: RaidPost = {
      id: Date.now().toString(),
      xUsername: user.xUsername,
      wallet: user.wallet,
      telegram: user.telegram,
      postUrl,
      timestamp: new Date().toISOString(),
      weekId,
    };

    savePost(newPost);
    setPosts(getPosts(weekId));
    setLeaderboard(getLeaderboard(weekId));
    setPostUrl("");
    setSuccess("Post submitted!");

    // Send to Telegram
    sendToTelegram(user.xUsername, postUrl);
  };

  const handleDelete = (postId: string) => {
    deletePost(postId);
    setPosts(getPosts(weekId));
    setLeaderboard(getLeaderboard(weekId));
  };

  const handleClearWeek = () => {
    if (confirm("Clear all posts for this week? This cannot be undone.")) {
      clearWeek(weekId);
      setPosts([]);
      setLeaderboard([]);
      setSuccess("Week cleared!");
    }
  };

  const handleAdminLogin = () => {
    if (adminSecret === "tow-admin-2026") {
      setAdminMode(true);
      setAdminSecret("");
    } else {
      setError("Wrong admin secret.");
    }
  };

  const totalPosts = posts.length;
  const totalContributors = new Set(posts.map((p) => p.xUsername)).size;
  const userCount = user ? getUserWeeklyCount(user.xUsername, weekId) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">TOW Raid Board</h1>
      <p className="text-lg text-gray-600 mb-8">Submit your X posts. Raid together. Win tired.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 border-2 border-black rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{totalPosts}</div>
          <div className="text-sm text-gray-600">Posts This Week</div>
        </div>
        <div className="bg-gray-50 border-2 border-black rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{totalContributors}</div>
          <div className="text-sm text-gray-600">Contributors</div>
        </div>
        <div className="bg-gray-50 border-2 border-black rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{userCount}</div>
          <div className="text-sm text-gray-600">Your Posts</div>
        </div>
      </div>

      {/* Top 5 Leaderboard */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Top Raiders This Week</h2>
        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((entry, i) => (
            <div key={entry.xUsername} className="flex items-center justify-between bg-white border-2 border-black rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-8">#{i + 1}</span>
                <span className="font-medium">@{entry.xUsername}</span>
              </div>
              <span className="font-bold">{entry.count} posts</span>
            </div>
          ))}
          {leaderboard.length === 0 && <p className="text-gray-500 text-sm">No posts yet this week.</p>}
        </div>
      </div>

      {/* Submission Area */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Submit a Post</h2>
        {!user ? (
          <Link href="/register" className="inline-block px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800">
            Register as Raider
          </Link>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Registered as <span className="font-bold">@{user.xUsername}</span> ({user.wallet.slice(0, 6)}...{user.wallet.slice(-4)})
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="Paste X post URL..."
                className="flex-1 px-4 py-2 border-2 border-black rounded focus:outline-none"
              />
              <button onClick={handleSubmit} className="px-6 py-2 bg-black text-white font-bold rounded hover:bg-gray-800">
                Submit
              </button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>
        )}
      </div>

      {/* Live Feed */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Live Raid Feed</h2>
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border-2 border-black rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">@{post.xUsername}</span>
                    <span className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                    {post.postUrl}
                  </a>
                </div>
                {adminMode && (
                  <button onClick={() => handleDelete(post.id)} className="text-red-600 text-sm hover:underline ml-4">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-gray-500 text-sm">No posts yet. Be the first!</p>}
        </div>
      </div>

      {/* Admin Section */}
      <div className="border-t border-black pt-8">
        {!adminMode ? (
          <div className="flex gap-2">
            <input
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Admin secret..."
              className="px-4 py-2 border-2 border-black rounded focus:outline-none text-sm"
            />
            <button onClick={handleAdminLogin} className="px-4 py-2 bg-gray-200 font-bold rounded hover:bg-gray-300 text-sm">
              Admin
            </button>
          </div>
        ) : (
          <div>
            <button onClick={handleClearWeek} className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 text-sm">
              Clear Week
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
