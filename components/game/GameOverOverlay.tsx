"use client";

import { useMemo, useRef, useState } from "react";
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

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: "image/png" });
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
  const [isSharing, setIsSharing] = useState(false);

  const result = state?.resultTitle || "The Participant";
  const img = getImage(result);
  const stamp = useMemo(() => pickStamp(state?.turn || 0, result), [state?.turn, result]);
  const resultColor = getResultColor(result);

  if (!state?.gameOver) return null;

  const shareText = `${result} — ${state.turn} turns\nTired ${state.tired}/100\nI almost made it. Next run might be the one.\n\nPlay TOW:`;

  const createCardPng = async () => {
    if (!cardRef.current) return null;

    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#F6F2EC",
    });
  };

  const shareToX = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const filename = `tow-run-${String(state.turn).padStart(4, "0")}.png`;
      const dataUrl = await createCardPng();

      if (dataUrl) {
        const file = await dataUrlToFile(dataUrl, filename);
        const nav = navigator as Navigator & {
          canShare?: (data: ShareData) => boolean;
        };

        if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
          await navigator.share({
            title: "TOW Run Card",
            text: shareText,
            files: [file],
          });
          return;
        }

        // Desktop/browser fallback: X web intent cannot attach local images.
        // Download the PNG automatically, then open X with text.
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
      }

      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-[860px] rounded-[24px] bg-[#F6F2EC] p-3 shadow-2xl sm:rounded-[30px] sm:p-4">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[22px] border border-[#DDD3C8] bg-[#F6F2EC] p-4 sm:p-5"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px)] [background-size:12px_12px]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="text-[9px] tracking-[0.22em] text-[#837A70] sm:text-[11px]">
              TOW RUN ID
              <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-[#1F1C18] sm:text-[12px]">
                RUN-{String(state.turn).padStart(4, "0")}
              </div>
            </div>

            <div
              className="rotate-3 rounded-full border-[3px] border-red-400 bg-red-50/80 px-4 py-2 text-[15px] font-black uppercase tracking-wide text-red-600 sm:px-8 sm:py-4 sm:text-[24px]"
              style={{
                boxShadow:
                  "0 0 0 5px rgba(239,68,68,0.16), 0 14px 30px rgba(239,68,68,0.22)",
              }}
            >
              {stamp}
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-[34%_1fr] gap-3 sm:mt-6 sm:grid-cols-[230px_1fr] sm:gap-6">
            <div className="relative h-[210px] overflow-hidden rounded-[18px] border border-[#DED5CA] bg-[#EDE7DF] shadow-inner sm:h-[280px]">
              <div className="absolute left-3 top-3 z-10 text-[9px] font-bold tracking-[0.22em] text-[#9A9288] sm:text-[10px]">
                PORTRAIT
              </div>
              <img
                src={img}
                alt={result}
                className="absolute bottom-[-12px] left-1/2 h-[132%] -translate-x-1/2 object-cover sm:bottom-[-18px] sm:h-[145%]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="min-w-0 pt-1 sm:pt-3">
              <div className={`mb-1 text-[30px] font-black leading-[0.9] sm:text-5xl ${resultColor}`}>
                {result}
              </div>

              <div className="mb-3 text-[13px] font-medium text-[#6E655C] sm:mb-4 sm:text-sm">
                You lasted <span className="font-bold text-orange-500">{state.turn}</span> turns.
              </div>

              <div className="mb-3 grid grid-cols-4 gap-1.5 text-center sm:gap-3">
                <div className="rounded-xl bg-[#EDE7DF] p-1.5 sm:p-3">
                  <div className="text-[8px] tracking-wider text-[#91887E] sm:text-[10px]">TURNS</div>
                  <div className="text-base font-black text-orange-500 sm:text-lg">{state.turn}</div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-1.5 sm:p-3">
                  <div className="text-[8px] tracking-wider text-[#91887E] sm:text-[10px]">TIRED</div>
                  <div className="text-base font-black text-red-600 sm:text-lg">{state.tired}</div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-1.5 sm:p-3">
                  <div className="text-[8px] tracking-wider text-[#91887E] sm:text-[10px]">HEATER</div>
                  <div className="text-base font-black text-green-600 sm:text-lg">
                    x{profile?.bestStreak || 1}
                  </div>
                </div>

                <div className="rounded-xl bg-[#EDE7DF] p-1.5 sm:p-3">
                  <div className="text-[8px] tracking-wider text-[#91887E] sm:text-[10px]">SAVES</div>
                  <div className="text-base font-black text-purple-600 sm:text-lg">
                    {profile?.almostSaves || 0}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#EDE7DF] p-2 sm:p-3">
                <div className="mb-1 text-[8px] font-bold tracking-[0.2em] text-[#91887E] sm:text-[10px]">
                  PLAYER MEMORY
                </div>
                <div className="text-base font-bold text-[#1F1C18] sm:text-lg">
                  {profile?.type || "balanced"}
                </div>
                <div className="text-xs text-[#6E655C] sm:text-sm">
                  {profile?.description || "you kept going"}
                </div>
              </div>

              <div className="mt-2 text-[14px] italic leading-snug text-[#746A60] sm:mt-3 sm:text-base">
                I almost made it. Next run might be the one.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4">
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
            onClick={shareToX}
            disabled={isSharing}
            className="min-h-[58px] rounded-[22px] border border-[#D8D2C8] bg-[#F4EFE8] px-4 py-3 text-lg font-black text-[#2B2621] transition-all duration-200 ease-out hover:border-black hover:bg-black hover:text-white active:scale-[0.97] disabled:cursor-wait disabled:opacity-70 sm:min-h-[68px] sm:rounded-[26px] sm:px-10 sm:py-5 sm:text-[19px]"
          >
            {isSharing ? "making PNG..." : "share to X"}
          </button>
        </div>
      </div>
    </div>
  );
}
