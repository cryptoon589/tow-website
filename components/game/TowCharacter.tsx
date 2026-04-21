'use client';

import { motion } from 'framer-motion';
import { Mood } from './content';

interface TowCharacterProps {
  mood: Mood;
  vfxType?: string;
  preAction?: string | null;
}

const EASE = [0.42, 0, 0.58, 1] as const;

export function TowCharacter({
  mood,
  vfxType,
  preAction,
}: TowCharacterProps) {
  const anticipation = getPreActionPose(preAction);
  const outcomePose = getPostOutcomePose(mood, vfxType);

  const bodyRotate = preAction ? anticipation.bodyRotate : outcomePose.bodyRotate;
  const headRotate = preAction ? anticipation.headRotate : outcomePose.headRotate;
  const phoneRotate = preAction ? anticipation.phoneRotate : outcomePose.phoneRotate;
  const bodyY = preAction ? anticipation.bodyY : outcomePose.bodyY;

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ width: 220, height: 290 }}
      animate={{
        y: [0, bodyY, 0, -1, 0],
      }}
      transition={{
        duration: preAction ? 0.22 : 1.1,
        repeat: 0,
        ease: EASE,
      }}
    >
      <svg
        width="220"
        height="290"
        viewBox="0 0 220 290"
        className="block overflow-visible"
      >
        <ellipse cx="110" cy="270" rx="28" ry="6" fill="rgba(0,0,0,0.08)" />

        {/* MAIN BODY RIG */}
        <motion.g
          animate={{ rotate: [0, bodyRotate, 0] }}
          transition={{
            duration: preAction ? 0.22 : 1,
            repeat: 0,
            ease: EASE,
          }}
          style={{ originX: '110px', originY: '165px' }}
        >
          {/* torso */}
          <path
            d="M 97 136
               L 123 136
               L 126 218
               L 96 218 Z"
            fill="none"
            stroke="#111"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* hips */}
          <path
            d="M 96 218 L 126 218"
            fill="none"
            stroke="#111"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* left arm */}
          <path
            d="M 98 146
               Q 84 176 87 230"
            fill="none"
            stroke="#111"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* right arm + phone as one stable rig */}
          <motion.g
            animate={{ rotate: [0, phoneRotate, 0] }}
            transition={{
              duration: preAction ? 0.22 : 0.95,
              repeat: 0,
              ease: EASE,
            }}
            style={{ originX: '140px', originY: '175px' }}
          >
            <path
              d="M 122 148
                 Q 136 172 150 186"
              fill="none"
              stroke="#111"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 150 186
                 Q 157 191 165 188"
              fill="none"
              stroke="#111"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* phone */}
            <rect x="160" y="172" width="16" height="32" rx="3" fill="#111" />
            <rect
              x="163"
              y="176"
              width="10"
              height="22"
              rx="2"
              fill={getPhoneScreenColor(mood, vfxType, preAction)}
              opacity={getPhoneScreenOpacity(mood, vfxType, preAction)}
            />
            <circle cx="165" cy="177" r="1.2" fill="#fff" />

            {/* subtle glow */}
            <motion.circle
              cx="168"
              cy="188"
              r="16"
              fill={getPhoneGlowColor(mood, vfxType, preAction)}
              animate={{
                opacity: getPhoneGlowOpacity(mood, vfxType, preAction),
                scale: getPhoneGlowScale(mood, vfxType, preAction),
              }}
              transition={{
                duration: 0.9,
                repeat: 0,
                ease: EASE,
              }}
            />
          </motion.g>

          {/* legs */}
          <path
            d="M 103 218
               Q 103 242 100 264"
            fill="none"
            stroke="#111"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M 122 218
               Q 124 242 124 264"
            fill="none"
            stroke="#111"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </motion.g>

        {/* HEAD RIG */}
        <motion.g
          animate={{ rotate: [0, headRotate, 0, mood === 'confused' ? 1 : 0, 0] }}
          transition={{
            duration: preAction ? 0.22 : 1,
            repeat: 0,
            ease: EASE,
          }}
          style={{ originX: '110px', originY: '90px' }}
        >
          <circle cx="110" cy="88" r="35" fill="#fff" stroke="#111" strokeWidth="7" />

          {/* hair */}
          <path
            d="M 88 66
               L 100 58
               L 112 64
               L 123 60
               L 135 68
               L 122 73
               L 110 70
               L 97 76 Z"
            fill="#111"
          />

          {/* eyes */}
          <Eyes mood={mood} preAction={preAction} />

          {/* mouth */}
          <path
            d={getMouth(mood)}
            fill="none"
            stroke="#111"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* regret tear */}
          {mood === 'regret' && (
            <motion.path
              d="M 100 108 Q 97 117 101 123"
              fill="none"
              stroke="#7C6CF2"
              strokeWidth="2.5"
              animate={{ opacity: [0.45, 0.9, 0.45] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: EASE }}
            />
          )}
        </motion.g>

        {/* sleepy marks */}
        {mood === 'sleepy' && (
          <>
            <motion.text
              x="152"
              y="68"
              fontSize="18"
              fill="#7C6CF2"
              animate={{ y: [68, 60, 68], opacity: [0.45, 0.85, 0.45] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: EASE }}
            >
              Z
            </motion.text>
            <motion.text
              x="168"
              y="54"
              fontSize="12"
              fill="#7C6CF2"
              animate={{ y: [54, 46, 54], opacity: [0.28, 0.6, 0.28] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.15, ease: EASE }}
            >
              z
            </motion.text>
          </>
        )}

        {/* confused mark */}
        {mood === 'confused' && (
          <motion.text
            x="156"
            y="74"
            fontSize="20"
            fill="#7C6CF2"
            animate={{ rotate: [0, 6, -6, 0], opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: EASE }}
            style={{ transformOrigin: '160px 70px' }}
          >
            ?
          </motion.text>
        )}
      </svg>
    </motion.div>
  );
}

function Eyes({
  mood,
  preAction,
}: {
  mood: Mood;
  preAction?: string | null;
}) {
  if (mood === 'sleepy') {
    return (
      <>
        <path
          d="M 96 92 Q 103 96 110 92"
          fill="none"
          stroke="#111"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 112 92 Q 119 96 126 92"
          fill="none"
          stroke="#111"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (mood === 'euphoric') {
    return (
      <>
        <path
          d="M 95 88 L 98 94 L 104 94 L 100 98 L 102 104 L 95 100 L 89 104 L 91 98 L 87 94 L 93 94 Z"
          fill="#F2A93B"
          stroke="#111"
          strokeWidth="1.8"
        />
        <path
          d="M 116 88 L 119 94 L 125 94 L 121 98 L 123 104 L 116 100 L 110 104 L 112 98 L 108 94 L 114 94 Z"
          fill="#F2A93B"
          stroke="#111"
          strokeWidth="1.8"
        />
      </>
    );
  }

  const blinkDuration = preAction ? 100 : 3.2;

  return (
    <>
      <motion.circle
        cx="100"
        cy="92"
        r={mood === 'stressed' ? 4.8 : 4.2}
        fill="#111"
        animate={{ scaleY: [1, 0.12, 1] }}
        transition={{ duration: blinkDuration, repeat: Infinity, ease: EASE }}
        style={{ originX: '100px', originY: '92px' }}
      />
      <motion.circle
        cx="121"
        cy="92"
        r={mood === 'stressed' ? 4.8 : 4.2}
        fill="#111"
        animate={{ scaleY: [1, 0.12, 1] }}
        transition={{ duration: blinkDuration, repeat: Infinity, delay: 0.2, ease: EASE }}
        style={{ originX: '121px', originY: '92px' }}
      />
    </>
  );
}

function getMouth(mood: Mood) {
  switch (mood) {
    case 'hopeful':
      return 'M 101 114 Q 110 120 119 114';
    case 'broken':
      return 'M 101 118 Q 110 111 119 118';
    case 'regret':
      return 'M 101 118 Q 110 109 119 118';
    case 'sleepy':
      return 'M 103 116 Q 110 119 117 116';
    case 'confused':
      return 'M 103 118 Q 108 114 114 117';
    default:
      return 'M 103 116 L 117 116';
  }
}

function getPreActionPose(preAction?: string | null) {
  switch (preAction) {
    case 'check-portfolio':
      return { bodyRotate: -1, headRotate: -2, phoneRotate: 8, bodyY: -1 };
    case 'buy-dip':
      return { bodyRotate: 1, headRotate: 1, phoneRotate: -6, bodyY: -2 };
    case 'go-sleep':
      return { bodyRotate: -1, headRotate: -3, phoneRotate: 0, bodyY: 2 };
    case 'touch-grass':
      return { bodyRotate: 1, headRotate: 2, phoneRotate: -2, bodyY: -1 };
    case 'open-telegram':
      return { bodyRotate: -2, headRotate: -2, phoneRotate: 6, bodyY: 0 };
    case 'listen-influencer':
      return { bodyRotate: 1, headRotate: 3, phoneRotate: -1, bodyY: -1 };
    case 'ape-coin':
      return { bodyRotate: 2, headRotate: 2, phoneRotate: -8, bodyY: -2 };
    case 'post-x':
      return { bodyRotate: 1, headRotate: 1, phoneRotate: -10, bodyY: -1 };
    case 'sell-peace':
      return { bodyRotate: -2, headRotate: -1, phoneRotate: 2, bodyY: 1 };
    default:
      return { bodyRotate: 0, headRotate: 0, phoneRotate: 0, bodyY: 0 };
  }
}

function getPostOutcomePose(mood: Mood, vfxType?: string) {
  if (vfxType === 'fake-gain-collapse') {
    return {
      bodyY: 3,
      bodyRotate: -2,
      headRotate: -3,
      phoneRotate: 6,
    };
  }

  switch (mood) {
    case 'regret':
      return { bodyY: 3, bodyRotate: -1.8, headRotate: -2.6, phoneRotate: 5 };
    case 'broken':
      return { bodyY: 4, bodyRotate: -2.4, headRotate: -3.2, phoneRotate: 7 };
    case 'hopeful':
      return { bodyY: -2, bodyRotate: 0.8, headRotate: 1.4, phoneRotate: -5 };
    case 'stressed':
      return { bodyY: 1, bodyRotate: -1, headRotate: -1.8, phoneRotate: 7 };
    case 'sleepy':
      return { bodyY: 2, bodyRotate: -0.8, headRotate: -2.2, phoneRotate: 0 };
    case 'confused':
      return { bodyY: 0, bodyRotate: 0.6, headRotate: 2, phoneRotate: -1 };
    case 'euphoric':
      return { bodyY: -3, bodyRotate: 1.2, headRotate: 1.8, phoneRotate: -8 };
    default:
      return { bodyY: 0, bodyRotate: 0, headRotate: 0, phoneRotate: -2 };
  }
}

function getPhoneGlowColor(
  mood: Mood,
  vfxType?: string,
  preAction?: string | null
) {
  if (preAction === 'check-portfolio') return '#8EA3C0';
  if (preAction === 'buy-dip') return '#58B889';
  if (vfxType === 'red-flicker' || mood === 'broken' || mood === 'regret') return '#E56B6F';
  if (vfxType === 'green-pop' || mood === 'hopeful') return '#58B889';
  if (vfxType === 'gold-shine' || mood === 'euphoric') return '#F2A93B';
  if (mood === 'sleepy') return '#7C6CF2';
  return '#8EA3C0';
}

function getPhoneGlowOpacity(
  mood: Mood,
  vfxType?: string,
  preAction?: string | null
) {
  if (preAction) return [0.04, 0.14, 0.04];
  if (vfxType === 'gold-shine') return [0.05, 0.18, 0.05];
  if (vfxType === 'green-pop') return [0.04, 0.12, 0.04];
  if (vfxType === 'red-flicker' || mood === 'regret' || mood === 'broken') {
    return [0.03, 0.11, 0.03];
  }
  return 0.03;
}

function getPhoneGlowScale(
  mood: Mood,
  vfxType?: string,
  preAction?: string | null
) {
  if (preAction) return [0.95, 1.06, 0.96];
  if (vfxType === 'gold-shine' || mood === 'euphoric') return [0.96, 1.1, 0.97];
  if (vfxType === 'green-pop' || mood === 'hopeful') return [0.96, 1.07, 0.97];
  return 1;
}

function getPhoneScreenColor(
  mood: Mood,
  vfxType?: string,
  preAction?: string | null
) {
  return getPhoneGlowColor(mood, vfxType, preAction);
}

function getPhoneScreenOpacity(
  mood: Mood,
  vfxType?: string,
  preAction?: string | null
) {
  if (preAction) return 0.18;
  if (vfxType === 'gold-shine') return 0.22;
  if (vfxType === 'green-pop') return 0.18;
  if (vfxType === 'red-flicker' || mood === 'broken' || mood === 'regret') return 0.2;
  return 0.1;
}