import React, { useState, useEffect } from 'react';

interface SequentialGameLoaderProps {
  onComplete?: () => void;
  minDuration?: number;
  maxDuration?: number;
  isDarkMode?: boolean;
}

const SequentialGameLoader: React.FC<SequentialGameLoaderProps> = ({
  onComplete,
  minDuration = 1200,
  maxDuration = 10000,
  isDarkMode = false,
}) => {
  const messages = [
    'Initializing client…',
    'Connecting to server…',
    'Authenticating session…',
    'Syncing game state…',
    'Preparing match…',
    'Entering game…',
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [startTime] = useState(Date.now());

  // Handle message transitions sequentially
  useEffect(() => {
    // If all messages have been shown and we're not exiting yet, start exit
    if (currentMessageIndex >= messages.length && !isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // If already exiting, don't schedule new messages
    if (isExiting) {
      return;
    }

    // If we've shown all messages, don't schedule more
    if (currentMessageIndex >= messages.length) {
      return;
    }

    const messageDuration = 800; // Time each message is shown
    const fadeOutStart = messageDuration - 200; // Start fade out 200ms before transition

    // Fade out the current message
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, fadeOutStart);

    // Move to next message
    const nextMessageTimer = setTimeout(() => {
      setCurrentMessageIndex(prev => prev + 1);
      setIsVisible(true);
    }, messageDuration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextMessageTimer);
    };
  }, [currentMessageIndex, messages.length, isExiting]);

  // Handle exit animation and completion
  useEffect(() => {
    if (!isExiting) return;

    const exitTimer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      // Ensure minimum duration has passed
      if (elapsed >= minDuration) {
        onComplete?.();
      }
    }, 600); // Duration of exit animation

    return () => clearTimeout(exitTimer);
  }, [isExiting, onComplete, minDuration, startTime]);

  // Absolute max timeout to ensure loader doesn't hang
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      onComplete?.();
    }, maxDuration);

    return () => clearTimeout(maxTimer);
  }, [maxDuration, onComplete]);

  const currentMessage = currentMessageIndex < messages.length 
    ? messages[currentMessageIndex] 
    : messages[messages.length - 1];

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center z-50 transition-all duration-600 ${
        isExiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center gap-8 w-full px-8">
        {/* Animated logo/game title */}
        <div
          className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 transition-all duration-500 ${
            isExiting ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
          }`}
          style={{
            animation: isExiting ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          Digit Duel
        </div>

        {/* Sequential message with fade in/out */}
        <div className="h-16 flex items-center justify-center min-w-[300px]">
          <div
            className={`text-lg font-medium text-slate-300 text-center transition-all duration-300 ${
              isExiting ? 'opacity-0 -translate-y-4' : isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {currentMessage}
          </div>
        </div>

        {/* Animated loading spinner */}
        <div className={`flex gap-3 transition-all duration-500 ${isExiting ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
          <div
            className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite',
              animationDelay: '0s',
            }}
          ></div>
          <div
            className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.2s',
            }}
          ></div>
          <div
            className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite',
              animationDelay: '0.4s',
            }}
          ></div>
        </div>

        {/* Progress bar showing which message we're on */}
        <div className="flex gap-2 mt-8 items-center">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index < currentMessageIndex
                  ? 'w-10 bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : index === currentMessageIndex
                    ? 'w-10 bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse'
                    : 'w-2 bg-slate-600'
              }`}
            ></div>
          ))}
        </div>

        {/* Message counter */}
        <div className={`text-xs text-slate-400 mt-6 transition-all duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
          {Math.min(currentMessageIndex + 1, messages.length)} / {messages.length}
        </div>
      </div>

      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div
          className="absolute top-1/3 right-1/4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      {/* Custom animations in style tag */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-12px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default SequentialGameLoader;
