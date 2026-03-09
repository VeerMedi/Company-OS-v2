/**
 * useVoiceAgent Hook - Production Grade
 * 
 * WebSocket-based voice agent with:
 * - Silence detection (auto-stop after 1.5s silence)
 * - Audio level monitoring
 * - Deterministic lifecycle
 * - React Strict Mode safe
 * 
 * Event Flow:
 * 1. connect() → establishes Socket.IO connection
 * 2. startRecording() → requests mic, starts MediaRecorder + AudioContext
 * 3. Silence detected → auto-triggers stopRecording()
 * 4. stopRecording() → sends audio via socket.emit('voice_pipeline')
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5002';

// ===== SILENCE DETECTION CONFIG (ROBUST STATE MACHINE) =====
// Hysteresis thresholds (Mac-safe, low gain mics - TUNED FOR FASTER DETECTION)
const SILENCE_THRESHOLD = 0.001;   // RMS below this = definitely silent
const SPEECH_THRESHOLD = 0.003;    // RMS above this = definitely speaking
// Timing
const GRACE_PERIOD_MS = 500;       // Silence detection disabled during this
const SILENCE_DURATION_MS = 1000;  // 1 second of silence before auto-stop (user requested)
const MAX_RECORDING_MS = 30000;    // Hard safety timeout (30 seconds for long queries)


export const useVoiceAgent = () => {
  // ===== STATE =====
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [answer, setAnswer] = useState('');
  const [audioData, setAudioData] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState(null);
  const [timing, setTiming] = useState(null);
  // conversationState is now a ref to avoid closure issues

  // ===== REFS (survive re-renders) =====
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isRecordingRef = useRef(false);
  const conversationStateRef = useRef(null); // Use ref to avoid closure issues
  const ackAudioRef = useRef(null); // Track acknowledgement audio for cleanup
  // State machine refs
  const hasSpokenRef = useRef(false);
  const graceOverRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // ===== SOCKET CONNECTION =====
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 Already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to Socket.IO...');
      
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        timeout: 30000,              // 30s timeout (handles slow WebM transcription)
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 3,
        pingTimeout: 30000,          // 30s ping timeout
        pingInterval: 25000,         // Send ping every 25s to keep alive
      });

      socket.on('connect', () => {
        console.log('🔌 ✓ WebSocket ready');
        setIsConnected(true);
        resolve();
      });

      socket.on('connect_error', (err) => {
        console.error('🔌 ❌ Connection error:', err);
        setError('Failed to connect to voice server');
        reject(err);
      });

      // Pipeline events
      socket.on('pipeline_status', (data) => {
        console.log('📡 Pipeline:', data.step, '-', data.message || '');
        setCurrentStep(data.step);
        if (data.step === 'stt_done') setTranscription(data.text || '');
        if (data.step === 'rag_done') setAnswer(data.answer || '');
        if (data.step === 'tts') console.log('🔊 TTS generating...');
      });

      // ===== ACKNOWLEDGEMENT EVENT (INSTANT FILLER WORDS) =====
      socket.on('acknowledgment', (data) => {
        console.log('💬 Acknowledgement received:', data.text);
        // Play instant acknowledgement (Haan..., Sure..., etc.)
        if (data.text) {
          // If backend sent ElevenLabs audio, play it (SAME VOICE as main response)
          if (data.audio_base64 && data.audio_format) {
            try {
              const format = data.audio_format;
              const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
              
              // Decode Base64 to binary
              const binaryString = atob(data.audio_base64);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Create Blob and play
              const blob = new Blob([bytes], { type: mimeType });
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              
              // Store in ref so it can be stopped when main response comes
              ackAudioRef.current = audio;
              
              audio.onended = () => {
                URL.revokeObjectURL(url);
                ackAudioRef.current = null;
              };
              audio.onerror = () => {
                URL.revokeObjectURL(url);
                ackAudioRef.current = null;
              };
              audio.play().catch(err => console.error('🔊 Ack play error:', err));
              
              console.log('🔊 Playing ElevenLabs acknowledgement audio');
            } catch (err) {
              console.error('🔊 Ack audio decode error:', err);
              // Fallback to browser TTS if audio fails
              fallbackToSpeechSynthesis(data.text);
            }
          } else {
            // Fallback: Use browser's Speech Synthesis API
            fallbackToSpeechSynthesis(data.text);
          }
          
          // Show acknowledgement text briefly
          const prevTranscription = transcription;
          setTranscription(`🎙️ ${data.text}`);
          setTimeout(() => setTranscription(prevTranscription), 2000);
        }
      });
      
      // Helper function for browser TTS fallback
      const fallbackToSpeechSynthesis = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const hasHindi = /[\u0900-\u097F]/.test(text);
        utterance.lang = hasHindi ? 'hi-IN' : 'en-US';
        utterance.rate = 1.1;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
        console.log('🔊 Playing browser TTS acknowledgement (fallback)');
      };

      socket.on('pipeline_complete', (data) => {
        console.log('✅ Pipeline complete:', data);
        setIsProcessing(false);
        setCurrentStep('complete');
        
        // Stop acknowledgement audio if still playing (prevent overlap)
        if (ackAudioRef.current) {
          try {
            ackAudioRef.current.pause();
            ackAudioRef.current = null;
            console.log('🔇 Stopped acknowledgement audio (main response ready)');
          } catch (err) {
            console.error('Error stopping ack audio:', err);
          }
        }
        
        // Set transcription and answer immediately
        if (data.timing) setTiming(data.timing);
        if (data.transcription) setTranscription(data.transcription);
        if (data.answer) setAnswer(data.answer);
        
        // CRITICAL: Save conversation_state for multi-turn interactions (task creation)
        if (data.conversation_state) {
          console.log('💾 Saving conversation_state for next turn:', data.conversation_state);
          conversationStateRef.current = data.conversation_state;
        } else {
          // Clear state if conversation is complete
          console.log('🧹 Clearing conversation_state (conversation complete)');
          conversationStateRef.current = null;
        }
        
        // Play audio IMMEDIATELY when received (don't rely on useEffect)
        if (data.audio) {
          const format = data.audio_format || 'mp3';
          console.log(`🔊 TTS base64 length: ${data.audio.length}`);
          console.log(`🔊 Audio MIME type: audio/${format}`);
          
          // Set audioData for any component that needs it
          setAudioData({ base64: data.audio, format: format });
          
          // IMMEDIATELY PLAY the audio
          try {
            const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
            const binaryString = atob(data.audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            
            console.log(`🔊 Playing audio immediately (${blob.size} bytes)...`);
            
            audio.oncanplaythrough = () => {
              console.log('🔊 Audio ready, starting playback');
              setCurrentStep('speaking'); // Update state so UI shows text
              audio.play().catch(err => {
                console.error('🔊 Autoplay blocked:', err);
              });
            };
            
            audio.onended = () => {
              URL.revokeObjectURL(url);
              console.log('🔊 Audio playback ended');
              setCurrentStep('idle'); // Reset after audio ends
            };
            
            audio.onerror = (e) => {
              console.error('🔊 Audio error:', e);
              URL.revokeObjectURL(url);
            };
          } catch (err) {
            console.error('🔊 Audio decode/play error:', err);
          }
        }
        
        // Auto-close on goodbye
        if (data.should_close) {
          console.log('👋 Goodbye detected - closing modal in 3 seconds...');
          setTimeout(() => {
            disconnect();
          }, 3000); // Wait for audio to play
        }
      });

      socket.on('pipeline_error', (data) => {
        console.error('❌ Pipeline error:', data.error);
        setError(data.error);
        setIsProcessing(false);
        setCurrentStep('error');
      });

      // ===== STREAMING STT EVENTS (Real-time transcription) =====
      socket.on('streaming_started', (data) => {
        console.log('🎤 Streaming started:', data);
        setCurrentStep('streaming');
      });

      socket.on('partial_result', (data) => {
        // Show partial transcription as user speaks
        console.log(`📝 Partial [${data.chunk}]: "${data.text}"`);
        if (data.text) {
          setTranscription(data.text);
        }
      });

      socket.on('final_result', (data) => {
        console.log(`📝 Final: "${data.text}"`);
        if (data.text) {
          setTranscription(data.text);
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected');
        setIsConnected(false);
      });

      socketRef.current = socket;
    });
  }, []);

  // ===== ROBUST SILENCE DETECTION (STATE MACHINE) =====
  const startAudioMonitoring = useCallback(() => {
    if (!analyzerRef.current) return;

    // TIME-DOMAIN data only (not frequency!)
    const dataArray = new Uint8Array(analyzerRef.current.fftSize);
    
    // Reset state machine
    hasSpokenRef.current = false;
    graceOverRef.current = false;
    isSpeakingRef.current = false;

    // Grace period timer
    setTimeout(() => {
      graceOverRef.current = true;
      console.log('⏳ Grace period ended - silence detection ENABLED');
    }, GRACE_PERIOD_MS);

    // Max recording safety timeout
    maxTimeoutRef.current = setTimeout(() => {
      console.log('⏹️ MAX TIMEOUT reached (8s) - force stopping');
      stopRecording();
    }, MAX_RECORDING_MS);

    const checkAudioLevel = () => {
      if (!isRecordingRef.current) return;

      // Calculate RMS from time-domain data
      analyzerRef.current.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      setAudioLevel(rms * 100);

      // Hysteresis state machine
      let state = isSpeakingRef.current ? '🗣️ speaking' : '🔕 silent';
      if (rms > SPEECH_THRESHOLD) {
        isSpeakingRef.current = true;
        state = '🗣️ speaking';
        if (!hasSpokenRef.current) {
          hasSpokenRef.current = true;
          console.log('🗣️ SPEECH DETECTED (first time) - hasSpoken=true');
        }
      } else if (rms < SILENCE_THRESHOLD) {
        isSpeakingRef.current = false;
        state = '🔕 silent';
      }
      // Between thresholds: keep previous state (hysteresis)

      console.log(`🎚️ RMS: ${rms.toFixed(4)} → ${state}`);

      // Silence detection logic (only after grace AND hasSpoken)
      if (graceOverRef.current && hasSpokenRef.current) {
        if (!isSpeakingRef.current) {
          // Start silence timer if not running
          if (!silenceTimeoutRef.current) {
            console.log('� Silence timer STARTED (1.2s countdown)');
            silenceTimeoutRef.current = setTimeout(() => {
              console.log('⏹️ SILENCE DURATION reached - auto-stopping');
              stopRecording();
            }, SILENCE_DURATION_MS);
          }
        } else {
          // Speech detected - reset silence timer
          if (silenceTimeoutRef.current) {
            console.log('🔁 Silence timer RESET (speech detected)');
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, []);

  // ===== START RECORDING =====
  const startRecording = useCallback(async () => {
    try {
      console.log('🎙️ startRecording called');
      setError(null);
      setTranscription('');
      setAnswer('');
      setAudioData(null);
      audioChunksRef.current = [];

      // STEP 1: Ensure WebSocket connected
      if (!socketRef.current?.connected) {
        console.log('🔌 Not connected, connecting first...');
        await connect();
      }
      console.log('🔌 ✓ WebSocket ready');

      // STEP 2: Get microphone permission
      console.log('🎤 Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;
      console.log('🎤 ✓ Microphone acquired, tracks:', stream.getTracks().length);

      // STEP 3: Set up AudioContext for level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      console.log('📊 ✓ Audio analyzer ready');

      // STEP 4: Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      // DISABLED: Streaming STT was causing partial WebM issues with Whisper
      // let streamingStarted = false;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          const chunkNum = audioChunksRef.current.length;
          console.log(`📦 Chunk #${chunkNum}: ${(event.data.size / 1024).toFixed(1)}KB`);
          
          // ===== STREAMING STT DISABLED =====
          // Sending partial WebM chunks causes EBML parsing errors in Whisper.
          // Audio is now sent as complete blob only in stopRecording().
          // See: implementation_plan.md for details on this architectural decision.
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
        // DISABLED: Streaming cleanup not needed since we're not streaming
        // if (streamingStarted && socketRef.current?.connected) {
        //   socketRef.current.emit('stop_streaming');
        //   console.log('🎤 Stopped streaming STT');
        // }
      };

      mediaRecorderRef.current = mediaRecorder;

      // STEP 5: Start recording
      recordingStartTimeRef.current = Date.now();
      isRecordingRef.current = true;
      mediaRecorder.start(500); // Collect chunks every 500ms (sent as complete blob on stop)
      setIsRecording(true);
      setCurrentStep('recording');
      console.log('🎙️ ✓ Recording started (complete blob mode - streaming STT disabled)');


      // STEP 6: Start audio level monitoring (for silence detection)
      startAudioMonitoring();

    } catch (err) {
      console.error('🎙️ ❌ startRecording failed:', err);
      setError(err.message);
      cleanupRecording();
      throw err;
    }
  }, [connect, startAudioMonitoring]);

  // ===== STOP RECORDING =====
  const stopRecording = useCallback(async (category = null, conversationState = null) => {
    console.log('🛑 stopRecording called, isRecording:', isRecordingRef.current);
    
    if (!isRecordingRef.current) {
      console.log('🛑 Not recording, skipping');
      return;
    }

    // 🔒 SAFETY: Never stop before capturing at least 1 chunk
    if (audioChunksRef.current.length === 0) {
      console.log('⚠️ No audio chunks captured yet, waiting...');
      return;
    }

    isRecordingRef.current = false;
    setIsRecording(false);

    // Clear silence timer
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Clear max recording timeout
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Wait a tick for final chunks
    await new Promise(resolve => setTimeout(resolve, 100));

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Check if we have audio
    if (audioChunksRef.current.length === 0) {
      console.log('🛑 ❌ No audio chunks captured');
      setError('No audio captured');
      setCurrentStep('error');
      return;
    }

    // Send to backend
    setIsProcessing(true);
    setCurrentStep('sending');
    setAudioLevel(0);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log(`📤 Sending ${(audioBlob.size / 1024).toFixed(1)}KB audio...`);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        
        // Use saved conversation_state from previous turn (for task creation flow)
        // CRITICAL: Use .current to get latest value, not closure capture
        socketRef.current?.emit('voice_pipeline', {
          audio: base64,
          category: category,
          conversation_state: conversationStateRef.current,
        });
        
        console.log('📤 Conversation state sent:', conversationStateRef.current ? 'Present' : 'None');
        
        console.log('📤 ✓ Audio sent to pipeline');
      };
      reader.readAsDataURL(audioBlob);
      
    } catch (err) {
      console.error('📤 ❌ Send failed:', err);
      setError(err.message);
      setIsProcessing(false);
      setCurrentStep('error');
    }
  }, []);

  // ===== CLEANUP =====
  const cleanupRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // ===== DISCONNECT =====
  const disconnect = useCallback(() => {
    cleanupRecording();
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
    socketRef.current = null;
    setIsConnected(false);
  }, [cleanupRecording]);

  // ===== PLAY AUDIO (Robust Base64 Decode) =====
  const playAudio = useCallback(() => {
    if (!audioData || !audioData.base64) {
      console.log('🔊 No audio data to play');
      return null;
    }

    try {
      // Extract Base64 and format
      const base64 = audioData.base64;
      const format = audioData.format || 'mp3';
      const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;

      console.log(`🔊 TTS base64 length: ${base64.length}`);
      console.log(`🔊 Audio MIME type: ${mimeType}`);

      // Decode Base64 to binary
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create Blob with correct MIME type
      const blob = new Blob([bytes], { type: mimeType });
      console.log(`🔊 Blob size: ${blob.size} bytes`);

      // Create Object URL and play
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.oncanplaythrough = () => {
        console.log('🔊 Audio playback started');
        audio.play().catch(err => {
          console.error('🔊 Play error:', err);
        });
      };

      audio.onended = () => {
        URL.revokeObjectURL(url);
        console.log('🔊 Audio playback ended');
      };

      audio.onerror = (e) => {
        console.error('🔊 Audio error:', e);
        URL.revokeObjectURL(url);
      };

      return audio;
    } catch (err) {
      console.error('🔊 Audio decode error:', err);
      return null;
    }
  }, [audioData]);

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [cleanupRecording]);

  // ===== EXPOSE STOP RECORDING FOR EXTERNAL CALLS =====
  // This allows VoiceAgentModal to pass category/conversationState
  const stopRecordingWithContext = useCallback((category, conversationState) => {
    return stopRecording(category, conversationState);
  }, [stopRecording]);

  return {
    // State
    isConnected,
    isRecording,
    isProcessing,
    audioLevel,
    transcription,
    answer,
    audioData,
    currentStep,
    error,
    timing,
    // Methods
    connect,
    startRecording,
    stopRecording: stopRecordingWithContext,
    playAudio,
    disconnect,
  };
};

export default useVoiceAgent;
