import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const AIAnalyticsChat = ({ onClose }) => {
    const { token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationState, setConversationState] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const messagesEndRef = useRef(null);

    const suggestedQuestions = [
        "Show me at-risk projects",
        "Team performance summary",
        "Recent task completions",
        "Employee workload analysis",
        "Projects by status",
        "Top performers this month"
    ];

    useEffect(() => {
        checkServerHealth();
        // Add welcome message
        setMessages([{
            role: 'assistant',
            content: "👋 Hello! I'm your AI Analytics Assistant. I can help you with:\n\n• Project status and progress\n• Team performance metrics\n• Task completion analysis\n• Employee workload insights\n• Revenue and sales data\n\nWhat would you like to know?",
            timestamp: new Date().toISOString()
        }]);
    }, []);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkServerHealth = async () => {
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/analytics/rag/health`);
            const data = await response.json();
            setServerStatus(data.status === 'healthy' ? 'online' : 'offline');
        } catch (error) {
            console.error('Health check failed:', error);
            setServerStatus('offline');
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/analytics/rag/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: userMessage.content,
                    conversation_history: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    conversation_state: conversationState
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage = {
                role: 'assistant',
                content: data.answer || data.error || 'Sorry, I couldn\'t process that request.',
                timestamp: new Date().toISOString(),
                citations: data.citations || [],
                sources: data.domains_searched || [],
                isAction: data.is_action || false
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Update conversation state if present (for multi-turn interactions)
            if (data.conversation_state) {
                setConversationState(data.conversation_state);
            } else {
                setConversationState(null);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please make sure the Analytics LLM server is running on port 5002.',
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestedQuestion = (question) => {
        setInput(question);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const renderMessageContent = (message, index) => {
        return (
            <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <div className="relative group">
                                    <button
                                        onClick={() => copyToClipboard(String(children), index)}
                                        className="absolute top-2 right-2 p-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {copiedIndex === index ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3 text-gray-300" />
                                        )}
                                    </button>
                                    <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg !bg-gray-900/50 !mt-2 !mb-2"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <code className="px-1.5 py-0.5 bg-gray-800/50 rounded text-cyan-400" {...props}>
                                    {children}
                                </code>
                            );
                        },
                        p({ children }) {
                            return <p className="mb-2 last:mb-0">{children}</p>;
                        },
                        ul({ children }) {
                            return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                        },
                        ol({ children }) {
                            return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                        },
                        strong({ children }) {
                            return <strong className="text-blue-300 font-semibold">{children}</strong>;
                        },
                        a({ href, children }) {
                            return <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>;
                        }
                    }}
                >
                    {message.content}
                </ReactMarkdown>

                {/* Citations/Sources */}
                {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <div className="text-xs text-gray-400 mb-2">📚 Sources:</div>
                        <div className="flex flex-wrap gap-2">
                            {message.citations.map((citation, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-gray-800/50 rounded-full text-gray-300 border border-gray-700/50">
                                    {citation}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-2">
                        <div className="text-xs text-gray-500">
                            Searched: {message.sources.join(', ')}
                        </div>
                    </div>
                )}
            </div>
        );
    };

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
                    className="w-[700px] h-[700px] bg-gradient-to-br from-[#0B1121] via-[#0f172a] to-[#1e1b4b] border border-purple-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{
                        boxShadow: '0 0 80px rgba(147, 51, 234, 0.3), 0 0 0 1px rgba(147, 51, 234, 0.2)'
                    }}
                >
                    {/* Header */}
                    <div className="h-16 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 ${serverStatus === 'online' ? 'bg-cyan-400' : 'bg-red-500'} border-2 border-[#0B1121] rounded-full`}></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-semibold">AI Analytics Assistant</h3>
                                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">AI</span>
                                </div>
                                <span className={`text-xs ${serverStatus === 'online' ? 'text-cyan-400' : 'text-red-400'}`}>
                                    {serverStatus === 'online' ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-400">
                            <button
                                onClick={checkServerHealth}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                title="Refresh Status"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-[#0B1121]/50 to-[#0f172a]/50">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none shadow-lg shadow-blue-900/20'
                                        : message.isError
                                            ? 'bg-red-900/20 border border-red-500/30 text-red-200 rounded-tl-none'
                                            : 'bg-gray-800/50 border border-gray-700/50 text-gray-200 rounded-tl-none backdrop-blur-sm'
                                    }`}>
                                    {message.role === 'user' ? (
                                        <div className="text-sm">{message.content}</div>
                                    ) : (
                                        renderMessageContent(message, index)
                                    )}
                                </div>
                                <span className={`text-[10px] text-gray-500 ${message.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-1">
                                <div className="px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-2xl rounded-tl-none backdrop-blur-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Analyzing...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions - Show when no messages */}
                    {messages.length === 1 && !isLoading && (
                        <div className="px-6 pb-4">
                            <div className="text-xs text-gray-400 mb-2">💡 Try asking:</div>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map((question, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestedQuestion(question)}
                                        className="text-xs px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 transition-all hover:scale-105"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-t border-purple-500/20 backdrop-blur-sm">
                        {serverStatus === 'offline' && (
                            <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-xs">
                                <AlertCircle className="w-4 h-4" />
                                <span>Analytics server offline. Please start the server on port 5002.</span>
                            </div>
                        )}
                        <div className="relative flex items-center">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about projects, tasks, team performance..."
                                disabled={serverStatus === 'offline'}
                                rows={1}
                                className="w-full bg-black/30 border border-purple-500/30 rounded-2xl py-3 px-5 pr-12 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all placeholder:text-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ maxHeight: '120px', minHeight: '48px' }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading || serverStatus === 'offline'}
                                className="absolute right-2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIAnalyticsChat;
