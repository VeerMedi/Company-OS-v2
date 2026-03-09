import React, { useState, useEffect } from 'react';
import { X, Users, Clock, AlertCircle, CheckCircle, Calendar, Save, History, FileText, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CenteredScrumMasterModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [scrumLogs, setScrumLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        duration: '15 mins',
        attendees: '',
        updates: '',
        blockers: '',
        nextSteps: ''
    });

    // Fetch existing logs on mount or tab change
    const fetchLogs = async () => {
        try {
            const response = await api.get('/personal-notes');
            if (response.data) {
                // Filter for scrum logs (tag: 'scrum' or category: 'meetings' with 'Scrum Meeting' in title)
                const logs = response.data.filter(note =>
                    (note.tags && note.tags.includes('scrum')) ||
                    (note.title && note.title.includes('Scrum Meeting'))
                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setScrumLogs(logs);
            }
        } catch (error) {
            console.error('Failed to fetch scrum logs:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen, activeTab]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Save structured data as JSON string for better reliability
            // We use a special prefix to identify it easily later
            const structuredContent = JSON.stringify({
                type: 'scrum-log-v1',
                data: formData
            });

            const payload = {
                title: `Scrum Meeting - ${formData.date}`,
                content: structuredContent, // Save as JSON
                category: 'meetings',
                tags: ['scrum', 'offline', 'daily-standup'],
                color: 'purple',
                isPinned: false,
                isStarred: false,
                status: 'completed'
            };

            await api.post('/personal-notes', payload);
            toast.success('Scrum meeting log saved!');

            // Reset & Switch to history
            setFormData({
                date: new Date().toISOString().split('T')[0],
                duration: '15 mins',
                attendees: '',
                updates: '',
                blockers: '',
                nextSteps: ''
            });
            fetchLogs();
            setActiveTab('history');

        } catch (error) {
            console.error('Failed to save scrum log:', error);
            toast.error('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to render log content safely
    const renderLogContent = (content) => {
        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(content);
            if (parsed && parsed.type === 'scrum-log-v1') {
                const { duration, attendees, updates, blockers, nextSteps } = parsed.data;
                return (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-4 text-xs">
                            <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 flex items-center gap-2">
                                <Clock size={14} />
                                <span className="font-medium">Duration:</span> {duration}
                            </div>
                            <div className="bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 flex items-center gap-2">
                                <Users size={14} />
                                <span className="font-medium">Attendees:</span> {attendees}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div>
                                <h5 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <CheckCircle size={12} /> Updates
                                </h5>
                                <p className="text-gray-300 text-sm leading-relaxed pl-5 border-l-2 border-emerald-500/20">
                                    {updates || 'No updates recorded.'}
                                </p>
                            </div>

                            {blockers && blockers.toLowerCase() !== 'none' && (
                                <div>
                                    <h5 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                        <AlertCircle size={12} /> Blockers
                                    </h5>
                                    <p className="text-gray-300 text-sm leading-relaxed pl-5 border-l-2 border-red-500/20">
                                        {blockers}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h5 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <ChevronRight size={12} /> Next Steps
                                </h5>
                                <p className="text-gray-300 text-sm leading-relaxed pl-5 border-l-2 border-indigo-500/20">
                                    {nextSteps || 'No next steps recorded.'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            }
        } catch (e) {
            // Fallback for legacy text logs (manual parsing)
            return (
                <div className="text-sm text-gray-300 space-y-2">
                    {content.split('\n').map((line, i) => {
                        if (!line.trim()) return <div key={i} className="h-2" />;
                        // Bold parsing fallback: **text** -> <strong>text</strong>
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                            <p key={i}>
                                {parts.map((part, j) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={j} className="text-indigo-200">{part.slice(2, -2)}</strong>;
                                    }
                                    return <span key={j}>{part}</span>;
                                })}
                            </p>
                        );
                    })}
                </div>
            );
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-2xl h-[85vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header with Tabs */}
                <div className="bg-gray-900 border-b border-white/10 pt-5 px-5 pb-0 flex-shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Users className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Scrum Log</h2>
                                <p className="text-gray-400 text-sm">Daily Standup Tracker</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'new'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <FileText size={16} /> New Entry
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <History size={16} /> History ({scrumLogs.length})
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-900/50">

                    {activeTab === 'new' ? (
                        /* NEW ENTRY FORM */
                        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Duration</label>
                                    <input
                                        type="text"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Attendees</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dev Team, Product Owner..."
                                    value={formData.attendees}
                                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Updates</label>
                                <textarea
                                    rows="3"
                                    placeholder="What did the team accomplish?"
                                    value={formData.updates}
                                    onChange={(e) => setFormData({ ...formData, updates: e.target.value })}
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Blockers</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Any impediments?"
                                        value={formData.blockers}
                                        onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Next Steps</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Goals for tomorrow..."
                                        value={formData.nextSteps}
                                        onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Saving Entry...' : (
                                        <>
                                            <Save size={18} /> Save Scrum Log
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* LOG HISTORY VIEW */
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {scrumLogs.length > 0 ? (
                                scrumLogs.map(log => (
                                    <div key={log._id} className="bg-black/20 border border-white/5 rounded-xl p-5 hover:border-indigo-500/30 transition-all group">
                                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{log.title}</h4>
                                                    <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pl-2">
                                            {renderLogContent(log.content)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <History size={48} className="mb-4 text-gray-700" />
                                    <p className="text-lg font-medium">No logs yet</p>
                                    <button
                                        onClick={() => setActiveTab('new')}
                                        className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm hover:underline"
                                    >
                                        Create your first entry
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CenteredScrumMasterModal;
