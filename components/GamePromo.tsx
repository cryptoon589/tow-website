"use client";

import Link from "next/link";
import TowCharacter from "@/components/game/TowCharacter";

export default function GamePromo() {
  return (
    <section className="border-y border-[#DDD7CE] bg-[#FFFCF8]">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="flex justify-center md:justify-start">
            <TowCharacter
              state={{
                lastOutcome: null,
                phase: "idle",
                isChoosing: false,
                isResolving: false,
                isIdle: true,
              }}
              preAction={false}
              hesitationMs={0}
              timeLeftMs={5500}
              choiceWindowMs={5500}
              tapped={false}
              selected={false}
              autoPicked={false}
              width={260}
              height={260}
            />
          </div>

          <div className="text-center md:text-left">
            <div className="inline-flex items-center rounded-full border border-[#DDD7CE] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#6F685F]">
              Play TOW
            </div>

            <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-[#1E1B18]">
              Choose before the market does.
            </h2>

            <p className="mt-4 max-w-xl text-sm md:text-base leading-7 text-[#6F685F]">
              A fast crypto-brained decision game built on pressure, bad instincts,
              and surviving one more turn than you probably should.
            </p>

            <div className="mt-6 grid gap-3 text-sm text-[#1E1B18] md:max-w-md">
              <div className="rounded-xl border border-[#DDD7CE] bg-white px-4 py-3">
                3 ambiguous choices
              </div>
              <div className="rounded-xl border border-[#DDD7CE] bg-white px-4 py-3">
                Timer pressure + auto-pick
              </div>
              <div className="rounded-xl border border-[#DDD7CE] bg-white px-4 py-3">
                Survive as long as you can
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/play"
                className="inline-flex items-center justify-center rounded-xl bg-[#1E1B18] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Play Game
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}