
import React from 'react';
import { Turn } from '../types';

interface Props {
  winner: Turn | null;
  playerSecret: string;
  opponentSecret: string;
  playerAttempts: number;
  opponentAttempts: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

const WinScreen: React.FC<Props> = ({ winner, playerSecret, opponentSecret, playerAttempts, opponentAttempts, onPlayAgain, onHome }) => {
  const isMyWinner = winner === 'SELF';

  return (
    <div className="p-12 text-center flex flex-col items-center animate-celebrate">
      <div className="text-8xl mb-8 transform hover:scale-110 transition-transform">
        {isMyWinner ? '👑' : '💀'}
      </div>

      <h2 className="text-6xl font-black text-slate-900 mb-2 leading-none">
        {isMyWinner ? 'Victory!' : 'Defeat!'}
      </h2>
      <p className="text-slate-500 font-bold mb-12 uppercase tracking-[0.3em] text-xs">
        Game Concluded
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
        <div className={`p-8 rounded-[2rem] border-4 transition-all ${isMyWinner ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white shadow-xl'}`}>
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Opponent Code</h3>
          <div className="text-5xl font-black tracking-widest text-slate-900 font-mono">{opponentSecret || '????'}</div>
          <p className="mt-4 text-xs font-bold text-slate-400">{playerAttempts} Attempts to Solve</p>
        </div>

        <div className={`p-8 rounded-[2rem] border-4 transition-all ${!isMyWinner ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-white shadow-xl'}`}>
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Your Code</h3>
          <div className="text-5xl font-black tracking-widest text-slate-900 font-mono">{playerSecret}</div>
          <p className="mt-4 text-xs font-bold text-slate-400">{opponentAttempts} Opponent Attempts</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button onClick={onPlayAgain} className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">
          New Round
        </button>
        <button onClick={onHome} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">
          Main Menu
        </button>
      </div>

      <style>{`
        @keyframes celebrate {
          0% { opacity: 0; transform: scale(0.9) translateY(40px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-celebrate { animation: celebrate 0.7s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}</style>
    </div>
  );
};

export default WinScreen;
