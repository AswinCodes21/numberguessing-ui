import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'SELF' | 'OPPONENT';
  message: string;
  timestamp: number;
  type: 'text' | 'voice';
  audioUrl?: string;
}

interface Props {
  roomCode: string;
  playerRole: 'HOST' | 'GUEST';
  isConnected: boolean;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSendVoice?: (audioBlob: Blob) => void;
}

const ChatPanel: React.FC<Props> = ({ roomCode, playerRole, isConnected, messages, onSendMessage, onSendVoice }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const shouldCancelRef = useRef<boolean>(false);
  const MAX_RECORDING_DURATION = 10000; // 10 seconds max

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isConnected) return;

    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Try different MIME types for better browser compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use browser default
          }
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Don't send if it was cancelled
          if (shouldCancelRef.current) {
            audioChunksRef.current = [];
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm'
          });

          if (audioBlob.size === 0) {
            console.warn('Voice message is empty, not sending');
            return;
          }

          if (onSendVoice) {
            console.log('Sending voice message, size:', audioBlob.size, 'type:', audioBlob.type);
            try {
              await onSendVoice(audioBlob);
            } catch (err) {
              console.error('Error in onSendVoice callback:', err);
              // Error is already handled in handleSendVoiceMessage
            }
          } else {
            console.warn('No voice message handler available');
          }
          audioChunksRef.current = [];
        } catch (err) {
          console.error('Error processing voice message:', err);
          alert('Failed to send voice message. Please try again.');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        alert('Error recording audio. Please try again.');
      };

      // Start recording with timeslice to ensure data is available
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 100;
          // Auto-stop if max duration reached
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopVoiceRecording();
            alert('Maximum recording duration (10 seconds) reached. Message sent automatically.');
          }
          return newDuration;
        });
      }, 100);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
    }
  };

  const stopVoiceRecording = (cancel: boolean = false) => {
    // Clear recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (cancel) {
      // Cancel - clear audio chunks without sending
      audioChunksRef.current = [];
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } else {
      // Normal stop - will trigger onstop which sends the message
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setIsCancelling(false);
  };

  const handleVoiceStart = (clientX: number, clientY: number) => {
    if (isRecording) return;

    // Don't block if connection check fails - let it try and show error later
    if (!isConnected) {
      alert('Not connected to server. Please wait for connection and try again.');
      return;
    }

    touchStartRef.current = { x: clientX, y: clientY };
    mouseStartRef.current = { x: clientX, y: clientY };
    shouldCancelRef.current = false;
    setIsCancelling(false);
    startVoiceRecording();
  };

  const handleVoiceEnd = () => {
    if (!isRecording) return;

    if (shouldCancelRef.current) {
      // Cancel recording
      stopVoiceRecording(true); // Pass true to indicate cancellation
      setIsCancelling(false);
    } else {
      // Send recording
      stopVoiceRecording(false);
    }

    touchStartRef.current = null;
    mouseStartRef.current = null;
    shouldCancelRef.current = false;
  };

  const handleVoiceMove = (clientX: number, clientY: number) => {
    if (!isRecording || !touchStartRef.current && !mouseStartRef.current) return;

    const startPos = touchStartRef.current || mouseStartRef.current;
    if (!startPos) return;

    const deltaX = clientX - startPos.x;
    const deltaY = Math.abs(clientY - startPos.y);

    // Check if swiped left (and not too much vertically)
    if (deltaX < -50 && deltaY < 100) {
      shouldCancelRef.current = true;
      setIsCancelling(true);
    } else {
      shouldCancelRef.current = false;
      setIsCancelling(false);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleVoiceStart(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleVoiceEnd();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isRecording) {
      handleVoiceMove(e.clientX, e.clientY);
    }
  };

  const handleMouseLeave = () => {
    if (isRecording) {
      handleVoiceEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleVoiceStart(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleVoiceEnd();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording && e.touches[0]) {
      const touch = e.touches[0];
      handleVoiceMove(touch.clientX, touch.clientY);
    }
  };

  // Global mouse/touch event handlers for recording
  useEffect(() => {
    if (!isRecording) return;

    const handleGlobalMouseUp = () => {
      if (!isRecording) return;

      if (shouldCancelRef.current) {
        stopVoiceRecording(true);
        setIsCancelling(false);
      } else {
        stopVoiceRecording(false);
      }

      touchStartRef.current = null;
      mouseStartRef.current = null;
      shouldCancelRef.current = false;
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isRecording || !touchStartRef.current && !mouseStartRef.current) return;

      const startPos = touchStartRef.current || mouseStartRef.current;
      if (!startPos) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = Math.abs(e.clientY - startPos.y);

      if (deltaX < -50 && deltaY < 100) {
        shouldCancelRef.current = true;
        setIsCancelling(true);
      } else {
        shouldCancelRef.current = false;
        setIsCancelling(false);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (!isRecording) return;

      if (shouldCancelRef.current) {
        stopVoiceRecording(true);
        setIsCancelling(false);
      } else {
        stopVoiceRecording(false);
      }

      touchStartRef.current = null;
      mouseStartRef.current = null;
      shouldCancelRef.current = false;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isRecording || !e.touches[0] || !touchStartRef.current && !mouseStartRef.current) return;

      const touch = e.touches[0];
      const startPos = touchStartRef.current || mouseStartRef.current;
      if (!startPos) return;

      const deltaX = touch.clientX - startPos.x;
      const deltaY = Math.abs(touch.clientY - startPos.y);

      if (deltaX < -50 && deltaY < 100) {
        shouldCancelRef.current = true;
        setIsCancelling(true);
      } else {
        shouldCancelRef.current = false;
        setIsCancelling(false);
      }
    };

    // Add global listeners when recording
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchmove', handleGlobalTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <span>💬</span>
          <span className="text-xs font-bold">Chat</span>
          {messages.length > 0 && (
            <span className="bg-white text-indigo-600 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <h3 className="text-sm font-black">Chat</h3>
            <p className="text-[10px] text-indigo-200 uppercase tracking-widest">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-300">
            <div className="text-center">
              <div className="text-3xl mb-2">💭</div>
              <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
              <p className="text-[10px] text-slate-400 mt-1">Start chatting!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'SELF' ? 'items-end' : 'items-start'}`}
            >
              {/* Sender label */}
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-2 ${msg.sender === 'SELF' ? 'text-indigo-600' : 'text-slate-500'
                }`}>
                {msg.sender === 'SELF' ? 'You' : playerRole === 'HOST' ? 'Guest' : 'Host'}
              </span>

              {/* Message bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.sender === 'SELF'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-900 border border-slate-200'
                  }`}
              >
                {msg.type === 'voice' ? (
                  <div className="flex items-center gap-2">
                    <span>🎤</span>
                    {msg.audioUrl ? (
                      <audio controls className="h-6" src={msg.audioUrl} />
                    ) : (
                      <span className="text-xs italic">Voice message</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{msg.message}</p>
                )}
                <p
                  className={`text-[10px] mt-1 ${msg.sender === 'SELF' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            disabled={!isConnected}
            className={`px-3 py-2 rounded-xl transition-all select-none ${isRecording
              ? isCancelling
                ? 'bg-orange-500 text-white'
                : 'bg-red-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? (isCancelling ? 'Release to cancel' : 'Release to send') : 'Hold to record'}
          >
            {isRecording ? (isCancelling ? '❌' : '🎤') : '🎤'}
          </button>
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </form>
        {isRecording && (
          <div className={`mt-2 flex items-center gap-2 text-xs ${isCancelling ? 'text-orange-500' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isCancelling ? 'bg-orange-500' : 'bg-red-500'}`}></span>
            <span className="font-bold">
              {isCancelling ? (
                <>Swipe released - Cancelling...</>
              ) : (
                <>Recording... {(recordingDuration / 1000).toFixed(1)}s / {(MAX_RECORDING_DURATION / 1000).toFixed(0)}s • Swipe left to cancel</>
              )}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default ChatPanel;
