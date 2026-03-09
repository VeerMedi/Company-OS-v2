/**
 * useStreamingSTT Hook (Socket.IO Version)
 * React hook for streaming Speech-to-Text with progressive feedback
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5002';
const CHUNK_INTERVAL_MS = 2000; // Send chunks every 2 seconds

export const useStreamingSTT = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [confidence, setConfidence] = useState(1.0);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * Initialize Socket.IO connection
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✓ Socket.IO connected');
      setIsConnected(true);
    });

    socket.on('connected', (data) => {
      console.log('Server ready:', data.message);
    });

    socket.on('streaming_started', (data) => {
      console.log('🎙️ Streaming started:', data);
    });

    socket.on('partial_result', (data) => {
      console.log(`📝 Partial [${data.chunk}]: "${data.text}"`);
      setPartialText(data.text);
      setConfidence(data.confidence || 0.7);
    });

    socket.on('final_result', (data) => {
      console.log(`✅ Final: "${data.text}"`);
      setFinalText(data.text);
      setConfidence(data.confidence || 1.0);
      setIsProcessing(false);
    });

    socket.on('error', (data) => {
      console.error('❌ Socket error:', data);
      setError(data.message);
      setIsProcessing(false);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, []);

  /**
   * Start recording with chunked streaming
   */
  const startRecording = useCallback(async (language = 'en') => {
    try {
      setError(null);
      setPartialText('');
      setFinalText('');

      // Ensure connected
      if (!socketRef.current?.connected) {
        connect();
        // Wait for connection
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Tell server we're starting
      socketRef.current.emit('start_streaming', { language });

      // Create MediaRecorder with chunked output
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      // Send audio chunks to server
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          // Convert Blob to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            socketRef.current.emit('audio_chunk', { audio: base64 });
            console.log(`📦 Sent chunk: ${(event.data.size / 1024).toFixed(1)} KB`);
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, requesting final result...');
        setIsProcessing(true);
        socketRef.current?.emit('stop_streaming');
      };

      // Start recording with chunked intervals
      mediaRecorder.start(CHUNK_INTERVAL_MS);
      setIsRecording(true);
      console.log(`🎙️ Recording started (chunks every ${CHUNK_INTERVAL_MS}ms)`);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err.message);
    }
  }, [connect]);

  /**
   * Stop recording and get final transcription
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      console.log('🛑 Recording stopped');
    }
  }, [isRecording]);

  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopRecording();
      disconnect();
    };
  }, [stopRecording, disconnect]);

  return {
    isConnected,
    isRecording,
    isProcessing,
    partialText,
    finalText,
    confidence,
    error,
    connect,
    startRecording,
    stopRecording,
    disconnect,
  };
};

export default useStreamingSTT;
