import React from 'react';

interface GameLoaderProps {
  /** Main status line, e.g. "Connecting to server..." */
  status: string;
  /** Optional second line (room code, role, etc.) */
  subtext?: string;
  /** Show cancel button (e.g. when reconnecting) */
  showCancel?: boolean;
  onCancel?: () => void;
  /** Full-screen overlay vs inline (e.g. inside card) */
  fullScreen?: boolean;
  /** Smaller title and spacing for inline use */
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
        ? 'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900'
        : 'flex flex-col items-center justify-center p-12 min-h-[320px]'
      }
    >
      {/* Game title with soft pulse */}
      <div className={compact ? 'mb-6' : 'mb-10'}>
        <h1 className={`font-black tracking-tight drop-shadow-lg loader-title ${compact ? 'text-xl text-slate-800' : 'text-3xl md:text-4xl text-white'}`}>
          Digit Duel
        </h1>
      </div>

      {/* Playful loader: bouncing dots in sequence (CSS-only) */}
      <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-6' : 'mb-8'}`}>
        <span className="loader-dot loader-dot-1" />
        <span className="loader-dot loader-dot-2" />
        <span className="loader-dot loader-dot-3" />
      </div>

      {/* Status text */}
      <p className={`font-bold tracking-wide mb-1 loader-status ${compact ? 'text-indigo-600 text-base' : 'text-indigo-200 text-lg'}`}>
        {status}
      </p>
      {subtext && (
        <p className={`font-medium max-w-xs text-center ${compact ? 'text-slate-500 text-xs' : 'text-slate-400 text-sm'}`}>
          {subtext}
        </p>
      )}

      {showCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-10 px-5 py-2.5 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all border border-slate-600/50"
        >
          Cancel
        </button>
      )}

      <style>{`
        .loader-title {
          animation: loaderTitlePulse 2s ease-in-out infinite;
        }
        @keyframes loaderTitlePulse {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.4)); }
          50% { opacity: 0.9; filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.6)); }
        }

        .loader-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a5b4fc, #6366f1);
          box-shadow: 0 0 14px rgba(99, 102, 241, 0.7);
        }
        .loader-dot-1 { animation: loaderBounce 0.5s ease-in-out infinite; }
        .loader-dot-2 { animation: loaderBounce 0.5s ease-in-out 0.15s infinite; }
        .loader-dot-3 { animation: loaderBounce 0.5s ease-in-out 0.3s infinite; }
        @keyframes loaderBounce {
          0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 0.9; }
        }

        .loader-status {
          animation: loaderStatusFade 1.5s ease-in-out infinite;
        }
        @keyframes loaderStatusFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default GameLoader;
