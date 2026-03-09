import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, MessageSquare } from 'lucide-react';

/**
 * VoiceAgentModal - HTTP-based voice interface with auto-silence detection
 * 
 * Uses HTTP POST to /api/analytics/rag/voice-query (NOT WebSocket)
 * 
 * States:
 * - idle: Waiting for user to speak
 * - listening: User is speaking (mic animated)
 * - thinking: Processing query (no animation)  
 * - speaking: Agent responding (orb animated, captions shown)
 * 
 * Features:
 * - Auto-detects when user stops speaking (silence detection)
 * - Automatically starts processing after silence timeout
 * - HTTP-based backend communication
 */
const VoiceAgentModal = ({
    isOpen,
    onClose,
    backendUrl,
    category = null,
    onSessionEnd = null
}) => {
    // Voice states: idle, listening, thinking, speaking
    const [voiceState, setVoiceState] = useState('idle');
    const [currentCaption, setCurrentCaption] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [conversationState, setConversationState] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [showSummary, setShowSummary] = useState(false);

    // Refs
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyzerRef = useRef(null);
    const silenceTimeoutRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastSpeechTimeRef = useRef(Date.now());
    const isListeningRef = useRef(false);
    const hasPlayedGreetingRef = useRef(false);
    const conversationStateRef = useRef(null);
    const agentSpeakingRef = useRef(false);
    const idleTimeoutRef = useRef(null);
    const recordingStartTimeRef = useRef(null);

    // Silence detection settings
    const SILENCE_THRESHOLD = 15;
    const SILENCE_DURATION = 2000; // 2 seconds of silence to auto-stop
    const MIN_RECORDING_TIME = 800;
    const IDLE_TIMEOUT = 10000;
    const ACTION_IDLE_TIMEOUT = 30000;

    // Confirmation/cancellation keywords
    const CONFIRM_KEYWORDS = ['yes', 'yeah', 'yep', 'confirm', 'sure', 'ok', 'okay', 'do it', 'go ahead', 'create it', 'please', 'correct'];
    const CANCEL_KEYWORDS = ['no', 'nope', 'cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'dont', "don't", 'wait'];

    // Instant greeting detection
    const INSTANT_GREETINGS = {
        patterns: [
            'hi', 'hello', 'hey', 'hii', 'hiii', 'yo', 'sup',
            'good morning', 'good afternoon', 'good evening',
            'morning', 'afternoon', 'evening',
            'namaste', 'namaskar', 'pranam',
            'whats up', "what's up", 'wassup', 'whatsup'
        ],
        responses: [
            "Hello! How can I help you today?",
            "Hi there! What can I do for you?",
            "Hey! What would you like to know?",
            "Hello! Ready to assist you!",
            "Hi! What's on your mind?"
        ]
    };

    // Cleanup on unmount or close
    useEffect(() => {
        if (!isOpen) {
            stopRecording();
            stopAudio();
            setVoiceState('idle');
            setCurrentCaption('');
        }

        return () => {
            stopRecording();
            stopAudio();
            clearAllTimeouts();
        };
    }, [isOpen]);

    const clearAllTimeouts = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch (e) { }
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            } catch (e) { }
        }
    };

    const stopRecording = () => {
        console.log('🛑 stopRecording called');
        isListeningRef.current = false;

        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch (e) { }
            audioContextRef.current = null;
        }

        setAudioLevel(0);
    };

    // Monitor audio levels for silence detection
    const startAudioMonitoring = useCallback((stream) => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyzerRef.current);

            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
            recordingStartTimeRef.current = Date.now();
            lastSpeechTimeRef.current = Date.now();

            let hasDetectedSpeech = false;

            const checkAudioLevel = () => {
                if (!isListeningRef.current) return;

                analyzerRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                setAudioLevel(average);

                const now = Date.now();
                const recordingDuration = now - recordingStartTimeRef.current;

                if (recordingDuration > MIN_RECORDING_TIME) {
                    if (average > SILENCE_THRESHOLD) {
                        hasDetectedSpeech = true;
                        lastSpeechTimeRef.current = now;
                    } else if (hasDetectedSpeech) {
                        const silenceDuration = now - lastSpeechTimeRef.current;

                        if (silenceDuration > SILENCE_DURATION) {
                            console.log('🔇 Silence detected after speech, auto-stopping...');
                            isListeningRef.current = false;
                            stopListeningAndProcess();
                            return;
                        }
                    }
                }

                animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
            };

            checkAudioLevel();
        } catch (err) {
            console.error('Audio monitoring error:', err);
        }
    }, []);

    // Start listening
    const startListening = async () => {
        try {
            console.log('🎙️ startListening');
            setError(null);
            setVoiceState('listening');
            setCurrentCaption('Starting...');
            audioChunksRef.current = [];

            // Play greeting on first interaction
            if (!hasPlayedGreetingRef.current) {
                hasPlayedGreetingRef.current = true;
                await playGreeting();
            }

            // Get microphone permission
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

            // Set up MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    console.log(`📦 Chunk: ${(event.data.size / 1024).toFixed(1)}KB`);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('🛑 MediaRecorder stopped');
            };

            mediaRecorderRef.current = mediaRecorder;

            // Start recording
            isListeningRef.current = true;
            mediaRecorder.start(500); // Collect chunks every 500ms
            setCurrentCaption('');
            console.log('🎙️ Recording started');

            // Start audio level monitoring for silence detection
            startAudioMonitoring(stream);

        } catch (err) {
            console.error('startListening error:', err);
            setError(err.message || 'Could not access microphone');
            setVoiceState('idle');
            setCurrentCaption('');
        }
    };

    // Stop listening and process audio via HTTP
    const stopListeningAndProcess = async () => {
        console.log('🛑 stopListeningAndProcess');

        stopRecording();

        if (audioChunksRef.current.length === 0) {
            console.log('No audio chunks captured');
            setVoiceState('idle');
            return;
        }

        setVoiceState('thinking');
        setCurrentCaption('Processing...');

        try {
            // Create audio blob
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log(`📤 Sending ${(audioBlob.size / 1024).toFixed(1)}KB audio to HTTP endpoint`);

            // Send via HTTP POST
            const formData = new FormData();
            formData.append('audio', new File([audioBlob], 'voice.webm', { type: 'audio/webm' }));
            if (category) {
                formData.append('category', category);
            }
            if (conversationStateRef.current) {
                formData.append('conversation_state', JSON.stringify(conversationStateRef.current));
            }

            const response = await fetch(`${backendUrl}/api/analytics/rag/voice-query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();
            console.log('📥 Response:', data);

            if (!data.success) {
                throw new Error(data.error || 'Voice query failed');
            }

            const transcribedText = data.question || '';

            if (!transcribedText.trim()) {
                await speakMessage("I didn't catch that. Could you repeat?");
                return;
            }

            // Check for instant greetings (frontend-side)
            const instantGreeting = detectInstantGreeting(transcribedText);
            if (instantGreeting) {
                console.log('⚡ Instant greeting detected');
                setCurrentCaption(`"${transcribedText}"`);
                await new Promise(resolve => setTimeout(resolve, 800));
                await speakMessage(instantGreeting);
                addToHistory(transcribedText, instantGreeting, false);
                return;
            }

            // Handle action confirmation
            if (pendingAction && pendingAction.ready_to_execute) {
                const confirmation = detectConfirmation(transcribedText);
                if (confirmation === 'confirm') {
                    const result = await executeAction(pendingAction.action_params);
                    setPendingAction(null);
                    setConversationState(null);
                    conversationStateRef.current = null;
                    if (result.success) {
                        await speakMessage("Done! Task has been created successfully.");
                    } else {
                        await speakMessage(`Sorry, ${result.message}. Please try again.`);
                    }
                    return;
                } else if (confirmation === 'cancel') {
                    setPendingAction(null);
                    setConversationState(null);
                    conversationStateRef.current = null;
                    await speakMessage("Alright, cancelled. What else can I help with?");
                    return;
                }
            }

            // Update conversation state
            if (data.is_action && data.conversation_state) {
                setConversationState(data.conversation_state);
                conversationStateRef.current = data.conversation_state;

                if (data.conversation_state.ready_to_execute && data.action_params) {
                    setPendingAction({
                        ready_to_execute: true,
                        action_params: data.action_params,
                        action_type: data.action_type
                    });
                } else {
                    setPendingAction({
                        ready_to_execute: false,
                        step: data.conversation_state.step,
                        collected_params: data.conversation_state.collected_params
                    });
                }
            } else if (!data.is_action && pendingAction) {
                setPendingAction(null);
                setConversationState(null);
                conversationStateRef.current = null;
            }

            // Show user's question briefly
            setCurrentCaption(`"${transcribedText}"`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Add to history
            addToHistory(transcribedText, data.answer, data.is_action);

            // Play response
            if (data.audio_base64) {
                await playAudioWithCaptions(data.audio_base64, data.audio_mime_type || 'audio/mp3', data.answer);
            } else {
                setCurrentCaption(data.answer);
                setVoiceState('speaking');
                await new Promise(resolve => setTimeout(resolve, 3000));
                setVoiceState('idle');
                setCurrentCaption('');
                setTimeout(() => startListening(), 1000);
            }

        } catch (err) {
            console.error('Voice query error:', err);
            setError(err.message);
            await speakMessage("I'm having trouble processing that. Please try again.");
        }
    };

    const addToHistory = (user, assistant, isAction) => {
        setConversationHistory(prev => [...prev, {
            user,
            assistant,
            timestamp: new Date().toISOString(),
            isAction
        }]);
    };

    const detectInstantGreeting = (text) => {
        const textLower = text.toLowerCase().trim();
        const textClean = textLower.replace(/[?!.,;:]/g, '').trim();
        const wordCount = textClean.split(/\s+/).length;
        if (wordCount > 5) return null;

        for (const pattern of INSTANT_GREETINGS.patterns) {
            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            if (regex.test(textClean)) {
                const responses = INSTANT_GREETINGS.responses;
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
        return null;
    };

    const detectConfirmation = (text) => {
        const textLower = text.toLowerCase().trim();
        const isConfirm = CONFIRM_KEYWORDS.some(kw => textLower.includes(kw));
        const isCancel = CANCEL_KEYWORDS.some(kw => textLower.includes(kw));
        if (isCancel) return 'cancel';
        if (isConfirm) return 'confirm';
        return null;
    };

    const executeAction = async (actionParams) => {
        try {
            const taskPayload = {
                title: actionParams.title,
                description: actionParams.description,
                assignedToId: actionParams.assignee_id || actionParams.assignedToId,
                deadline: actionParams.deadline_iso || actionParams.deadline,
                priority: actionParams.priority || 'high',
                points: actionParams.points || 3,
                source: 'cofounder_rag',
                requiresOverride: actionParams.requires_override || false
            };

            if (!actionParams.skip_project && actionParams.project_id) {
                taskPayload.projectId = actionParams.project_id;
            }

            const response = await fetch(`${backendUrl}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskPayload)
            });

            const result = await response.json();

            if (result.success || result._id) {
                return { success: true, message: 'Task created' };
            } else {
                return { success: false, message: result.message || result.error || 'Failed' };
            }
        } catch (err) {
            return { success: false, message: 'Error connecting to server' };
        }
    };

    const playGreeting = async () => {
        try {
            const greetings = ["I'm listening.", "Go ahead.", "Yes, I'm here."];
            const greeting = greetings[Math.floor(Math.random() * greetings.length)];

            const response = await fetch(`${backendUrl}/api/analytics/rag/text-to-speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: greeting })
            });

            const data = await response.json();

            if (data.success && data.audio_base64) {
                await playAudio(data.audio_base64, data.mime_type || 'audio/mp3', greeting, false);
            }
        } catch (err) {
            console.error('Greeting error:', err);
        }
    };

    const speakMessage = async (text) => {
        try {
            const response = await fetch(`${backendUrl}/api/analytics/rag/text-to-speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            if (data.success && data.audio_base64) {
                await playAudioWithCaptions(data.audio_base64, data.mime_type || 'audio/mp3', text);
            } else {
                setCurrentCaption(text);
                setVoiceState('speaking');
                await new Promise(resolve => setTimeout(resolve, 2000));
                setVoiceState('idle');
                setCurrentCaption('');
                setTimeout(() => startListening(), 1000);
            }
        } catch (err) {
            setCurrentCaption(text);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setCurrentCaption('');
            setTimeout(() => startListening(), 1000);
        }
    };

    const playAudio = (base64, mimeType, caption, updateState = true) => {
        return new Promise((resolve) => {
            try {
                const audioData = atob(base64);
                const audioArray = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    audioArray[i] = audioData.charCodeAt(i);
                }
                const blob = new Blob([audioArray], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                if (updateState) {
                    setVoiceState('speaking');
                    setCurrentCaption(caption);
                }

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    if (updateState) {
                        setCurrentCaption('');
                        setVoiceState('idle');
                    }
                    resolve();
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };

                audio.play().catch(() => resolve());
            } catch (err) {
                resolve();
            }
        });
    };

    const playAudioWithCaptions = (base64, mimeType, fullText, isLastChunk = true) => {
        return new Promise((resolve) => {
            try {
                stopAudio();
                agentSpeakingRef.current = true;

                const audioData = atob(base64);
                const audioArray = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    audioArray[i] = audioData.charCodeAt(i);
                }
                const blob = new Blob([audioArray], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                const sentences = fullText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [fullText];
                const wordCount = fullText.split(/\s+/).length;
                const estimatedDuration = Math.max(2, (wordCount / 150) * 60);
                const intervalTime = (estimatedDuration * 1000) / sentences.length;

                let sentenceIndex = 0;
                let captionInterval;

                setVoiceState('speaking');

                if (sentences.length > 0) {
                    setCurrentCaption(sentences[0].trim());
                    sentenceIndex = 1;
                }

                audio.onplay = () => {
                    captionInterval = setInterval(() => {
                        if (sentenceIndex < sentences.length) {
                            setCurrentCaption(sentences[sentenceIndex].trim());
                            sentenceIndex++;
                        }
                    }, intervalTime);
                };

                audio.onended = () => {
                    clearInterval(captionInterval);
                    URL.revokeObjectURL(url);

                    setTimeout(() => {
                        agentSpeakingRef.current = false;
                    }, 300);

                    if (isLastChunk) {
                        setTimeout(() => {
                            setCurrentCaption('');
                            setVoiceState('idle');
                            // Auto-restart listening with delay (prevents echo)
                            setTimeout(() => startListening(), 1500);
                            resolve();
                        }, 1000);
                    } else {
                        resolve();
                    }
                };

                audio.onerror = () => {
                    clearInterval(captionInterval);
                    URL.revokeObjectURL(url);
                    setCurrentCaption('');
                    setVoiceState('idle');
                    agentSpeakingRef.current = false;
                    resolve();
                };

                audio.play().catch(() => {
                    setCurrentCaption(fullText);
                    agentSpeakingRef.current = false;
                    setTimeout(() => {
                        setCurrentCaption('');
                        setVoiceState('idle');
                        resolve();
                    }, 3000);
                });
            } catch (error) {
                agentSpeakingRef.current = false;
                setVoiceState('idle');
                resolve();
            }
        });
    };

    const toggleListening = () => {
        if (voiceState === 'speaking') {
            stopAudio();
            setTimeout(() => startListening(), 100);
            return;
        }

        if (voiceState === 'listening') {
            stopListeningAndProcess();
        } else if (voiceState === 'idle') {
            startListening();
        }
    };

    const handleClose = () => {
        stopRecording();
        stopAudio();
        clearAllTimeouts();

        if (onSessionEnd && conversationHistory.length > 0) {
            onSessionEnd(conversationHistory);
        }

        setConversationHistory([]);
        setVoiceState('idle');
        setCurrentCaption('');
        setConversationState(null);
        setPendingAction(null);
        setError(null);
        setAudioLevel(0);
        audioChunksRef.current = [];
        hasPlayedGreetingRef.current = false;
        conversationStateRef.current = null;
        agentSpeakingRef.current = false;
        isListeningRef.current = false;

        onClose();
    };

    if (!isOpen) return null;

    const ringScale = 1 + (audioLevel / 100) * 0.5;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Close button */}
            <button
                onClick={handleClose}
                className="fixed top-8 right-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all duration-200"
                aria-label="Close voice modal"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Modal */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Summary toggle */}
                {conversationHistory.length > 0 && (
                    <button
                        onClick={() => setShowSummary(!showSummary)}
                        className="fixed top-8 left-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all duration-200 flex items-center gap-2"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">{conversationHistory.length}</span>
                    </button>
                )}

                {/* Summary panel */}
                {showSummary && (
                    <div className="absolute top-16 right-[calc(50%+100px)] w-80 max-h-96 overflow-y-auto bg-white/10 backdrop-blur-md rounded-xl p-4 text-white text-sm">
                        <h3 className="font-semibold mb-3">Conversation Summary</h3>
                        {conversationHistory.map((exchange, idx) => (
                            <div key={idx} className="mb-4 pb-3 border-b border-white/10 last:border-0">
                                <p className="text-blue-300 mb-1">You: {exchange.user}</p>
                                <p className="text-gray-300">AI: {exchange.assistant}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main orb/button with audio level visualization */}
                <div className="relative mb-8">
                    {/* Audio level responsive rings */}
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

                    {/* Animated rings for speaking state */}
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
                                        : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50'
                            }
                            ${voiceState === 'thinking' ? 'cursor-wait' : 'cursor-pointer'}
                        `}
                    >
                        {voiceState === 'listening' ? (
                            <Mic className="w-12 h-12 text-white" />
                        ) : voiceState === 'thinking' ? (
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        ) : voiceState === 'speaking' ? (
                            <Volume2 className="w-12 h-12 text-white animate-pulse" />
                        ) : (
                            <Mic className="w-12 h-12 text-white/80" />
                        )}
                    </button>
                </div>

                {/* State label */}
                <div className="flex flex-col items-center gap-2 mb-4">
                    <p className={`text-lg font-medium transition-all duration-300 ${voiceState === 'listening' ? 'text-blue-400' :
                        voiceState === 'thinking' ? 'text-yellow-400' :
                            voiceState === 'speaking' ? 'text-purple-400' :
                                pendingAction ? 'text-orange-400' :
                                    'text-gray-400'
                        }`}>
                        {voiceState === 'idle' && (pendingAction ? 'Creating task...' : 'Tap to speak')}
                        {voiceState === 'listening' && 'Listening...'}
                        {voiceState === 'thinking' && 'Processing...'}
                        {voiceState === 'speaking' && ''}
                    </p>

                    {/* Audio level meter */}
                    {voiceState === 'listening' && (
                        <div className="flex items-center gap-1">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 h-${i + 2} rounded-full transition-all duration-100 ${audioLevel > (i * 10) ? 'bg-blue-400' : 'bg-gray-600'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Caption display */}
                <div className="h-24 w-96 flex items-center justify-center">
                    <p className={`
                        text-center text-white text-lg px-6 py-3 rounded-xl
                        transition-all duration-500 ease-out
                        ${currentCaption
                            ? 'opacity-100 transform translate-y-0 bg-white/10 backdrop-blur-sm'
                            : 'opacity-0 transform translate-y-4'
                        }
                    `}>
                        {currentCaption}
                    </p>
                </div>

                {/* Error display */}
                {error && (
                    <div className="flex flex-col items-center gap-2 mt-4 max-w-md">
                        <div className="flex items-center gap-2 text-red-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                            💡 Tip: Speak clearly and wait for "Listening..." before talking
                        </p>
                    </div>
                )}

                {/* End Call button */}
                <button
                    onClick={handleClose}
                    className="mt-6 px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-full font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-red-500/30"
                >
                    <X className="w-5 h-5" />
                    End Call
                </button>

                {/* Hint */}
                <p className="text-gray-500 text-sm mt-8">
                    {voiceState === 'idle' ? 'Press ESC to close' : ''}
                </p>
            </div>
        </div>
    );
};

export default VoiceAgentModal;
