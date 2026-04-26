"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import TowLeaderboard from "@/components/game/TowLeaderboard";
import {
  isValidXrplWallet,
  isValidXUsername,
  normalizeXUsername,
  saveRewardProfile,
} from "@/lib/towLeaderboard";

export default function PlayStartPage() {
  const router = useRouter();

  const [xUsername, setXUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");

  function startRewardRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanUsername = normalizeXUsername(xUsername);
    const cleanWallet = walletAddress.trim();

    if (!isValidXUsername(cleanUsername)) {
      setError("Enter a valid X username without spaces.");
      return;
    }

    if (!isValidXrplWallet(cleanWallet)) {
      setError("Enter a valid XRPL wallet address starting with r.");
      return;
    }

    saveRewardProfile({
      xUsername: cleanUsername,
      walletAddress: cleanWallet,
      createdAt: new Date().toISOString(),
    });

    router.push("/play?mode=earn");
  }

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-8 text-[#1E1B18]">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-black tracking-tight">
            TOW
          </Link>

          <p className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-[#B14A35] shadow-sm">
            Too Tired To Quit
          </p>
        </header>

        <section className="rounded-[32px] border border-[#E5DED3] bg-[#FFFCF8]/88 p-5 text-center shadow-[0_22px_80px_rgba(30,27,24,0.08)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B14A35]">
            Choose Your Run
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Play TOW
          </h1>

          <p className="mx-auto mt-3 max-w-[560px] text-sm font-bold leading-relaxed text-[#6F665D] md:text-base">
            Play for fun with no setup, or enter reward mode and fight for a
            weekly leaderboard boost.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/play?mode=fun"
            className="group rounded-[28px] border border-[#E5DED3] bg-white/80 p-5 shadow-[0_18px_60px_rgba(30,27,24,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(30,27,24,0.11)]"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E1B18] text-2xl">
              😴
            </div>

            <h2 className="text-2xl font-black tracking-tight">
              Just Play For Fun
            </h2>

            <p className="mt-2 text-sm font-bold leading-relaxed text-[#6F665D]">
              No wallet. No X username. Just survive the tiredness.
            </p>

            <div className="mt-5 rounded-2xl bg-[#F8F1E7] px-4 py-3 text-center text-sm font-black text-[#1E1B18] transition group-hover:bg-[#1E1B18] group-hover:text-white">
              Start Fun Run
            </div>
          </Link>

          <form
            onSubmit={startRewardRun}
            className="rounded-[28px] border border-[#E5DED3] bg-white/88 p-5 shadow-[0_18px_60px_rgba(30,27,24,0.07)]"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B14A35] text-2xl">
              🏆
            </div>

            <h2 className="text-2xl font-black tracking-tight">
              Play & Earn Rewards
            </h2>

            <p className="mt-2 text-sm font-bold leading-relaxed text-[#6F665D]">
              Enter your X and XRPL wallet. Your score and runs count toward the
              weekly leaderboard.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-left">
                <span className="text-xs font-black uppercase tracking-wide text-[#81766B]">
                  X Username
                </span>
                <input
                  value={xUsername}
                  onChange={(event) => {
                    setError("");
                    setXUsername(event.target.value);
                  }}
                  placeholder="@username"
                  className="mt-1 w-full rounded-2xl border border-[#E5DED3] bg-[#FFFCF8] px-4 py-3 text-sm font-black outline-none focus:border-[#B14A35]"
                />
              </label>

              <label className="block text-left">
                <span className="text-xs font-black uppercase tracking-wide text-[#81766B]">
                  XRPL Wallet
                </span>
                <input
                  value={walletAddress}
                  onChange={(event) => {
                    setError("");
                    setWalletAddress(event.target.value);
                  }}
                  placeholder="r..."
                  className="mt-1 w-full rounded-2xl border border-[#E5DED3] bg-[#FFFCF8] px-4 py-3 text-sm font-black outline-none focus:border-[#B14A35]"
                />
              </label>
            </div>

            {error ? (
              <p className="mt-3 rounded-2xl bg-[#FFE8DF] px-3 py-2 text-sm font-black text-[#B14A35]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-4 w-full cursor-pointer rounded-2xl bg-[#B14A35] px-4 py-3 text-sm font-black text-white shadow-[0_12px_32px_rgba(177,74,53,0.24)] transition hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Reward Run
            </button>

            <p className="mt-3 text-center text-xs font-bold text-[#81766B]">
              Wallet is only used for reward tracking. No signing. No connection.
            </p>
          </form>
        </section>

        <TowLeaderboard />
      </div>
    </main>
  );
}