
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

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
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
  });

  const [isServerOnline, setIsServerOnline] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const playerRoleRef = useRef<PlayerRole>('NONE');
  
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
          selfGuessHistory: [],
          opponentGuessHistory: [],
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
    };
  }, [applyTurnResult]);

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
          // Don't set screen here - wait for RoomCreated event from server
          setGameState(p => ({ ...p, playerRole: role, roomCode: cleanCode }));
        } else {
          console.log(`[SignalR: SEND] JoinRoom: Code=${cleanCode}, Role=GUEST`);
          await signalRService.getConnection().invoke("JoinRoom", cleanCode);
          console.log(`[SignalR: SUCCESS] Joined room: ${cleanCode}`);
          setGameState(p => ({ ...p, playerRole: role, roomCode: cleanCode, screen: 'WAITING_FOR_HOST' }));
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
        alert(`Guess rejected: ${err instanceof Error ? err.message : 'Server error'}`);
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
            alert('Connection lost. Please wait for reconnection and try again.');
            return;
          }
        } else {
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
            alert('Voice message is too large after encoding. Please record a shorter message.');
            return;
          }
          
          console.log("[SignalR: SEND] Sending voice message, base64 length:", base64Audio.length);
          
          // Ensure connection is still active
          const conn = signalRService.getConnection();
          if (conn.state !== signalR.HubConnectionState.Connected) {
            alert('Connection lost. Please wait for reconnection and try again.');
            return;
          }
          
          // Send roomCode, sender (HOST/GUEST), and base64Audio so backend can broadcast to the other player with sender
          await conn.invoke("SendVoiceMessage", gameState.roomCode, gameState.playerRole, base64Audio);
          console.log("[SignalR: SUCCESS] Voice message sent");
        } catch (err: any) {
          console.error("[SignalR: ERROR] SendVoiceMessage failed:", err);
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
        alert('Failed to process voice message. Please try again.');
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error("[SignalR: ERROR] SendVoiceMessage failed:", err);
      alert(`Failed to send voice message: ${err?.message || 'Unknown error'}`);
    }
  };

  const reset = () => {
    setGameState(p => ({ 
      ...p, 
      screen: 'HOME', 
      winner: null, 
      gameStatus: 'WAITING',
      selfGuessHistory: [],
      opponentGuessHistory: [],
      roomCode: '',
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
      case 'WAITING_FOR_OPPONENT': return (
        <div className="p-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Room Created</h2>
          <p className="text-slate-500 font-medium">Room Code: <span className="text-indigo-600 font-bold">{gameState.roomCode}</span></p>
          <p className="text-slate-400 text-sm mt-4">Waiting for an opponent to join...</p>
          <button onClick={reset} className="mt-12 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel</button>
        </div>
      );
      case 'WAITING_FOR_HOST': return (
        <div className="p-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Joined Room</h2>
          <p className="text-slate-500 font-medium">Room Code: <span className="text-indigo-600 font-bold">{gameState.roomCode}</span></p>
          <p className="text-slate-400 text-sm mt-4">Waiting for the Host to choose the number of digits. You will then set your secret.</p>
          <button onClick={reset} className="mt-12 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Leave Lobby</button>
        </div>
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
      case 'WIN': return <WinScreen winner={gameState.winner} playerSecret={gameState.playerSecret} opponentSecret={gameState.opponentSecret} playerAttempts={gameState.selfGuessHistory.length} opponentAttempts={gameState.opponentGuessHistory.length} onPlayAgain={() => selectDigits(gameState.digitCount)} onHome={reset} />;
      default: return <HomeScreen onStart={toModeSelection} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
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
