import React from 'react';
import { Turn, PlayerRole } from '../types';

interface Props {
  winner: Turn | null;
  playerSecret: string;
  opponentSecret: string;
  playerAttempts: number;
  opponentAttempts: number;
  onPlayAgain: () => void;
  onHome: () => void;
  playerRole?: PlayerRole;
}

const WinScreen: React.FC<Props> = ({
  winner,
  playerSecret,
  opponentSecret,
  playerAttempts,
  opponentAttempts,
  onPlayAgain,
  onHome,
  playerRole = 'NONE',
}) => {
const isWinner = winner === 'SELF';
  const isHost = playerRole === 'HOST';

  return (
    <div className="p-8 md:p-12 text-center flex flex-col items-center win-screen">
      {/* Result headline */}
      <div className="text-6xl md:text-7xl mb-4 win-emoji">
        {isWinner ? '👑' : '💀'}
      </div>
      <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-1 leading-none">
        {isWinner ? 'You won!' : 'You lost'}
      </h2>
      <p className="text-slate-500 font-bold mb-10 uppercase tracking-[0.2em] text-xs">
        Game over
      </p>

      {/* Side-by-side: Your Number | Opponent's Number — clear labels, winner highlighted */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        {/* Your Number — left */}
        <div
          className={`win-card win-card-reveal win-card-you ${isWinner ? 'win-card-winner' : ''}`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Your number
            </span>
            {isWinner && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                Winner
              </span>
            )}
          </div>
          <div className="text-4xl md:text-5xl font-black tracking-widest text-slate-900 font-mono win-number-reveal">
            {playerSecret || '—'}
          </div>
          <p className="mt-3 text-xs font-bold text-slate-400">
            Opponent solved it in <strong className="text-slate-600">{opponentAttempts}</strong> attempt{opponentAttempts !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Opponent's Number — right */}
        <div
          className={`win-card win-card-reveal win-card-opponent ${!isWinner ? 'win-card-winner' : ''}`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Opponent&apos;s number
            </span>
            {!isWinner && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                Winner
              </span>
            )}
          </div>
          <div className="text-4xl md:text-5xl font-black tracking-widest text-slate-900 font-mono win-number-reveal">
            {opponentSecret || '????'}
          </div>
          <p className="mt-3 text-xs font-bold text-slate-400">
            You solved it in <strong className="text-slate-600">{playerAttempts}</strong> attempt{playerAttempts !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={onPlayAgain}
          disabled={!isHost}
          className={`flex-1 py-4 font-black rounded-2xl shadow-lg transition-all ${isHost ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          {isHost ? 'Play again' : 'Waiting for host'}
        </button>
        <button
          onClick={onHome}
          className="flex-1 py-4 bg-slate-200 text-slate-800 font-black rounded-2xl hover:bg-slate-300 transition-all"
        >
          Main menu
        </button>
      </div>

      <style>{`
        .win-screen {
          animation: winFadeIn 0.5s ease-out forwards;
        }
        @keyframes winFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .win-emoji {
          animation: winEmojiPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
          opacity: 0;
          transform: scale(0.5);
        }
        @keyframes winEmojiPop {
          to { opacity: 1; transform: scale(1); }
        }

        .win-card {
          padding: 1.5rem;
          border-radius: 1.5rem;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          text-align: center;
          opacity: 0;
          transform: translateY(16px);
        }
        .win-card-reveal {
          animation: winCardReveal 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
        .win-card-you { animation-delay: 0.12s; }
        .win-card-opponent { animation-delay: 0.24s; }
        @keyframes winCardReveal {
          to { opacity: 1; transform: translateY(0); }
        }

        .win-card-winner {
          border-color: #10b981;
          background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .win-number-reveal {
          animation: winNumberReveal 0.4s ease-out 0.4s forwards;
          opacity: 0;
        }
        @keyframes winNumberReveal {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default WinScreen;
