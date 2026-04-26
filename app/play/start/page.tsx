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
    <main className="rounded-full border border-black bg-white min-h-screen bg-white px-4 py-5 text-[#111]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-black tracking-tight">
            TOW
          </Link>

          <p className="px-3 py-1 text-xs font-black">
            Too Tired To Quit
          </p>
        </header>

        <section className="grid min-h-[calc(100vh-72px)] gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <section className="rounded-[28px] border-2 border-black bg-white p-4 shadow-[8px_8px_0_#111]">
              <p className="text-xs font uppercase tracking-[0.24em] text-[#6D3BFF]">
                Choose Your Run
             </p>

             <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                Play TOW
            </h1>
            </section>

            <Link
              href="/play?mode=fun"
              className="group rounded-[24px] border-2 border-black bg-white p-4 shadow-[6px_6px_0_#111]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-2xl">
                  😴
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-black tracking-tight">
                    Just Play For Fun
                  </h2>
                  <p className="mt-1 text-sm font-bold text-[#555]">
                    No wallet. No X username. Just survive.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border-2 border-black bg-black px-4 py-3 text-center text-sm font-black text-white transition group-hover:bg-white group-hover:text-black">
                Start Fun Run
              </div>
            </Link>

            <form
              onSubmit={startRewardRun}
              className="rounded-[24px] border-2 border-black bg-white p-4 shadow-[6px_6px_0_#111] transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-2xl">
                  🏆
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Play & Earn Rewards
                  </h2>
                  <p className="mt-1 text-sm font-bold text-[#555]">
                    Submit your run to the weekly leaderboard.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-[#555]">
                    X Username
                  </span>
                  <input
                    value={xUsername}
                    onChange={(event) => {
                      setError("");
                      setXUsername(event.target.value);
                    }}
                    placeholder="@username"
                    className="mt-1 w-full rounded-2xl border-2 border-black bg-white px-4 py-3 text-sm font-black outline-none focus:border-[#B14A35]"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-[#555]">
                    XRPL Wallet
                  </span>
                  <input
                    value={walletAddress}
                    onChange={(event) => {
                      setError("");
                      setWalletAddress(event.target.value);
                    }}
                    placeholder="r..."
                    className="mt-1 w-full rounded-2xl border-2 border-black bg-white px-4 py-3 text-sm font-black outline-none focus:border-[#B14A35]"
                  />
                </label>
              </div>

              {error ? (
                <p className="mt-3 rounded-2xl border-2 border-[#B14A35] bg-[#FFE8DF] px-3 py-2 text-sm font-black text-[#B14A35]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-4 w-full cursor-pointer rounded-2xl border-2 border-black bg-[#6D3BFF] px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(109,59,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#5B2BE8] active:translate-y-0"
              >
                🎮 Start Reward Run
              </button>

              <p className="mt-3 text-center text-xs font-bold text-[#555]">
                Wallet is only used for reward tracking. No signing. No connection.
              </p>
            </form>
          </div>

          <div className="lg:sticky lg:top-5">
            <TowLeaderboard />
          </div>
        </section>
      </div>
    </main>
  );
}