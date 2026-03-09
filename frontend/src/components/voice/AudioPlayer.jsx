import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

const AudioPlayer = ({ audioBase64, mimeType = 'audio/mp3', autoPlay = false, compact = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);
    const [audioUrl, setAudioUrl] = useState(null);

    useEffect(() => {
        if (audioBase64) {
            try {
                const audioData = atob(audioBase64);
                const audioArray = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    audioArray[i] = audioData.charCodeAt(i);
                }
                const blob = new Blob([audioArray], { type: mimeType });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                return () => {
                    URL.revokeObjectURL(url);
                };
            } catch (error) {
                console.error('Error creating audio URL:', error);
            }
        }
    }, [audioBase64, mimeType]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (audioRef.current.paused) {
            audioRef.current.play().catch(err => console.error('Audio playback failed:', err));
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        if (duration) {
            setProgress((current / duration) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const restart = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error('Audio playback failed:', err));
        setIsPlaying(true);
    };

    if (!audioUrl) return null;

    return (
        <div className={`flex items-center gap-3 ${compact ? 'py-1' : 'py-2 px-4 bg-white/5 rounded-xl border border-white/10 shadow-sm'}`}>
            <audio
                ref={audioRef}
                src={audioUrl}
                autoPlay={autoPlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg active:scale-95"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
            </button>

            <div className="flex-1 h-1.5 bg-gray-200/20 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    if (audioRef.current) {
                        audioRef.current.currentTime = percentage * audioRef.current.duration;
                    }
                }}>
                <div
                    className="h-full bg-blue-500 transition-all duration-100 relative"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                </div>
            </div>

            <button
                onClick={restart}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Restart"
            >
                <RotateCcw size={14} />
            </button>

            {!compact && <Volume2 size={14} className="text-gray-400" />}
        </div>
    );
};

export default AudioPlayer;
