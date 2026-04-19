"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveRaider, getCurrentUser } from "@/lib/raidStorage";

export default function RegisterForm() {
  const router = useRouter();
  const [xUsername, setXUsername] = useState("");
  const [wallet, setWallet] = useState("");
  const [telegram, setTelegram] = useState("");
  const [error, setError] = useState("");
  const [existingUser, setExistingUser] = useState<any>(null);

  useEffect(() => {
    setExistingUser(getCurrentUser());
  }, []);

  const handleSubmit = () => {
    setError("");

    if (!xUsername.trim()) {
      setError("X username is required.");
      return;
    }

    if (!wallet.trim()) {
      setError("Wallet address is required.");
      return;
    }

    if (wallet.length < 10) {
      setError("Invalid wallet address.");
      return;
    }

    saveRaider({
      xUsername: xUsername.trim(),
      wallet: wallet.trim(),
      telegram: telegram.trim() || undefined,
      registeredAt: new Date().toISOString(),
    });

    router.push("/raid-board");
  };

  if (existingUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Already Registered</h1>
        <div className="bg-gray-50 border-2 border-black rounded-lg p-6">
          <p className="mb-2"><span className="font-bold">X:</span> @{existingUser.xUsername}</p>
          <p className="mb-2"><span className="font-bold">Wallet:</span> {existingUser.wallet.slice(0, 6)}...{existingUser.wallet.slice(-4)}</p>
          {existingUser.telegram && <p className="mb-4"><span className="font-bold">Telegram:</span> @{existingUser.telegram}</p>}
          <button onClick={() => router.push("/raid-board")} className="w-full px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800">
            Go to Raid Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Register as Raider</h1>
      <p className="text-gray-600 mb-8">One-time setup. Your info is stored in your browser.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">X Username (required)</label>
          <input
            type="text"
            value={xUsername}
            onChange={(e) => setXUsername(e.target.value)}
            placeholder="your_username"
            className="w-full px-4 py-2 border-2 border-black rounded focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Wallet Address (required)</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="r..."
            className="w-full px-4 py-2 border-2 border-black rounded focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Telegram Username (optional)</label>
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@your_telegram"
            className="w-full px-4 py-2 border-2 border-black rounded focus:outline-none"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button onClick={handleSubmit} className="w-full px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800">
          Register
        </button>
      </div>
    </div>
  );
}
