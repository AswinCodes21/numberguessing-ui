
export type GameMode = 'AI' | 'ONLINE';
export type GameScreen = 'HOME' | 'MODE_SELECTION' | 'ROOM_SETUP' | 'DIFFICULTY_SETUP' | 'PLAYER_SECRET_SETUP' | 'GAME' | 'WIN' | 'WAITING_FOR_HOST' | 'WAITING_FOR_OPPONENT';
export type GameStatus = 'WAITING' | 'READY_TO_START' | 'PLAYING' | 'FINISHED';
export type PlayerRole = 'HOST' | 'GUEST' | 'NONE';

export interface GuessResult {
  guess: string;
  bulls: number;
  cows: number;
  timestamp: number;
}

export type Turn = 'SELF' | 'OPPONENT';

export interface GameState {
  screen: GameScreen;
  gameMode: GameMode;
  gameStatus: GameStatus;
  digitCount: 3 | 4;
  playerRole: PlayerRole;
  roomCode: string;
  playerSecret: string;
  opponentSecret: string;
  selfGuessHistory: GuessResult[];
  opponentGuessHistory: GuessResult[];
  currentTurn: Turn;
  winner: Turn | null;
  isPendingResult: boolean;
}
