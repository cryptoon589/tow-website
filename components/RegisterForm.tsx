"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRaider, getCurrentUser } from "@/lib/raidStorage";
import { formatHandle, normalizeHandle } from "@/config/raidBoard";

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

    const cleanXUsername = normalizeHandle(xUsername);
    const cleanWallet = wallet.trim();
    const cleanTelegram = normalizeHandle(telegram);

    if (!cleanXUsername) {
      setError("X username is required.");
      return;
    }

    if (!/^[A-Za-z0-9_]{1,15}$/.test(cleanXUsername)) {
      setError("Enter your X username only, without @.");
      return;
    }

    if (!cleanWallet) {
      setError("Wallet address is required.");
      return;
    }

    if (cleanWallet.length < 10) {
      setError("Invalid wallet address.");
      return;
    }

    saveRaider({
      xUsername: cleanXUsername,
      wallet: cleanWallet,
      telegram: cleanTelegram || undefined,
      registeredAt: new Date().toISOString(),
    });

    router.push("/raid-board");
  };

  if (existingUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">Already Registered</h1>
        <div className="rounded-lg border-2 border-black bg-gray-50 p-6">
          <p className="mb-2">
            <span className="font-bold">X:</span>{" "}
            {formatHandle(existingUser.xUsername)}
          </p>
          <p className="mb-2">
            <span className="font-bold">Wallet:</span>{" "}
            {existingUser.wallet.slice(0, 6)}...{existingUser.wallet.slice(-4)}
          </p>
          {existingUser.telegram && (
            <p className="mb-4">
              <span className="font-bold">Telegram:</span>{" "}
              {formatHandle(existingUser.telegram)}
            </p>
          )}
          <button
            onClick={() => router.push("/raid-board")}
            className="w-full rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
          >
            Go to Everyone&apos;s Tired
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Start Posting</h1>
      <p className="mb-8 text-gray-600">
        One-time setup. Your info stays in your browser.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            X Username (required)
          </label>
          <input
            type="text"
            value={xUsername}
            onChange={(event) => setXUsername(normalizeHandle(event.target.value))}
            placeholder="your_username"
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">No @ needed.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Wallet Address (required)
          </label>
          <input
            type="text"
            value={wallet}
            onChange={(event) => setWallet(event.target.value)}
            placeholder="r..."
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Telegram Username (optional)
          </label>
          <input
            type="text"
            value={telegram}
            onChange={(event) => setTelegram(normalizeHandle(event.target.value))}
            placeholder="your_telegram"
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">No @ needed.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
        >
          Start Posting
        </button>
      </div>
    </div>
  );
}
