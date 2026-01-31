import React from 'react';

/** Neon Arena theme: #0f0f14 bg, #00f5d4 accent, #ffffff title. High contrast, no grey gradients. */
const NEON_ARENA = {
  bg: '#0f0f14',
  bgSubtle: '#16161d',
  title: '#ffffff',
  status: '#00f5d4',
  subtext: '#b8b8c8',
  accentGlow: 'rgba(0, 245, 212, 0.6)',
  dotBg: '#00f5d4',
  dotGlow: 'rgba(0, 245, 212, 0.85)',
  buttonBorder: '#2d2d3a',
  buttonHover: '#00f5d4',
  // Compact (on light card): dark text, teal accent
  compactTitle: '#0f0f14',
  compactStatus: '#0f766e',
  compactSubtext: '#475569',
  compactDot: '#0d9488',
} as const;

interface GameLoaderProps {
  status: string;
  subtext?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  fullScreen?: boolean;
  compact?: boolean;
}

const GameLoader: React.FC<GameLoaderProps> = ({
  status,
  subtext,
  showCancel = false,
  onCancel,
  fullScreen = true,
  compact = false,
}) => {
  return (
    <div
      className={fullScreen
        ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center game-loader-bg'
        : 'flex flex-col items-center justify-center p-12 min-h-[320px]'
      }
    >
      {/* Game title — strong contrast, soft cyan glow (full-screen only) */}
      <div className={compact ? 'mb-6' : 'mb-10'}>
        <h1
          className={`font-black tracking-tight loader-title ${
            compact
              ? 'text-xl text-[#0f0f14]'
              : 'text-3xl md:text-4xl text-white'
          }`}
        >
          Digit Duel
        </h1>
      </div>

      {/* Bouncing dots — accent color, high visibility */}
      <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-6' : 'mb-8'}`}>
        <span className={`loader-dot loader-dot-1 ${compact ? 'loader-dot-compact' : ''}`} />
        <span className={`loader-dot loader-dot-2 ${compact ? 'loader-dot-compact' : ''}`} />
        <span className={`loader-dot loader-dot-3 ${compact ? 'loader-dot-compact' : ''}`} />
      </div>

      {/* Status — bold, readable, no fade */}
      <p
        className={`font-extrabold tracking-wide mb-1 loader-status ${
          compact
            ? 'text-base text-[#0f766e]'
            : 'text-lg md:text-xl text-[#00f5d4]'
        }`}
      >
        {status}
      </p>
      {subtext && (
        <p
          className={`font-medium max-w-xs text-center ${
            compact ? 'text-xs text-[#475569]' : 'text-sm text-[#b8b8c8]'
          }`}
        >
          {subtext}
        </p>
      )}

      {showCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-10 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border game-loader-cancel"
        >
          Cancel
        </button>
      )}

      <style>{`
        .game-loader-bg {
          background: ${NEON_ARENA.bg};
        }

        .loader-title {
          animation: loaderTitlePulse 2s ease-in-out infinite;
        }
        @keyframes loaderTitlePulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 14px ${NEON_ARENA.accentGlow}); }
          50% { opacity: 0.95; filter: drop-shadow(0 0 22px ${NEON_ARENA.accentGlow}); }
        }

        .loader-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${NEON_ARENA.dotBg};
          box-shadow: 0 0 16px ${NEON_ARENA.dotGlow};
        }
        .loader-dot-compact {
          background: ${NEON_ARENA.compactDot};
          box-shadow: 0 0 12px rgba(13, 148, 136, 0.7);
        }
        .loader-dot-1 { animation: loaderBounce 0.5s ease-in-out infinite; }
        .loader-dot-2 { animation: loaderBounce 0.5s ease-in-out 0.15s infinite; }
        .loader-dot-3 { animation: loaderBounce 0.5s ease-in-out 0.3s infinite; }
        @keyframes loaderBounce {
          0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-10px) scale(1.25); opacity: 1; }
        }

        .loader-status {
          letter-spacing: 0.03em;
        }

        .game-loader-cancel {
          border-color: ${NEON_ARENA.buttonBorder};
          color: ${NEON_ARENA.subtext};
        }
        .game-loader-cancel:hover {
          border-color: ${NEON_ARENA.buttonHover};
          color: ${NEON_ARENA.buttonHover};
          background: rgba(0, 245, 212, 0.08);
        }
      `}</style>
    </div>
  );
};

export default GameLoader;
