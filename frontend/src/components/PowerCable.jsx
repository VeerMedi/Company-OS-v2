import React from 'react';
import { motion } from 'framer-motion';

const PowerCable = ({ isPowered, isWireNear, onWireDrag, onWireDrop }) => {
    return (
        <>
            {/* Draggable wire when NOT powered */}
            {!isPowered && (
                <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    {/* Fixed Wire Part - Top (ceiling) */}
                    <div className="relative w-1 h-20 bg-gradient-to-b from-zinc-700 to-zinc-600 mx-auto" />

                    {/* Draggable Wire End */}
                    <motion.div
                        drag
                        dragElastic={0.1}
                        dragMomentum={false}
                        onDrag={onWireDrag}
                        onDragEnd={onWireDrop}
                        className="pointer-events-auto cursor-grab active:cursor-grabbing absolute top-20 left-1/2 -translate-x-1/2"
                        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                    >
                        {/* Wire connector */}
                        <div className="relative">

                            {/* Plug end */}
                            <div className="w-12 h-16 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-lg border-2 border-zinc-500 shadow-xl relative">
                                {/* Shine */}
                                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg" />

                                {/* Grip lines */}
                                <div className="absolute left-2 right-2 top-6 space-y-2">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="h-1 bg-zinc-900 rounded-full" />
                                    ))}
                                </div>

                                {/* Indicator light */}
                                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${isWireNear ? 'bg-green-400 animate-pulse' : 'bg-zinc-800'
                                    }`} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* When powered - NO wire visible, socket will glow */}
            {/* Wire is "inside" the socket - invisible! */}
        </>
    );
};

export default PowerCable;
