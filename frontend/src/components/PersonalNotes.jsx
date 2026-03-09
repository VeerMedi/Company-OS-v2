import React, { useState, useEffect, useRef } from 'react';
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  Search,
  Filter,
  Star,
  Archive,
  Clock,
  Tag,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Palette,
  Pin,
  Copy,
  Share2,
  Download,
  Upload,
  MoreVertical,
  Check,
  AlertCircle,
  Lightbulb,
  Target,
  Zap,
  Book,
  Briefcase,
  Heart,
  MessageSquare,
  Code,
  Calendar,
  CheckSquare,
  Bell,
  BellRing,
  Mail,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';

// Icon mapping for category creation
const iconMap = {
  Lightbulb,
  CheckSquare,
  Target,
  Calendar,
  Zap,
  Book,
  Briefcase,
  Heart,
  MessageSquare,
  Code,
  Star,
  StickyNote,
  FolderPlus,
  Tag
};

const defaultCategories = [
  { id: 'ideas', name: 'Ideas', icon: 'Lightbulb', color: 'yellow' },
  { id: 'tasks', name: 'Tasks', icon: 'CheckSquare', color: 'blue' },
  { id: 'goals', name: 'Goals', icon: 'Target', color: 'green' },
  { id: 'meetings', name: 'Meetings', icon: 'Calendar', color: 'purple' },
  { id: 'quick', name: 'Quick Notes', icon: 'Zap', color: 'orange' },
  { id: 'learning', name: 'Learning', icon: 'Book', color: 'indigo' },
  { id: 'projects', name: 'Projects', icon: 'Briefcase', color: 'red' },
  { id: 'personal', name: 'Personal', icon: 'Heart', color: 'pink' },
  { id: 'feedback', name: 'Feedback', icon: 'MessageSquare', color: 'teal' },
  { id: 'code', name: 'Code Snippets', icon: 'Code', color: 'gray' }
];

const colorOptions = [
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  { name: 'Green', value: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
  { name: 'Red', value: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
  { name: 'Teal', value: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800' },
  { name: 'Gray', value: 'gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' }
];

const PersonalNotes = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [currentNote, setCurrentNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'title', 'priority'
  const [showArchived, setShowArchived] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: 'blue', icon: 'Book' });
  const [filterPinned, setFilterPinned] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState({});
  const notificationCheckInterval = useRef(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes_${user?.id}`);
    const savedCategories = localStorage.getItem(`categories_${user?.id}`);
    const savedSentNotifications = localStorage.getItem(`sentNotifications_${user?.id}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    if (savedSentNotifications) {
      setSentNotifications(JSON.parse(savedSentNotifications));
    }
  }, [user]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notes_${user.id}`, JSON.stringify(notes));
    }
  }, [notes, user]);

  // Save categories to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`categories_${user.id}`, JSON.stringify(categories));
    }
  }, [categories, user]);

  // Save sent notifications to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`sentNotifications_${user.id}`, JSON.stringify(sentNotifications));
    }
  }, [sentNotifications, user]);

  // Deadline notification checker
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const upcomingNotifications = [];

      notes.forEach(note => {
        if (!note.deadline || note.isArchived) return;

        const deadline = new Date(note.deadline);
        const timeDiff = deadline - now;
        const noteKey = `${note.id}_${note.deadline}`;

        // Check if deadline has passed
        if (timeDiff < 0) return;

        // 1 day before (24 hours)
        const oneDayBefore = 24 * 60 * 60 * 1000;
        if (timeDiff <= oneDayBefore && timeDiff > oneDayBefore - 60000 && !sentNotifications[`${noteKey}_1day`]) {
          upcomingNotifications.push({
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            deadline: note.deadline,
            type: '1day',
            message: '1 day before deadline'
          });
          setSentNotifications(prev => ({ ...prev, [`${noteKey}_1day`]: true }));
        }

        // 1 hour before
        const oneHourBefore = 60 * 60 * 1000;
        if (timeDiff <= oneHourBefore && timeDiff > oneHourBefore - 60000 && !sentNotifications[`${noteKey}_1hour`]) {
          upcomingNotifications.push({
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            deadline: note.deadline,
            type: '1hour',
            message: '1 hour before deadline'
          });
          setSentNotifications(prev => ({ ...prev, [`${noteKey}_1hour`]: true }));
        }

        // 10 minutes before (1st notification)
        const tenMinsBefore = 10 * 60 * 1000;
        if (timeDiff <= tenMinsBefore && timeDiff > tenMinsBefore - 60000 && !sentNotifications[`${noteKey}_10min1`]) {
          upcomingNotifications.push({
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            deadline: note.deadline,
            type: '10min1',
            message: '10 minutes before deadline (1st reminder)'
          });
          setSentNotifications(prev => ({ ...prev, [`${noteKey}_10min1`]: true }));
        }

        // 10 minutes before (2nd notification) - 30 seconds later
        if (timeDiff <= tenMinsBefore - 30000 && timeDiff > tenMinsBefore - 90000 && !sentNotifications[`${noteKey}_10min2`]) {
          upcomingNotifications.push({
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            deadline: note.deadline,
            type: '10min2',
            message: '10 minutes before deadline (2nd reminder)'
          });
          setSentNotifications(prev => ({ ...prev, [`${noteKey}_10min2`]: true }));
        }

        // 10 minutes before (3rd notification) - 60 seconds later
        if (timeDiff <= tenMinsBefore - 60000 && timeDiff > tenMinsBefore - 120000 && !sentNotifications[`${noteKey}_10min3`]) {
          upcomingNotifications.push({
            noteId: note.id,
            noteTitle: note.title || 'Untitled Note',
            deadline: note.deadline,
            type: '10min3',
            message: '10 minutes before deadline (3rd reminder)'
          });
          setSentNotifications(prev => ({ ...prev, [`${noteKey}_10min3`]: true }));
        }
      });

      if (upcomingNotifications.length > 0) {
        setEmailNotifications(prev => [...prev, ...upcomingNotifications]);
        sendEmailNotifications(upcomingNotifications);
      }
    };

    // Check every minute
    notificationCheckInterval.current = setInterval(checkDeadlines, 60000);
    checkDeadlines(); // Initial check

    return () => {
      if (notificationCheckInterval.current) {
        clearInterval(notificationCheckInterval.current);
      }
    };
  }, [notes, sentNotifications, user]);

  // Send email notifications
  const sendEmailNotifications = async (notifications) => {
    try {
      const response = await fetchWithAuth('notes/send-deadline-notifications', {
        method: 'POST',
        body: JSON.stringify({
          notifications,
          userEmail: user?.email,
          userName: user?.firstName + ' ' + user?.lastName
        })
      });

      if (response.ok) {
        console.log('Email notifications sent successfully');
      }
    } catch (error) {
      console.error('Failed to send email notifications:', error);
    }
  };

  const createNewNote = () => {
    const note = {
      id: Date.now(),
      title: '',
      content: '',
      category: selectedCategory !== 'all' ? selectedCategory : 'quick',
      tags: [],
      color: 'yellow',
      isPinned: false,
      isStarred: false,
      isArchived: false,
      priority: 'medium',
      deadline: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentNote(note);
  };

  const saveNote = () => {
    if (!currentNote.title && !currentNote.content) return;

    const updatedNote = {
      ...currentNote,
      updatedAt: new Date().toISOString()
    };

    const existingIndex = notes.findIndex(n => n.id === currentNote.id);
    if (existingIndex >= 0) {
      const newNotes = [...notes];
      newNotes[existingIndex] = updatedNote;
      setNotes(newNotes);
    } else {
      setNotes([updatedNote, ...notes]);
    }

    setCurrentNote(null);
  };

  const deleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
      if (currentNote?.id === id) {
        setCurrentNote(null);
      }
    }
  };

  const togglePin = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const toggleStar = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isStarred: !n.isStarred } : n));
  };

  const toggleArchive = (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isArchived: !n.isArchived } : n));
  };

  const duplicateNote = (note) => {
    const duplicated = {
      ...note,
      id: Date.now(),
      title: `${note.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false
    };
    setNotes([duplicated, ...notes]);
  };

  const addTag = (tag) => {
    if (currentNote && tag && !currentNote.tags.includes(tag)) {
      setCurrentNote({
        ...currentNote,
        tags: [...currentNote.tags, tag]
      });
    }
  };

  const removeTag = (tag) => {
    if (currentNote) {
      setCurrentNote({
        ...currentNote,
        tags: currentNote.tags.filter(t => t !== tag)
      });
    }
  };

  const addCategory = () => {
    if (newCategory.name.trim()) {
      const category = {
        id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        name: newCategory.name,
        icon: newCategory.icon, // Store as string
        color: newCategory.color
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', color: 'blue', icon: 'Book' });
      setShowCategoryModal(false);
    }
  };

  const deleteCategory = (id) => {
    if (window.confirm('Delete this category? Notes in this category will be moved to "Quick Notes".')) {
      setCategories(categories.filter(c => c.id !== id));
      setNotes(notes.map(n => n.category === id ? { ...n, category: 'quick' } : n));
    }
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify({ notes, categories }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes_${user?.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importNotes = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.notes) {
            setNotes([...notes, ...data.notes]);
          }
          if (data.categories) {
            const newCats = data.categories.filter(
              c => !categories.find(existing => existing.id === c.id)
            );
            setCategories([...categories, ...newCats]);
          }
        } catch (error) {
          alert('Invalid notes file');
        }
      };
      reader.readAsText(file);
    }
  };

  const getColorClass = (color) => {
    const colorObj = colorOptions.find(c => c.value === color);
    return colorObj || colorOptions[0];
  };

  const filteredNotes = notes
    .filter(note => {
      if (!showArchived && note.isArchived) return false;
      if (showArchived && !note.isArchived) return false;
      if (selectedCategory !== 'all' && note.category !== selectedCategory) return false;
      if (filterPinned && !note.isPinned) return false;
      if (filterStarred && !note.isStarred) return false;
      if (selectedTags.length > 0 && !selectedTags.every(tag => note.tags.includes(tag))) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return note.title.toLowerCase().includes(query) ||
               note.content.toLowerCase().includes(query) ||
               note.tags.some(tag => tag.toLowerCase().includes(query));
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
      
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorities = { high: 3, medium: 2, low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        case 'updated':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

  const allTags = [...new Set(notes.flatMap(n => n.tags))];

  const getCategoryStats = (categoryId) => {
    return notes.filter(n => n.category === categoryId && !n.isArchived).length;
  };

  return (
    <>
      {/* Floating Notes Button - Fixed to center-right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-l-2xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:pr-6 group ${
          isOpen ? 'pr-6' : ''
        }`}
        title="Personal Notes"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="h-6 w-6" />
          <span className="text-sm font-semibold hidden group-hover:inline-block whitespace-nowrap">
            Notes
          </span>
          {notes.filter(n => !n.isArchived).length > 0 && (
            <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {notes.filter(n => !n.isArchived).length}
            </span>
          )}
        </div>
      </button>

      {/* Notes Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <StickyNote className="h-7 w-7" />
                <div>
                  <h2 className="text-2xl font-bold">Personal Notes</h2>
                  <p className="text-purple-100 text-sm">Your ideas & thoughts</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-200" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={createNewNote}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                New Note
              </button>

              <div className="flex-1 flex items-center gap-2 flex-wrap">
                {/* Filter Buttons */}
                <button
                  onClick={() => setFilterPinned(!filterPinned)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterPinned ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pin className="h-4 w-4" />
                  Pinned
                </button>

                <button
                  onClick={() => setFilterStarred(!filterStarred)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterStarred ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className="h-4 w-4" />
                  Starred
                </button>

                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showArchived ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Archive className="h-4 w-4" />
                  {showArchived ? 'Show Active' : 'Archived'}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="updated">Last Updated</option>
                  <option value="created">Created Date</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                </select>

                {/* More Actions */}
                <div className="relative group">
                  <button className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Manage Categories
                    </button>
                    <button
                      onClick={exportNotes}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Export Notes
                    </button>
                    <label className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Import Notes
                      <input type="file" accept=".json" onChange={importNotes} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Notes ({notes.filter(n => !n.isArchived).length})
              </button>
              {categories.map(category => {
                const IconComponent = iconMap[category.icon] || Book;
                const count = getCategoryStats(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      selectedCategory === category.id
                        ? `bg-${category.color}-600 text-white`
                        : `bg-${category.color}-50 text-${category.color}-700 hover:bg-${category.color}-100`
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    {category.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-gray-500 font-medium">Tags:</span>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notes yet. Start writing!</p>
              </div>
            ) : (
              filteredNotes.map(note => {
                const colorClass = getColorClass(note.color);
                const category = categories.find(c => c.id === note.category);
                const CategoryIcon = category?.icon ? (iconMap[category.icon] || Book) : Book;

                return (
                  <div
                    key={note.id}
                    className={`${colorClass.bg} ${colorClass.border} border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                      note.isPinned ? 'ring-2 ring-purple-400' : ''
                    }`}
                    onClick={() => setCurrentNote(note)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {note.isPinned && <Pin className="h-4 w-4 text-purple-600 fill-current" />}
                        {note.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <CategoryIcon className={`h-4 w-4 text-${category?.color || 'gray'}-600`} />
                        <h3 className={`font-semibold ${colorClass.text} line-clamp-1`}>
                          {note.title || 'Untitled Note'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {note.priority === 'high' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(note.id);
                          }}
                          className="p-1 hover:bg-white/50 rounded"
                        >
                          <Star className={`h-4 w-4 ${note.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>
                      </div>
                    </div>

                    <p className={`text-sm ${colorClass.text} line-clamp-2 mb-2`}>
                      {note.content || 'No content'}
                    </p>

                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-white/50 rounded text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        {note.deadline && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            new Date(note.deadline) < new Date() 
                              ? 'bg-red-100 text-red-700' 
                              : new Date(note.deadline) - new Date() < 24 * 60 * 60 * 1000
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <BellRing className="h-3 w-3" />
                            {new Date(note.deadline).toLocaleDateString()} {new Date(note.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(note.id);
                          }}
                          className="hover:text-purple-600"
                        >
                          <Pin className={`h-3 w-3 ${note.isPinned ? 'fill-current text-purple-600' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleArchive(note.id);
                          }}
                          className="hover:text-blue-600"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Note Editor Modal */}
      {currentNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Editor Header */}
            <div className={`${getColorClass(currentNote.color).bg} border-b-4 ${getColorClass(currentNote.color).border} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentNote({ ...currentNote, isPinned: !currentNote.isPinned })}
                    className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                    title="Pin Note"
                  >
                    <Pin className={`h-5 w-5 ${currentNote.isPinned ? 'fill-current text-purple-600' : 'text-gray-600'}`} />
                  </button>
                  <button
                    onClick={() => setCurrentNote({ ...currentNote, isStarred: !currentNote.isStarred })}
                    className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                    title="Star Note"
                  >
                    <Star className={`h-5 w-5 ${currentNote.isStarred ? 'fill-current text-yellow-500' : 'text-gray-600'}`} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                      title="Change Color"
                    >
                      <Palette className="h-5 w-5 text-gray-600" />
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl p-3 grid grid-cols-5 gap-2 z-10">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            onClick={() => {
                              setCurrentNote({ ...currentNote, color: color.value });
                              setShowColorPicker(false);
                            }}
                            className={`w-8 h-8 rounded-full ${color.bg} ${color.border} border-2 hover:scale-110 transition-transform ${
                              currentNote.color === color.value ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => duplicateNote(currentNote)}
                    className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={saveNote}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setCurrentNote(null)}
                    className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                placeholder="Note Title..."
                value={currentNote.title}
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                className={`w-full px-4 py-3 text-xl font-bold ${getColorClass(currentNote.color).text} bg-white/50 rounded-lg border-2 ${getColorClass(currentNote.color).border} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Category, Priority & Deadline */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={currentNote.category}
                    onChange={(e) => setCurrentNote({ ...currentNote, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={currentNote.priority}
                    onChange={(e) => setCurrentNote({ ...currentNote, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Bell className="h-4 w-4" />
                    Deadline (Email Alerts)
                  </label>
                  <input
                    type="datetime-local"
                    value={currentNote.deadline ? new Date(currentNote.deadline).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCurrentNote({ ...currentNote, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {currentNote.deadline && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Alerts: 1 day, 1 hour, 10 min (×3) before
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentNote.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-indigo-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  placeholder="Write your thoughts..."
                  value={currentNote.content}
                  onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Created: {new Date(currentNote.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(currentNote.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderPlus className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Manage Categories</h2>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Add New Category */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-gray-900">Add New Category</h3>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Category name..."
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.keys(iconMap).map(iconName => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                  <select
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addCategory}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Add Category
                </button>
              </div>

              {/* Existing Categories */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Existing Categories</h3>
                {categories.map(category => {
                  const IconComponent = iconMap[category.icon] || Book;
                  const count = getCategoryStats(category.id);
                  return (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-3 bg-${category.color}-50 border border-${category.color}-200 rounded-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`h-5 w-5 text-${category.color}-600`} />
                        <div>
                          <div className={`font-medium text-${category.color}-900`}>{category.name}</div>
                          <div className="text-xs text-gray-500">{count} notes</div>
                        </div>
                      </div>
                      {!defaultCategories.find(c => c.id === category.id) && (
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalNotes;
