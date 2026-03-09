import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search, Sparkles, Users as UsersIcon } from 'lucide-react';

const LeftPeekPanel = ({ onUserSelect, onAIAssistantSelect }) => {
    const [isHovered, setIsHovered] = useState(false);

    const panelVariants = {
        collapsed: {
            x: '-92%',
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 30,
                duration: 0.25
            }
        },
        expanded: {
            x: '0%',
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 30,
                duration: 0.25
            }
        }
    };

    const users = [
        { id: 1, name: "Sarah Wilson", role: "Product Manager", color: "bg-gray-800 text-sky-500" },
        { id: 2, name: "Mike Chen", role: "Lead Developer", color: "bg-gray-800 text-sky-500" },
        { id: 3, name: "Jessica Stark", role: "Marketing Head", color: "bg-gray-800 text-sky-500" },
        { id: 4, name: "David Kim", role: "Sales Director", color: "bg-gray-800 text-sky-500" },
        { id: 5, name: "Emma Watson", role: "HR Manager", color: "bg-gray-800 text-sky-500" },
    ];

    const handleAIChatClick = () => {
        console.log('AI Chat clicked - Opening RAG');
        onAIAssistantSelect && onAIAssistantSelect('ai-analytics');
    };

    return (
        <motion.div
            className="fixed left-0 top-[25%] z-50 flex items-start"
            initial="collapsed"
            animate={isHovered ? "expanded" : "collapsed"}
            variants={panelVariants}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ width: '320px' }}
        >
            {/* Main Panel Content */}
            <div className="h-auto max-h-[70vh] w-full bg-gray-900/50 backdrop-blur-2xl border-y border-r border-white/10 rounded-r-2xl shadow-2xl flex flex-col">
                {/* Toggle Buttons */}
                <div className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        {/* Team Chat Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                        >
                            <div className="p-3 rounded-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg">
                                <UsersIcon size={16} />
                                <span className="text-sm font-medium">Team</span>
                            </div>
                        </motion.button>

                        {/* AI Chat Button - Direct open */}
                        <motion.button
                            onClick={handleAIChatClick}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                        >
                            <div className="p-3 rounded-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg hover:from-purple-600 hover:to-blue-700">
                                <Sparkles size={16} />
                                <span className="text-sm font-medium">AI Chat</span>
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Team Chat Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="px-4 pb-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search people..."
                                className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/30 focus:bg-white/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="px-2 pb-2 space-y-1 overflow-y-auto">
                        {users.map((user, i) => (
                            <motion.button
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => onUserSelect && onUserSelect(user)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center font-bold shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 transition-all`}>
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors truncate">{user.name}</h4>
                                    <p className="text-xs text-gray-500 group-hover:text-gray-400 truncate">{user.role}</p>
                                </div>
                                <ChevronRight className="ml-auto text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" size={14} />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Handle / Peek Edge */}
            <div
                className={`
                    absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                    w-1.5 h-16 
                    bg-white/20 hover:bg-white/40
                    backdrop-blur-md
                    rounded-full 
                    transition-all duration-300
                    cursor-pointer
                    ${isHovered ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}
                `}
            />
        </motion.div>
    );
};

export default LeftPeekPanel;