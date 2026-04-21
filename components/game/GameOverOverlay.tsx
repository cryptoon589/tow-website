'use client';

import { motion } from 'framer-motion';
import { GameState } from './engine';
import { getCollapseCause, getEndTitle, formatShareResult } from './engine';

interface GameOverOverlayProps {
  state: GameState;
  onReplay: () => void;
}

export function GameOverOverlay({ state, onReplay }: GameOverOverlayProps) {
  const cause = getCollapseCause(state);
  const title = getEndTitle(state);
  const shareText = formatShareResult(state);
  const mood = state.lastOutcome?.mood || 'broken';

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCard = async () => {
    try {
      const svg = buildShareCardSvg({
        turns: state.turn,
        cause,
        title,
        mood,
      });

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1500;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#F7F5F2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `too-tired-to-win-${slugify(title)}.png`;
          link.click();
          URL.revokeObjectURL(pngUrl);
        }, 'image/png');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      console.error('Failed to download card:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[rgba(30,27,24,0.16)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.94, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', damping: 20 }}
        className="bg-[#FFFCF8] rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#DDD7CE] shadow-[0_18px_60px_rgba(30,27,24,0.12)]"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#1E1B18] mb-1">Too Tired to Win</h2>
          <div className="text-sm text-[#6F685F]">You lasted {state.turn} turns.</div>
          <div className="text-sm text-[#948B81] italic mt-1">
            You knew better. You still did it.
          </div>
        </div>

        <div className="rounded-2xl border border-[#DDD7CE] bg-[#F7F5F2] p-4 mb-6 shadow-sm">
          <div className="rounded-2xl bg-[#FFFCF8] border border-[#E7E1D8] p-5">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-[#948B81] mb-4">
              Result Card
            </div>

            <div className="rounded-2xl bg-[#F1EEE8] border border-[#DDD7CE] min-h-[220px] flex items-center justify-center mb-4">
              <TowMoodCardPreview mood={mood} />
            </div>

            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#948B81] mb-2">
              Title Earned
            </div>
            <div className="text-2xl md:text-[28px] leading-tight font-extrabold text-[#1E1B18] mb-4">
              {title}
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl bg-[#FFFCF8] border border-[#E7E1D8] px-4 py-3">
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#948B81] mb-1">
                  Cause of Collapse
                </div>
                <div className="text-base font-semibold text-[#E56B6F]">
                  {cause}
                </div>
              </div>

              <div className="rounded-xl bg-[#FFFCF8] border border-[#E7E1D8] px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#948B81] mb-1">
                    Survived
                  </div>
                  <div className="text-xl font-bold text-[#1E1B18]">{state.turn} turns</div>
                </div>
                <div className="text-sm font-semibold text-[#7C6CF2]">$TOW</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <button
            onClick={onReplay}
            className="w-full px-6 py-3 bg-[#1E1B18] hover:bg-[#2C2824] text-white font-semibold rounded-2xl transition-colors duration-200"
          >
            Play Again
          </button>

          <button
            onClick={handleDownloadCard}
            className="w-full px-6 py-3 bg-[#7C6CF2] hover:bg-[#6D5BE9] text-white font-semibold rounded-2xl transition-colors duration-200"
          >
            Download Card PNG
          </button>

          <button
            onClick={handleCopyShare}
            className="w-full px-6 py-3 bg-[#FFFCF8] hover:bg-[#F6F1EA] text-[#1E1B18] font-medium rounded-2xl transition-colors duration-200 border border-[#DDD7CE]"
          >
            Copy Your Collapse
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-[#948B81]">
          Save it. Post it. Regret it later.
        </div>
      </motion.div>
    </motion.div>
  );
}

function TowMoodCardPreview({ mood }: { mood: string }) {
  return (
    <svg viewBox="0 0 260 220" className="w-[190px] h-[170px]">
      <ellipse cx="130" cy="196" rx="36" ry="8" fill="rgba(30,27,24,0.08)" />

      <path
        d="M 118 110 L 142 110 L 145 174 L 115 174 Z"
        fill="none"
        stroke="#111"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M 122 174 L 122 198" stroke="#111" strokeWidth="7" strokeLinecap="round" />
      <path d="M 142 174 L 144 198" stroke="#111" strokeWidth="7" strokeLinecap="round" />
      <path d="M 118 124 Q 100 144 104 182" stroke="#111" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M 142 124 Q 165 145 178 156" stroke="#111" strokeWidth="7" fill="none" strokeLinecap="round" />

      <rect x="174" y="142" width="16" height="30" rx="3" fill="#111" />
      <rect x="177" y="146" width="10" height="21" rx="2" fill={getCardPhoneColor(mood)} opacity="0.22" />
      <circle cx="179" cy="147" r="1.3" fill="#fff" />

      <circle cx="130" cy="80" r="38" fill="#fff" stroke="#111" strokeWidth="7" />
      <path
        d="M 105 58 L 118 50 L 130 57 L 142 53 L 154 61 L 142 67 L 130 64 L 118 71 Z"
        fill="#111"
      />

      {mood === 'sleepy' ? (
        <>
          <path d="M 109 84 Q 116 88 123 84" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
          <path d="M 137 84 Q 144 88 151 84" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : mood === 'euphoric' ? (
        <>
          <path d="M 108 79 L 111 85 L 118 85 L 113 89 L 116 96 L 108 91 L 101 96 L 104 89 L 99 85 L 106 85 Z" fill="#F2A93B" stroke="#111" strokeWidth="2" />
          <path d="M 138 79 L 141 85 L 148 85 L 143 89 L 146 96 L 138 91 L 131 96 L 134 89 L 129 85 L 136 85 Z" fill="#F2A93B" stroke="#111" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="115" cy="85" r="4.6" fill="#111" />
          <circle cx="145" cy="85" r="4.6" fill="#111" />
        </>
      )}

      <path d={getCardMouth(mood)} fill="none" stroke="#111" strokeWidth="4.5" strokeLinecap="round" />

      {mood === 'sleepy' && (
        <>
          <text x="170" y="52" fontSize="16" fill="#7C6CF2">Z</text>
          <text x="183" y="40" fontSize="11" fill="#7C6CF2">z</text>
        </>
      )}

      {mood === 'confused' && (
        <text x="171" y="62" fontSize="20" fill="#7C6CF2">?</text>
      )}

      {mood === 'regret' && (
        <path d="M 114 101 Q 111 110 115 116" fill="none" stroke="#7C6CF2" strokeWidth="3" />
      )}
    </svg>
  );
}

function getCardMouth(mood: string) {
  switch (mood) {
    case 'hopeful':
      return 'M 116 108 Q 130 117 144 108';
    case 'broken':
      return 'M 116 112 Q 130 102 144 112';
    case 'regret':
      return 'M 116 112 Q 130 100 144 112';
    case 'sleepy':
      return 'M 120 110 Q 130 114 140 110';
    case 'confused':
      return 'M 121 112 Q 128 107 136 112';
    default:
      return 'M 120 110 L 140 110';
  }
}

function getCardPhoneColor(mood: string) {
  if (mood === 'broken' || mood === 'regret') return '#E56B6F';
  if (mood === 'hopeful') return '#58B889';
  if (mood === 'euphoric') return '#F2A93B';
  if (mood === 'sleepy') return '#7C6CF2';
  return '#8EA3C0';
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildShareCardSvg({
  turns,
  cause,
  title,
  mood,
}: {
  turns: number;
  cause: string;
  title: string;
  mood: string;
}) {
  const safeCause = escapeXml(cause);
  const safeTitle = escapeXml(title);
  const face = buildCardTowSvg(mood);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <rect width="1200" height="1500" fill="#F7F5F2"/>
    <rect x="60" y="60" width="1080" height="1380" rx="40" fill="#FFFCF8" stroke="#DDD7CE" stroke-width="4"/>

    <text x="120" y="160" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="5" fill="#948B81">TOO TIRED TO WIN</text>

    <rect x="120" y="220" width="960" height="520" rx="32" fill="#F1EEE8" stroke="#DDD7CE" stroke-width="3"/>
    <g transform="translate(300 250)">
      ${face}
    </g>

    <text x="120" y="840" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#948B81">TITLE EARNED</text>
    <text x="120" y="900" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="800" fill="#1E1B18">${safeTitle}</text>

    <rect x="120" y="980" width="960" height="150" rx="24" fill="#FFFCF8" stroke="#E7E1D8" stroke-width="3"/>
    <text x="155" y="1038" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#948B81">CAUSE OF COLLAPSE</text>
    <text x="155" y="1094" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#E56B6F">${safeCause}</text>

    <rect x="120" y="1160" width="460" height="150" rx="24" fill="#FFFCF8" stroke="#E7E1D8" stroke-width="3"/>
    <text x="155" y="1218" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="#948B81">SURVIVED</text>
    <text x="155" y="1276" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="#1E1B18">${turns} TURNS</text>

    <text x="1040" y="1365" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" fill="#7C6CF2">$TOW</text>
    <text x="120" y="1365" font-family="Arial, Helvetica, sans-serif" font-size="24" font-style="italic" fill="#6F685F">You knew better. You still did it.</text>
  </svg>`;
}

function buildCardTowSvg(mood: string) {
  const mouth = getSvgCardMouth(mood);
  const phoneColor = getCardPhoneColor(mood);

  const eyes =
    mood === 'sleepy'
      ? `
        <path d="M 150 150 Q 162 156 174 150" fill="none" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
        <path d="M 206 150 Q 218 156 230 150" fill="none" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      `
      : mood === 'euphoric'
      ? `
        <path d="M 150 144 L 154 152 L 162 152 L 156 158 L 159 166 L 150 160 L 142 166 L 145 158 L 139 152 L 147 152 Z" fill="#F2A93B" stroke="#111111" stroke-width="3"/>
        <path d="M 206 144 L 210 152 L 218 152 L 212 158 L 215 166 L 206 160 L 198 166 L 201 158 L 195 152 L 203 152 Z" fill="#F2A93B" stroke="#111111" stroke-width="3"/>
      `
      : `
        <circle cx="160" cy="150" r="8" fill="#111111"/>
        <circle cx="216" cy="150" r="8" fill="#111111"/>
      `;

  return `
    <ellipse cx="190" cy="430" rx="78" ry="16" fill="rgba(30,27,24,0.08)" />

    <path d="M 178 240 L 226 240 L 232 370 L 172 370 Z" fill="none" stroke="#111111" stroke-width="15" stroke-linecap="round"/>
    <path d="M 188 370 L 188 418" fill="none" stroke="#111111" stroke-width="14" stroke-linecap="round"/>
    <path d="M 226 370 L 228 418" fill="none" stroke="#111111" stroke-width="14" stroke-linecap="round"/>
    <path d="M 178 256 Q 150 318 162 382" fill="none" stroke="#111111" stroke-width="14" stroke-linecap="round"/>
    <path d="M 226 256 Q 264 308 286 324" fill="none" stroke="#111111" stroke-width="14" stroke-linecap="round"/>

    <rect x="282" y="296" width="34" height="66" rx="7" fill="#111111"/>
    <rect x="287" y="302" width="24" height="48" rx="4" fill="${phoneColor}" opacity="0.22"/>
    <circle cx="292" cy="304" r="2.4" fill="#ffffff"/>

    <circle cx="190" cy="140" r="66" fill="#ffffff" stroke="#111111" stroke-width="14"/>
    <path d="M 148 100 L 170 88 L 190 98 L 212 92 L 234 104 L 212 114 L 190 110 L 168 120 Z" fill="#111111"/>

    ${eyes}

    <path d="${mouth}" fill="none" stroke="#111111" stroke-width="8" stroke-linecap="round"/>

    ${mood === 'sleepy' ? `<text x="284" y="92" font-size="32" fill="#7C6CF2">Z</text><text x="310" y="70" font-size="20" fill="#7C6CF2">z</text>` : ''}
    ${mood === 'confused' ? `<text x="286" y="108" font-size="38" fill="#7C6CF2">?</text>` : ''}
    ${mood === 'regret' ? `<path d="M 160 184 Q 156 198 162 208" fill="none" stroke="#7C6CF2" stroke-width="6"/>` : ''}
  `;
}

function getSvgCardMouth(mood: string) {
  switch (mood) {
    case 'hopeful':
      return 'M 164 188 Q 188 202 212 188';
    case 'broken':
      return 'M 164 196 Q 188 180 212 196';
    case 'regret':
      return 'M 164 196 Q 188 176 212 196';
    case 'sleepy':
      return 'M 172 192 Q 188 198 204 192';
    case 'confused':
      return 'M 174 194 Q 184 186 194 194';
    default:
      return 'M 174 192 L 202 192';
  }
}

function escapeXml(unsafe: string) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}