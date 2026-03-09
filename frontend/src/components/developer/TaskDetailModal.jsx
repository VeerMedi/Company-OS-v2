import React, { useState } from 'react';
import { X, CheckCircle, Clock, Target, Calendar, Award, Zap, AlertCircle, Upload, Play, CheckCheck, RefreshCcw } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const TaskDetailModal = ({ task, onClose, onStatusUpdate, onAcceptTask, onSubmitTask }) => {
    const { user } = useAuth();
    if (!task) return null;

    const getStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
            'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'review': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            'completed': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            'cant-complete': 'bg-red-500/20 text-red-300 border-red-500/30',
            'needs-revision': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        };
        return colors[status] || colors['not-started'];
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'bg-red-500/20 text-red-300 border-red-500/30',
            'high': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            'medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            'low': 'bg-green-500/20 text-green-300 border-green-500/30'
        };
        return colors[priority] || colors['medium'];
    };

    const handleAction = (action) => {
        action();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-b from-zinc-900 to-zinc-900/95 backdrop-blur-xl border-b border-white/10 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                            <h2 className="text-2xl font-bold text-white mb-2">{task.title}</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(task.status)}`}>
                                    {task.status?.replace('-', ' ').toUpperCase()}
                                </span>
                                {task.priority && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                        {task.priority.toUpperCase()} PRIORITY
                                    </span>
                                )}
                                {task.points && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        {task.points} POINTS
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    {task.description && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <Target size={16} />
                                Description
                            </h3>
                            <p className="text-white leading-relaxed">{task.description}</p>
                        </div>
                    )}

                    {/* Revision Feedback */}
                    {task.status === 'needs-revision' && task.revisionHistory && task.revisionHistory.length > 0 && (
                        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                            <h3 className="text-sm font-bold text-orange-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <RefreshCcw size={16} />
                                Revision Requested
                            </h3>
                            <p className="text-white">{task.revisionHistory[task.revisionHistory.length - 1].feedback}</p>
                            <p className="text-xs text-orange-400/70 mt-2">
                                Please address the feedback and resubmit your work.
                            </p>
                        </div>
                    )}

                    {/* Task Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {task.deadline && (
                            <div className="bg-gradient-to-br from-blue-600/10 to-blue-700/10 rounded-xl p-4 border border-blue-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-3 rounded-lg">
                                        <Calendar size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-300 font-semibold mb-1">Due Date</p>
                                        <p className="text-white font-bold">{formatDate(task.deadline)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {task.estimatedTime && (
                            <div className="bg-gradient-to-br from-purple-600/10 to-purple-700/10 rounded-xl p-4 border border-purple-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-3 rounded-lg">
                                        <Clock size={20} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-300 font-semibold mb-1">Estimated Time</p>
                                        <p className="text-white font-bold">{task.estimatedTime}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Required Skills */}
                    {task.requiredSkills && task.requiredSkills.length > 0 && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Zap size={16} />
                                Required Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {task.requiredSkills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-blue-500/10 text-blue-300 text-sm rounded-lg border border-blue-500/20 font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned By Info */}
                    {task.assignedBy && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wide mb-2">
                                Assigned By
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold">
                                    {task.assignedBy.firstName?.charAt(0)}{task.assignedBy.lastName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">
                                        {task.assignedBy.firstName} {task.assignedBy.lastName}
                                    </p>
                                    <p className="text-xs text-zinc-400">{task.assignedBy.designation}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    {task.additionalInfo && (
                        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                            <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <AlertCircle size={16} />
                                Additional Information
                            </h3>
                            <p className="text-zinc-300 text-sm">{task.additionalInfo}</p>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                {/* Hide action buttons if task is delegated OR if already completed */}
                {task.status !== 'completed' && !task.delegatedBy && (
                    <div className="sticky bottom-0 bg-gradient-to-t from-zinc-900 to-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-6">
                        <div className="flex gap-3">{['not-started', 'assigned', 'pending-assignment'].includes(task.status) && (
                                <button
                                    onClick={() => handleAction(() => onAcceptTask && onAcceptTask(task._id))}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30"
                                >
                                    <Play size={20} />
                                    Start Task
                                </button>
                            )}
                            {task.status === 'in-progress' && (
                                <>
                                    <button
                                        onClick={() => handleAction(() => onSubmitTask && onSubmitTask(task._id))}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/30"
                                    >
                                        <Upload size={20} />
                                        Submit Evidence
                                    </button>
                                    <button
                                        onClick={() => handleAction(() => onStatusUpdate && onStatusUpdate(task._id, 'completed'))}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30"
                                    >
                                        <CheckCheck size={20} />
                                        Mark Complete
                                    </button>
                                </>
                            )}
                            {task.status === 'needs-revision' && (
                                <button
                                    onClick={() => handleAction(() => onSubmitTask && onSubmitTask(task._id))}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/30"
                                >
                                    <RefreshCcw size={20} />
                                    Resubmit Task
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Show message if task is delegated */}
                {task.delegatedBy && task.assignedTo && (
                    <div className="sticky bottom-0 bg-gradient-to-t from-zinc-900 to-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-6">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-blue-300 text-center">
                                <span className="font-semibold">Task delegated to:</span> {task.assignedTo.firstName} {task.assignedTo.lastName}
                            </p>
                            <p className="text-zinc-400 text-sm text-center mt-1">
                                Only the assigned intern can work on this task
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetailModal;
