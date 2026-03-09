/**
 * Voice Agent Modal using Socket.IO
 * 
 * Uses Flask-SocketIO backend for voice pipeline (STT → RAG → TTS)
 * ChatGPT-style voice interface with real-time streaming
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Mic, Volume2, Wifi, WifiOff } from 'lucide-react';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';

const WebSocketVoiceModal = ({
    isOpen,
    onClose,
    category = null,
    onSessionEnd = null
}) => {
    // Use Socket.IO based voice agent hook (matches Flask-SocketIO backend)
    const {
        isConnected,
        isRecording,
        isProcessing,
        audioLevel,
        transcription: partialTranscript,
        answer: response,
        currentStep,
        error: wsError,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        playAudio,
        audioData
    } = useVoiceAgent();

    // Derive finalTranscript from transcription when processing is done
    const finalTranscript = currentStep === 'complete' ? partialTranscript : '';

    // Voice states: idle, listening, thinking, speaking
    const [voiceState, setVoiceState] = useState('idle');
    const [displayText, setDisplayText] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);

    // Update voice state based on hook state
    useEffect(() => {
        if (isRecording) {
            setVoiceState('listening');
        } else if (isProcessing) {
            setVoiceState('thinking');
        } else if (currentStep === 'speaking' || currentStep === 'acknowledged') {
            setVoiceState('speaking');
        } else {
            setVoiceState('idle');
        }
    }, [isRecording, isProcessing, currentStep]);

    // Update display text - show response text when speaking/complete
    useEffect(() => {
        // When speaking or complete, prioritize showing the response
        if ((voiceState === 'speaking' || currentStep === 'complete') && response) {
            setDisplayText(response);
        } else if (voiceState === 'thinking') {
            setDisplayText('Processing...');
        } else if (voiceState === 'listening' && partialTranscript) {
            setDisplayText(`🎤 "${partialTranscript}"`);
        } else if (voiceState === 'listening') {
            setDisplayText('Listening...');
        } else if (voiceState === 'idle') {
            setDisplayText('');
        }
    }, [partialTranscript, response, voiceState, currentStep]);

    // Add to conversation history when response completes
    useEffect(() => {
        if (partialTranscript && response && currentStep === 'complete') {
            setConversationHistory(prev => [...prev, {
                user: partialTranscript,
                assistant: response,
                timestamp: new Date().toISOString()
            }]);
        }
    }, [partialTranscript, response, currentStep]);

    // Play audio when pipeline completes - use ref to prevent double-play
    const audioPlayedRef = React.useRef(false);

    useEffect(() => {
        // Reset the flag when we start processing
        if (isProcessing) {
            audioPlayedRef.current = false;
        }
    }, [isProcessing]);

    useEffect(() => {
        if (currentStep === 'complete' && audioData && !audioPlayedRef.current) {
            audioPlayedRef.current = true;
            console.log('🔊 Playing TTS audio response...', audioData);
            setVoiceState('speaking');

            try {
                const audio = playAudio();
                if (audio) {
                    // Override onended to reset state
                    audio.onended = () => {
                        console.log('🔊 Audio playback ended');
                        setVoiceState('idle');
                    };
                    audio.onerror = (e) => {
                        console.error('🔊 Audio error:', e);
                        setVoiceState('idle');
                    };
                } else {
                    console.error('🔊 playAudio returned null');
                    // Fallback: still transition to idle after a delay
                    setTimeout(() => setVoiceState('idle'), 3000);
                }
            } catch (err) {
                console.error('🔊 Audio playback error:', err);
                setVoiceState('idle');
            }
        }
    }, [currentStep, audioData, playAudio]);

    // Connect on modal open
    useEffect(() => {
        if (isOpen && !isConnected) {
            console.log('📡 Connecting WebSocket...');
            connect().catch(err => console.error('Connection failed:', err));
        }

        return () => {
            if (!isOpen && isConnected) {
                disconnect();
            }
        };
    }, [isOpen, isConnected, connect, disconnect]);

    // Toggle recording - uses hook's isRecording directly, not voiceState
    const toggleRecording = useCallback(() => {
        console.log('🔘 Toggle clicked - isRecording:', isRecording, 'isConnected:', isConnected, 'voiceState:', voiceState);
        if (isRecording) {
            console.log('🔴 Stopping recording...');
            stopRecording(category);
        } else if (isConnected && !isProcessing) {
            console.log('🟢 Starting recording...');
            startRecording();
        } else {
            console.log('⚠️ Cannot toggle - connected:', isConnected, 'processing:', isProcessing);
        }
    }, [isRecording, isConnected, isProcessing, startRecording, stopRecording, category, voiceState]);

    // Handle close
    const handleClose = useCallback(() => {
        if (isRecording) {
            stopRecording(category);
        }
        disconnect();
        setVoiceState('idle');
        setDisplayText('');

        if (onSessionEnd && conversationHistory.length > 0) {
            onSessionEnd({ history: conversationHistory });
        }

        onClose?.();
    }, [isRecording, stopRecording, disconnect, conversationHistory, onSessionEnd, onClose]);

    // Calculate visualization
    const ringScale = 1 + (audioLevel * 0.5);

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
            <div className="fixed top-8 left-8 z-50 flex items-center gap-2">
                {isConnected ? (
                    <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-white/60">Connected</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-white/60">Connecting...</span>
                    </>
                )}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Orb with audio visualization */}
                <div className="relative mb-8">
                    {/* Audio level rings - listening state */}
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
                            <div
                                className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20"
                                style={{ transform: 'scale(1.5)' }}
                            />
                            <div
                                className="absolute inset-0 rounded-full bg-purple-400 animate-pulse opacity-30"
                                style={{ transform: 'scale(1.3)' }}
                            />
                        </>
                    )}

                    {/* Main button */}
                    <button
                        onClick={toggleRecording}
                        disabled={voiceState === 'thinking' || !isConnected}
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
                            ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
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
                    {!isConnected && 'Connecting...'}
                    {isConnected && voiceState === 'idle' && 'Tap to speak'}
                    {voiceState === 'listening' && 'Listening...'}
                    {voiceState === 'thinking' && 'Processing...'}
                    {voiceState === 'speaking' && 'Speaking...'}
                </div>

                {/* Display text */}
                {displayText && (
                    <div className="max-w-md text-center px-4">
                        <p className="text-white text-xl font-medium leading-relaxed">
                            {displayText}
                        </p>
                    </div>
                )}

                {/* Error display */}
                {wsError && (
                    <div className="mt-4 text-red-400 text-sm">
                        {wsError}
                    </div>
                )}

                {/* Conversation count */}
                {conversationHistory.length > 0 && (
                    <div className="mt-6 text-white/40 text-xs">
                        {conversationHistory.length} exchange{conversationHistory.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebSocketVoiceModal;
