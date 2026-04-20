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

        {/* Share card preview */}
        <div className="rounded-2xl border border-[#DDD7CE] bg-[#F7F5F2] p-4 mb-6 shadow-sm">
          <div className="rounded-2xl bg-[#FFFCF8] border border-[#E7E1D8] p-5">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-[#948B81] mb-4">
              Result Card
            </div>

            <div className="rounded-2xl bg-[#F1EEE8] border border-[#DDD7CE] min-h-[220px] flex items-center justify-center mb-4">
              <TowMoodPreview mood={mood} />
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

function TowMoodPreview({ mood }: { mood: string }) {
  const face = getMoodFace(mood);

  return (
    <svg viewBox="0 0 260 220" className="w-[200px] h-[170px]">
      <ellipse cx="130" cy="196" rx="38" ry="8" fill="rgba(30,27,24,0.08)" />

      {/* body */}
      <path
        d="M 117 112 L 145 114 L 149 176 L 113 174 Z"
        fill="none"
        stroke="#111111"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M 125 176 L 124 198" fill="none" stroke="#111111" strokeWidth="8" strokeLinecap="round" />
      <path d="M 145 176 L 147 196" fill="none" stroke="#111111" strokeWidth="8" strokeLinecap="round" />
      <path d="M 116 124 Q 98 140 92 170" fill="none" stroke="#111111" strokeWidth="7" strokeLinecap="round" />
      <path d="M 144 124 Q 162 139 176 154" fill="none" stroke="#111111" strokeWidth="7" strokeLinecap="round" />

      {/* phone */}
      <rect x="170" y="143" width="20" height="32" rx="4" fill="#111111" />
      <circle cx="175" cy="148" r="1.5" fill="#FFFCF8" />

      {/* head */}
      <path
        d="M 127 38
           Q 154 37 168 58
           Q 180 77 173 101
           Q 166 126 144 136
           Q 117 147 95 132
           Q 73 117 73 92
           Q 73 67 88 52
           Q 100 39 127 38 Z"
        fill="#FFFCF8"
        stroke="#111111"
        strokeWidth="8"
        strokeLinejoin="round"
      />

      {/* hair */}
      <path
        d="M 104 51 L 113 46 L 124 50 L 136 48 L 145 55 L 136 57 L 126 55 L 115 59 L 104 56 L 96 57 Z"
        fill="#111111"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* brows */}
      {face.leftBrow && (
        <path d={face.leftBrow} fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
      )}
      {face.rightBrow && (
        <path d={face.rightBrow} fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
      )}

      {/* eyes */}
      {face.eyeStyle === 'normal' && (
        <>
          <circle cx="109" cy="92" r="5" fill="#111111" />
          <circle cx="139" cy="92" r="5" fill="#111111" />
        </>
      )}
      {face.eyeStyle === 'sleepy' && (
        <>
          <path d="M 101 92 Q 109 96 117 92" fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
          <path d="M 131 92 Q 139 96 147 92" fill="none" stroke="#111111" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {face.eyeStyle === 'star' && (
        <>
          <path d="M 108 84 L 111 90 L 118 90 L 113 94 L 116 101 L 108 97 L 101 101 L 104 94 L 99 90 L 106 90 Z" fill="#F2A93B" stroke="#111111" strokeWidth="2" />
          <path d="M 138 84 L 141 90 L 148 90 L 143 94 L 146 101 L 138 97 L 131 101 L 134 94 L 129 90 L 136 90 Z" fill="#F2A93B" stroke="#111111" strokeWidth="2" />
        </>
      )}

      {/* mouth */}
      <path d={face.mouth} fill="none" stroke="#111111" strokeWidth="4.5" strokeLinecap="round" />

      {/* mood marks */}
      {mood === 'sleepy' && (
        <>
          <text x="185" y="62" fontSize="20" fill="#7C6CF2">Z</text>
          <text x="199" y="46" fontSize="15" fill="#7C6CF2">z</text>
        </>
      )}
      {mood === 'confused' && (
        <text x="184" y="68" fontSize="24" fill="#7C6CF2">?</text>
      )}
      {mood === 'regret' && (
        <path d="M 104 104 Q 102 112 106 118" fill="none" stroke="#7C6CF2" strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  );
}

function getMoodFace(mood: string) {
  switch (mood) {
    case 'stressed':
      return {
        eyeStyle: 'normal',
        mouth: 'M 116 116 L 132 116',
        leftBrow: 'M 100 81 L 111 85',
        rightBrow: 'M 147 81 L 136 85',
      };
    case 'hopeful':
      return {
        eyeStyle: 'normal',
        mouth: 'M 114 115 Q 123 121 133 115',
        leftBrow: 'M 100 82 L 111 82',
        rightBrow: 'M 136 82 L 147 82',
      };
    case 'broken':
      return {
        eyeStyle: 'normal',
        mouth: 'M 114 118 Q 124 113 134 118',
        leftBrow: 'M 100 83 L 111 87',
        rightBrow: 'M 147 83 L 136 87',
      };
    case 'confused':
      return {
        eyeStyle: 'normal',
        mouth: 'M 116 118 Q 123 114 131 117',
        leftBrow: 'M 100 84 L 111 82',
        rightBrow: 'M 136 80 L 148 84',
      };
    case 'euphoric':
      return {
        eyeStyle: 'star',
        mouth: 'M 111 113 Q 124 126 137 113',
        leftBrow: '',
        rightBrow: '',
      };
    case 'sleepy':
      return {
        eyeStyle: 'sleepy',
        mouth: 'M 118 117 Q 124 120 130 117',
        leftBrow: '',
        rightBrow: '',
      };
    case 'regret':
      return {
        eyeStyle: 'normal',
        mouth: 'M 114 119 Q 124 112 135 119',
        leftBrow: 'M 100 83 L 111 87',
        rightBrow: 'M 147 83 L 136 87',
      };
    case 'neutral':
    default:
      return {
        eyeStyle: 'normal',
        mouth: 'M 116 116 L 132 116',
        leftBrow: '',
        rightBrow: '',
      };
  }
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
  const moodFace = getShareSvgFace(mood);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <rect width="1200" height="1500" fill="#F7F5F2"/>
    <rect x="60" y="60" width="1080" height="1380" rx="40" fill="#FFFCF8" stroke="#DDD7CE" stroke-width="4"/>

    <text x="120" y="160" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="5" fill="#948B81">TOO TIRED TO WIN</text>

    <rect x="120" y="220" width="960" height="520" rx="32" fill="#F1EEE8" stroke="#DDD7CE" stroke-width="3"/>

    <g transform="translate(320 255)">
      ${moodFace}
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

function getShareSvgFace(mood: string) {
  const face = getMoodFace(mood);

  const eyes =
    face.eyeStyle === 'sleepy'
      ? `
      <path d="M 150 150 Q 166 158 182 150" fill="none" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
      <path d="M 210 150 Q 226 158 242 150" fill="none" stroke="#111111" stroke-width="8" stroke-linecap="round"/>
    `
      : face.eyeStyle === 'star'
      ? `
      <path d="M 166 133 L 172 145 L 186 145 L 176 153 L 181 166 L 166 158 L 152 166 L 157 153 L 147 145 L 161 145 Z" fill="#F2A93B" stroke="#111111" stroke-width="3"/>
      <path d="M 226 133 L 232 145 L 246 145 L 236 153 L 241 166 L 226 158 L 212 166 L 217 153 L 207 145 L 221 145 Z" fill="#F2A93B" stroke="#111111" stroke-width="3"/>
    `
      : `
      <circle cx="166" cy="150" r="9" fill="#111111"/>
      <circle cx="226" cy="150" r="9" fill="#111111"/>
    `;

  const brows = `
    ${face.leftBrow ? `<path d="${face.leftBrow.replaceAll('100', '150').replaceAll('111', '171')}" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round"/>` : ''}
    ${face.rightBrow ? `<path d="${face.rightBrow.replaceAll('136', '210').replaceAll('147', '240').replaceAll('148', '242')}" fill="none" stroke="#111111" stroke-width="6" stroke-linecap="round"/>` : ''}
  `;

  return `
    <ellipse cx="200" cy="430" rx="80" ry="16" fill="rgba(30,27,24,0.08)" />
    <path d="M 180 240 L 236 244 L 244 372 L 172 368 Z" fill="none" stroke="#111111" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 196 368 L 194 418" fill="none" stroke="#111111" stroke-width="15" stroke-linecap="round"/>
    <path d="M 236 368 L 240 412" fill="none" stroke="#111111" stroke-width="15" stroke-linecap="round"/>
    <path d="M 176 264 Q 142 298 132 358" fill="none" stroke="#111111" stroke-width="14" stroke-linecap="round"/>
    <path d="M 236 264 Q 272 294 300 324" fill="none" stroke="#111111" stroke-width="14" stroke-linecap="round"/>
    <rect x="292" y="300" width="42" height="68" rx="8" fill="#111111"/>
    <circle cx="302" cy="311" r="3" fill="#FFFCF8"/>

    <path
      d="M 202 70
         Q 256 68 284 110
         Q 308 147 294 195
         Q 280 245 236 264
         Q 182 286 138 256
         Q 94 226 94 176
         Q 94 126 124 96
         Q 148 72 202 70 Z"
      fill="#FFFCF8"
      stroke="#111111"
      stroke-width="16"
      stroke-linejoin="round"
    />

    <path
      d="M 154 96 L 172 86 L 194 94 L 218 90 L 236 104 L 218 108 L 198 104 L 176 112 L 154 106 L 138 108 Z"
      fill="#111111"
      stroke="#111111"
      stroke-width="6"
      stroke-linejoin="round"
    />

    ${brows}
    ${eyes}
    <path d="${face.mouth
      .replace('114', '176')
      .replace('116', '180')
      .replace('118', '184')
      .replace('124', '200')
      .replace('130', '212')
      .replace('131', '214')
      .replace('132', '216')
      .replace('133', '218')
      .replace('134', '220')
      .replace('135', '222')
      .replace('137', '226')}"
      fill="none" stroke="#111111" stroke-width="8" stroke-linecap="round"/>

    ${mood === 'sleepy' ? `<text x="320" y="110" font-size="44" fill="#7C6CF2">Z</text><text x="350" y="78" font-size="30" fill="#7C6CF2">z</text>` : ''}
    ${mood === 'confused' ? `<text x="320" y="130" font-size="52" fill="#7C6CF2">?</text>` : ''}
    ${mood === 'regret' ? `<path d="M 156 173 Q 151 189 159 202" fill="none" stroke="#7C6CF2" stroke-width="6" stroke-linecap="round"/>` : ''}
  `;
}

function escapeXml(unsafe: string) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}