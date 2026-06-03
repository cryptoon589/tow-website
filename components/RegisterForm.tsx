"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRaider, getCurrentUser } from "@/lib/raidStorage";
import { formatHandle, normalizeHandle } from "@/config/raidBoard";
import { saveRewardProfile } from "@/lib/towLeaderboard";

export default function RegisterForm() {
  const router = useRouter();

  const [xUsername, setXUsername] = useState("");
  const [wallet, setWallet] = useState("");
  const [telegram, setTelegram] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [existingUser, setExistingUser] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const telegramBotUsername =
    process.env.TELEGRAM_BOT_USERNAME ?? "";

  useEffect(() => {
    setExistingUser(getCurrentUser());
  }, []);

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied.");
    } catch {
      setError("Could not copy text.");
    }
  }

  async function regenerateCode(targetWallet?: string) {
    setError("");
    setMessage("");

    const cleanWallet = String(targetWallet ?? wallet ?? existingUser?.wallet ?? "").trim();

    if (!cleanWallet) {
      setError("Wallet address missing.");
      return;
    }

    setGeneratingCode(true);

    try {
      const response = await fetch("/api/tired-regenerate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: cleanWallet,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not generate new code.");
      }

      setVerificationCode(data.verificationCode);
      setMessage("New verification code generated.");
    } catch (err: any) {
      setError(err.message || "Could not generate new code.");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function handleSubmit() {
    setError("");
    setMessage("");
    setVerificationCode(null);

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

    setLoading(true);

    try {
      saveRaider({
        xUsername: cleanXUsername,
        wallet: cleanWallet,
        telegram: cleanTelegram || undefined,
        registeredAt: new Date().toISOString(),
      });

      saveRewardProfile({
        xUsername: cleanXUsername,
        walletAddress: cleanWallet,
        createdAt: new Date().toISOString(),
      });

      const response = await fetch("/api/tired-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xUsername: cleanXUsername,
          walletAddress: cleanWallet,
          telegramUsername: cleanTelegram || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Could not register survivor identity."
        );
      }

      if (data?.verificationCode) {
        setVerificationCode(data.verificationCode);
        setMessage("Survivor identity saved. Verify with TiredBuddy.");
      } else {
        setMessage("Survivor identity saved.");
      }

      setExistingUser({
        xUsername: cleanXUsername,
        wallet: cleanWallet,
        telegram: cleanTelegram || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  function VerificationBox({ code }: { code: string }) {
    const command = `/verify ${code}`;

    return (
      <div className="mt-5 rounded-2xl border-2 border-black bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
          Verification Code
        </p>

        <p className="mt-2 break-all text-2xl font-black">
          {code}
        </p>

        <p className="mt-4 text-sm font-bold text-[#555]">
          Send this to TiredBuddy in DM:
        </p>

        <div className="mt-2 rounded-xl border-2 border-black bg-[#F8F8F8] p-3 font-black">
          {command}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => copyText(command)}
            className="rounded-xl border-2 border-black px-4 py-2 text-sm font-black"
          >
            Copy Command
          </button>

          {telegramBotUsername ? (
            <a
              href={`https://t.me/${telegramBotUsername.replace(/^@+/, "")}`}
              target="_blank"
              className="rounded-xl border-2 border-black bg-black px-4 py-2 text-sm font-black text-white"
            >
              Open TiredBuddy
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (existingUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">
          Survivor Identity Found
        </h1>

        <div className="rounded-lg border-2 border-black bg-gray-50 p-6">
          <p className="mb-2">
            <span className="font-bold">X:</span>{" "}
            {formatHandle(existingUser.xUsername)}
          </p>

          <p className="mb-2">
            <span className="font-bold">Wallet:</span>{" "}
            {existingUser.wallet.slice(0, 6)}
            ...
            {existingUser.wallet.slice(-4)}
          </p>

          {existingUser.telegram ? (
            <p className="mb-4">
              <span className="font-bold">Telegram:</span>{" "}
              {formatHandle(existingUser.telegram)}
            </p>
          ) : null}

          <div className="mt-4 rounded-2xl border-2 border-black bg-[#FFF4CC] p-4">
            <p className="text-sm font-black">
              Need to verify?
            </p>

            <p className="mt-1 text-sm font-bold text-[#555]">
              Generate a fresh code and send it to TiredBuddy in DM.
            </p>

            <button
              onClick={() => regenerateCode(existingUser.wallet)}
              disabled={generatingCode}
              className="mt-4 w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-black disabled:opacity-60"
            >
              {generatingCode ? "Generating..." : "Generate New Verification Code"}
            </button>

            {verificationCode ? (
              <VerificationBox code={verificationCode} />
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 text-sm font-bold text-red-600">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-4 text-sm font-bold text-green-700">
              {message}
            </p>
          ) : null}

          <button
            onClick={() => router.push("/too-tired-to-quit")}
            className="mt-5 w-full rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800"
          >
            Open Proof Of Tiredness
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">
        Register Survivor Identity
      </h1>

      <p className="mb-8 text-gray-600">
        One identity shared across TOW game, raids, rewards, and Proof Of Tiredness.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            X Username
          </label>

          <input
            type="text"
            value={xUsername}
            onChange={(event) =>
              setXUsername(normalizeHandle(event.target.value))
            }
            placeholder="your_username"
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />

          <p className="mt-1 text-xs text-gray-500">
            No @ needed.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Wallet Address
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
            Telegram Username
          </label>

          <input
            type="text"
            value={telegram}
            onChange={(event) =>
              setTelegram(normalizeHandle(event.target.value))
            }
            placeholder="your_telegram"
            className="w-full rounded border-2 border-black px-4 py-2 focus:outline-none"
          />

          <p className="mt-1 text-xs text-gray-500">
            Required.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        {message ? (
          <p className="text-sm font-bold text-green-700">
            {message}
          </p>
        ) : null}

        {verificationCode ? (
          <VerificationBox code={verificationCode} />
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded bg-black px-6 py-3 font-bold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Survivor Identity"}
        </button>
      </div>
    </div>
  );
}
