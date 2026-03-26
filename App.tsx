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
import SequentialGameLoader from './components/SequentialGameLoader';
import Toast, { ToastMessage } from './components/Toast';

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
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const playerRoleRef = useRef<PlayerRole>('NONE');
  const reconnectAttemptedRef = useRef(false);

  const MIN_LOADER_MS = 4800; // 6 messages × 800ms = 4800ms
  const MAX_LOADER_MS = 10000;

  // Toast helper functions
  const showToast = (type: ToastMessage['type'], title: string, message: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToastMessages(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToastMessages(prev => prev.filter(t => t.id !== id));
  };

  // Helper to simplify SignalR error messages
  const simplifySignalRError = (error: any): string => {
    if (!error) return 'An error occurred';
    
    const message = error?.message || String(error);
    
    // Extract user-friendly messages
    if (message.includes('Room not found') || message.includes('room not found')) {
      return 'Room not found';
    }
    if (message.includes('already exists') || message.includes('Room already exists')) {
      return 'Room already exists';
    }
    if (message.includes('Room is full') || message.includes('room is full')) {
      return 'Room is full';
    }
    if (message.includes('Not your turn') || message.includes('not your turn')) {
      return 'Not your turn';
    }
    if (message.includes('Invalid guess') || message.includes('invalid guess')) {
      return 'Invalid guess format';
    }
    if (message.includes('Connection') || message.includes('disconnected')) {
      return 'Connection lost';
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
      return 'Request timeout';
    }
    
    // Default: return first 80 chars of message, remove HubException prefix
    let clean = message.replace(/^HubException:\s*/i, '').trim();
    if (clean.length > 80) clean = clean.substring(0, 80) + '...';
    return clean || 'An error occurred';
  };

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

  // Remove the old loader check - let SequentialGameLoader handle completion
  // The loader will complete after all messages are shown, regardless of server status

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
        showToast('error', 'Reconnection Failed', `Could not rejoin room. Try joining again.`);
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

    connection.on("RoomCreated", () => {
      console.log(`[SignalR: RECEIVE] RoomCreated`);
      setGameState(p => ({ ...p, screen: 'WAITING_FOR_OPPONENT', gameStatus: 'WAITING' }));
    });

    connection.on("OpponentJoined", () => {
      console.log(`[SignalR: RECEIVE] OpponentJoined`);
      setGameState(p => {
        if (p.playerRole === 'HOST') {
          return { ...p, screen: 'DIFFICULTY_SETUP', gameStatus: 'READY_TO_START' };
        }
        return { ...p, gameStatus: 'READY_TO_START' };
      });
    });

    connection.on("DifficultySet", (digitCount: 3 | 4) => {
      console.log(`[SignalR: RECEIVE] DifficultySet: ${digitCount}`);
      setGameState(p => {
        if (p.playerRole === 'GUEST') {
          return { ...p, digitCount, screen: 'PLAYER_SECRET_SETUP' };
        }
        return p;
      });
    });

    connection.on("OpponentSecretSubmitted", () => {
      console.log(`[SignalR: RECEIVE] OpponentSecretSubmitted`);
      setGameState(p => {
        if (p.playerRole === 'GUEST' && !p.playerSecret && p.screen === 'WAITING_FOR_HOST') {
          return { ...p, screen: 'PLAYER_SECRET_SETUP', digitCount: 3 };
        }
        return p;
      });
    });

    connection.on("GameStarted", (currentTurn: "PLAYER1" | "PLAYER2") => {
      console.log(`[SignalR: RECEIVE] GameStarted: ${currentTurn}`);
      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost;
        const turnIsSelf = (currentTurn === 'PLAYER1' && selfIsPlayer1) || (currentTurn === 'PLAYER2' && !selfIsPlayer1);
        return {
          ...p,
          gameStatus: 'PLAYING',
          screen: 'GAME',
          currentTurn: turnIsSelf ? 'SELF' : 'OPPONENT',
        };
      });
    });

    connection.on("GuessResult", (player: "PLAYER1" | "PLAYER2", result: { guess?: string; Guess?: string; bulls?: number; Bulls?: number; cows?: number; Cows?: number }) => {
      console.log(`[SignalR: RECEIVE] GuessResult: Player=${player}, Result=${JSON.stringify(result)}`);
      setGameState(p => {
        const amHost = p.playerRole === 'HOST';
        const selfIsPlayer1 = amHost;
        const turn: Turn = (player === 'PLAYER1' && selfIsPlayer1) || (player === 'PLAYER2' && !selfIsPlayer1) ? 'SELF' : 'OPPONENT';
        const normalizedResult: GuessResult = {
          guess: result.guess ?? result.Guess ?? '',
          bulls: result.bulls ?? result.Bulls ?? 0,
          cows: result.cows ?? result.Cows ?? 0,
          timestamp: Date.now(),
        };
        const isWinner = normalizedResult.bulls === p.digitCount;

        return {
          ...p,
          selfGuessHistory: turn === 'SELF' ? [normalizedResult, ...p.selfGuessHistory] : p.selfGuessHistory,
          opponentGuessHistory: turn === 'OPPONENT' ? [normalizedResult, ...p.opponentGuessHistory] : p.opponentGuessHistory,
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

    // Chat message received
    const handleChatMessage = (data: any, messageParam?: string) => {
      let sender: string;
      let message: string;
      
      if (typeof data === 'object' && data !== null) {
        sender = data.sender || data.Sender || data.role || data.Role || '';
        message = data.message || data.Message || data.text || data.Text || '';
      } else {
        sender = data || '';
        message = messageParam || '';
      }
      
      console.log(`[SignalR: RECEIVE] ChatMessage: sender=${sender}, message=${message}`, data);
      
      if (!message) {
        console.warn('Invalid chat message format: message is empty', { data, messageParam });
        return;
      }
      
      let isSelf = false;
      if (sender) {
        isSelf = sender === playerRoleRef.current || 
                 sender.toUpperCase() === playerRoleRef.current.toUpperCase();
      } else {
        setChatMessages(prev => {
          const recentSelfMessage = prev
            .filter(m => m.sender === 'SELF')
            .sort((a, b) => b.timestamp - a.timestamp)[0];
          
          if (recentSelfMessage && 
              recentSelfMessage.message === message && 
              Math.abs(recentSelfMessage.timestamp - Date.now()) < 5000) {
            console.log('Message matches recent self message, skipping duplicate');
            return prev;
          }
          
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
        return;
      }
      
      setChatMessages(prev => {
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
    connection.on("receivechatmessage", handleChatMessage);

    // Voice message received
    const handleVoiceMessage = async (data: any, audioDataParam?: string) => {
      let sender: string;
      let audioData: string;
      
      if (typeof data === 'object' && data !== null) {
        sender = data.sender || data.Sender || data.role || data.Role || '';
        audioData = data.audioData || data.audio || data.data || data.AudioData || '';
      } else {
        sender = data || '';
        audioData = audioDataParam || '';
      }
      
      console.log(`[SignalR: RECEIVE] VoiceMessage: sender=${sender}, audioData length=${audioData?.length || 0}`, data);
      
      if (!audioData) {
        console.warn('Invalid voice message format: audioData is empty', { data, audioDataParam });
        return;
      }
      
      try {
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
        showToast('error', 'Voice Message Error', 'Failed to process received voice message.');
      }
    };

    connection.on("VoiceMessage", handleVoiceMessage);
    connection.on("receivevoicemessage", handleVoiceMessage);

    // GameState handler
    const handleGameState = (data: any) => {
      const d = data ?? {};
      console.warn('[SignalR: RECEIVE] raw GameState payload:', d);
      const digitCount = (d.digitCount ?? d.DigitCount ?? 3) as 3 | 4;
      const currentTurnServer = d.currentTurn ?? d.CurrentTurn ?? 'PLAYER1';
      const isGameStarted = d.isGameStarted ?? d.IsGameStarted ?? false;
      const isGameOver = d.isGameOver ?? d.IsGameOver ?? false;
      const yourHistory = d.yourGuesses ?? d.yourGuessHistory ?? d.selfGuessHistory ?? d.myGuessHistory ?? d.YourGuesses ?? d.YourGuessHistory ?? d.SelfGuessHistory ?? [];
      const oppHistory = d.opponentGuesses ?? d.opponentGuessHistory ?? d.OpponentGuesses ?? d.OpponentGuessHistory ?? [];
      const winnerServer = d.winner ?? d.Winner ?? null;
      const rawP1 = d.player1Secret ?? d.playerOneSecret ?? d.Player1Secret ?? d.PlayerOneSecret;
      const rawP2 = d.player2Secret ?? d.playerTwoSecret ?? d.Player2Secret ?? d.PlayerTwoSecret;
      const p1Secret = typeof rawP1 === 'string' && rawP1.length > 0 ? rawP1 : null;
      const p2Secret = typeof rawP2 === 'string' && rawP2.length > 0 ? rawP2 : null;

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

        let winner: Turn | null = null;
        if (winnerServer) {
          winner =
            winnerServer === 'PLAYER1' && selfIsPlayer1
              ? 'SELF'
              : winnerServer === 'PLAYER2' && !selfIsPlayer1
                ? 'SELF'
                : winnerServer === 'PLAYER1' && !selfIsPlayer1
                  ? 'OPPONENT'
                  : winnerServer === 'PLAYER2' && selfIsPlayer1
                    ? 'OPPONENT'
                    : null;
        }

        if (!winner && isGameOver) {
          const recentSelf = selfGuessHistory[0];
          const recentOpp = opponentGuessHistory[0];
          const selfWon = !!recentSelf && recentSelf.bulls === digitCount;
          const oppWon = !!recentOpp && recentOpp.bulls === digitCount;
          if (selfWon && !oppWon) winner = 'SELF';
          else if (oppWon && !selfWon) winner = 'OPPONENT';
        }

        let screen: GameScreen = p.screen;
        if (isGameOver) {
          screen = 'WIN';
        } else if (isGameStarted) {
          screen = 'GAME';
        } else {
          screen = p.playerRole === 'HOST' ? 'WAITING_FOR_OPPONENT' : 'WAITING_FOR_HOST';
        }

        const gameStatus = isGameOver ? 'FINISHED' : isGameStarted ? 'PLAYING' : 'WAITING';
        let playerSecret = p.playerSecret;
        let opponentSecret = p.opponentSecret;
        if (p1Secret !== null || p2Secret !== null) {
          if (selfIsPlayer1) {
            playerSecret = p1Secret ?? playerSecret;
            opponentSecret = p2Secret ?? opponentSecret;
          } else {
            playerSecret = p2Secret ?? playerSecret;
            opponentSecret = p1Secret ?? opponentSecret;
          }
        } else {
          if (payloadYourSecretRaw !== null) playerSecret = payloadYourSecretRaw || playerSecret;
          if (payloadOpponentSecret !== null) opponentSecret = payloadOpponentSecret || opponentSecret;
        }

        console.warn('[GameState] applied winner mapping:', { winnerServer, inferredWinner: winner, selfGuessHistory, opponentGuessHistory });

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

    // Game restart
    connection.on('GameRestarted', (data: any) => {
      console.log('[SignalR: RECEIVE] GameRestarted', data);
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
  }, [applyTurnResult, showToast]);

  const handlePlayAgain = async () => {
    if (gameState.gameMode !== 'ONLINE' || !gameState.roomCode) {
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
      const simplifiedError = simplifySignalRError(err);
      showToast('error', 'Restart Failed', simplifiedError);
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

  const handleRoomAction = async (role: PlayerRole, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (gameState.gameMode === 'ONLINE') {
      if (!signalRService.isConnected) {
        showToast('error', 'Server Offline', 'Check your C# backend connection.');
        return;
      }
      try {
        if (role === 'HOST') {
          console.log(`[SignalR: SEND] CreateRoom: Code=${cleanCode}, Role=HOST`);
          await signalRService.getConnection().invoke("CreateRoom", cleanCode);
          console.log(`[SignalR: SUCCESS] Room created: ${cleanCode}`);
          setGameState(p => ({ ...p, playerRole: role, roomCode: cleanCode }));
          sessionStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify({ roomCode: cleanCode, role: 'HOST' }));
          showToast('success', 'Room Created', `Room code: ${cleanCode}`);
        } else {
          console.log(`[SignalR: SEND] JoinRoom: Code=${cleanCode}, Role=GUEST`);
          await signalRService.getConnection().invoke("JoinRoom", cleanCode);
          console.log(`[SignalR: SUCCESS] Joined room: ${cleanCode}`);
          setGameState(p => ({ ...p, playerRole: role, roomCode: cleanCode, screen: 'WAITING_FOR_HOST' }));
          sessionStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify({ roomCode: cleanCode, role: 'GUEST' }));
          showToast('success', 'Room Joined', `Connected to room ${cleanCode}`);
        }
      } catch (err) {
        console.error("[SignalR: ERROR] Room action failed:", err);
        const simplifiedError = simplifySignalRError(err);
        showToast('error', 'Connection Error', simplifiedError);
      }
    }
  };

  const selectDigits = async (count: 3 | 4) => {
    if (gameState.gameMode === 'ONLINE' && gameState.playerRole === 'HOST') {
      try {
        await signalRService.getConnection().invoke("SetDifficulty", gameState.roomCode, count);
        setGameState(p => ({ ...p, digitCount: count, screen: 'PLAYER_SECRET_SETUP' }));
      } catch (err) {
        console.error("[SignalR: ERROR] SetDifficulty failed:", err);
        const simplifiedError = simplifySignalRError(err);
        showToast('error', 'Difficulty Error', simplifiedError);
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
        console.warn('[SignalR: SEND] SubmitSecret payload:', { room: gameState.roomCode, secret });
        await signalRService.getConnection().invoke("SubmitSecret", gameState.roomCode, secret);
        console.log("[SignalR: SUCCESS] Secret accepted by server.");

        setGameState(p => {
          if (p.gameStatus === 'PLAYING') return p;
          return {
            ...p,
            playerSecret: secret,
            screen: 'GAME',
            gameStatus: 'WAITING',
          };
        });
        showToast('success', 'Code Locked', 'Your secret code has been set!');
      } catch (err) {
        console.error("[SignalR: ERROR] SubmitSecret failed:", err);
        const simplifiedError = simplifySignalRError(err);
        showToast('error', 'Code Lock Failed', simplifiedError);
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
        const simplifiedError = simplifySignalRError(err);
        const msg = err instanceof Error ? err.message : 'Server error';
        if (msg.includes('Not your turn') || msg.includes('not your turn')) {
          showToast('warning', 'Not Your Turn', 'Waiting for opponent\'s guess. Please wait.');
        } else {
          showToast('error', 'Guess Rejected', simplifiedError);
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

  const handleSendChatMessage = async (message: string) => {
    if (!gameState.roomCode || gameState.gameMode !== 'ONLINE') return;
    
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
    } catch (err) {
      console.error("[SignalR: ERROR] SendChatMessage failed:", err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      const simplifiedError = simplifySignalRError(err);
      showToast('error', 'Message Failed', simplifiedError);
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    if (!gameState.roomCode || gameState.gameMode !== 'ONLINE') return;
    
    const MAX_AUDIO_SIZE = 100 * 1024;
    if (audioBlob.size > MAX_AUDIO_SIZE) {
      const sizeMB = (audioBlob.size / (1024 * 1024)).toFixed(2);
      showToast('error', 'Audio Too Large', `Please record a shorter message (max ~5 seconds).`);
      return;
    }
    
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
      
      const conn = signalRService.getConnection();
      if (conn.state !== signalR.HubConnectionState.Connected) {
        console.warn('[SignalR: WARNING] Connection not ready, state:', conn.state);
        if (conn.state === signalR.HubConnectionState.Disconnected) {
          try {
            await signalRService.start();
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('[SignalR: ERROR] Failed to reconnect:', err);
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(audioUrl);
            const simplifiedError = simplifySignalRError(err);
            showToast('error', 'Connection Lost', simplifiedError);
            return;
          }
        } else {
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          URL.revokeObjectURL(audioUrl);
          showToast('error', 'Connection Error', 'Please wait a moment and try again.');
          return;
        }
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          if (!base64Audio) {
            throw new Error('Failed to convert audio to base64');
          }
          
          if (base64Audio.length > MAX_AUDIO_SIZE * 1.4) {
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(audioUrl);
            showToast('error', 'Audio Encoding Error', 'Please record a shorter message.');
            return;
          }
          
          console.log("[SignalR: SEND] Sending voice message, base64 length:", base64Audio.length);
          
          const conn = signalRService.getConnection();
          if (conn.state !== signalR.HubConnectionState.Connected) {
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(audioUrl);
            showToast('error', 'Connection Lost', 'Please wait for reconnection and try again.');
            return;
          }
          
          await conn.invoke("SendVoiceMessage", gameState.roomCode, gameState.playerRole, base64Audio);
          console.log("[SignalR: SUCCESS] Voice message sent");
        } catch (err: any) {
          console.error("[SignalR: ERROR] SendVoiceMessage failed:", err);
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          URL.revokeObjectURL(audioUrl);
          const simplifiedError = simplifySignalRError(err);
          const errorMsg = err?.message || 'Unknown error';
          if (errorMsg.includes('Connection') || errorMsg.includes('disconnected')) {
            showToast('error', 'Connection Error', 'Connection lost while sending voice message.');
          } else {
            showToast('error', 'Voice Send Failed', simplifiedError);
          }
        }
      };
      reader.onerror = (err) => {
        console.error("[SignalR: ERROR] FileReader error:", err);
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
        URL.revokeObjectURL(audioUrl);
        showToast('error', 'File Error', 'Failed to process voice message.');
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error("[SignalR: ERROR] SendVoiceMessage failed:", err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      URL.revokeObjectURL(audioUrl);
      const simplifiedError = simplifySignalRError(err);
      showToast('error', 'Voice Send Failed', simplifiedError);
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
    setChatMessages([]);
  };

  // Theme: persist and share across screens
	const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
		try {
			const v = localStorage.getItem('ui_dark_mode');
			return v ? JSON.parse(v) : false;
		} catch { return false; }
	});
	const toggleDarkMode = () => {
		setIsDarkMode(prev => {
			const next = !prev;
			try { localStorage.setItem('ui_dark_mode', JSON.stringify(next)); } catch {}
			return next;
		});
	};

  const renderScreen = () => {
    switch (gameState.screen) {
      case 'HOME': return <HomeScreen onStart={toModeSelection} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'MODE_SELECTION': return <ModeSelection onSelect={selectMode} onBack={reset} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'ROOM_SETUP': return <RoomSetup onConfirm={handleRoomAction} onBack={toModeSelection} onShowToast={showToast} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'DIFFICULTY_SETUP': return <SetupScreen onSelect={selectDigits} onBack={toModeSelection} onShowToast={showToast} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'PLAYER_SECRET_SETUP': return <PlayerSetupScreen digitCount={gameState.digitCount} onConfirm={finalizeSecrets} onBack={() => setGameState(p => ({ ...p, screen: gameState.playerRole === 'HOST' ? 'DIFFICULTY_SETUP' : 'ROOM_SETUP' }))} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'RECONNECTING': return (
        <GameLoader
          fullScreen={false}
          compact
          status="Joining room..."
          subtext={`Room ${gameState.roomCode} · Rejoining as ${gameState.playerRole}`}
          showCancel
          onCancel={reset}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
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
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
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
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      );
      case 'GAME': return (
        <>
          <GameScreenComp state={gameState} onGuess={handlePlayerGuess} onQuit={reset} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          {gameState.gameMode === 'ONLINE' && gameState.roomCode && gameState.playerRole !== 'NONE' && (
            <ChatPanel
              roomCode={gameState.roomCode}
              playerRole={gameState.playerRole}
              isConnected={isServerOnline}
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              onSendVoice={handleSendVoiceMessage}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      );
      case 'WIN': {
        let derivedWinner = gameState.winner;
        if (!derivedWinner) {
          const topSelf = gameState.selfGuessHistory[0];
          const topOpp = gameState.opponentGuessHistory[0];
          if (topSelf && topSelf.bulls === gameState.digitCount) derivedWinner = 'SELF';
          else if (topOpp && topOpp.bulls === gameState.digitCount) derivedWinner = 'OPPONENT';
        }
        return <WinScreen winner={derivedWinner} playerSecret={gameState.playerSecret} opponentSecret={gameState.opponentSecret} playerAttempts={gameState.selfGuessHistory.length} opponentAttempts={gameState.opponentGuessHistory.length} onPlayAgain={handlePlayAgain} onHome={reset} playerRole={gameState.playerRole} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      }
      default: return <HomeScreen onStart={toModeSelection} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300`}>
      {showInitialLoader && (
        <SequentialGameLoader
          minDuration={MIN_LOADER_MS}
          maxDuration={MAX_LOADER_MS}
          onComplete={() => setShowInitialLoader(false)}
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
        <div className="opacity-60">© {new Date().getFullYear()} AswinCodes21 (V2.1)</div>
      </div>

      {/* Toast Notifications */}
      <Toast messages={toastMessages} onRemove={removeToast} />
    </div>
  );
};

export default App;
