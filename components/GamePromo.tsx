import Link from "next/link";
import { TowCharacter } from "@/components/game/TowCharacter";

export default function GamePromo() {
  return (
    <section className="py-16 bg-[#F7F5F2] border-y border-[#DDD7CE]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-[#E8E2FF] text-[#7C6CF2] text-xs font-semibold rounded-full mb-4">
              PLAYABLE NOW
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-[#1E1B18]">
              Too Tired to Win
            </h2>

            <p className="text-lg text-[#6F685F] mb-6 max-w-xl">
              A crypto doom game built for bad decisions, near misses, and
              people who keep checking the chart anyway.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">😵‍💫</span>
                <div>
                  <div className="font-semibold text-[#1E1B18]">Different every run</div>
                  <div className="text-sm text-[#6F685F]">
                    Random events, behavior reactions, and outcome variety so it
                    doesn’t feel repetitive.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">✍️</span>
                <div>
                  <div className="font-semibold text-[#1E1B18]">Built for screenshots</div>
                  <div className="text-sm text-[#6F685F]">
                    Finish a run, get your result card, and post your collapse on X.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🎮</span>
                <div>
                  <div className="font-semibold text-[#1E1B18]">Fast and addictive</div>
                  <div className="text-sm text-[#6F685F]">
                    Short runs, sharp outcomes, one more try energy.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/play"
                className="inline-flex items-center px-8 py-4 bg-[#1E1B18] text-white font-bold rounded-2xl hover:bg-[#2B2723] transition-all shadow-sm"
              >
                Play Now →
              </Link>

              <Link
                href="/play"
                className="inline-flex items-center px-6 py-4 bg-[#FFFCF8] text-[#1E1B18] font-semibold rounded-2xl border border-[#DDD7CE] hover:bg-[#F6F1EA] transition-all"
              >
                View Game
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#DDD7CE] bg-[#FFFCF8] p-5 shadow-[0_12px_32px_rgba(30,27,24,0.08)]">
            <div className="aspect-[4/4.2] rounded-2xl bg-[#F7F5F2] border border-[#E7E1D8] p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold tracking-[0.16em] uppercase text-[#948B81] mb-3">
                  Game Preview
                </div>

                <div className="rounded-2xl bg-[#FFFCF8] border border-[#DDD7CE] min-h-[240px] flex items-center justify-center mb-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,108,242,0.08),transparent_65%)]" />

                  <div className="relative flex flex-col items-center">
                    <div className="scale-[0.78] origin-center">
                      <TowCharacter mood="regret" vfxType="none" />
                    </div>

                    <div className="text-sm font-medium text-[#1E1B18] -mt-2">
                      TOW is too tired again
                    </div>
                    <div className="text-xs text-[#6F685F] mt-1 italic">
                      “You checked. That was a mistake.”
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#DADFE6] bg-[#F2F4F7] px-3 py-3 text-xs font-medium text-[#1E1B18] text-center">
                  Check Portfolio
                </div>
                <div className="rounded-xl border border-[#D7EBDD] bg-[#F3FAF6] px-3 py-3 text-xs font-medium text-[#1E1B18] text-center">
                  Buy the Dip
                </div>
                <div className="rounded-xl border border-[#DCEAD7] bg-[#F4FAF2] px-3 py-3 text-xs font-medium text-[#1E1B18] text-center">
                  Touch Grass
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}