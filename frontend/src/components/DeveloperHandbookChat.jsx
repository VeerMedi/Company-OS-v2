import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, BookOpen, HelpCircle, FileText, Code } from 'lucide-react';
import developerHandbookService from '../services/developerHandbookService';
import { showToast } from '../utils/toast';

const DeveloperHandbookChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isApiHealthy, setIsApiHealthy] = useState(null);
    const messagesEndRef = useRef(null);

    // Quick action suggestions
    const quickActions = [
        { icon: BookOpen, label: "Development Principles", question: "What are the core principles of the development department?" },
        { icon: Code, label: "Code Branching Rules", question: "What are the git branching rules I should follow?" },
        { icon: FileText, label: "Documentation Standards", question: "What documentation is mandatory for projects?" },
        { icon: HelpCircle, label: "Escalation Process", question: "Who should I escalate issues to?" }
    ];

    useEffect(() => {
        // Check API health on mount
        checkApiHealth();

        // Show welcome message
        setMessages([{
            type: 'assistant',
            content: "Hey there! 👋 I'm your AI Handbook Assistant. I can help answer questions about projects, employees, analytics, and business insights. Ask me anything!",
            timestamp: new Date().toISOString()
        }]);
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkApiHealth = async () => {
        try {
            const health = await developerHandbookService.healthCheck();
            setIsApiHealthy(health.status === 'healthy');
        } catch (error) {
            setIsApiHealthy(false);
            console.error('API health check failed:', error);
        }
    };

    const handleSendMessage = async () => {
        console.log('🟢 [Chat Component] handleSendMessage called');
        console.log('🟢 [Chat Component] Input message:', inputMessage);
        console.log('🟢 [Chat Component] isLoading:', isLoading);
        
        if (!inputMessage.trim() || isLoading) {
            console.log('⚠️ [Chat Component] Message blocked - empty or loading');
            return;
        }

        const userMessage = inputMessage.trim();
        setInputMessage('');

        // Add user message to chat
        const newUserMessage = {
            type: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newUserMessage]);
        console.log('🟢 [Chat Component] User message added to chat:', userMessage);

        // Set loading state
        setIsLoading(true);
        console.log('🟢 [Chat Component] Loading state set to true');

        try {
            // Prepare conversation history
            const conversationHistory = messages
                .filter(msg => msg.type !== 'system')
                .map(msg => ({
                    question: msg.type === 'user' ? msg.content : '',
                    answer: msg.type === 'assistant' ? msg.content : ''
                }))
                .filter(turn => turn.question || turn.answer);

            console.log('🟢 [Chat Component] Calling RAG service with question:', userMessage);
            console.log('🟢 [Chat Component] Conversation history:', conversationHistory);
            
            // Query the RAG system
            const response = await developerHandbookService.query(userMessage, conversationHistory);

            console.log('🟢 [Chat Component] Received response from RAG service:', response);
            
            // Add assistant response to chat
            const assistantMessage = {
                type: 'assistant',
                content: response.answer,
                sources: response.sources || [],
                timestamp: response.timestamp
            };
            setMessages(prev => [...prev, assistantMessage]);
            console.log('🟢 [Chat Component] Assistant message added to chat');

        } catch (error) {
            console.error('❌ [Chat Component] Error getting response:', error);

            const errorMessage = {
                type: 'assistant',
                content: "Oops! I'm having trouble connecting to the handbook service. Please make sure the backend is running and try again. If this keeps happening, reach out to the team!",
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);

            showToast.error('Failed to get response from handbook assistant');
        } finally {
            setIsLoading(false);
            console.log('🟢 [Chat Component] Loading state set to false');
        }
    };

    const handleQuickAction = (question) => {
        setInputMessage(question);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI Handbook Assistant</h2>
                            <p className="text-blue-100 text-sm">
                                {isApiHealthy === null ? 'Checking status...' :
                                    isApiHealthy ? '🟢 Online & Ready' : '🔴 Offline - Backend not running'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`flex-shrink-0 ${message.type === 'user' ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'} rounded-xl p-2`}>
                                {message.type === 'user' ? (
                                    <User className="h-5 w-5 text-white" />
                                ) : (
                                    <Bot className="h-5 w-5 text-white" />
                                )}
                            </div>

                            {/* Message Content */}
                            <div className={`flex flex-col space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-2xl px-4 py-3 ${message.type === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                        : message.isError
                                            ? 'bg-red-50 text-red-900 border border-red-200'
                                            : 'bg-white text-gray-900 shadow-md'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                </div>

                                {/* Sources */}
                                {message.sources && message.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {message.sources.map((source, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200"
                                            >
                                                📖 Section {source.section_id}: {source.title}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <span className="text-xs text-gray-500 px-2">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-3xl">
                            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-2">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                    <span className="text-sm text-gray-600">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && !isLoading && (
                <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 font-medium mb-3">Quick actions:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickAction(action.question)}
                                className="flex items-center space-x-3 p-3 bg-white hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 text-left group"
                            >
                                <action.icon className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4 rounded-b-2xl">
                <div className="flex items-end space-x-3">
                    <div className="flex-1">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about the handbook or our processes..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        <Send className="h-5 w-5" />
                        <span>Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeveloperHandbookChat;
