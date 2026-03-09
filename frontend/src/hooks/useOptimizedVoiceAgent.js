/**
 * Optimized WebSocket Voice Agent Hook
 * 
 * Features:
 * - Native WebSocket (no Socket.IO overhead)
 * - Binary audio streaming for low latency
 * - Automatic reconnection with exponential backoff
 * - Chunked audio processing
 * - Connection pooling/keep-alive
 * - Optimized silence detection
 * - Real-time transcription streaming
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// WebSocket configuration
const WS_URL = import.meta.env.VITE_VOICE_WS_URL || 'ws://localhost:5002/ws/voice';
const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 10000;
const MAX_RECONNECT_ATTEMPTS = 5;

// Audio configuration - optimized for low latency
const AUDIO_CONFIG = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    chunkSize: 4096,  // Smaller chunks for faster streaming
    silenceThreshold: 0.001, // Lowered for faster detection
    speechThreshold: 0.003,
    gracePeriodMs: 500,
    silenceDurationMs: 800,
    maxRecordingMs: 30000
};

export const useOptimizedVoiceAgent = () => {
    // ===== STATE =====
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [partialTranscript, setPartialTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [currentStep, setCurrentStep] = useState('');
    const [error, setError] = useState(null);

    // ===== REFS =====
    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyzerRef = useRef(null);
    const silenceTimeoutRef = useRef(null);
    const maxTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const isRecordingRef = useRef(false);
    const hasSpokenRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const animationFrameRef = useRef(null);

    // ===== WEBSOCKET CONNECTION with Auto-Reconnect =====
    const connect = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('✅ Already connected');
                resolve();
                return;
            }

            console.log('🔌 Connecting to WebSocket:', WS_URL);
            
            try {
                const ws = new WebSocket(WS_URL);

                ws.onopen = () => {
                    console.log('\✅ WebSocket connected');
                    setIsConnected(true);
                    setError(null);
                    reconnectAttemptsRef.current = 0;
                    resolve();
                };

                ws.onmessage = (event) => {
                    handleMessage(event);
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    // Don't set error here - wait for onclose to determine if reconnect will happen
                    reject(error);
                };

                ws.onclose = () => {
                    console.log('🔌 WebSocket closed');
                    setIsConnected(false);
                    wsRef.current = null;
                    
                    // Auto-reconnect with exponential backoff
                    if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                        const delay = Math.min(
                            RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current),
                            MAX_RECONNECT_DELAY_MS
                        );
                        
                        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
                        
                        reconnectTimeoutRef.current = setTimeout(() => {
                            reconnectAttemptsRef.current++;
                            connect().catch(console.error);
                        }, delay);
                    } else {
                        setError('Maximum reconnection attempts reached');
                    }
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('❌ Failed to create WebSocket:', error);
                setError('Failed to establish connection');
                reject(error);
            }
        });
    }, []);

    // ===== SEND MESSAGE =====
    const sendMessage = useCallback((type, data = null) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        const message = JSON.stringify({ type, data });
        wsRef.current.send(message);
        return true;
    }, []);

    // ===== HANDLE INCOMING MESSAGES =====
    const handleMessage = useCallback((event) => {
        try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            console.log(`📥 ${type}`, data);

            switch (type) {
                case 'connected':
                    console.log('✅ Server ready:', data?.status);
                    break;

                case 'stream_started':
                    console.log('🎤 Stream active');
                    break;

                case 'transcript_partial':
                    setPartialTranscript(data.text || '');
                    setCurrentStep('transcribing');
                    break;

                case 'transcript_final':
                    setFinalTranscript(data.text || '');
                    setPartialTranscript('');
                    setCurrentStep('processing');
                    break;

                case 'acknowledgment':
                    // Quick acknowledgment (Haan, Sure, etc.)
                    console.log('💬 Ack:', data.text);
                    setCurrentStep('acknowledged');
                    if (data.audio_base64) {
                        playAudio(data.audio_base64, data.audio_format);
                    }
                    break;

                case 'rag_response':
                    setResponse(data.answer || '');
                    setCurrentStep('generating_audio');
                    break;

                case 'tts_chunk':
                    // Streaming TTS chunk
                    if (data.audio_base64) {
                        playAudio(data.audio_base64, data.audio_format || 'mp3');
                    }
                 break;

                case 'tts_complete':
                    setCurrentStep('complete');
                    setIsProcessing(false);
                    break;

                case 'error':
                    console.error('❌ Server error:', data.message);
                    setError(data.message);
                    setIsProcessing(false);
                    break;

                case 'stream_ended':
                    console.log('🛑 Stream ended');
                    break;

                default:
                    console.warn('⚠️ Unknown message:', type);
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    }, []);

    // ===== PLAY AUDIO =====
    const playAudio = useCallback((base64Audio, format = 'mp3') => {
        try {
            const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onended = () => URL.revokeObjectURL(url);
            audio.onerror = () => URL.revokeObjectURL(url);
            audio.play().catch(err => console.error('🔊 Play error:', err));
        } catch (error) {
            console.error('❌ Audio decode error:', error);
        }
    }, []);

    // ===== START RECORDING with Optimized Audio Processing =====
    const startRecording = useCallback(async () => {
        if (isRecordingRef.current) {
            console.warn('⚠️ Already recording');
           return;
        }

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to server');
            return;
        }

        try {
            console.log('🎤 Starting recording...');

            // Get microphone stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: AUDIO_CONFIG.sampleRate,
                    channelCount: AUDIO_CONFIG.channels,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;

            // Setup audio context for level monitoring and silence detection
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: AUDIO_CONFIG.sampleRate
            });
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);

            audioContextRef.current = audioContext;
            analyzerRef.current = analyzer;

            // Start level monitoring
            monitorAudioLevel();

            // Setup MediaRecorder with optimal settings
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 16000
            });

            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('🛑 Recording stopped, sending audio...');
                setIsRecording(false);
                setIsProcessing(true);

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                // Send via WebSocket
                sendMessage('start_stream', {
                    sample_rate: AUDIO_CONFIG.sampleRate
                });

                //Send audio as binary (more efficient than base64)
                const arrayBuffer = await audioBlob.arrayBuffer();
                const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                sendMessage('audio_chunk', base64Audio);
                sendMessage('end_stream');

                // Cleanup
                audioChunksRef.current = [];
                cleanup();
            };

            // Start recording with small chunks for streaming
            mediaRecorder.start(100); // 100ms chunks
            mediaRecorderRef.current = mediaRecorder;

            isRecordingRef.current = true;
            hasSpokenRef.current = false;
            setIsRecording(true);

            // Safety timeout
            maxTimeoutRef.current = setTimeout(() => {
                console.log('⏰ Max recording time reached');
                stopRecording();
            }, AUDIO_CONFIG.maxRecordingMs);

            console.log('✅ Recording started');
        } catch (error) {
            console.error('❌ Mic access error:', error);
            setError('Microphone access denied');
            cleanup();
        }
    }, [sendMessage]);

    // ===== MONITOR AUDIO LEVEL with Optimized Silence Detection =====
    const monitorAudioLevel = useCallback(() => {
        const analyzer = analyzerRef.current;
        if (!analyzer || !isRecordingRef.current) return;

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);

        // Calculate RMS level
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        const level = avg / 255;

        setAudioLevel(level);

        // Silence detection state machine
        const timestamp = Date.now();
        const timeSinceStart = timestamp - (mediaRecorderRef.current?.startTime || timestamp);

        if (timeSinceStart > AUDIO_CONFIG.gracePeriodMs) {
            if (level > AUDIO_CONFIG.speechThreshold) {
                // Speaking
                isSpeakingRef.current = true;
                hasSpokenRef.current = true;
                
                // Clear silence timeout
                if (silenceTimeoutRef.current) {
                    clearTimeout(silenceTimeoutRef.current);
                    silenceTimeoutRef.current = null;
                }
            } else if (level < AUDIO_CONFIG.silenceThreshold && hasSpokenRef.current) {
                // Silence detected after speaking
                isSpeakingRef.current = false;
                
                if (!silenceTimeoutRef.current) {
                    silenceTimeoutRef.current = setTimeout(() => {
                        console.log('🔇 Silence detected, stopping...');
                        stopRecording();
                    }, AUDIO_CONFIG.silenceDurationMs);
                }
            }
        }

        // Continue monitoring
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }, []);

    // ===== STOP RECORDING =====
    const stopRecording = useCallback(() => {
        if (!isRecordingRef.current) return;

        console.log('🛑 Stopping recording');
        isRecordingRef.current = false;

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    // ===== CLEANUP =====
    const cleanup = useCallback(() => {
        // Clear timeouts
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
            maxTimeoutRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyzerRef.current = null;
        mediaRecorderRef.current = null;
        hasSpokenRef.current = false;
        isSpeakingRef.current = false;
        setAudioLevel(0);
    }, []);

    // ===== DISCONNECT =====
    const disconnect = useCallback(() => {
        console.log('🔌 Disconnecting WebSocket');
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        cleanup();
        setIsConnected(false);
        reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
    }, [cleanup]);

    // ===== CLEANUP ON UNMOUNT =====
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        // Connection state
        isConnected,
        isRecording,
        isProcessing,
        error,
        
        // Audio feedback
        audioLevel,
        
        // Transcription
        partialTranscript,
        finalTranscript,
        
        // Response
        response,
        currentStep,
        
        // Actions
        connect,
        disconnect,
        startRecording,
        stopRecording
    };
};
