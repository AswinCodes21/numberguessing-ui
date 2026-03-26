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
  const [secretVisible, setSecretVisible] = useState(false); // default hidden; toggle to reveal
  const [dragPosition, setDragPosition] = useState({ x: 16, y: 16 }); // Store position in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeHistoryPanel, setActiveHistoryPanel] = useState(0); // 0 = My Guesses, 1 = Opponent's Guesses
  const [swipeStart, setSwipeStart] = useState({ x: 0, y: 0 });
  const [isSwipingHistory, setIsSwipingHistory] = useState(false);
  const secretBoxRef = useRef<HTMLDivElement>(null);
  const historyCarouselRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasAudioInteractionRef = useRef(false);
  const prevTurnRef = useRef(state.currentTurn);
  const prevSelfHistoryLenRef = useRef(state.selfGuessHistory.length);
  const prevOpponentHistoryLenRef = useRef(state.opponentGuessHistory.length);
  const prevPendingResultRef = useRef(state.isPendingResult);

  // Debug: log secret visibility and role to help diagnose guest badge issues
  useEffect(() => {
    try {
      console.debug('[GameScreen] playerRole=', state.playerRole, 'playerSecret=', state.playerSecret, 'opponentSecret=', state.opponentSecret);
    } catch (e) {
      /* ignore */
    }
  }, [state.playerRole, state.playerSecret, state.opponentSecret]);

  // Guess input disabled unless it's our turn (restored from GameState after refresh/reconnect; also updated by TurnChanged)
  const isMyTurn = state.currentTurn === 'SELF' && state.gameStatus === 'PLAYING' && !state.isPendingResult;
  const opponentLabel = state.gameMode === 'AI' ? 'Computer' : 'Opponent';

  useEffect(() => {
    if (isMyTurn) inputRefs.current[0]?.focus();
  }, [isMyTurn]);

  const ensureAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => undefined);
    }
    return audioContextRef.current;
  };

  const registerAudioInteraction = () => {
    hasAudioInteractionRef.current = true;
    ensureAudioContext();
  };

  const playTone = (frequency: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.05, delay = 0) => {
    const context = ensureAudioContext();
    if (!context || !hasAudioInteractionRef.current) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  };

  const playSound = (kind: 'submit' | 'error' | 'myTurn' | 'opponentTurn' | 'myResult' | 'opponentResult') => {
    if (!hasAudioInteractionRef.current) return;
    switch (kind) {
      case 'submit':
        playTone(420, 0.08, 'triangle', 0.03);
        playTone(620, 0.11, 'triangle', 0.03, 0.09);
        break;
      case 'error':
        playTone(220, 0.14, 'sawtooth', 0.04);
        playTone(160, 0.16, 'sawtooth', 0.03, 0.1);
        break;
      case 'myTurn':
        playTone(523.25, 0.09, 'sine', 0.035);
        playTone(659.25, 0.12, 'sine', 0.04, 0.08);
        break;
      case 'opponentTurn':
        playTone(330, 0.08, 'sine', 0.025);
        playTone(261.63, 0.11, 'sine', 0.02, 0.08);
        break;
      case 'myResult':
        playTone(740, 0.08, 'triangle', 0.035);
        playTone(880, 0.1, 'triangle', 0.04, 0.07);
        break;
      case 'opponentResult':
        playTone(280, 0.07, 'triangle', 0.025);
        playTone(350, 0.09, 'triangle', 0.02, 0.08);
        break;
    }
  };

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!hasAudioInteractionRef.current) return;
    const turnChanged = prevTurnRef.current !== state.currentTurn;
    if (turnChanged && state.gameStatus === 'PLAYING') {
      playSound(state.currentTurn === 'SELF' ? 'myTurn' : 'opponentTurn');
    }
    prevTurnRef.current = state.currentTurn;
  }, [state.currentTurn, state.gameStatus]);

  useEffect(() => {
    if (!hasAudioInteractionRef.current) {
      prevSelfHistoryLenRef.current = state.selfGuessHistory.length;
      prevOpponentHistoryLenRef.current = state.opponentGuessHistory.length;
      return;
    }
    if (state.selfGuessHistory.length > prevSelfHistoryLenRef.current) {
      playSound('myResult');
    }
    if (state.opponentGuessHistory.length > prevOpponentHistoryLenRef.current) {
      playSound('opponentResult');
    }
    prevSelfHistoryLenRef.current = state.selfGuessHistory.length;
    prevOpponentHistoryLenRef.current = state.opponentGuessHistory.length;
  }, [state.selfGuessHistory.length, state.opponentGuessHistory.length]);

  useEffect(() => {
    if (!hasAudioInteractionRef.current) {
      prevPendingResultRef.current = state.isPendingResult;
      return;
    }
    if (prevPendingResultRef.current && !state.isPendingResult && state.gameStatus === 'PLAYING') {
      playSound(state.currentTurn === 'SELF' ? 'myTurn' : 'opponentTurn');
    }
    prevPendingResultRef.current = state.isPendingResult;
  }, [state.isPendingResult, state.currentTurn, state.gameStatus]);

  const handleSecretMouseDown = (e: React.MouseEvent) => {
    if (secretBoxRef.current) {
      const rect = secretBoxRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // History carousel swipe handlers
  const handleHistorySwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsSwipingHistory(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setSwipeStart({ x: clientX, y: clientY });
  };

  const handleHistorySwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSwipingHistory || !historyCarouselRef.current) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - swipeStart.x;
    const deltaY = clientY - swipeStart.y;

    // Only trigger swipe if mostly horizontal movement (ignore vertical scrolls)
    // Reduced threshold from 50 to 30 for better mobile responsiveness
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      if (deltaX > 0 && activeHistoryPanel > 0) {
        setActiveHistoryPanel(0);
      } else if (deltaX < 0 && activeHistoryPanel < 1) {
        setActiveHistoryPanel(1);
      }
    }

    setIsSwipingHistory(false);
  };

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
      playSound('error');
      return;
    }
    registerAudioInteraction();
    playSound('submit');
    onGuess(guess);
    setDigits(new Array(state.digitCount).fill(''));
  };

  // If game is waiting (online) we show a subtle overlay but keep the main UI available
  const showWaitingOverlay = state.gameStatus === 'WAITING' && state.gameMode === 'ONLINE';

  return (
    <div className="flex flex-col relative">
      {showWaitingOverlay && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm p-8">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Waiting for Opponent</h2>
            <p className="text-slate-500 font-medium">Room Code: <span className="text-indigo-600 font-bold">{state.roomCode}</span></p>
            <p className="text-slate-400 text-sm mt-2 italic">The game will start once both players set their secret codes.</p>
            <button onClick={onQuit} className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel Duel</button>
          </div>
        </div>
      )}
      {/* Your number — subtle reference, top-left; only your secret, never opponent's. Toggle show/hide (default hidden). */}
      {state.playerSecret && (
        <div
          ref={secretBoxRef}
          className="fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 shadow-lg hover:shadow-xl transition-shadow cursor-move select-none"
          style={{
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
          }}
          onMouseDown={handleSecretMouseDown}
          title={secretVisible ? 'Your secret number (for reference)' : 'Click eye to reveal your number. Drag to move.'}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              Your number
            </p>
            <p className="text-2xl font-black font-mono tracking-wider tabular-nums min-w-[3rem] text-white">
              {secretVisible ? state.playerSecret : '•'.repeat(state.playerSecret.length)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSecretVisible(prev => !prev)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title={secretVisible ? 'Hide number' : 'Show number'}
            aria-label={secretVisible ? 'Hide secret number' : 'Show secret number'}
            onMouseDown={e => e.stopPropagation()}
          >
            {secretVisible ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4 4l3 3m10 10l3 3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      )}

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

      {/* Swipeable History Carousel */}
      <div className="bg-slate-50/50 px-8 pt-8 pb-8">
        {/* Desktop: Side-by-side layout, Mobile: Carousel with swipe */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <HistoryPanel title="My Guesses" history={state.selfGuessHistory} icon="🎯" theme="indigo" />
          <HistoryPanel title={`${opponentLabel}'s Guesses`} history={state.opponentGuessHistory} icon="🔮" theme="slate" />
        </div>

        {/* Mobile: Swipeable Carousel */}
        <div className="md:hidden flex flex-col">
          <div
            ref={historyCarouselRef}
            className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleHistorySwipeStart}
            onTouchEnd={handleHistorySwipeEnd}
            onMouseDown={handleHistorySwipeStart}
            onMouseUp={handleHistorySwipeEnd}
            onMouseLeave={() => setIsSwipingHistory(false)}
            style={{ touchAction: 'pan-y' }}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${activeHistoryPanel * 100}%)`,
              }}
            >
              <div className="w-full flex-shrink-0 px-0">
                <HistoryPanel title="My Guesses" history={state.selfGuessHistory} icon="🎯" theme="indigo" />
              </div>
              <div className="w-full flex-shrink-0 px-0">
                <HistoryPanel title={`${opponentLabel}'s Guesses`} history={state.opponentGuessHistory} icon="🔮" theme="slate" />
              </div>
            </div>
          </div>

          {/* Swipe Indicator Dots - More Visible */}
          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={() => setActiveHistoryPanel(0)}
              className={`transition-all duration-300 ${
                activeHistoryPanel === 0 ? 'bg-indigo-600 w-8 h-3 rounded-full' : 'w-3 h-3 bg-slate-300 rounded-full hover:bg-slate-400'
              }`}
              aria-label="View My Guesses"
              type="button"
            />
            <button
              onClick={() => setActiveHistoryPanel(1)}
              className={`transition-all duration-300 ${
                activeHistoryPanel === 1 ? 'bg-indigo-600 w-8 h-3 rounded-full' : 'w-3 h-3 bg-slate-300 rounded-full hover:bg-slate-400'
              }`}
              aria-label={`View ${opponentLabel}'s Guesses`}
              type="button"
            />
          </div>

          {/* Mobile Hint Text */}
          <p className="text-center text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wider">
            Swipe left/right to switch panels
          </p>
        </div>
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
                  onFocus={registerAudioInteraction}
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
