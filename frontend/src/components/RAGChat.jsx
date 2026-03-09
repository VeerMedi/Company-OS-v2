import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader, Plus, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const RAGChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/rag/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: input
                })
            });

            const data = await response.json();

            const assistantMessage = {
                type: 'assistant',
                content: data.answer,
                citations: data.citations || [],
                num_sources: data.num_sources || 0,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = {
                type: 'error',
                content: 'Failed to get response. Please make sure the RAG API is running on port 5002.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedQuestions = [
        "What projects are at risk?",
        "Which team members need attention?",
        "Show me project status overview",
        "Who are the top performers?"
    ];

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 group"
                >
                    <MessageCircle className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        <Sparkles className="w-3 h-3" />
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <div>
                                <h3 className="font-semibold">AI Insights Assistant</h3>
                                <p className="text-xs opacity-90">Ask me anything about your business</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-1 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-gray-800 mb-2">Welcome! How can I help?</h4>
                                <p className="text-sm text-gray-600 mb-4">Try asking:</p>
                                <div className="space-y-2">
                                    {suggestedQuestions.map((question, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setInput(question)}
                                            className="block w-full text-left px-3 py-2 text-sm bg-white rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, idx) => (
                            <div
                                key={idx}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl p-3 ${message.type === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : message.type === 'error'
                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                            : 'bg-white shadow-md border border-gray-200'
                                        }`}
                                >
                                    {message.type === 'user' ? (
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    ) : (
                                        <div className="text-sm prose prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="ml-0 text-gray-800" {...props} />,
                                                    p: ({ node, ...props }) => <p className="my-1 leading-relaxed text-gray-800" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                                                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-3 mb-2 text-gray-900" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2 text-gray-900" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 text-gray-900" {...props} />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}

                                    {message.citations && message.citations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">
                                                📚 Sources ({message.num_sources}):
                                            </p>
                                            <div className="space-y-1">
                                                {message.citations.slice(0, 3).map((citation, cidx) => (
                                                    <div key={cidx} className="text-xs bg-gray-50 p-2 rounded">
                                                        <span className="font-medium">{citation.name}</span>
                                                        <span className="text-gray-500 ml-2">
                                                            ({Math.round(citation.relevance_score * 100)}% match)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs opacity-60 mt-2">
                                        {message.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white shadow-md rounded-2xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin text-blue-600" />
                                        <span className="text-sm text-gray-600">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                        <div className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about projects, team, metrics..."
                                className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                rows="2"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RAGChat;
