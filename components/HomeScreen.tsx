
import React from 'react';

interface HomeScreenProps {
  onStart: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="p-8 text-center flex flex-col items-center gap-6">
      <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-2">
        <span className="text-4xl">🎯</span>
      </div>
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Number Guessing Game
        </h1>
        <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mt-2">
          Viluthugal Production
        </p>
        <p className="text-gray-500 mt-4 font-medium max-w-xs mx-auto">
          The classic code-breaking logic game. Can you guess the secret number?
        </p>
      </div>

      <div className="space-y-4 w-full mt-4">
        <button
          onClick={onStart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-md flex items-center justify-center gap-2"
        >
          <span>Start New Game</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <div className="text-2xl mb-1">🟢</div>
            <div className="text-xs font-bold text-green-700 uppercase tracking-wider">Correct Number - Correct Place</div>
            <div className="text-xs text-green-600">Right digit, right spot</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <div className="text-2xl mb-1">🟡</div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Correct-Number</div>
            <div className="text-xs text-amber-600">Right digit, wrong spot</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
