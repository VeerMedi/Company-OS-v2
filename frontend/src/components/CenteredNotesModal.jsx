import React, { useState, useEffect } from 'react';
import {
    StickyNote,
    X,
    Plus,
    Trash2,
    Save,
    Search,
    Star,
    Clock,
    Tag,
    Pin,
    CheckSquare,
    Lightbulb,
    Target,
    Calendar,
    Zap,
    Book,
    Briefcase,
    Heart,
    MessageSquare,
    Code,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api'; // Ensure this points to your configured axios instance

const iconMap = {
    Lightbulb, CheckSquare, Target, Calendar, Zap, Book, Briefcase, Heart, MessageSquare, Code, Star, StickyNote, Tag
};

const defaultCategories = [
    { id: 'ideas', name: 'Ideas', icon: 'Lightbulb', color: 'yellow' },
    { id: 'tasks', name: 'Tasks', icon: 'CheckSquare', color: 'blue' },
    { id: 'goals', name: 'Goals', icon: 'Target', color: 'green' },
    { id: 'meetings', name: 'Meetings', icon: 'Calendar', color: 'purple' },
    { id: 'quick', name: 'Quick Notes', icon: 'Zap', color: 'orange' },
];

const colorOptions = [
    { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300' },
    { name: 'Blue', value: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' },
    { name: 'Green', value: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-300' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300' },
];

const CenteredNotesModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filterPinned, setFilterPinned] = useState(false);
    const [filterStarred, setFilterStarred] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notes from API
    const fetchNotes = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/personal-notes');
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchNotes();
        }
    }, [isOpen, user]);

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

    const createNewNote = () => {
        const note = {
            title: '',
            content: '',
            category: selectedCategory !== 'all' ? selectedCategory : 'quick',
            tags: [],
            color: 'yellow',
            isPinned: false,
            isStarred: false,
            isArchived: false,
            deadline: '',
            status: 'pending'
        };
        setCurrentNote(note); // Set as current note purely in frontend state first
    };

    const saveNote = async () => {
        if (!currentNote.title && !currentNote.content) return;

        try {
            // Sanitize payload (empty string date causes MongoDB error)
            const notePayload = {
                ...currentNote,
                deadline: currentNote.deadline || undefined
            };

            let savedNote;
            if (currentNote._id) {
                // Update existing
                const response = await api.put(`/personal-notes/${currentNote._id}`, notePayload);
                savedNote = response.data;
                setNotes(notes.map(n => n._id === savedNote._id ? savedNote : n));
            } else {
                // Create new
                const response = await api.post('/personal-notes', notePayload);
                savedNote = response.data;
                setNotes([savedNote, ...notes]);
            }
            setCurrentNote(null);
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note');
        }
    };

    const deleteNote = async (id) => {
        if (window.confirm('Delete this note?')) {
            try {
                await api.delete(`/personal-notes/${id}`);
                setNotes(notes.filter(n => n._id !== id));
                if (currentNote?._id === id) setCurrentNote(null);
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const togglePin = async (note) => {
        try {
            const updatedNote = { ...note, isPinned: !note.isPinned };
            const response = await api.put(`/personal-notes/${note._id}`, { isPinned: updatedNote.isPinned });
            setNotes(notes.map(n => n._id === note._id ? response.data : n));
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    const toggleStar = async (note) => {
        try {
            const updatedNote = { ...note, isStarred: !note.isStarred };
            const response = await api.put(`/personal-notes/${note._id}`, { isStarred: updatedNote.isStarred });
            setNotes(notes.map(n => n._id === note._id ? response.data : n));
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    const getColorClass = (color) => colorOptions.find(c => c.value === color) || colorOptions[0];

    // Filter Logic
    const filteredNotes = notes
        .filter(note => {
            if (note.isArchived) return false;
            // Handle case where category might not be set on old notes (though defaults handle this)
            const noteCategory = note.category || 'quick';
            if (selectedCategory !== 'all' && noteCategory !== selectedCategory) return false;
            if (filterPinned && !note.isPinned) return false;
            if (filterStarred && !note.isStarred) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (note.title || '').toLowerCase().includes(query) || (note.content || '').toLowerCase().includes(query);
            }
            return true;
        })
        .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-5xl h-[85vh] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-b border-white/10 p-5 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <StickyNote className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Personal Notes</h2>
                                <p className="text-gray-400 text-sm">Your ideas & thoughts</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-gray-800/50 border-b border-white/10 p-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={createNewNote}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            New Note
                        </button>

                        <button
                            onClick={() => setFilterPinned(!filterPinned)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${filterPinned ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <Pin className="h-4 w-4" />
                            Pinned
                        </button>

                        <button
                            onClick={() => setFilterStarred(!filterStarred)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${filterStarred ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            <Star className="h-4 w-4" />
                            Starred
                        </button>
                    </div>

                    {/* Categories Filter */}
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            All Notes ({notes.filter(n => !n.isArchived).length})
                        </button>
                        {defaultCategories.map(cat => {
                            const Icon = iconMap[cat.icon] || Book;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${selectedCategory === cat.id ? 'bg-purple-600/50 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar overscroll-contain">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" /> Loading notes...
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-12">
                            <StickyNote className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No notes found. Start writing!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredNotes.map(note => {
                                const colorClass = getColorClass(note.color);
                                const isDeadlineNear = note.deadline && new Date(note.deadline) - new Date() < 86400000 && new Date(note.deadline) > new Date();

                                return (
                                    <div
                                        key={note._id}
                                        className={`${colorClass.bg} ${colorClass.border} border rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-transform ${note.isPinned ? 'ring-2 ring-purple-500' : ''
                                            }`}
                                        onClick={() => setCurrentNote(note)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-1">
                                                {note.isPinned && <Pin className="h-4 w-4 text-purple-400 fill-current" />}
                                                {note.isStarred && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                                                <h3 className={`font-semibold ${colorClass.text} line-clamp-1`}>
                                                    {note.title || 'Untitled Note'}
                                                </h3>
                                            </div>
                                            {note.status && (
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ml-2 ${note.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                                    note.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {note.status}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-3 mb-3">{note.content || 'No content'}</p>

                                        {/* Meta info */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </span>
                                                {note.deadline && (
                                                    <span className={`flex items-center gap-1 ${isDeadlineNear ? 'text-red-400 font-bold' : ''}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(note.deadline).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                                                    className="hover:text-purple-400"
                                                >
                                                    <Pin className={`h-3 w-3 ${note.isPinned ? 'fill-current text-purple-400' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleStar(note); }}
                                                    className="hover:text-yellow-400"
                                                >
                                                    <Star className={`h-3 w-3 ${note.isStarred ? 'fill-current text-yellow-400' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}
                                                    className="hover:text-red-400"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Note Editor Modal */}
                {currentNote && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
                        <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Editor Toolbar */}
                            <div className={`${getColorClass(currentNote.color).bg} border-b border-white/10 p-4`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentNote({ ...currentNote, isPinned: !currentNote.isPinned })}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            title="Toggle Pin"
                                        >
                                            <Pin className={`h-5 w-5 ${currentNote.isPinned ? 'fill-current text-purple-400' : 'text-gray-400'}`} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentNote({ ...currentNote, isStarred: !currentNote.isStarred })}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            title="Toggle Star"
                                        >
                                            <Star className={`h-5 w-5 ${currentNote.isStarred ? 'fill-current text-yellow-400' : 'text-gray-400'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={saveNote}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                        >
                                            <Save className="h-4 w-4" />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setCurrentNote(null)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="p-4 flex-1 overflow-y-auto overscroll-contain">
                                <input
                                    type="text"
                                    placeholder="Note title..."
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                    className="w-full text-xl font-bold bg-transparent border-none focus:outline-none text-white placeholder-gray-500 mb-4"
                                />

                                {/* Meta Fields: Category, Status, Deadline */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {/* Category Select */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500">Category</label>
                                        <select
                                            value={currentNote.category || 'quick'}
                                            onChange={(e) => setCurrentNote({ ...currentNote, category: e.target.value })}
                                            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-purple-500"
                                        >
                                            {defaultCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status Select */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500">Status</label>
                                        <select
                                            value={currentNote.status || 'pending'}
                                            onChange={(e) => setCurrentNote({ ...currentNote, status: e.target.value })}
                                            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Deadline Input */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-500">Deadline</label>
                                        <input
                                            type="date"
                                            value={currentNote.deadline ? new Date(currentNote.deadline).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setCurrentNote({ ...currentNote, deadline: e.target.value })}
                                            className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <textarea
                                    placeholder="Write your note..."
                                    value={currentNote.content}
                                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                    className="w-full h-48 bg-transparent border-none focus:outline-none resize-none text-gray-300 placeholder-gray-600"
                                />

                                {/* Color Picker */}
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Color:</span>
                                    {colorOptions.map(color => (
                                        <button
                                            key={color.value}
                                            onClick={() => setCurrentNote({ ...currentNote, color: color.value })}
                                            className={`w-6 h-6 rounded-full ${color.bg} ${currentNote.color === color.value ? 'ring-2 ring-white' : ''
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CenteredNotesModal;
