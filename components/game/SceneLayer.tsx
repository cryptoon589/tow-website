'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { GameOutcome } from './engine';

interface SceneLayerProps {
  marketState: 'bull' | 'bear' | 'crab';
  tired: number;
  preAction?: string | null;
  outcome?: GameOutcome | null;
}

const EASE = [0.42, 0, 0.58, 1] as const;

export function SceneLayer({
  marketState,
  tired,
  preAction,
  outcome,
}: SceneLayerProps) {
  const ambientOpacity = getAmbientOpacity(tired);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AmbientScene marketState={marketState} opacity={ambientOpacity} tired={tired} />
      <AnimatePresence mode="wait">
        {preAction && <ActionReaction key={`action-${preAction}`} preAction={preAction} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {outcome && <OutcomeAccent key={`outcome-${outcome.id}`} outcome={outcome} />}
      </AnimatePresence>
    </div>
  );
}

function AmbientScene({
  marketState,
  opacity,
  tired,
}: {
  marketState: 'bull' | 'bear' | 'crab';
  opacity: number;
  tired: number;
}) {
  const palette = getMarketPalette(marketState);
  const duration = tired > 75 ? 7.5 : tired > 45 ? 6.5 : 5.5;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.svg
        viewBox="0 0 560 320"
        className="w-[560px] h-[320px]"
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: 0.6 }}
      >
        <defs>
          <radialGradient id="sceneGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.22" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        <motion.ellipse
          cx="280"
          cy="150"
          rx="175"
          ry="96"
          fill="url(#sceneGlow)"
          animate={{ opacity: [0.65, 0.9, 0.65], scale: [1, 1.015, 1] }}
          transition={{ duration, repeat: Infinity, ease: EASE }}
        />

        <motion.path
          d={palette.primaryPath}
          fill="none"
          stroke={palette.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.9"
          animate={{
            pathLength: [0.96, 1, 0.96],
            opacity: [0.55, 0.78, 0.55],
            x: [0, 3, 0],
          }}
          transition={{ duration, repeat: Infinity, ease: EASE }}
        />

        <motion.path
          d={palette.secondaryPath}
          fill="none"
          stroke={palette.secondary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.75"
          animate={{
            opacity: [0.18, 0.34, 0.18],
            x: [0, -2, 0],
            y: [0, 1, 0],
          }}
          transition={{ duration: duration + 1.2, repeat: Infinity, ease: EASE }}
        />

        {tired > 70 && (
          <motion.rect
            x="65"
            y="55"
            width="430"
            height="190"
            rx="36"
            fill="#1E1B18"
            animate={{ opacity: [0.02, 0.06, 0.02] }}
            transition={{ duration: 5.2, repeat: Infinity }}
          />
        )}
      </motion.svg>
    </div>
  );
}

function ActionReaction({ preAction }: { preAction: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 560 320" className="w-[560px] h-[320px] overflow-visible">
        <AnimatePresence mode="wait">
          {preAction === 'buy-dip' && <BuyDipReaction />}
          {preAction === 'check-portfolio' && <CheckPortfolioReaction />}
          {preAction === 'go-sleep' && <SleepReaction />}
          {preAction === 'touch-grass' && <GrassReaction />}
        </AnimatePresence>
      </svg>
    </div>
  );
}

function OutcomeAccent({ outcome }: { outcome: GameOutcome }) {
  const vfx = outcome.vfx;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 560 320" className="w-[560px] h-[320px] overflow-visible">
        <AnimatePresence mode="wait">
          {vfx === 'red-flicker' && <RedFlickerAccent />}
          {vfx === 'green-pop' && <GreenPopAccent />}
          {vfx === 'fake-gain-collapse' && <FakeGainCollapseAccent />}
          {vfx === 'zzz' && <SleepAccent />}
          {vfx === 'leaf-drift' && <LeafAccent />}
          {vfx === 'gold-shine' && <GoldAccent />}
        </AnimatePresence>
      </svg>
    </div>
  );
}

/* ---------------- reactions ---------------- */

function BuyDipReaction() {
  return (
    <>
      <motion.path
        d="M 120 135 C 180 132, 215 138, 255 172 C 285 198, 330 208, 420 216"
        fill="none"
        stroke="#E56B6F"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0.18, 0.5, 0.22] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      />
      <motion.path
        d="M 246 170 C 265 159, 282 155, 300 162"
        fill="none"
        stroke="#58B889"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ opacity: 0, scaleX: 0.75 }}
        animate={{ opacity: [0, 0.3, 0], scaleX: [0.75, 1, 0.9] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        style={{ transformOrigin: '272px 162px' }}
      />
    </>
  );
}

function CheckPortfolioReaction() {
  return (
    <>
      <motion.path
        d="M 145 172 C 190 165, 225 178, 270 168 C 320 156, 355 184, 410 174"
        fill="none"
        stroke="#8EA3C0"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0.2 }}
        animate={{ opacity: [0.12, 0.38, 0.12], pathLength: [0.2, 1, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: EASE }}
      />
      <motion.circle
        cx="330"
        cy="160"
        r="26"
        fill="#8EA3C0"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: [0, 0.08, 0], scale: [0.85, 1.08, 1.18] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24 }}
      />
    </>
  );
}

function SleepReaction() {
  return (
    <>
      <motion.rect
        x="120"
        y="86"
        width="320"
        height="136"
        rx="42"
        fill="#B6AECF"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.08, 0.02] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.34 }}
      />
      <motion.text
        x="355"
        y="118"
        fontSize="20"
        fill="#7C6CF2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 0.55, 0.1], y: [6, -8, -18] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
      >
        Z
      </motion.text>
      <motion.text
        x="374"
        y="98"
        fontSize="14"
        fill="#7C6CF2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 0.45, 0], y: [6, -10, -18] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        z
      </motion.text>
    </>
  );
}

function GrassReaction() {
  return (
    <>
      <motion.path
        d="M 158 192 C 204 176, 250 170, 306 180 C 344 186, 372 192, 410 188"
        fill="none"
        stroke="#58B889"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.05, 0.22, 0.08] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.42 }}
      />
      <motion.path
        d="M 180 205 C 170 192, 174 178, 188 170 C 194 182, 193 195, 180 205 Z"
        fill="#8FCB95"
        initial={{ opacity: 0, x: -8, y: 4, rotate: -18 }}
        animate={{ opacity: [0, 0.5, 0.1], x: [-8, 16, 38], y: [4, -6, -10], rotate: [-18, 6, 18] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.52, ease: EASE }}
      />
    </>
  );
}

/* ---------------- outcome accents ---------------- */

function RedFlickerAccent() {
  return (
    <motion.rect
      x="115"
      y="82"
      width="330"
      height="144"
      rx="44"
      fill="#E56B6F"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.08, 0, 0.05, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42 }}
    />
  );
}

function GreenPopAccent() {
  return (
    <motion.circle
      cx="280"
      cy="150"
      r="46"
      fill="#58B889"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: [0, 0.16, 0], scale: [0.7, 1.22, 1.45] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.48, ease: EASE }}
      style={{ transformOrigin: '280px 150px' }}
    />
  );
}

function FakeGainCollapseAccent() {
  return (
    <>
      <motion.path
        d="M 185 190 C 218 180, 238 155, 262 140 C 278 132, 296 132, 314 138"
        fill="none"
        stroke="#58B889"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.38, 0], pathLength: [0, 1, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
      />
      <motion.path
        d="M 312 139 C 332 144, 354 158, 384 184 C 402 200, 420 206, 440 212"
        fill="none"
        stroke="#E56B6F"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.44, 0], pathLength: [0, 1, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.36, delay: 0.08 }}
      />
    </>
  );
}

function SleepAccent() {
  return (
    <>
      <motion.text
        x="348"
        y="112"
        fontSize="20"
        fill="#7C6CF2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 0.45, 0], y: [6, -10, -22] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65 }}
      >
        Z
      </motion.text>
      <motion.text
        x="368"
        y="92"
        fontSize="14"
        fill="#7C6CF2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 0.38, 0], y: [6, -10, -20] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.08 }}
      >
        z
      </motion.text>
    </>
  );
}

function LeafAccent() {
  return (
    <motion.path
      d="M 184 204 C 174 190, 179 176, 192 168 C 199 180, 197 194, 184 204 Z"
      fill="#8FCB95"
      initial={{ opacity: 0, x: -8, y: 4, rotate: -15 }}
      animate={{ opacity: [0, 0.5, 0], x: [-8, 20, 42], y: [4, -8, -12], rotate: [-15, 8, 18] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.72, ease: EASE }}
    />
  );
}

function GoldAccent() {
  return (
    <>
      <motion.rect
        x="120"
        y="86"
        width="320"
        height="136"
        rx="42"
        fill="#F2A93B"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.06, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.62 }}
      />
      <motion.path
        d="M 150 118 C 205 104, 262 101, 338 108 C 372 111, 402 115, 438 122"
        fill="none"
        stroke="#F2A93B"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.4, 0], pathLength: [0, 1, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.54, ease: EASE }}
      />
    </>
  );
}

/* ---------------- helpers ---------------- */

function getAmbientOpacity(tired: number) {
  if (tired >= 86) return 0.12;
  if (tired >= 61) return 0.15;
  if (tired >= 31) return 0.17;
  return 0.18;
}

function getMarketPalette(state: 'bull' | 'bear' | 'crab') {
  switch (state) {
    case 'bull':
      return {
        primary: '#58B889',
        secondary: '#A6D7B7',
        glow: '#BDE8C9',
        primaryPath:
          'M 90 202 C 138 198, 168 192, 204 178 C 238 164, 270 150, 308 144 C 340 138, 384 130, 458 106',
        secondaryPath:
          'M 104 224 C 148 214, 190 207, 236 190 C 276 176, 318 165, 356 158 C 392 150, 424 145, 468 132',
      };
    case 'bear':
      return {
        primary: '#E56B6F',
        secondary: '#F0B1B4',
        glow: '#F6D0D1',
        primaryPath:
          'M 92 118 C 140 124, 182 132, 224 148 C 262 163, 298 178, 334 190 C 374 202, 416 211, 466 220',
        secondaryPath:
          'M 108 102 C 150 112, 192 124, 234 140 C 270 154, 308 166, 350 182 C 392 196, 428 203, 470 208',
      };
    case 'crab':
    default:
      return {
        primary: '#C49A4A',
        secondary: '#DCC391',
        glow: '#F0E1BE',
        primaryPath:
          'M 92 164 C 126 160, 160 172, 196 168 C 232 164, 270 154, 308 160 C 344 166, 382 174, 468 168',
        secondaryPath:
          'M 96 186 C 136 176, 170 192, 212 184 C 246 178, 286 170, 324 176 C 366 184, 404 190, 470 184',
      };
  }
}