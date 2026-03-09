/**
 * Native WebSocket Voice Streaming Hook
 * Replaces Socket.IO with pure WebSocket implementation
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export const useVoiceStream = (options = {}) => {
    const {
        url = 'http://localhost:5002',
        onPartialTranscript = () => {},
        onFinalTranscript = () => {},
        onInstantResponse = () => {},
        onTTSChunk = () => {},
        onError = () => {}
    } = options;

    const wsRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [partialText, setPartialText] = useState('');

    // WebSocket URL (ws:// not http://)
    const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/voice';

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('✅ WebSocket already connected');
            return;
        }

        console.log('🔌 Connecting to WebSocket:', wsUrl);

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                onError('WebSocket connection failed. Please use regular voice agent.');
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket closed');
                setIsConnected(false);
                setIsStreaming(false);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            onError('Failed to establish WebSocket connection. Please use regular voice mode.');
        }
    }, [wsUrl, onError]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            console.log('🔌 Disconnecting WebSocket');
            wsRef.current.close();
            wsRef.current = null;
            setIsConnected(false);
            setIsStreaming(false);
        }
    }, []);

    const sendMessage = useCallback((type, data = null) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        const message = { type, data };
        wsRef.current.send(JSON.stringify(message));
        return true;
    }, []);

    const handleMessage = useCallback((message) => {
        const { type, data } = message;

        console.log(`📥 Received: ${type}`, data);

        switch (type) {
            case 'connected':
                console.log('✅ Server confirmed connection');
                break;

            case 'stream_started':
                setIsStreaming(true);
                console.log('🎤 Stream started');
                break;

            case 'transcript_partial':
                setPartialText(data.text || '');
                onPartialTranscript(data);
                break;

            case 'transcript_final':
                onFinalTranscript(data);
                setPartialText('');
                break;

            case 'tts_chunk':
                onTTSChunk(data);
                break;

            case 'tts_complete':
                console.log('✅ TTS complete');
                break;

            case 'stream_ended':
                setIsStreaming(false);
                console.log('🛑 Stream ended');
                break;

            case 'error':
                console.error('❌ Server error:', data.message);
                onError(new Error(data.message));
                break;

            default:
                console.warn('⚠️ Unknown message type:', type);
        }
    }, [onPartialTranscript, onFinalTranscript, onTTSChunk, onError]);

    const startStreaming = useCallback(async (opts = {}) => {
        const { sampleRate = 16000, category = null, use_hf = true } = opts;

        console.log('🎤 Starting voice stream');

        return sendMessage('start_stream', {
            sample_rate: sampleRate,
            category,
            use_hf
        });
    }, [sendMessage]);

    const sendAudioChunk = useCallback((audioData) => {
        // Convert audio data to base64
        const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(audioData))
        );

        return sendMessage('audio_chunk', base64Audio);
    }, [sendMessage]);

    const endStreaming = useCallback(() => {
        console.log('🛑 Ending voice stream');
        return sendMessage('end_stream');
    }, [sendMessage]);

    const generateTTS = useCallback((text, streaming = true) => {
        console.log('🔊 Generating TTS:', text.substring(0, 50));
        return sendMessage('generate_tts', { text, streaming });
    }, [sendMessage]);

    // Manual connection - components should call connect() explicitly
    // Removed auto-connect to prevent infinite reconnection loops

    return {
        isConnected,
        isStreaming,
        partialText,
        connect,
        disconnect,
        startStreaming,
        sendAudioChunk,
        endStreaming,
        generateTTS
    };
};
