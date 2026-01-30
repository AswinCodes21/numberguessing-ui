
import React, { useState, useRef, useEffect } from 'react';
import { GameState, GuessResult } from '../types';
import { validateGuess } from '../utils';

interface Props {
  state: GameState;
  onGuess: (guess: string) => void;
  onQuit: () => void;
}

const HistoryPanel: React.FC<{ title: string; history: GuessResult[]; icon: string; theme: 'indigo' | 'slate' }> = ({ title, history, icon, theme }) => {
  const isIndigo = theme === 'indigo';
  return (
    <div className="flex flex-col h-[400px] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
      <div className={`px-5 py-3 flex items-center gap-2 ${isIndigo ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-slate-50 border-b border-slate-100'}`}>
        <span className="text-xl">{icon}</span>
        <h3 className={`text-xs font-black uppercase tracking-widest ${isIndigo ? 'text-indigo-700' : 'text-slate-700'}`}>{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-[10px] font-bold uppercase tracking-widest">No Activity</p>
          </div>
        ) : (
          history.map((h, i) => (
            <div key={h.timestamp} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between animate-slideIn">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-300">#{history.length - i}</span>
                <span className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{h.guess}</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-xl text-xs font-black border border-emerald-200">🟢 {h.bulls}</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-xl text-xs font-black border border-amber-200">🟡 {h.cows}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GameScreenComp: React.FC<Props> = ({ state, onGuess, onQuit }) => {
  const [digits, setDigits] = useState<string[]>(new Array(state.digitCount).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Guess input disabled unless it's our turn (restored from GameState after refresh/reconnect; also updated by TurnChanged)
  const isMyTurn = state.currentTurn === 'SELF' && state.gameStatus === 'PLAYING' && !state.isPendingResult;
  const opponentLabel = state.gameMode === 'AI' ? 'Computer' : 'Opponent';

  useEffect(() => {
    if (isMyTurn) inputRefs.current[0]?.focus();
  }, [isMyTurn]);

  const handleInputChange = (idx: number, val: string) => {
    if (!isMyTurn || (val && !/^\d$/.test(val))) return;
    const newDigits = [...digits];
    newDigits[idx] = val;
    setDigits(newDigits);
    setError(null);
    if (val && idx < state.digitCount - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleSubmit = () => {
    const guess = digits.join('');
    const err = validateGuess(guess, state.digitCount);
    if (err) {
      setError(err);
      return;
    }
    onGuess(guess);
    setDigits(new Array(state.digitCount).fill(''));
  };

  // Requirement 3: Game Status Handling for "WAITING"
  if (state.gameStatus === 'WAITING' && state.gameMode === 'ONLINE') {
    return (
      <div className="p-20 text-center flex flex-col items-center">
        <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Waiting for Opponent</h2>
        <p className="text-slate-500 font-medium">Room Code: <span className="text-indigo-600 font-bold">{state.roomCode}</span></p>
        <p className="text-slate-400 text-sm mt-2 italic">The game will start once both players set their secret codes.</p>
        <button onClick={onQuit} className="mt-12 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel Duel</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Dynamic Header with Turn Indicator */}
      <div className={`px-8 py-6 flex items-center justify-between transition-all duration-700 ${isMyTurn ? 'bg-indigo-600' : 'bg-slate-900'}`}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-white/20 border border-white/30 backdrop-blur-md`}>
              {state.currentTurn === 'SELF' ? '🙎‍♂️' : '🤖'}
            </div>
            {isMyTurn && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse"></div>}
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-none mb-1">
              {state.isPendingResult ? 'Validating...' : isMyTurn ? "Your Turn" : `${opponentLabel}'s Turn`}
            </h2>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
              {state.gameMode === 'ONLINE' ? `Duel Mode` : 'Vs AI (Minimax)'}
            </p>
          </div>
        </div>
        <button onClick={onQuit} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold transition-all uppercase tracking-widest">
          Quit
        </button>
      </div>

      {/* Requirement 2: Separate History Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50/50">
        <HistoryPanel title="My Guesses" history={state.selfGuessHistory} icon="🎯" theme="indigo" />
        <HistoryPanel title={`${opponentLabel}'s Guesses`} history={state.opponentGuessHistory} icon="🔮" theme="slate" />
      </div>

      {/* Interaction Bar */}
      <div className="px-8 pb-10 bg-white">
        <div className={`transition-all duration-500 ${isMyTurn ? 'opacity-100 translate-y-0' : 'opacity-20 pointer-events-none translate-y-4'}`}>
          <div className="flex flex-col items-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-widest">Submit your {state.digitCount}-digit guess</p>
            <div className="flex gap-4 mb-6">
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  // Fix: Ensure the callback ref returns void to satisfy TypeScript Ref type
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  disabled={!isMyTurn}
                  value={d}
                  onChange={e => handleInputChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className="w-14 h-20 text-center text-4xl font-black rounded-2xl border-4 border-slate-100 focus:border-indigo-600 outline-none transition-all text-slate-900 bg-white shadow-inner"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-xs font-black mb-4 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-lg border border-red-100">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!isMyTurn || digits.some(d => !d)}
              className="w-full max-w-sm py-5 rounded-2xl font-black text-white bg-indigo-600 shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:shadow-none uppercase tracking-widest"
            >
              {state.isPendingResult ? 'Waiting for Server...' : 'Submit Guess'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.4s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default GameScreenComp;
