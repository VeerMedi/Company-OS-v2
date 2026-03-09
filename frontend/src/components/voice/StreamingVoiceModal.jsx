/**
 * StreamingVoiceModal - Enhanced voice interface with real-time streaming
 * 
 * Features:
 * - Instant greeting detection via WebSocket streaming (~2-3s response)
 * - Real-time partial transcription display
 * - Chunked TTS audio playback (hear response while LLM thinks)
 * - Fallback to legacy mode if WebSocket unavailable
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { useVoiceStream } from '../../hooks/useVoiceStream';

const StreamingVoiceModal = ({
    isOpen,
    onClose,
    backendUrl = 'http://localhost:5002',
    category = null,
    onSessionEnd = null
}) => {
    // Voice states: idle, listening, thinking, speaking
    const [voiceState, setVoiceState] = useState('idle');
    const [currentCaption, setCurrentCaption] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);

    // Streaming refs
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyzerRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Use the voice streaming hook
    const {
        isConnected,
        isStreaming,
        partialText,
        connect,
        disconnect,
        startStreaming,
        sendAudioChunk,
        endStreaming,
        generateTTS
    } = useVoiceStream({
        url: backendUrl,
        onPartialTranscript: (data) => {
            setCurrentCaption(data.text || '');
        },
        onFinalTranscript: (data) => {
            console.log('Final transcript:', data.text);
            if (data.text) {
                processTranscript(data.text);
            }
        },
        onInstantResponse: (data) => {
            console.log('⚡ Instant response received:', data.text);
            setVoiceState('speaking');
            setCurrentCaption(data.text);

            // Add to history
            setConversationHistory(prev => [...prev, {
                user: partialText || 'Hello',
                assistant: data.text,
                timestamp: new Date().toISOString(),
                instantResponse: true
            }]);

            // Return to idle after response plays
            setTimeout(() => {
                setVoiceState('idle');
                setCurrentCaption('');
            }, 3000);
        },
        onTTSChunk: (data) => {
            if (data.is_first) {
                setVoiceState('speaking');
            }
            setCurrentCaption(data.text);
        },
        onError: (message) => {
            setError(message);
            setVoiceState('idle');
        },
        onConnected: () => {
            console.log('✅ Voice streaming connected');
        },
        onDisconnected: () => {
            console.log('🔌 Voice streaming disconnected');
        }
    });

    // Store connect/disconnect in refs to avoid dependency issues
    const connectRef = useRef(connect);
    const disconnectRef = useRef(disconnect);

    useEffect(() => {
        connectRef.current = connect;
        disconnectRef.current = disconnect;
    }, [connect, disconnect]);

    // Connect when modal opens
    useEffect(() => {
        if (isOpen && !isConnected) {
            console.log('📡 Modal opened - connecting to WebSocket');
            connectRef.current();
        } else if (!isOpen && isConnected) {
            console.log('🔌 Modal closed - disconnecting from WebSocket');
            disconnectRef.current();
            stopRecording();
        }

        return () => {
            stopRecording();
        };
    }, [isOpen, isConnected]); // Only depend on isOpen and isConnected state

    // Start listening
    const startListening = useCallback(async () => {
        setVoiceState('listening');
        setError(null);

        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            streamRef.current = stream;

            // Setup audio context for level visualization
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;
            source.connect(analyzerRef.current);

            // Start audio level animation
            const updateLevel = () => {
                if (!analyzerRef.current) return;

                const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
                analyzerRef.current.getByteFrequencyData(data);

                const average = data.reduce((a, b) => a + b, 0) / data.length;
                setAudioLevel(average);

                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();

            // Start WebSocket streaming
            if (isConnected) {
                await startStreaming({ category });

                // Create MediaRecorder to capture chunks
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm'
                });
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0) {
                        // Convert blob to array buffer
                        const buffer = await event.data.arrayBuffer();
                        sendAudioChunk(buffer, 16000);
                    }
                };

                // Send chunks every 500ms
                mediaRecorder.start(500);
            }

        } catch (err) {
            console.error('Failed to start listening:', err);
            setError('Could not access microphone');
            setVoiceState('idle');
        }
    }, [isConnected, startStreaming, sendAudioChunk, category]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setAudioLevel(0);
    }, []);

    // Stop listening and process
    const stopListening = useCallback(() => {
        stopRecording();

        if (isConnected && isStreaming) {
            setVoiceState('thinking');
            endStreaming();
        } else {
            setVoiceState('idle');
        }
    }, [stopRecording, isConnected, isStreaming, endStreaming]);

    // Process transcript (for non-greeting queries)
    const processTranscript = useCallback(async (text) => {
        if (!text.trim()) {
            setVoiceState('idle');
            return;
        }

        setVoiceState('thinking');
        setCurrentCaption('Processing...');

        try {
            // Send to regular voice-query endpoint
            const formData = new FormData();
            // For now, use the backend processing
            // In future, could stream LLM response via WebSocket too

            const response = await fetch(`${backendUrl}/api/analytics/rag/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    category,
                    is_voice: true
                })
            });

            const data = await response.json();

            if (data.success && data.answer) {
                // Generate TTS via WebSocket for streaming playback
                if (isConnected) {
                    generateTTS(data.answer, true);
                }

                // Add to history
                setConversationHistory(prev => [...prev, {
                    user: text,
                    assistant: data.answer,
                    timestamp: new Date().toISOString()
                }]);
            } else {
                setError('Failed to get response');
            }

        } catch (err) {
            console.error('Query failed:', err);
            setError('Query failed');
        }

        setVoiceState('idle');
    }, [backendUrl, category, isConnected, generateTTS]);

    // Toggle listening state
    const toggleListening = useCallback(() => {
        if (voiceState === 'listening') {
            stopListening();
        } else if (voiceState === 'idle') {
            startListening();
        }
    }, [voiceState, startListening, stopListening]);

    // Handle close
    const handleClose = useCallback(() => {
        stopRecording();
        disconnect();
        setVoiceState('idle');
        setCurrentCaption('');
        setError(null);
        onClose?.();
    }, [stopRecording, disconnect, onClose]);

    // Calculate ring scale for visualization
    const ringScale = 1 + (audioLevel / 100) * 0.5;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Close button */}
            <button
                onClick={handleClose}
                className="fixed top-8 right-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all"
                aria-label="Close"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Connection status */}
            <div className="fixed top-8 left-8 z-50 flex items-center gap-2 text-white/60">
                {isConnected ? (
                    <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-xs">Streaming</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs">Connecting...</span>
                    </>
                )}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Orb with audio visualization */}
                <div className="relative mb-8">
                    {/* Audio level rings */}
                    {voiceState === 'listening' && (
                        <>
                            <div
                                className="absolute inset-0 rounded-full bg-blue-500 opacity-20 transition-transform duration-100"
                                style={{ transform: `scale(${ringScale + 0.5})` }}
                            />
                            <div
                                className="absolute inset-0 rounded-full bg-blue-400 opacity-30 transition-transform duration-100"
                                style={{ transform: `scale(${ringScale + 0.3})` }}
                            />
                            <div
                                className="absolute inset-0 rounded-full bg-blue-300 opacity-40 transition-transform duration-100"
                                style={{ transform: `scale(${ringScale})` }}
                            />
                        </>
                    )}

                    {/* Speaking animation */}
                    {voiceState === 'speaking' && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20"
                                style={{ transform: 'scale(1.5)' }}
                            />
                            <div className="absolute inset-0 rounded-full bg-purple-400 animate-pulse opacity-30"
                                style={{ transform: 'scale(1.3)' }}
                            />
                        </>
                    )}

                    {/* Main button */}
                    <button
                        onClick={toggleListening}
                        disabled={voiceState === 'thinking'}
                        className={`
                            relative w-32 h-32 rounded-full flex items-center justify-center
                            transition-all duration-500 ease-out
                            ${voiceState === 'idle'
                                ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                                : voiceState === 'listening'
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/50'
                                    : voiceState === 'thinking'
                                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600 animate-pulse'
                                        : 'bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/50'
                            }
                        `}
                    >
                        {voiceState === 'listening' || voiceState === 'idle' ? (
                            <Mic className={`w-12 h-12 text-white ${voiceState === 'listening' ? 'animate-pulse' : ''}`} />
                        ) : voiceState === 'speaking' ? (
                            <Volume2 className="w-12 h-12 text-white animate-pulse" />
                        ) : (
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                    </button>
                </div>

                {/* Status text */}
                <div className="text-white/70 text-lg mb-4">
                    {voiceState === 'idle' && 'Tap to speak'}
                    {voiceState === 'listening' && 'Listening...'}
                    {voiceState === 'thinking' && 'Thinking...'}
                    {voiceState === 'speaking' && 'Speaking...'}
                </div>

                {/* Caption/transcript display */}
                {(currentCaption || partialText) && (
                    <div className="max-w-md text-center">
                        <p className="text-white text-xl font-medium leading-relaxed">
                            {currentCaption || partialText}
                        </p>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="mt-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreamingVoiceModal;
