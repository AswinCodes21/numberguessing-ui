
/**
 * Generates a random string of N digits. Duplicates are allowed.
 */
export const generateSecretNumber = (count: number): string => {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < count; i++) {
    result += digits[Math.floor(Math.random() * 10)];
  }
  return result;
};

// For backward compatibility with App.tsx imports if needed
export const generateUniqueSecret = generateSecretNumber;

/**
 * Calculates Bulls and Cows supporting duplicate digits.
 * 1. Count Bulls and mark matched positions.
 * 2. Count Cows using remaining unmatched digits.
 */
export const calculateBullsAndCows = (secret: string, guess: string) => {
  let bulls = 0;
  let cows = 0;
  const secretArr = secret.split('');
  const guessArr = guess.split('');
  const secretUsed = new Array(secret.length).fill(false);
  const guessUsed = new Array(guess.length).fill(false);

  // First pass: Bulls
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === secretArr[i]) {
      bulls++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: Cows
  for (let i = 0; i < guessArr.length; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < secretArr.length; j++) {
      if (!secretUsed[j] && guessArr[i] === secretArr[j]) {
        cows++;
        secretUsed[j] = true;
        break;
      }
    }
  }

  return { bulls, cows };
};

/**
 * Validates if a string consists of digits and has correct length.
 * Unique digit requirement removed.
 */
export const validateGuess = (guess: string, length: number): string | null => {
  if (guess.length !== length) return `Must be exactly ${length} digits.`;
  if (!/^\d+$/.test(guess)) return "Must contain only numbers.";
  return null;
};

/**
 * Smart AI Logic using a Minimax / Information Gain strategy.
 */
export const generateSmartAIGuess = (length: number, history: { guess: string; bulls: number; cows: number }[]): string => {
  // 1. Initial guess optimization (standard starting moves)
  if (history.length === 0) {
    return length === 3 ? "001" : "0011"; // Good starting coverage for duplicates
  }

  // 2. Generate/Filter the pool of all possible secrets
  const allPossibilities: string[] = [];
  const max = Math.pow(10, length);
  for (let i = 0; i < max; i++) {
    allPossibilities.push(i.toString().padStart(length, '0'));
  }

  // Filter pool based on history (Consistency check)
  const filteredPool = allPossibilities.filter(candidate => {
    return history.every(h => {
      const result = calculateBullsAndCows(candidate, h.guess);
      return result.bulls === h.bulls && result.cows === h.cows;
    });
  });

  if (filteredPool.length <= 1) return filteredPool[0] || generateSecretNumber(length);

  // 3. Minimax Strategy:
  // For each potential guess (even those not in the pool), 
  // calculate how many candidates in the pool would remain for each possible (B, C) feedback.
  // We want to minimize the MAXIMUM possible size of the next filtered pool.
  
  let bestGuess = filteredPool[0];
  let minMaxScore = Infinity;

  // For performance, if the pool is very large, we sample or just pick from the pool
  // But for 3-4 digits, we can be quite thorough.
  const searchSpace = filteredPool.length > 500 ? filteredPool : allPossibilities;

  for (const guessAttempt of searchSpace) {
    const feedbackCounts: Record<string, number> = {};
    
    for (const candidate of filteredPool) {
      const { bulls, cows } = calculateBullsAndCows(candidate, guessAttempt);
      const key = `${bulls},${cows}`;
      feedbackCounts[key] = (feedbackCounts[key] || 0) + 1;
    }

    const maxRemaining = Math.max(...Object.values(feedbackCounts));
    
    if (maxRemaining < minMaxScore) {
      minMaxScore = maxRemaining;
      bestGuess = guessAttempt;
    } else if (maxRemaining === minMaxScore) {
      // Tie-breaker: prefer guesses that are actually in the filtered pool
      if (!filteredPool.includes(bestGuess) && filteredPool.includes(guessAttempt)) {
        bestGuess = guessAttempt;
      }
    }
  }

  return bestGuess;
};
