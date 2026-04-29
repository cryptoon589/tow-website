"use client";

import { useMemo, useRef } from "react";
import { toPng } from "html-to-image";

const STAMPS = [
  "EVENTUALLY REKT",
  "ALMOST MADE IT",
  "SO CLOSE",
  "NOT THIS TIME",
  "RUN IT BACK",
  "ONE MORE RUN",
  "SURVIVED NOTHING",
];

function pickStamp(turn: number, result: string) {
  const seed = `${result}-${turn}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }

  return STAMPS[hash % STAMPS.length];
}

function getImage(result: string) {
  const r = result.toLowerCase();

  if (r.includes("hesitant")) return "/tow/run-id/hesitant.png";
  if (r.includes("degen")) return "/tow/run-id/degen.png";
  if (r.includes("participant")) return "/tow/run-id/participant.png";
  if (r.includes("exit")) return "/tow/run-id/rekt.png";
  if (r.includes("rekt")) return "/tow/run-id/rekt.png";

  return "/tow/run-id/survivor.png";
}

function getResultColor(result: string) {
  const r = result.toLowerCase();

  if (r.includes("exit") || r.includes("rekt")) return "text-red-600";
  if (r.includes("degen")) return "text-orange-500";
  if (r.includes("hesitant")) return "text-purple-600";

  return "text-[#1F1C18]";
}

export default function GameOverOverlay({
  state,
  bestRun,
  profile,
  onReplay,
}: {
  state: any;
  bestRun: number;
  profile: any;
  onReplay: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const result = state?.resultTitle || "The Participant";
  const img = getImage(result);
  const stamp = useMemo(
    () => pickStamp(state?.turn || 0, result),
    [state?.turn, result],
  );
  const resultColor = getResultColor(result);

  if (!state?.gameOver) return null;

  const downloadCard = async () => {
    if (!cardRef.current) return;

    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#F6F2EC",
    });

    const link = document.createElement("a");
    link.download = `tow-run-${String(state.turn).padStart(4, "0")}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[820px] rounded-[26px] bg-[#F6F2EC] p-4 shadow-2xl">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[22px] border border-[#DDD3C8] bg-[#F6F2EC] p-5"
        >
          {/* subtle card texture */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Run ID */}
          <div className="relative z-10 shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.22em] text-[#837A70] sm:text-[11px]">
            TOW RUN ID
            <div className="mt-1 whitespace-nowrap font-mono text-[11px] font-medium tracking-[0.12em] text-[#1F1C18] sm:text-[12px]">
              RUN-{String(state.turn).padStart(4, "0")}
            </div>
          </div>

          {/* BIG STAMP */}
          <div
            className="absolute right-4 top-8 z-20 rotate-[4deg] rounded-full border-[4px] border-[#EF4444] bg-red-50/90 px-5 py-2.5 text-[#DC2626] sm:right-5 sm:top-9 sm:border-[5px] sm:px-9 sm:py-4"
            style={{
              boxShadow:
                "0 0 0 6px rgba(239,68,68,0.18), 0 14px 30px rgba(239,68,68,0.24)",
            }}
          >
            <div className="whitespace-nowrap text-center text-[17px] font-black uppercase leading-none tracking-[0.08em] text-[#DC2626] sm:text-[29px]">
              {stamp}
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10 mt-10 flex gap-5 md:gap-6">
            {/* Portrait */}
            <div className="mt-6 relative h-[158px] w-[158px] shrink-0 overflow-hidden rounded-[18px] border border-[#DED5CA] bg-[#EDE7DF] shadow-inner">
              <div className="absolute left-3 top-3 z-10 text-[10px] font-bold tracking-[0.22em] text-[#9A9288]">
                PORTRAIT
              </div>
              <img
                src={img}
                alt={result}
                className="absolute bottom-[-18px] left-1/2 h-[145%] -translate-x-1/2 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1 pt-4">
              <div
                className={`mb-1 text-4xl font-black leading-none md:text-5xl ${resultColor}`}
              >
                {result}
              </div>

              <div className="mb-4 text-sm font-medium text-[#6E655C]">
                You lasted{" "}
                <span className="font-bold text-orange-500">{state.turn}</span>{" "}
                turns.
              </div>

              <div className="mb-3 grid grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl bg-[#EDE7DF] p-3 text-center">
                  <div className="text-[10px] tracking-wider text-[#91887E]">
                    TURNS
                  </div>
                  <div className="text-lg font-black text-orange-500">
                    {state.turn}
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-3 text-center">
                  <div className="text-[10px] tracking-wider text-[#91887E]">
                    TIRED
                  </div>
                  <div className="text-lg font-black text-red-600">
                    {state.tired}/100
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-3 text-center">
                  <div className="text-[10px] tracking-wider text-[#91887E]">
                    HEATER
                  </div>
                  <div className="text-lg font-black text-green-600">
                    x{profile?.bestStreak || 1}
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-3 text-center">
                  <div className="text-[10px] tracking-wider text-[#91887E]">
                    SAVES
                  </div>
                  <div className="text-lg font-black text-purple-600">
                    {profile?.almostSaves || 0}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#EDE7DF] p-3">
                <div className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#91887E]">
                  PLAYER MEMORY
                </div>
                <div className="font-bold text-[#1F1C18]">
                  {profile?.type || "balanced"}
                </div>
                <div className="text-sm text-[#6E655C]">
                  {profile?.description || "you kept going"}
                </div>
              </div>

              <div className="mt-3 text-base italic text-[#746A60]">
                I almost made it. Next run might be the one.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onReplay}
            className="relative min-h-[58px] overflow-hidden rounded-[22px] border border-white/70 px-4 py-3 text-lg font-black text-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-[0_18px_42px_rgba(0,0,0,0.22)] active:scale-[0.97] sm:min-h-[68px] sm:rounded-[26px] sm:px-10 sm:py-5 sm:text-[19px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(182,230,204,0.85), rgba(255,192,192,0.85))",
            }}
          >
            run it back
          </button>

          <button
            onClick={downloadCard}
            className="min-h-[58px] rounded-[22px] border border-[#D8D2C8] bg-[#F4EFE8] px-4 py-3 text-base font-black text-[#2B2621] transition-all duration-200 ease-out hover:border-black hover:bg-black hover:text-white active:scale-[0.97] sm:min-h-[68px] sm:rounded-[26px] sm:px-10 sm:py-5 sm:text-[19px]"
          >
            download card PNG to share
          </button>
        </div>
      </div>
    </div>
  );
}
