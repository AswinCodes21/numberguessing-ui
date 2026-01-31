
import React, { useState, useRef, useEffect } from 'react';
import { validateGuess } from '../utils';

interface PlayerSetupScreenProps {
  digitCount: 3 | 4;
  onConfirm: (secret: string) => void | Promise<void>;
  onBack: () => void;
}

const PlayerSetupScreen: React.FC<PlayerSetupScreenProps> = ({ digitCount, onConfirm, onBack }) => {
  const [digits, setDigits] = useState<string[]>(new Array(digitCount).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(null);
    if (value && index < digitCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const secret = digits.join('');
    const validationError = validateGuess(secret, digitCount);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.warn('[PlayerSetup] submitting secret:', secret);
      await onConfirm(secret);
    } catch (err) {
      setError("Failed to communicate with server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-lg mx-auto text-center">
      <button 
        onClick={onBack} 
        disabled={isSubmitting}
        className="mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold text-sm">Back</span>
      </button>

      <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Set Your Secret Code</h2>
      <p className="text-slate-500 mb-8">
        The AI will try to guess this code. <br/>
        <strong className="text-indigo-600">Repeating digits are allowed!</strong>
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-center gap-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="password"
              maxLength={1}
              value={digit}
              disabled={isSubmitting}
              onChange={e => handleInputChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className="w-16 h-20 text-center text-4xl font-black rounded-2xl border-4 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-slate-900 bg-white disabled:bg-slate-50 disabled:opacity-50"
            />
          ))}
        </div>

        {error && <p className="text-red-500 font-semibold animate-pulse">{error}</p>}

        <button
          type="submit"
          disabled={digits.some(d => !d) || isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Locking In...</span>
            </>
          ) : (
            'Lock In Secret Code'
          )}
        </button>
      </form>
    </div>
  );
};

export default PlayerSetupScreen;
