import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Users, BarChart3 } from 'lucide-react';

const ClientChat = () => {
    const [selectedChannel, setSelectedChannel] = useState('general');
    const [message, setMessage] = useState('');
    
    const channels = [
        { id: 'general', name: 'General Discussion', lastMessage: 'Hey, how are you?', participants: 5 },
        { id: 'project-updates', name: 'Project Updates', lastMessage: 'New milestone completed!', participants: 8 },
        { id: 'support', name: 'Support', lastMessage: 'Issue resolved', participants: 3 },
    ];

    const messages = [
        { id: 1, user: 'John Doe', avatar: 'J', message: 'Hey team! Just checking in on the progress.', time: '10:30 AM', isMe: false },
        { id: 2, user: 'You', avatar: 'M', message: 'Everything is going great! We are on track.', time: '10:32 AM', isMe: true },
        { id: 3, user: 'Jane Smith', avatar: 'J', message: 'I have uploaded the latest designs to the Documents section.', time: '10:35 AM', isMe: false },
        { id: 4, user: 'You', avatar: 'M', message: 'Perfect! I will review them today.', time: '10:36 AM', isMe: true },
    ];

    const handleSend = () => {
        if (message.trim()) {
            console.log('Sending:', message);
            setMessage('');
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] flex gap-6">
            {/* Channels Sidebar */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-80 bg-zinc-900 border border-white/10 rounded-3xl p-4 flex flex-col"
            >
                <h2 className="text-white font-black text-lg mb-4 px-2">Channels</h2>
                <div className="space-y-2 flex-1 overflow-y-auto">
                    {channels.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel.id)}
                            className={`w-full text-left p-4 rounded-xl transition-all ${
                                selectedChannel === channel.id
                                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                                    : 'bg-black/40 border border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-bold text-sm"># {channel.name}</span>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Users size={12} />
                                    <span className="text-xs">{channel.participants}</span>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 truncate">{channel.lastMessage}</p>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Chat Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 bg-zinc-900 border border-white/10 rounded-3xl flex flex-col"
            >
                {/* Chat Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-black text-xl"># {channels.find(c => c.id === selectedChannel)?.name}</h2>
                        <p className="text-zinc-400 text-sm">{channels.find(c => c.id === selectedChannel)?.participants} participants</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl font-bold hover:bg-blue-500/30 transition-all flex items-center gap-2">
                        <BarChart3 size={16} />
                        Insights
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                msg.isMe ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}>
                                {msg.avatar}
                            </div>
                            <div className={`flex-1 max-w-lg ${msg.isMe ? 'text-right' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {!msg.isMe && <span className="text-white font-bold text-sm">{msg.user}</span>}
                                    <span className="text-xs text-zinc-500">{msg.time}</span>
                                </div>
                                <div className={`p-4 rounded-2xl ${
                                    msg.isMe
                                        ? 'bg-emerald-500/20 text-white border border-emerald-500/30'
                                        : 'bg-black/40 text-white border border-white/10'
                                }`}>
                                    {msg.message}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <button className="p-3 hover:bg-white/10 rounded-xl transition-all">
                            <Paperclip className="text-zinc-400" size={20} />
                        </button>
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none"
                        />
                        <button
                            onClick={handleSend}
                            className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                        >
                            <Send size={20} />
                            Send
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ClientChat;