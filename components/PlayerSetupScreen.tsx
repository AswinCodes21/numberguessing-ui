import React, { useMemo, useRef, useState } from 'react';

interface PlayerSetupScreenProps {
  digitCount: 3 | 4;
  onConfirm: (secret: string) => void | Promise<void>;
  onBack: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const proTips = [
  'Avoid obvious sequences like 123 or 9876.',
  'Mix high and low digits so patterns are harder to infer.',
  'If you repeat a number, do it intentionally to mislead.',
  'Pick a code you can remember instantly under pressure.',
  'Think one move ahead: what would your rival try first?',
];

const PlayerSetupScreen: React.FC<PlayerSetupScreenProps> = ({ digitCount, onConfirm, onBack, isDarkMode, toggleDarkMode }) => {
  const [digits, setDigits] = useState<string[]>(Array.from({ length: digitCount }, () => ''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * proTips.length));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const secret = digits.join('');
  const filledCount = digits.filter(Boolean).length;
  const isValid = filledCount === digitCount;

  const codeComplexity = useMemo(() => {
    if (!isValid) return { label: 'Incomplete', tone: 'neutral' as const };

    const uniqueCount = new Set(digits).size;
    const isSequence = /^0123$|^1234$|^4321$|^3210$|^234$|^345$|^543$|^654$/.test(secret);

    if (isSequence) return { label: 'Weak Pattern', tone: 'weak' as const };
    if (uniqueCount === digitCount) return { label: 'Strong Mix', tone: 'strong' as const };
    return { label: 'Balanced', tone: 'balanced' as const };
  }, [digits, isValid, digitCount, secret]);

  const handleDigitInput = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < digitCount - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < digitCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const generateRandomCode = () => {
    const next = Array.from({ length: digitCount }, () => Math.floor(Math.random() * 10).toString());
    setDigits(next);
    setError('');
  };

  const handleConfirm = async () => {
    if (!isValid) {
      setError(`Please enter exactly ${digitCount} digits.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(secret);
    } catch (_) {
      setError('Failed to communicate with server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
          isDarkMode
            ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
            : 'bg-gradient-to-r from-blue-300 to-cyan-200'
        }`}></div>
        <div className={`absolute top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
          isDarkMode
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
            : 'bg-gradient-to-r from-cyan-300 to-blue-300'
        }`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleDarkMode}
          className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
            isDarkMode
              ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border border-cyan-400 border-opacity-30 hover:border-opacity-50'
              : 'bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 hover:border-blue-300'
          }`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6zm-4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl ${
            isDarkMode
              ? 'bg-slate-800 bg-opacity-50 backdrop-blur-md border border-cyan-400 border-opacity-30 hover:border-opacity-50 text-cyan-300 hover:text-cyan-200'
              : 'bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-wide">Back</span>
        </button>
      </div>

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tight ${
            isDarkMode ? 'from-cyan-300 via-blue-300 to-cyan-300' : 'from-blue-600 via-cyan-500 to-blue-600'
          }`}>
            Secure Your Secret
          </h1>
          <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Set your private {digitCount}-digit code before the duel begins.
          </p>
        </div>

        <div className={`rounded-3xl p-6 md:p-8 border shadow-xl ${
          isDarkMode
            ? 'bg-slate-800/55 backdrop-blur-md border-cyan-400/30'
            : 'bg-white/80 backdrop-blur-md border-blue-100'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
              Enter your code
            </p>
            <button
              type="button"
              onClick={generateRandomCode}
              className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${
                isDarkMode ? 'bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Random code
            </button>
          </div>

          <div className="flex justify-center gap-3 md:gap-4 mb-6">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                autoComplete="off"
                onChange={(e) => handleDigitInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-16 w-14 md:h-20 md:w-16 rounded-2xl text-center text-2xl font-black font-mono transition-all border-2 ${
                  isDarkMode
                    ? 'bg-slate-900/50 border-slate-600 text-cyan-200 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/30'
                    : 'bg-white border-blue-200 text-blue-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300/50'
                }`}
                aria-label={`Code digit ${index + 1}`}
              />
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Security read
              </p>
              <p className={`text-xs font-bold ${
                codeComplexity.tone === 'strong'
                  ? 'text-emerald-500'
                  : codeComplexity.tone === 'weak'
                  ? 'text-rose-500'
                  : codeComplexity.tone === 'balanced'
                  ? 'text-amber-500'
                  : isDarkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}>
                {codeComplexity.label}
              </p>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div
                className={`h-full transition-all duration-300 ${
                  codeComplexity.tone === 'strong'
                    ? 'w-full bg-emerald-500'
                    : codeComplexity.tone === 'balanced'
                    ? 'w-3/4 bg-amber-500'
                    : codeComplexity.tone === 'weak'
                    ? 'w-1/2 bg-rose-500'
                    : 'w-1/4 bg-slate-400'
                }`}
              ></div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 border ${
            isDarkMode ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
              Pro tip
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-cyan-100' : 'text-blue-700'}`}>
              {proTips[tipIndex]}
            </p>
          </div>

          {error && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-semibold ${
              isDarkMode ? 'bg-red-950/40 border border-red-500/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!isValid || isSubmitting}
          className={`w-full font-bold text-lg py-5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Locking In...</span>
            </>
          ) : (
            `Lock ${digitCount}-Digit Code`
          )}
        </button>
      </div>
    </div>
  );
};

export default PlayerSetupScreen;
