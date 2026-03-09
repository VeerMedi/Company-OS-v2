import React, { useState, useEffect } from 'react';
import { X, Calendar, Award, User, Clock, CheckCircle, Play, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { showToast as toast } from '../utils/toast';
import { formatDate } from '../utils/helpers';

const TaskDetailModal = ({ taskId, isOpen, onClose, onTaskUpdate }) => {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);

    // Evidence submission state
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [submittingEvidence, setSubmittingEvidence] = useState(false);

    // Notes State
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchTaskDetails();
        }
    }, [isOpen, taskId]);

    const fetchTaskDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/tasks/${taskId}/details`);
            if (response.data.success) {
                setTask(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching task details:', error);
            toast.error('Failed to load task details');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTask = async () => {
        try {
            const response = await api.put(`/tasks/${taskId}/status`, {
                status: 'in-progress'
            });

            if (response.data.success) {
                toast.success('Task started successfully!');
                setTask({ ...task, status: 'in-progress' });
                if (onTaskUpdate) {
                    onTaskUpdate(taskId, 'in-progress');
                }
            }
        } catch (error) {
            console.error('Error starting task:', error);
            toast.error('Failed to start task');
        }
    };

    const handleSubmitEvidence = async () => {
        try {
            setSubmittingEvidence(true);

            const formData = new FormData();
            formData.append('verificationUrl', evidenceUrl);

            if (evidenceFile) {
                formData.append('verificationImage', evidenceFile);
            }

            const response = await api.put(`/tasks/${taskId}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                toast.success('Evidence submitted successfully!');
                setTask({ ...task, status: 'review' });
                setEvidenceUrl('');
                setEvidenceFile(null);
                if (onTaskUpdate) {
                    onTaskUpdate(taskId, 'review');
                }
                // Close modal after successful submission
                setTimeout(() => onClose(), 1500);
            }
        } catch (error) {
            console.error('Error submitting evidence:', error);
            toast.error(error.response?.data?.message || 'Failed to submit evidence');
        } finally {
            setSubmittingEvidence(false);
        }
    };

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;

        try {
            setAddingNote(true);
            const response = await api.post(`/tasks/${taskId}/comments`, {
                comment: newNote
            });

            if (response.data.success) {
                toast.success('Note added successfully');
                setNewNote('');
                // Refresh task details to show new note
                fetchTaskDetails();
            }
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error('Failed to add note');
        } finally {
            setAddingNote(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'completed': 'bg-green-500/20 text-green-300 border-green-500/30',
            'review': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            'needs-revision': 'bg-red-500/20 text-red-300 border-red-500/30'
        };
        return colors[status] || colors['not-started'];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-10">
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[calc(100vh-5rem)] overflow-hidden my-auto flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : task ? (
                    <>
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-white/10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                                        {task.status?.replace('-', ' ').toUpperCase()}
                                    </span>
                                    {task.priority && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.priority === 'high' || task.priority === 'urgent'
                                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                            : task.priority === 'medium'
                                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                : 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            }`}>
                                            {task.priority.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-white">{task.title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Task Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Deadline</span>
                                    </div>
                                    <p className="text-white font-semibold">
                                        {task.deadline ? formatDate(task.deadline) : 'No deadline'}
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                        <Award className="h-4 w-4" />
                                        <span>Points</span>
                                    </div>
                                    <p className="text-white font-semibold">
                                        {task.points || 0} pts
                                    </p>
                                </div>

                                {task.assignedBy && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                            <User className="h-4 w-4" />
                                            <span>Assigned By</span>
                                        </div>
                                        <p className="text-white font-semibold">
                                            {task.assignedBy.firstName} {task.assignedBy.lastName}
                                        </p>
                                    </div>
                                )}

                                {task.project && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                            <Clock className="h-4 w-4" />
                                            <span>Project</span>
                                        </div>
                                        <p className="text-white font-semibold">
                                            {task.project.name}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    Description
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                        {task.description || 'No description provided'}
                                    </p>
                                </div>
                            </div>

                            {/* Revision Feedback - Only if needs-revision */}
                            {task.status === 'needs-revision' && task.revisionHistory && task.revisionHistory.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5" />
                                        Revision Requested
                                    </h3>
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                        <p className="text-xs font-bold text-orange-400 uppercase mb-2">
                                            Latest Feedback
                                        </p>
                                        <p className="text-zinc-200 leading-relaxed">
                                            {task.revisionHistory[task.revisionHistory.length - 1].feedback}
                                        </p>
                                        {task.revisionHistory[task.revisionHistory.length - 1].newDeadline && (
                                            <div className="mt-3 pt-3 border-t border-orange-500/20 flex items-center gap-2 text-orange-300 text-sm">
                                                <Calendar className="h-4 w-4" />
                                                <span>New Deadline: {formatDate(task.revisionHistory[task.revisionHistory.length - 1].newDeadline)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Required Skills */}
                            {task.requiredSkills && task.requiredSkills.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {task.requiredSkills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-sm font-medium border border-blue-500/30"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Evidence Submission - Only for in-progress or needs-revision tasks */}
                            {(task.status === 'in-progress' || task.status === 'needs-revision') && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-bold text-white mb-3">Submit Evidence</h3>
                                    <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Verification URL (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                value={evidenceUrl}
                                                onChange={(e) => setEvidenceUrl(e.target.value)}
                                                placeholder="https://github.com/repo or https://deployed-url.com"
                                                className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Upload Screenshot (Optional)
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setEvidenceFile(e.target.files[0])}
                                                className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30 transition-all"
                                            />
                                            {evidenceFile && (
                                                <p className="mt-2 text-xs text-zinc-400">
                                                    Selected: {evidenceFile.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes Section used to be here, moving to own section block */}
                            <div className="mt-8 border-t border-white/10 pt-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-purple-400" />
                                    Notes & Updates
                                </h3>

                                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {task.comments && task.comments.length > 0 ? (
                                        task.comments.map((note, index) => (
                                            <div key={index} className="bg-zinc-800/50 rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-300 font-bold">
                                                        {note.user?.firstName?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-sm font-medium text-zinc-300">
                                                        {note.user?.firstName} {note.user?.lastName}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 ml-auto">
                                                        {formatDate(note.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-400 pl-8">{note.text}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-500 italic text-center py-2">No notes added yet.</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a note or update..."
                                        className="flex-1 bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveNote()}
                                    />
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={addingNote || !newNote.trim()}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {addingNote ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 flex gap-3">
                            {task.status === 'not-started' || task.status === 'assigned' || task.status === 'pending-assignment' ? (
                                <button
                                    onClick={handleStartTask}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Play className="h-5 w-5" />
                                    Start Task
                                </button>
                            ) : (task.status === 'in-progress' || task.status === 'needs-revision') ? (
                                <button
                                    onClick={handleSubmitEvidence}
                                    disabled={submittingEvidence || (!evidenceUrl && !evidenceFile)}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingEvidence ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5" />
                                            {task.status === 'needs-revision' ? 'Resubmit Evidence' : 'Submit Evidence & Complete'}
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex-1 px-6 py-3 bg-green-500/20 text-green-300 rounded-xl font-semibold border border-green-500/30 flex items-center justify-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Task Completed
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-white/5 text-zinc-300 rounded-xl font-semibold hover:bg-white/10 transition-colors border border-white/10"
                            >
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-6 text-center text-zinc-400">
                        <p>Failed to load task details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetailModal;
