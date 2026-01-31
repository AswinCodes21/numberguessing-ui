
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameScreen, GameState, Turn, GameMode, PlayerRole, GuessResult } from './types';
import { calculateBullsAndCows, generateSmartAIGuess, generateUniqueSecret } from './utils';
import { signalRService } from './signalrService';
import * as signalR from "@microsoft/signalr";
import HomeScreen from './components/HomeScreen';
import ModeSelection from './components/ModeSelection';
import RoomSetup from './components/RoomSetup';
import SetupScreen from './components/SetupScreen';
import PlayerSetupScreen from './components/PlayerSetupScreen';
import GameScreenComp from './components/GameScreen';
import WinScreen from './components/WinScreen';
import ChatPanel, { ChatMessage } from './components/ChatPanel';
import GameLoader from './components/GameLoader';

const ROOM_STORAGE_KEY = 'numberguess_room';

function getInitialGameState(): GameState {
  const defaultState: GameState = {
    screen: 'HOME',
    gameMode: 'AI',
    gameStatus: 'WAITING',
    digitCount: 3,
    playerRole: 'NONE',
    roomCode: '',
    playerSecret: '',
    opponentSecret: '',
    selfGuessHistory: [],
    opponentGuessHistory: [],
    currentTurn: 'SELF',
    winner: null,
    isPendingResult: false,
  };
  try {
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(ROOM_STORAGE_KEY) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      const roomCode = parsed.roomCode ?? parsed.RoomCode;
      const role = parsed.role ?? parsed.Role ?? parsed.playerRole;
      if (roomCode && (role === 'HOST' || role === 'GUEST')) {
        return { ...defaultState, gameMode: 'ONLINE', playerRole: role, roomCode, screen: 'RECONNECTING' };
      }
    }
  } catch (_) {}
  return defaultState;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(getInitialGameState);

  const [isServerOnline, setIsServerOnline] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const playerRoleRef = useRef<PlayerRole>('NONE');
  const reconnectAttemptedRef = useRef(false);

  const MIN_LOADER_MS = 1200;
  const MAX_LOADER_MS = 10000;

  // Keep ref in sync with state
  useEffect(() => {
    playerRoleRef.current = gameState.playerRole;
  }, [gameState.playerRole]);

  useEffect(() => {
    signalRService.start().then(() => {
      setIsServerOnline(signalRService.isConnected);
    });
    const interval = setInterval(() => {
      setIsServerOnline(signalRService.isConnected);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initial game-style loader: show until server connected (with min/max time), then fade into app
  useEffect(() => {
    if (!showInitialLoader) return;
    const startedAt = Date.now();
    const check = () => {
      const elapsed = Date.now() - startedAt;
      if (isServerOnline && elapsed >= MIN_LOADER_MS) {
        setShowInitialLoader(false);
        return;
      }
      if (elapsed >= MAX_LOADER_MS) {
        setShowInitialLoader(false);
        return;
      }
      setTimeout(check, 200);
    };
    const t = setTimeout(check, 200);
    return () => clearTimeout(t);
  }, [showInitialLoader, isServerOnline]);

  // After refresh: reconnect to room when server is online and we were in a room
  useEffect(() => {
    if (gameState.screen !== 'RECONNECTING') {
      reconnectAttemptedRef.current = false;
      return;
    }
    if (!isServerOnline || !gameState.roomCode || (gameState.playerRole !== 'HOST' && gameState.playerRole !== 'GUEST')) return;

    const conn = signalRService.getConnection();
    if (conn.state !== signalR.HubConnectionState.Connected) return;
    if (reconnectAttemptedRef.current) return;
    reconnectAttemptedRef.current = true;

    (async () => {
      try {
        if (gameState.playerRole === 'HOST') {
          try {
            await conn.invoke('CreateRoom', gameState.roomCode);
            // RoomCreated event will set screen to WAITING_FOR_OPPONENT
          } catch (createErr: any) {
            const msg = createErr?.message || String(createErr);
            // Room already exists = we're reconnecting; re-join the existing room as host
            if (msg.includes('Room already exists') || msg.includes('already exists')) {
              await conn.invoke('JoinRoom', gameState.roomCode);
              // Screen will be set by GameState event from backend
            } else {
              throw createErr;
            }
          }
        } else {
          await conn.invoke('JoinRoom', gameState.roomCode);
          // Screen will be set by GameState event from backend
        }
      } catch (err) {
        console.error('[SignalR: ERROR] Reconnect failed:', err);
        reconnectAttemptedRef.current = false;
        alert(`Could not rejoin room: ${err instanceof Error ? err.message : 'Unknown error'}. Try joining again.`);
      }
    })();
  }, [isServerOnline, gameState.screen, gameState.roomCode, gameState.playerRole]);

  const applyTurnResult = useCallback((guess: string, bulls: number, cows: number, turn: Turn) => {
    setGameState(prev => {
      const isWinner = bulls === prev.digitCount;
      const newResult: GuessResult = { guess, bulls, cows, timestamp: Date.now() };
      
      return {
        ...prev,
        selfGuessHistory: turn === 'SELF' ? [newResult, ...prev.selfGuessHistory] : prev.selfGuessHistory,
        opponentGuessHistory: turn === 'OPPONENT' ? [newResult, ...prev.opponentGuessHistory] : prev.opponentGuessHistory,
        winner: isWinner ? turn : null,
        gameStatus: isWinner ? 'FINISHED' : prev.gameStatus,
        screen: isWinner ? 'WIN' : 'GAME',
        currentTurn: turn === 'SELF' ? 'OPPONENT' : 'SELF',
        isPendingResult: false,
      };
    });
  }, []);

  // --- SignalR LISTENERS (RECEIVING) ---
  useEffect(() => {
    const connection = signalRService.getConnection();

    // Room created (sent to the creator)
    connection.on("RoomCreated", () => {
      console.log(`[SignalR: RECEIVE] RoomCreated`);
      setGameState(p => ({ ...p, screen: 'WAITING_FOR_OPPONENT', gameStatus: 'WAITING' }));
    });

    // Opponent joined into the room
    connection.on("OpponentJoined", () => {
      console.log(`[SignalR: RECEIVE] OpponentJoined`);
      setGameState(p => {
        // If you're the HOST and opponent joined, move to difficulty setup
        if (p.playerRole === 'HOST') {
          return { ...p, screen: 'DIFFICULTY_SETUP', gameStatus: 'READY_TO_START' };
        }
        // If you're the GUEST, wait for host to set difficulty
        // The host will set difficulty, then both can set secrets
        return { ...p, gameStatus: 'READY_TO_START' };
      });
    });

    // Listen for when difficulty is set (if server sends this event)
    // If server doesn't send this, GUEST will proceed when HOST submits secret
    connection.on("DifficultySet", (digitCount: 3 | 4) => {
      console.log(`[SignalR: RECEIVE] DifficultySet: ${digitCount}`);
      setGameState(p => {
        // GUEST receives difficulty and can now set their secret
        if (p.playerRole === 'GUEST') {
          return { ...p, digitCount, screen: 'PLAYER_SECRET_SETUP' };
        }
        return p;
      });
    });

    // Listen for when opponent submits secret (if server sends this event)
    // This allows GUEST to know when HOST has submitted and they should also submit
    connection.on("OpponentSecretSubmitted", () => {
      console.log(`[SignalR: RECEIVE] OpponentSecretSubmitted`);
      setGameState(p => {
        // If you're GUEST and haven't submitted yet, you can now submit
        if (p.playerRole === 'GUEST' && !p.playerSecret && p.screen === 'WAITING_FOR_HOST') {
          return { ...p, screen: 'PLAYER_SECRET_SETUP', digitCount: 3 }; // Default to 3 digits
        }
        return p;
      });
    });

    // Game started: server tells which player goes first (PLAYER1|PLAYER2)
    // Do NOT clear guess history here — after refresh, history comes from GameState only.
    connection.on("GameStarted", (currentTurn: "PLAYER1" | "PLAYER2") => {
      console.log(`[SignalR: RECEIVE] GameStarted: ${currentTurn}`);
      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost; // assume creator = PLAYER1
        const turnIsSelf = (currentTurn === 'PLAYER1' && selfIsPlayer1) || (currentTurn === 'PLAYER2' && !selfIsPlayer1);
        return {
          ...p,
          gameStatus: 'PLAYING',
          screen: 'GAME',
          currentTurn: turnIsSelf ? 'SELF' : 'OPPONENT',
          // Keep existing guess history (empty on fresh start; restored from GameState after reconnect)
        };
      });
    });

    // Guess results: server forwards which player made the guess and the result
    connection.on("GuessResult", (player: "PLAYER1" | "PLAYER2", result: { guess: string, bulls: number, cows: number }) => {
      console.log(`[SignalR: RECEIVE] GuessResult: Player=${player}, Result=${JSON.stringify(result)}`);
      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost;
        const turn: Turn = (player === 'PLAYER1' && selfIsPlayer1) || (player === 'PLAYER2' && !selfIsPlayer1) ? 'SELF' : 'OPPONENT';
        const isWinner = result.bulls === p.digitCount;
        const newResult: GuessResult = { ...result, timestamp: Date.now() };

        return {
          ...p,
          selfGuessHistory: turn === 'SELF' ? [newResult, ...p.selfGuessHistory] : p.selfGuessHistory,
          opponentGuessHistory: turn === 'OPPONENT' ? [newResult, ...p.opponentGuessHistory] : p.opponentGuessHistory,
          winner: isWinner ? turn : p.winner,
          gameStatus: isWinner ? 'FINISHED' : p.gameStatus,
          screen: isWinner ? 'WIN' : p.screen,
          isPendingResult: false,
        };
      });
    });

    connection.on("TurnChanged", (currentTurn: "PLAYER1" | "PLAYER2") => {
      console.log(`[SignalR: RECEIVE] TurnChanged: ${currentTurn}`);
      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost;
        const turnIsSelf = (currentTurn === 'PLAYER1' && selfIsPlayer1) || (currentTurn === 'PLAYER2' && !selfIsPlayer1);
        return { ...p, currentTurn: turnIsSelf ? 'SELF' : 'OPPONENT' };
      });
    });

    connection.on("GameEnded", (winner: "PLAYER1" | "PLAYER2") => {
      console.log(`[SignalR: RECEIVE] GameEnded: ${winner}`);
      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost;
        const winnerTurn: Turn = (winner === 'PLAYER1' && selfIsPlayer1) || (winner === 'PLAYER2' && !selfIsPlayer1) ? 'SELF' : 'OPPONENT';
        return {
          ...p,
          winner: winnerTurn,
          screen: 'WIN',
          gameStatus: 'FINISHED'
        };
      });
    });

    // Chat message received - handle both PascalCase and lowercase method names
    // Handle different formats: object, or (sender, message) parameters
    const handleChatMessage = (data: any, messageParam?: string) => {
      let sender: string;
      let message: string;
      
      // Check if data is an object (backend sends object format)
      if (typeof data === 'object' && data !== null) {
        sender = data.sender || data.Sender || data.role || data.Role || '';
        message = data.message || data.Message || data.text || data.Text || '';
      } else {
        // Backend sends separate parameters (sender, message)
        sender = data || '';
        message = messageParam || '';
      }
      
      console.log(`[SignalR: RECEIVE] ChatMessage: sender=${sender}, message=${message}`, data);
      
      // Only validate message, sender can be empty
      if (!message) {
        console.warn('Invalid chat message format: message is empty', { data, messageParam });
        return;
      }
      
      // Determine if message is from self
      let isSelf = false;
      if (sender) {
        isSelf = sender === playerRoleRef.current || 
                 sender.toUpperCase() === playerRoleRef.current.toUpperCase();
      } else {
        // If sender is empty, check if this message matches a recent optimistic message we sent
        // This prevents duplicate messages when server echoes back our own message
        setChatMessages(prev => {
          const recentSelfMessage = prev
            .filter(m => m.sender === 'SELF')
            .sort((a, b) => b.timestamp - a.timestamp)[0];
          
          // If message matches recent self message and it's within 5 seconds, skip it (already shown)
          if (recentSelfMessage && 
              recentSelfMessage.message === message && 
              Math.abs(recentSelfMessage.timestamp - Date.now()) < 5000) {
            console.log('Message matches recent self message, skipping duplicate');
            return prev;
          }
          
          // Otherwise, treat as opponent message
          const messageExists = prev.some(m => 
            m.message === message && 
            m.sender === 'OPPONENT' && 
            Math.abs(m.timestamp - Date.now()) < 2000
          );
          if (messageExists) {
            console.log('Duplicate message detected, skipping');
            return prev;
          }
          
          const newMessage = {
            id: data.id || Date.now().toString(),
            sender: 'OPPONENT' as const,
            message,
            timestamp: data.timestamp || Date.now(),
            type: 'text' as const
          };
          
          console.log('Adding chat message (empty sender, treating as opponent):', newMessage);
          return [...prev, newMessage];
        });
        return; // Early return for empty sender case
      }
      
      setChatMessages(prev => {
        // Avoid duplicates by checking if message already exists
        const messageExists = prev.some(m => 
          m.message === message && 
          m.sender === (isSelf ? 'SELF' : 'OPPONENT') && 
          Math.abs(m.timestamp - Date.now()) < 2000
        );
        if (messageExists) {
          console.log('Duplicate message detected, skipping');
          return prev;
        }
        
        const newMessage = {
          id: data.id || Date.now().toString(),
          sender: isSelf ? 'SELF' : 'OPPONENT' as 'SELF' | 'OPPONENT',
          message,
          timestamp: data.timestamp || Date.now(),
          type: 'text' as const
        };
        
        console.log('Adding chat message:', newMessage);
        return [...prev, newMessage];
      });
    };

    connection.on("ChatMessage", handleChatMessage);
    connection.on("receivechatmessage", handleChatMessage); // Also listen for lowercase version

    // Voice message received - handle both object and parameter formats
    const handleVoiceMessage = async (data: any, audioDataParam?: string) => {
      let sender: string;
      let audioData: string;
      
      // Check if data is an object (backend sends object format)
      if (typeof data === 'object' && data !== null) {
        sender = data.sender || data.Sender || data.role || data.Role || '';
        audioData = data.audioData || data.audio || data.data || data.AudioData || '';
      } else {
        // Backend sends separate parameters (sender, audioData)
        sender = data || '';
        audioData = audioDataParam || '';
      }
      
      console.log(`[SignalR: RECEIVE] VoiceMessage: sender=${sender}, audioData length=${audioData?.length || 0}`, data);
      
      if (!audioData) {
        console.warn('Invalid voice message format: audioData is empty', { data, audioDataParam });
        return;
      }
      
      try {
        // Convert base64 to blob (support webm or mp4 if backend sends mimeType)
        const mime = (typeof data === 'object' && data !== null && data.mimeType) ? data.mimeType : 'audio/webm';
        const audioBlob = await fetch(`data:${mime};base64,${audioData}`).then(r => r.blob());
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const isSelf = sender && (
          sender === playerRoleRef.current || 
          sender.toUpperCase() === playerRoleRef.current.toUpperCase()
        );
        
        const newMessage = {
          id: data.id || Date.now().toString(),
          sender: isSelf ? 'SELF' : 'OPPONENT' as 'SELF' | 'OPPONENT',
          message: '',
          timestamp: data.timestamp || Date.now(),
          type: 'voice' as const,
          audioUrl
        };
        
        console.log('Adding voice message to chat:', newMessage);
        setChatMessages(prev => {
          // Avoid duplicates
          const messageExists = prev.some(m => 
            m.type === 'voice' && 
            m.sender === newMessage.sender && 
            Math.abs(m.timestamp - newMessage.timestamp) < 2000
          );
          if (messageExists) {
            console.log('Duplicate voice message detected, skipping');
            return prev;
          }
          return [...prev, newMessage];
        });
      } catch (err) {
        console.error('Error processing voice message:', err);
        alert('Failed to process received voice message.');
      }
    };

    connection.on("VoiceMessage", handleVoiceMessage);
    connection.on("receivevoicemessage", handleVoiceMessage); // Also listen for lowercase version

    // GameState: source of truth after JoinRoom (including reconnect). Backend sends after every successful JoinRoom.
    const handleGameState = (data: any) => {
      const d = data ?? {};
      const digitCount = (d.digitCount ?? d.DigitCount ?? 3) as 3 | 4;
      const currentTurnServer = d.currentTurn ?? d.CurrentTurn ?? 'PLAYER1';
      const isGameStarted = d.isGameStarted ?? d.IsGameStarted ?? false;
      const isGameOver = d.isGameOver ?? d.IsGameOver ?? false;
      // Backend may send yourGuesses/opponentGuesses or yourGuessHistory/opponentGuessHistory
      const yourHistory = d.yourGuesses ?? d.yourGuessHistory ?? d.selfGuessHistory ?? d.myGuessHistory ?? d.YourGuesses ?? d.YourGuessHistory ?? d.SelfGuessHistory ?? [];
      const oppHistory = d.opponentGuesses ?? d.opponentGuessHistory ?? d.OpponentGuesses ?? d.OpponentGuessHistory ?? [];
      const winnerServer = d.winner ?? d.Winner ?? null;
      // Secrets: for win screen and for reconnecting players (backend may send at game over or in GameState)
      // Be defensive about field names and map based on player role (HOST = PLAYER1) so clients don't accidentally
      // read the other player's secret. Prefer explicit player1/player2 fields when available.
      // Read server secrets but treat empty strings as "not provided" so we don't erase a local secret.
      const rawP1 = d.player1Secret ?? d.playerOneSecret ?? d.Player1Secret ?? d.PlayerOneSecret;
      const rawP2 = d.player2Secret ?? d.playerTwoSecret ?? d.Player2Secret ?? d.PlayerTwoSecret;
      const p1Secret = typeof rawP1 === 'string' && rawP1.length > 0 ? rawP1 : null;
      const p2Secret = typeof rawP2 === 'string' && rawP2.length > 0 ? rawP2 : null;

      // Determine per-connection secret payloads; accept only non-empty strings
      const rawYour = d.yourSecret ?? d.playerSecret ?? null;
      const payloadYourSecretRaw = typeof rawYour === 'string' && rawYour.length > 0 ? rawYour : null;
      const payloadOpponentSecret = (typeof d.opponentSecret === 'string' && d.opponentSecret.length > 0) ? d.opponentSecret : null;

      const toGuessResult = (item: any): GuessResult => ({
        guess: item.guess ?? item.Guess ?? '',
        bulls: item.bulls ?? item.Bulls ?? 0,
        cows: item.cows ?? item.Cows ?? 0,
        timestamp: item.timestamp ?? item.Timestamp ?? Date.now(),
      });
      const selfGuessHistory = Array.isArray(yourHistory) ? yourHistory.map(toGuessResult) : [];
      const opponentGuessHistory = Array.isArray(oppHistory) ? oppHistory.map(toGuessResult) : [];

      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost;
        const currentTurn: Turn =
          (currentTurnServer === 'PLAYER1' && selfIsPlayer1) || (currentTurnServer === 'PLAYER2' && !selfIsPlayer1)
            ? 'SELF'
            : 'OPPONENT';
        const winner: Turn | null =
          winnerServer === 'PLAYER1' && selfIsPlayer1
            ? 'SELF'
            : winnerServer === 'PLAYER2' && !selfIsPlayer1
              ? 'SELF'
              : winnerServer === 'PLAYER1' && !selfIsPlayer1
                ? 'OPPONENT'
                : winnerServer === 'PLAYER2' && selfIsPlayer1
                  ? 'OPPONENT'
                  : null;

        let screen: GameScreen = p.screen;
        if (isGameOver) {
          screen = 'WIN';
        } else if (isGameStarted) {
          screen = 'GAME';
        } else {
          screen = p.playerRole === 'HOST' ? 'WAITING_FOR_OPPONENT' : 'WAITING_FOR_HOST';
        }

        const gameStatus = isGameOver ? 'FINISHED' : isGameStarted ? 'PLAYING' : 'WAITING';
        // Preserve or set secrets: keep existing if we have it; use payload when provided (e.g. game over or reconnect)
        // Map explicitly when server provided player1/player2 secrets
        let playerSecret = p.playerSecret;
        let opponentSecret = p.opponentSecret;
        if (p1Secret !== null || p2Secret !== null) {
          // Map based on whether this client was PLAYER1 (host) or PLAYER2 (guest)
          if (selfIsPlayer1) {
            playerSecret = p1Secret ?? playerSecret;
            opponentSecret = p2Secret ?? opponentSecret;
          } else {
            playerSecret = p2Secret ?? playerSecret;
            opponentSecret = p1Secret ?? opponentSecret;
          }
        } else {
          // If server sent 'yourSecret' / 'playerSecret' (per-connection) and 'opponentSecret', use them
          if (payloadYourSecretRaw !== null) playerSecret = payloadYourSecretRaw || playerSecret;
          if (payloadOpponentSecret !== null) opponentSecret = payloadOpponentSecret || opponentSecret;
        }

        return {
          ...p,
          digitCount,
          currentTurn,
          selfGuessHistory,
          opponentGuessHistory,
          playerSecret,
          opponentSecret,
          screen,
          gameStatus,
          winner: isGameOver ? winner : null,
          isPendingResult: false,
        };
      });
      console.log('[SignalR: RECEIVE] GameState applied:', { digitCount, isGameStarted, isGameOver, screen: isGameOver ? 'WIN' : isGameStarted ? 'GAME' : 'LOBBY' });
    };

    connection.on('GameState', handleGameState);

    // Game restart: server requests both players to reset secrets and start a fresh round
    connection.on('GameRestarted', (data: any) => {
      console.log('[SignalR: RECEIVE] GameRestarted', data);
      // Clear local secrets and histories; server is authoritative and will send a GameState shortly
      setGameState(p => ({
        ...p,
        playerSecret: '',
        opponentSecret: '',
        selfGuessHistory: [],
        opponentGuessHistory: [],
        winner: null,
        gameStatus: 'WAITING',
        screen: 'PLAYER_SECRET_SETUP',
        isPendingResult: false,
      }));
    });

    return () => {
      connection.off("RoomCreated");
      connection.off("OpponentJoined");
      connection.off("DifficultySet");
      connection.off("OpponentSecretSubmitted");
      connection.off("GameStarted");
      connection.off("GuessResult");
      connection.off("TurnChanged");
      connection.off("GameEnded");
      connection.off("ChatMessage");
      connection.off("receivechatmessage");
      connection.off("VoiceMessage");
      connection.off("receivevoicemessage");
      connection.off("GameState");
      connection.off("GameRestarted");
    };
  }, [applyTurnResult]);

  const handlePlayAgain = async () => {
    if (gameState.gameMode !== 'ONLINE' || !gameState.roomCode) {
      // For local/AI mode, simply reset to secret setup
      setGameState(p => ({
        ...p,
        playerSecret: '',
        opponentSecret: '',
        selfGuessHistory: [],
        opponentGuessHistory: [],
        winner: null,
        screen: 'PLAYER_SECRET_SETUP',
        gameStatus: 'WAITING',
      }));
      return;
    }

    try {
      console.log('[SignalR: SEND] RestartGame', gameState.roomCode);
      await signalRService.getConnection().invoke('RestartGame', gameState.roomCode);
      // Optimistically clear local state; server will broadcast GameRestarted/GameState soon
      setGameState(p => ({
        ...p,
        playerSecret: '',
        opponentSecret: '',
        selfGuessHistory: [],
        opponentGuessHistory: [],
        winner: null,
        screen: 'PLAYER_SECRET_SETUP',
        gameStatus: 'WAITING',
      }));
    } catch (err) {
      console.error('[SignalR: ERROR] RestartGame failed', err);
      alert('Failed to request a restart. Please try again.');
    }
  };

  const toModeSelection = () => setGameState(p => ({ ...p, screen: 'MODE_SELECTION' }));
  
  const selectMode = (mode: GameMode) => {
    setGameState(p => ({ 
      ...p, 
      gameMode: mode, 
      screen: mode === 'AI' ? 'DIFFICULTY_SETUP' : 'ROOM_SETUP' 
    }));
  };

  // --- SignalR INVOKES (SENDING) ---

  const handleRoomAction = async (role: PlayerRole, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (gameState.gameMode === 'ONLINE') {
      if (!signalRService.isConnected) {
        alert("Server Offline. Check your C# backend connection.");
        return;
      }
      try {
        if (role === 'HOST') {
          console.log(`[SignalR: SEND] CreateRoom: Code=${cleanCode}, Role=HOST`);
          await signalRService.getConnection().invoke("CreateRoom", cleanCode);
          console.log(`[SignalR: SUCCESS] Room created: ${cleanCode}`);
          setGameState(p => ({ ...p, playerRole: role, roomCode: cleanCode }));
          sessionStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify({ roomCode: cleanCode, role: 'HOST' }));
        } else {
          console.log(`[SignalR: SEND] JoinRoom: Code=${cleanCode}, Role=GUEST`);
          await signalRService.getConnection().invoke("JoinRoom", cleanCode);
          console.log(`[SignalR: SUCCESS] Joined room: ${cleanCode}`);
          setGameState(p => ({ ...p, playerRole: role, roomCode: cleanCode, screen: 'WAITING_FOR_HOST' }));
          sessionStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify({ roomCode: cleanCode, role: 'GUEST' }));
        }
      } catch (err) {
        console.error("[SignalR: ERROR] Room action failed:", err);
        alert(`Server Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  };

  const selectDigits = async (count: 3 | 4) => {
    // Only HOST can set digit count in online mode; server broadcasts DifficultySet to GUEST
    if (gameState.gameMode === 'ONLINE' && gameState.playerRole === 'HOST') {
      try {
        await signalRService.getConnection().invoke("SetDifficulty", gameState.roomCode, count);
        setGameState(p => ({ ...p, digitCount: count, screen: 'PLAYER_SECRET_SETUP' }));
      } catch (err) {
        console.error("[SignalR: ERROR] SetDifficulty failed:", err);
        setGameState(p => ({ ...p, digitCount: count, screen: 'PLAYER_SECRET_SETUP' }));
      }
    } else {
      setGameState(p => ({ ...p, digitCount: count, screen: 'PLAYER_SECRET_SETUP' }));
    }
  };

  const finalizeSecrets = async (secret: string) => {
    if (gameState.gameMode === 'AI') {
      const aiSecret = generateUniqueSecret(gameState.digitCount);
      setGameState(p => ({
        ...p,
        playerSecret: secret,
        opponentSecret: aiSecret,
        screen: 'GAME',
        gameStatus: 'PLAYING',
        selfGuessHistory: [],
        opponentGuessHistory: [],
        currentTurn: 'SELF'
      }));
    } else {
      try {
        console.log(`[SignalR: SEND] SubmitSecret: Room=${gameState.roomCode}`);
        await signalRService.getConnection().invoke("SubmitSecret", gameState.roomCode, secret);
        console.log("[SignalR: SUCCESS] Secret accepted by server.");

        setGameState(p => {
          // Don't override if game has already started
          if (p.gameStatus === 'PLAYING') return p;
          // Set secret and wait for GameStarted event from server
          // The server will send GameStarted when both players have submitted secrets
          return {
            ...p,
            playerSecret: secret,
            screen: 'GAME',
            gameStatus: 'WAITING', // Waiting for opponent's secret and GameStarted event
          };
        });
      } catch (err) {
        console.error("[SignalR: ERROR] SubmitSecret failed:", err);
        alert(`Locking code failed: ${err instanceof Error ? err.message : 'Server error'}`);
        throw err;
      }
    }
  };

  const handlePlayerGuess = async (guess: string) => {
    if (gameState.gameMode === 'AI') {
      const { bulls, cows } = calculateBullsAndCows(gameState.opponentSecret, guess);
      applyTurnResult(guess, bulls, cows, 'SELF');
    } else {
      try {
        console.log(`[SignalR: SEND] MakeGuess: Room=${gameState.roomCode}, Guess=${guess}`);
        setGameState(p => ({ ...p, isPendingResult: true }));
        await signalRService.getConnection().invoke("MakeGuess", gameState.roomCode, guess);
        console.log("[SignalR: SUCCESS] Guess transmitted.");
      } catch (err) {
        console.error("[SignalR: ERROR] MakeGuess failed:", err);
        setGameState(p => ({ ...p, isPendingResult: false }));
        const msg = err instanceof Error ? err.message : 'Server error';
        // "Not your turn" usually means our UI state is stale (e.g. other player rejoined and we didn't get GameState)
        if (msg.includes('Not your turn') || msg.includes('not your turn')) {
          alert('It\'s not your turn. The game state may have updated (e.g. after the other player reconnected). Please wait for your turn.');
        } else {
          alert(`Guess rejected: ${msg}`);
        }
      }
    }
  };

  useEffect(() => {
    if (gameState.gameMode === 'AI' && gameState.screen === 'GAME' && gameState.currentTurn === 'OPPONENT' && !gameState.winner) {
      const timer = setTimeout(() => {
        const aiGuess = generateSmartAIGuess(gameState.digitCount, gameState.opponentGuessHistory);
        const { bulls, cows } = calculateBullsAndCows(gameState.playerSecret, aiGuess);
        applyTurnResult(aiGuess, bulls, cows, 'OPPONENT');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.gameMode, gameState.screen, gameState.currentTurn, gameState.winner, gameState.digitCount, gameState.opponentGuessHistory, gameState.playerSecret, applyTurnResult]);

  // Chat handlers
  const handleSendChatMessage = async (message: string) => {
    if (!gameState.roomCode || gameState.gameMode !== 'ONLINE') return;
    
    // Optimistic UI update - add message immediately
    const tempId = `temp-${Date.now()}`;
    setChatMessages(prev => [...prev, {
      id: tempId,
      sender: 'SELF',
      message,
      timestamp: Date.now(),
      type: 'text'
    }]);
    
    try {
      await signalRService.getConnection().invoke("SendChatMessage", gameState.roomCode, message);
      // Message will be confirmed via the ChatMessage event (which may replace the temp one)
    } catch (err) {
      console.error("[SignalR: ERROR] SendChatMessage failed:", err);
      // Remove the optimistic message on error
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    if (!gameState.roomCode || gameState.gameMode !== 'ONLINE') return;
    
    // Check audio size - SignalR typically has a 32KB message limit
    // Warn if audio is too large (allow up to 100KB to be safe)
    const MAX_AUDIO_SIZE = 100 * 1024; // 100KB
    if (audioBlob.size > MAX_AUDIO_SIZE) {
      const sizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
      alert(`Voice message is too large (${sizeMB}MB). Please record a shorter message (max ~5 seconds).`);
      return;
    }
    
    // Optimistic UI: show sender's voice note immediately (receiver gets it via server)
    const tempId = `voice-temp-${Date.now()}`;
    const audioUrl = URL.createObjectURL(audioBlob);
    setChatMessages(prev => [...prev, {
      id: tempId,
      sender: 'SELF',
      message: '',
      timestamp: Date.now(),
      type: 'voice',
      audioUrl,
    }]);
    
    try {
      console.log("[SignalR: SEND] SendVoiceMessage: Size=", audioBlob.size, "Type=", audioBlob.type);
      
      // Check connection before sending (but try to reconnect if needed)
      const conn = signalRService.getConnection();
      if (conn.state !== signalR.HubConnectionState.Connected) {
        console.warn('[SignalR: WARNING] Connection not ready, state:', conn.state);
        // Try to reconnect if disconnected
        if (conn.state === signalR.HubConnectionState.Disconnected) {
          try {
            await signalRService.start();
            // Wait a bit for connection to establish
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('[SignalR: ERROR] Failed to reconnect:', err);
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(audioUrl);
            alert('Connection lost. Please wait for reconnection and try again.');
            return;
          }
        } else {
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          URL.revokeObjectURL(audioUrl);
          alert('Connection not ready. Please wait a moment and try again.');
          return;
        }
      }
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          if (!base64Audio) {
            throw new Error('Failed to convert audio to base64');
          }
          
          // Check base64 size
          if (base64Audio.length > MAX_AUDIO_SIZE * 1.4) { // Base64 is ~33% larger
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(audioUrl);
            alert('Voice message is too large after encoding. Please record a shorter message.');
            return;
          }
          
          console.log("[SignalR: SEND] Sending voice message, base64 length:", base64Audio.length);
          
          // Ensure connection is still active
          const conn = signalRService.getConnection();
          if (conn.state !== signalR.HubConnectionState.Connected) {
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(audioUrl);
            alert('Connection lost. Please wait for reconnection and try again.');
            return;
          }
          
          // Send roomCode, sender (HOST/GUEST), and base64Audio so backend can broadcast to the other player with sender
          await conn.invoke("SendVoiceMessage", gameState.roomCode, gameState.playerRole, base64Audio);
          console.log("[SignalR: SUCCESS] Voice message sent");
        } catch (err: any) {
          console.error("[SignalR: ERROR] SendVoiceMessage failed:", err);
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          URL.revokeObjectURL(audioUrl);
          const errorMsg = err?.message || 'Unknown error';
          if (errorMsg.includes('Connection') || errorMsg.includes('disconnected')) {
            alert('Connection lost while sending voice message. Please try again.');
          } else {
            alert(`Failed to send voice message: ${errorMsg}`);
          }
        }
      };
      reader.onerror = (err) => {
        console.error("[SignalR: ERROR] FileReader error:", err);
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
        URL.revokeObjectURL(audioUrl);
        alert('Failed to process voice message. Please try again.');
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error("[SignalR: ERROR] SendVoiceMessage failed:", err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      URL.revokeObjectURL(audioUrl);
      alert(`Failed to send voice message: ${err?.message || 'Unknown error'}`);
    }
  };

  const reset = () => {
    sessionStorage.removeItem(ROOM_STORAGE_KEY);
    setGameState(p => ({ 
      ...p, 
      screen: 'HOME', 
      winner: null, 
      gameStatus: 'WAITING',
      selfGuessHistory: [],
      opponentGuessHistory: [],
      roomCode: '',
      playerRole: 'NONE',
      isPendingResult: false 
    }));
    setChatMessages([]); // Clear chat messages on reset
  };

  const renderScreen = () => {
/**
 * Renders the screen based on the current gameState.screen.
 * 
 * @returns {JSX.Element} The rendered screen component.
 */
    switch (gameState.screen) {
      case 'HOME': return <HomeScreen onStart={toModeSelection} />;
      case 'MODE_SELECTION': return <ModeSelection onSelect={selectMode} onBack={reset} />;
      case 'ROOM_SETUP': return <RoomSetup onConfirm={handleRoomAction} onBack={toModeSelection} />;
      case 'DIFFICULTY_SETUP': return <SetupScreen onSelect={selectDigits} onBack={toModeSelection} />;
      case 'RECONNECTING': return (
        <GameLoader
          fullScreen={false}
          compact
          status="Joining room..."
          subtext={`Room ${gameState.roomCode} · Rejoining as ${gameState.playerRole}`}
          showCancel
          onCancel={reset}
        />
      );
      case 'WAITING_FOR_OPPONENT': return (
        <GameLoader
          fullScreen={false}
          compact
          status="Waiting for players..."
          subtext={`Room ${gameState.roomCode} · Share the code so someone can join`}
          showCancel
          onCancel={reset}
        />
      );
      case 'WAITING_FOR_HOST': return (
        <GameLoader
          fullScreen={false}
          compact
          status="Waiting for the host..."
          subtext={`Room ${gameState.roomCode} · Host will choose digits, then you set your secret`}
          showCancel
          onCancel={reset}
        />
      );
      case 'PLAYER_SECRET_SETUP': return <PlayerSetupScreen digitCount={gameState.digitCount} onConfirm={finalizeSecrets} onBack={() => setGameState(p => ({ ...p, screen: gameState.playerRole === 'HOST' ? 'DIFFICULTY_SETUP' : 'ROOM_SETUP' }))} />;
      case 'GAME': return (
        <>
          <GameScreenComp state={gameState} onGuess={handlePlayerGuess} onQuit={reset} />
          {gameState.gameMode === 'ONLINE' && gameState.roomCode && gameState.playerRole !== 'NONE' && (
            <ChatPanel
              roomCode={gameState.roomCode}
              playerRole={gameState.playerRole}
              isConnected={isServerOnline}
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              onSendVoice={handleSendVoiceMessage}
            />
          )}
        </>
      );
      case 'WIN': {
        // If server didn't provide a mapped winner, try to infer from latest guess results as a fallback
        let derivedWinner = gameState.winner;
        if (!derivedWinner) {
          const topSelf = gameState.selfGuessHistory[0];
          const topOpp = gameState.opponentGuessHistory[0];
          if (topSelf && topSelf.bulls === gameState.digitCount) derivedWinner = 'SELF';
          else if (topOpp && topOpp.bulls === gameState.digitCount) derivedWinner = 'OPPONENT';
        }
        return <WinScreen winner={derivedWinner} playerSecret={gameState.playerSecret} opponentSecret={gameState.opponentSecret} playerAttempts={gameState.selfGuessHistory.length} opponentAttempts={gameState.opponentGuessHistory.length} onPlayAgain={handlePlayAgain} onHome={reset} playerRole={gameState.playerRole} />;
      }
      default: return <HomeScreen onStart={toModeSelection} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {showInitialLoader && (
        <GameLoader
          status="Connecting to server..."
          subtext="Digit Duel is getting ready..."
        />
      )}
      <div className={`w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative transition-opacity duration-500 ${showInitialLoader ? 'opacity-0' : 'opacity-100'}`}>
        {renderScreen()}
      </div>
      <div className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2">
        <div className="flex gap-4 items-center">
          <div className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className={isServerOnline ? 'text-emerald-600' : 'text-rose-500'}>
            {isServerOnline ? 'Server Online' : 'Server Offline'}
          </span>
          <span className="opacity-30">|</span>
          <span>Mode: {gameState.gameMode}</span>
          {gameState.roomCode && <span>Room: {gameState.roomCode}</span>}
        </div>
        <div className="opacity-60">© {new Date().getFullYear()} Viluthugal Production</div>
      </div>
    </div>
  );
};

export default App;
