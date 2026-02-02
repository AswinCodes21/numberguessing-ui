import React, { useState, useRef, useEffect } from 'react';
import { validateGuess } from '../utils';

interface PlayerSetupScreenProps {
  digitCount: 3 | 4;
  onConfirm: (secret: string) => void | Promise<void>;
  onBack: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// List of fun and energetic tips
const funTips = [
  "Pro Tip: Use a mix of odd and even numbers to keep your opponent guessing!",
  "Fun Fact: The number 7 is considered lucky in many cultures. Will you include it?",
  "Challenge: Try to create a code that spells a word on a phone keypad!",
  "Did You Know? The world record for solving a 4-digit code is under 10 seconds!",
  "Tip: Avoid repeating digits—it makes your code harder to crack!",
  "Fun Idea: Use your favorite numbers or a special date for your code!",
  "Pro Move: Think like a detective—what code would be hardest for you to guess?",
  "Energy Boost: Take a deep breath and pick a code that feels powerful!",
  "Secret Trick: Visualize your code as a pattern or shape in your mind!",
  "Mind Game: Pretend you're a spy setting a top-secret passcode!",
  "Creative Twist: Use numbers that add up to your lucky number!",
  "Fun Challenge: Try to make a code that looks like a smiley face on a digital clock (e.g., 25:87)!",
  "Pro Strategy: Use prime numbers for an extra layer of complexity!",
  "Did You Know? Some people use their house number or street address as their code!",
  "Fun Idea: Pick numbers that match the jersey numbers of your favorite athletes!",
  "Tip: Try to avoid obvious sequences like 1234 or 1111—they’re too easy to guess!",
  "Mind Hack: Imagine your code as a combination to a treasure chest—what would unlock it?",
  "Energy Boost: Play some upbeat music while you pick your code to get in the zone!",
  "Fun Fact: The number 13 is considered unlucky by some, but lucky by others. Dare to use it?",
  "Creative Idea: Use numbers that represent letters (A=1, B=2, etc.) to spell a hidden word!",
  "Pro Tip: If you’re feeling bold, use a code that’s a palindrome (e.g., 1221)!",
  "Fun Challenge: Create a code where each digit is larger than the previous one!",
  "Mind Game: Pretend your code is a password to a secret mission—make it unforgettable!",
  "Tip: Use numbers that have special meaning to you, like a birthday or anniversary!",
  "Fun Idea: Try to create a code that looks like a zigzag pattern on paper!",
  "Energy Boost: Stand up and stretch before picking your code—it helps with creativity!",
  "Secret Trick: Whisper your code to yourself—if it feels right, it probably is!",
  "Did You Know? Some people believe that codes with repeating patterns are easier to remember!",
  "Fun Twist: Use numbers that correspond to colors in a rainbow (e.g., 1=Red, 2=Orange, etc.)!",
  "Pro Strategy: Think about what numbers you’d least expect someone to choose!",
  "Creative Challenge: Make a code that uses only even or only odd numbers!",
];


const PlayerSetupScreen: React.FC<PlayerSetupScreenProps> = ({ digitCount, onConfirm, onBack, isDarkMode, toggleDarkMode }) => {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [randomTip, setRandomTip] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Set a random tip when the component mounts
    setRandomTip(funTips[Math.floor(Math.random() * funTips.length)]);
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...secret];
    newDigits[index] = value;
    setSecret(newDigits.join(''));
    setError('');
    if (value && index < digitCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !secret[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    setError('');

    if (!secret || secret.length === 0) {
      setError(`Please enter ${digitCount} digits`);
      return;
    }

    if (secret.length < digitCount) {
      setError(`Please enter exactly ${digitCount} digits`);
      return;
    }

    if (secret.length > digitCount) {
      setError(`Maximum ${digitCount} digits allowed`);
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

  const isValid = secret.length === digitCount;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* 3D Background Elements */}
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

        <div className={`absolute -bottom-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
          isDarkMode
            ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
            : 'bg-gradient-to-r from-blue-300 to-cyan-200'
        }`} style={{ animationDelay: '4s' }}></div>

        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(90deg, rgba(100, 150, 255, 0.1) 1px, transparent 1px),
                              linear-gradient(rgba(100, 150, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full opacity-30 animate-pulse bg-blue-400"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full opacity-30 animate-pulse bg-cyan-400" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full opacity-30 animate-pulse bg-blue-400" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-3 h-3 rounded-full opacity-20 animate-pulse bg-cyan-400" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleDarkMode}
          className="relative inline-flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 hover:border-blue-300"
          title="Switch to Dark Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 hover:border-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-bold uppercase tracking-wide">Back</span>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-2xl space-y-8 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tight from-blue-600 via-cyan-500 to-blue-600">
            Set Your Secret
          </h1>
          <p className="text-lg font-medium text-slate-600">
            Choose a {digitCount}-digit code that your opponent will try to guess
          </p>
        </div>

        {/* Secret Input */}
        <div className="space-y-4">
          <input
            type="text"
            maxLength={digitCount}
            placeholder={`Enter ${digitCount} digits`}
            value={secret}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setSecret(value);
              setTouched(true);
              setError('');
            }}
            onBlur={() => setTouched(true)}
            className={`w-full px-6 py-4 rounded-2xl font-mono text-xl md:text-2xl font-semibold text-center tracking-[0.25em] transition-all duration-300 border-2 ${error && touched
              ? isDarkMode
                ? 'bg-red-900 bg-opacity-20 border-red-500 text-red-300 placeholder-red-300'
                : 'bg-red-50 border-red-500 text-red-600 placeholder-red-400'
              : isDarkMode
                ? 'bg-slate-700 bg-opacity-50 border-blue-400 border-opacity-50 text-cyan-300 placeholder-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-30'
                : 'bg-white bg-opacity-50 border-blue-300 border-opacity-60 text-blue-600 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-20'
              }`}
          />

          {/* Digit Counter */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: digitCount }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all duration-300 ${
                  i < secret.length
                    ? isDarkMode
                      ? 'bg-blue-500 text-white scale-110'
                      : 'bg-blue-500 text-white scale-110'
                    : isDarkMode
                      ? 'bg-slate-700 bg-opacity-50 text-slate-400'
                      : 'bg-slate-200 text-slate-400'
                }`}
              >
                {i < secret.length ? secret[i] : '-'}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && touched && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              isDarkMode
                ? 'bg-red-900 bg-opacity-30 border border-red-400 border-opacity-50 text-red-300'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              ⚠️ {error}
            </div>
          )}

          {/* Success Message */}
          {isValid && touched && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              isDarkMode
                ? 'bg-emerald-900 bg-opacity-30 border border-emerald-400 border-opacity-50 text-emerald-300'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              ✓ Perfect! Your code is ready to lock.
            </div>
          )}

          {/* Info Box */}
          <div className={`rounded-2xl p-5 border ${
            isDarkMode
              ? 'bg-blue-900 bg-opacity-30 border-blue-400 border-opacity-30'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              💡 Tip
            </p>
            <p className={`text-sm mt-2 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              {randomTip}
            </p>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!isValid || isSubmitting}
          className={`w-full font-bold text-lg py-5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            isDarkMode
              ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white'
          }`}
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
      </div>
    </div>
  );
};

export default PlayerSetupScreen;
