import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone, Video, MoreVertical } from 'lucide-react';

const ChatModal = ({ user, onClose }) => {
    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!user) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="
                        w-[500px] h-[600px] 
                        bg-[#0B1121] 
                        border border-white/10 
                        rounded-2xl shadow-2xl 
                        flex flex-col 
                        overflow-hidden
                    "
                    style={{
                        boxShadow: '0 0 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Header */}
                    <div className="h-16 border-b border-white/5 bg-white/5 flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${user.color || 'bg-blue-500'}`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0B1121] rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{user.name}</h3>
                                <span className="text-xs text-green-400">Online</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-400">
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Phone size={18} /></button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Video size={18} /></button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MoreVertical size={18} /></button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-[#0B1121] to-[#0f172a]">
                        <div className="flex flex-col gap-1 items-start">
                            <div className="px-4 py-2 bg-white/10 rounded-2xl rounded-tl-none text-gray-200 text-sm max-w-[80%]">
                                Hey, do you have the Q4 report ready?
                            </div>
                            <span className="text-[10px] text-gray-500 ml-2">10:23 AM</span>
                        </div>

                        <div className="flex flex-col gap-1 items-end self-end">
                            <div className="px-4 py-2 bg-blue-600 rounded-2xl rounded-tr-none text-white text-sm max-w-[80%]">
                                Yes, just finalizing the metrics. Sending it in 5 mins! 🚀
                            </div>
                            <span className="text-[10px] text-gray-500 mr-2">10:25 AM</span>
                        </div>

                        <div className="flex flex-col gap-1 items-start">
                            <div className="px-4 py-2 bg-white/10 rounded-2xl rounded-tl-none text-gray-200 text-sm max-w-[80%]">
                                Perfect, thanks!
                            </div>
                            <span className="text-[10px] text-gray-500 ml-2">10:26 AM</span>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/5 border-t border-white/5">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full bg-black/20 border border-white/10 rounded-full py-3 px-5 pr-12 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-gray-600"
                            />
                            <button className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors shadow-lg shadow-blue-900/20">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatModal;
