import React, { useState } from 'react';

interface GameGuideProps {
  compact?: boolean;
}

const GameGuide: React.FC<GameGuideProps> = ({ compact = true }) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
      {/* Header with Toggle */}
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-between gap-3 hover:opacity-80 transition-opacity mb-4"
      >
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 5a3 3 0 013-3h13v18H7a3 3 0 00-3 3V5z"/><path d="M7 2v18"/></svg>
          <h3 className="text-xl font-black text-indigo-900 uppercase tracking-wider">
            How to Play
          </h3>
        </div>
        <svg
          className={`w-6 h-6 text-indigo-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Expandable Content */}
      <div
        className={`space-y-4 transition-all duration-300 overflow-y-auto ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Game Overview */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true"></span>
            Game Overview
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            A classic code-breaking logic game where you try to guess your opponent's secret number
            before they guess yours. The more you play, the better you'll become at deducing the
            hidden code!
          </p>
        </div>

        {/* Game Rules */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="7" y="4" width="10" height="16" rx="2"/><path d="M9 4h6v3H9z"/></svg>
            The Rules
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold text-green-600 flex-shrink-0">1.</span>
              <span>Both players set a secret number (3 or 4 unique digits)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600 flex-shrink-0">2.</span>
              <span>Players take turns guessing each other's secret number</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600 flex-shrink-0">3.</span>
              <span>After each guess, you get feedback on how close you are</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600 flex-shrink-0">4.</span>
              <span>First player to guess the secret number correctly wins!</span>
            </li>
          </ul>
        </div>

        {/* Feedback System */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 13c.6.5 1 1.2 1.1 2h5.8c.1-.8.5-1.5 1.1-2A7 7 0 0012 2z"/></svg>
            Feedback Indicators
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></div>
              <div>
                <div className="font-bold text-green-700 text-sm"> (Correct)</div>
                <div className="text-xs text-green-600">Correct digit in correct position</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
              <div className="w-4 h-4 rounded-full bg-amber-400 animate-pulse" aria-hidden="true"></div>
              <div>
                <div className="font-bold text-amber-700 text-sm"> (Close)</div>
                <div className="text-xs text-amber-600">Correct digit but wrong position</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100">
          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="10" width="18" height="8" rx="4"/><path d="M8 14h4"/><path d="M10 12v4"/></svg>
            Game Modes
          </h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 mt-1 inline-flex"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="6" y="8" width="12" height="10" rx="2"/><path d="M12 4v4"/></svg></span>
              <span>
                <strong>Play vs AI:</strong> Challenge the computer with smart AI logic
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-600 mt-1 inline-flex"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M4 19a5 5 0 0110 0"/><path d="M13 19a4 4 0 018 0"/></svg></span>
              <span>
                <strong>Multiplayer:</strong> Connect with a friend online and compete in real-time
              </span>
            </div>
          </div>
        </div>

        {/* Strategy Tips */}
        <div className="bg-indigo-100 p-4 rounded-xl border border-indigo-200">
          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>
            Quick Tips
          </h4>
          <ul className="text-sm text-indigo-900 space-y-1">
            <li>• Start with a diverse set of digits (e.g., 1, 2, 3) to test positions</li>
            <li>• Track which digits are ruled out to narrow your search</li>
            <li>• Use Green and Yellow indicator to logically deduce the answer</li>
            <li>• Be strategic with your guesses—every guess counts!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameGuide;
