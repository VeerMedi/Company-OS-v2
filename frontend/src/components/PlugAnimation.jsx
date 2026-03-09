import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PlugAnimation = ({ onComplete }) => {
    const [isPlugged, setIsPlugged] = useState(false);
    const [showSparks, setShowSparks] = useState(false);
    const [bulbGlowing, setBulbGlowing] = useState(false);
    const [isNearSocket, setIsNearSocket] = useState(false);

    const handlePlugDrop = (event, info) => {
        // Get socket position (center of screen)
        const socketElement = document.getElementById('power-socket');
        if (!socketElement) return;

        const socketRect = socketElement.getBoundingClientRect();
        const socketCenter = {
            x: socketRect.left + socketRect.width / 2,
            y: socketRect.top + socketRect.height / 2
        };

        // Get plug drop position
        const plugPosition = {
            x: info.point.x,
            y: info.point.y
        };

        // Calculate distance
        const distance = Math.sqrt(
            Math.pow(plugPosition.x - socketCenter.x, 2) +
            Math.pow(plugPosition.y - socketCenter.y, 2)
        );

        // Only connect if within 100px of socket
        if (distance < 100) {
            // Plug connected!
            setIsPlugged(true);
            setShowSparks(true);

            // Spark animation duration
            setTimeout(() => setShowSparks(false), 800);

            // Bulb glow
            setTimeout(() => setBulbGlowing(true), 500);

            // Transition to login after animation
            setTimeout(() => {
                onComplete && onComplete();
            }, 3000);
        }
        setIsNearSocket(false); // Reset near state after drop
    };

    const handlePlugDrag = (event, info) => {
        // Visual feedback when near socket
        const socketElement = document.getElementById('power-socket');
        if (!socketElement) return;

        const socketRect = socketElement.getBoundingClientRect();
        const socketCenter = {
            x: socketRect.left + socketRect.width / 2,
            y: socketRect.top + socketRect.height / 2
        };

        const plugPosition = {
            x: info.point.x,
            y: info.point.y
        };

        const distance = Math.sqrt(
            Math.pow(plugPosition.x - socketCenter.x, 2) +
            Math.pow(plugPosition.y - socketCenter.y, 2)
        );

        // Show visual feedback when near
        setIsNearSocket(distance < 120);
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center overflow-hidden">
            {/* Background Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Main Container - Simplified Layout */}
            <div className="relative z-10 w-full max-w-md mx-auto px-4">
                <div className="relative h-screen flex flex-col items-center justify-center gap-16">

                    {/* Light Bulb at Top */}
                    <motion.div
                        className="w-24 h-24"
                        animate={bulbGlowing ? {
                            filter: 'brightness(1.5) drop-shadow(0 0 40px rgba(59, 130, 246, 0.8))',
                        } : {}}
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Bulb Glass */}
                            <circle
                                cx="50"
                                cy="40"
                                r="20"
                                fill={bulbGlowing ? "#60A5FA" : "#374151"}
                                stroke={bulbGlowing ? "#93C5FD" : "#4B5563"}
                                strokeWidth="2"
                            />

                            {/* Bulb Base */}
                            <rect
                                x="42"
                                y="58"
                                width="16"
                                height="10"
                                fill="#71717A"
                                stroke="#52525B"
                                strokeWidth="1"
                                rx="2"
                            />

                            {/* Thread Lines */}
                            <line x1="42" y1="61" x2="58" y2="61" stroke="#3F3F46" strokeWidth="1" />
                            <line x1="42" y1="64" x2="58" y2="64" stroke="#3F3F46" strokeWidth="1" />
                        </svg>

                        {/* Glow effect */}
                        {bulbGlowing && (
                            <motion.div
                                className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl -z-10"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        )}
                    </motion.div>



                    {/* Socket */}
                    <motion.div
                        id="power-socket"
                        className="relative w-40 h-28 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-xl border-4 border-zinc-700 shadow-2xl"
                        animate={!isPlugged ? {
                            boxShadow: isNearSocket
                                ? ['0 0 0px rgba(59, 130, 246, 0.5)', '0 0 40px rgba(59, 130, 246, 0.8)', '0 0 0px rgba(59, 130, 246, 0.5)']
                                : ['0 0 0px rgba(59, 130, 246, 0)', '0 0 30px rgba(59, 130, 246, 0.3)', '0 0 0px rgba(59, 130, 246, 0)'],
                            scale: isNearSocket ? 1.05 : 1,
                        } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Socket Holes */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-10">
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className="w-5 h-14 bg-black rounded-lg border-2 border-zinc-900"
                                />
                            ))}
                        </div>

                        {/* Spark Effects */}
                        <AnimatePresence>
                            {showSparks && (
                                <>
                                    {[...Array(8)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                                            initial={{ opacity: 1, scale: 0 }}
                                            animate={{
                                                opacity: [1, 0],
                                                x: Math.cos((i * 45 * Math.PI) / 180) * 50,
                                                y: Math.sin((i * 45 * Math.PI) / 180) * 50,
                                            }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    ))}
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Draggable Plug */}
                    <motion.div
                        drag={!isPlugged}
                        dragElastic={0.1}
                        dragMomentum={false}
                        onDrag={handlePlugDrag}
                        onDragEnd={handlePlugDrop}
                        initial={{ y: 50, opacity: 0 }}
                        animate={isPlugged ? {
                            x: 0,
                            y: -120, // Move way up to touch socket
                            scale: 0.85,
                            opacity: 1,
                            transition: { type: 'spring', stiffness: 300, damping: 20 }
                        } : {
                            y: 0,
                            opacity: 1,
                            transition: { delay: 0.3 }
                        }}
                        whileDrag={{
                            scale: 1.15,
                            cursor: 'grabbing',
                            filter: 'brightness(1.3)',
                            zIndex: 50,
                        }}
                        className={`${!isPlugged ? 'cursor-grab active:cursor-grabbing' : ''} relative`}
                    >
                        <div className="relative w-28 h-36">
                            {/* Plug Handle - Premium Design */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-24 bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 rounded-2xl border-2 border-zinc-500 shadow-2xl overflow-hidden">
                                {/* Top Shine */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl" />

                                {/* Side Shadows for 3D effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30" />
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/10" />

                                {/* Grip Lines - Realistic */}
                                <div className="absolute left-3 right-3 top-10 space-y-3">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="relative h-1.5 bg-zinc-900 rounded-full shadow-inner">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Brand Mark */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500/20 border border-blue-400/30" />
                            </div>

                            {/* Connection glow when near socket */}
                            {isNearSocket && !isPlugged && (
                                <motion.div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Instruction Text */}
                    <AnimatePresence>
                        {!isPlugged && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.5 }}
                                className="absolute bottom-20 text-center w-full"
                            >
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-blue-400 text-lg font-semibold"
                                >
                                    🔌 Drag the plug to the socket
                                </motion.div>
                                <div className="text-zinc-500 text-sm mt-2">
                                    {isNearSocket ? '✨ Drop it now!' : 'Power up to access Hustle OS'}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success Message */}
                    <AnimatePresence>
                        {bulbGlowing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute bottom-20 text-center"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"
                                >
                                    ⚡ Connected! Powering up...
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default PlugAnimation;
