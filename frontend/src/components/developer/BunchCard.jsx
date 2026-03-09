import React, { useState } from 'react';
import { Package, ChevronRight, CheckCircle, Clock, Target, Calendar, TrendingUp, Eye, Sparkles, Users } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import TaskDetailModal from './TaskDetailModal';

const BunchCard = ({ bunch, onTaskUpdate, onAcceptTask, onSubmitTask, onDelegateTask }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTasksModal, setShowTasksModal] = useState(false);

    const getStatusColor = (status) => {
        const colors = {
            'pending-assignment': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
            'assigned': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'in-progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            'review': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            'completed': 'bg-green-500/20 text-green-300 border-green-500/30',
            'blocked': 'bg-red-500/20 text-red-300 border-red-500/30'
        };
        return colors[status] || colors['pending-assignment'];
    };

    const getStatusGradient = (status) => {
        const gradients = {
            'pending-assignment': 'from-zinc-600/20 to-zinc-700/20',
            'assigned': 'from-blue-600/20 to-indigo-700/20',
            'in-progress': 'from-yellow-600/20 to-orange-700/20',
            'review': 'from-purple-600/20 to-pink-700/20',
            'completed': 'from-green-600/20 to-emerald-700/20',
            'blocked': 'from-red-600/20 to-red-700/20'
        };
        return gradients[status] || gradients['pending-assignment'];
    };

    const getPhaseIcon = (phase) => {
        if (phase?.includes('Frontend')) return '🎨';
        if (phase?.includes('Backend')) return '⚙️';
        if (phase?.includes('Testing')) return '🧪';
        if (phase?.includes('DevOps')) return '🚀';
        if (phase?.includes('AI')) return '🤖';
        if (phase?.includes('Documentation')) return '📚';
        return '📦';
    };

    const getTaskStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
            'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'review': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            'completed': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            'cant-complete': 'bg-red-500/20 text-red-300 border-red-500/30'
        };
        return colors[status] || colors['not-started'];
    };

    const getProgressBarColor = (percentage) => {
        if (percentage === 100) return 'from-green-500 to-emerald-600';
        if (percentage >= 70) return 'from-blue-500 to-cyan-600';
        if (percentage >= 40) return 'from-yellow-500 to-orange-600';
        return 'from-purple-500 to-pink-600';
    };

    const completedTasks = bunch.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = bunch.tasks?.length || 0;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate days remaining
    const daysRemaining = bunch.deadline ? Math.ceil((new Date(bunch.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;

    return (
        <>
            <div className={`relative bg-gradient-to-br ${getStatusGradient(bunch.status)} rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/30 group`}>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Bunch Header */}
                <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                            {/* Icon Container */}
                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl border border-white/20 shadow-lg">
                                {getPhaseIcon(bunch.name)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                                    {bunch.name}
                                </h3>

                                <div className="flex items-center gap-2 mb-3">
                                    <Package size={14} className="text-zinc-400 flex-shrink-0" />
                                    <p className="text-sm text-zinc-300 truncate">{bunch.project?.name}</p>
                                </div>

                                {/* Meta Info */}
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                        <Target size={14} className="text-blue-400" />
                                        <span className="text-sm font-semibold">{totalTasks} tasks</span>
                                    </div>

                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm ${isUrgent ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/5 text-zinc-300'
                                        }`}>
                                        <Calendar size={14} className={isUrgent ? 'text-red-400' : 'text-purple-400'} />
                                        <span className="text-sm font-semibold">
                                            {daysRemaining !== null && daysRemaining >= 0
                                                ? `${daysRemaining} days left`
                                                : formatDate(bunch.deadline)
                                            }
                                        </span>
                                    </div>

                                    {bunch.estimatedDuration && (
                                        <div className="flex items-center gap-1.5 text-zinc-300 bg-white/5 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                            <Clock size={14} className="text-yellow-400" />
                                            <span className="text-sm font-semibold">{bunch.estimatedDuration} days</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 ml-4">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-lg ${getStatusColor(bunch.status)}`}>
                                {bunch.status.replace('-', ' ').toUpperCase()}
                            </span>

                            <button
                                onClick={() => setShowTasksModal(true)}
                                className="text-zinc-400 hover:text-white transition-colors bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 p-2 rounded-lg flex items-center gap-2 px-3"
                                title="View all tasks"
                            >
                                <Eye size={18} />
                                <span className="text-xs font-semibold">View Tasks</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="mt-5 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-400" />
                                <span className="text-sm font-semibold text-white">Progress</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{progressPercentage}%</span>
                        </div>

                        {/* Premium Progress Bar */}
                        <div className="relative w-full h-3 bg-zinc-800/50 rounded-full overflow-hidden border border-white/10">
                            <div
                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressBarColor(progressPercentage)} rounded-full transition-all duration-500 shadow-lg`}
                                style={{ width: `${progressPercentage}%` }}
                            >
                                {/* Animated shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                    style={{ backgroundSize: '200% 100%' }} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                            <span className="font-medium">{completedTasks} of {totalTasks} completed</span>
                            {totalTasks - completedTasks > 0 && (
                                <span className="font-semibold text-yellow-400">{totalTasks - completedTasks} remaining</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks Modal */}
            {showTasksModal && bunch.tasks && bunch.tasks.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="relative w-full max-w-5xl my-8 bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 shadow-2xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-b from-zinc-900 to-zinc-900/95 backdrop-blur-xl border-b border-white/10 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
                                        {getPhaseIcon(bunch.name)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{bunch.name}</h2>
                                        <p className="text-sm text-zinc-400">{totalTasks} tasks in this module</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTasksModal(false)}
                                    className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                >
                                    <ChevronRight size={24} className="rotate-90" />
                                </button>
                            </div>
                        </div>

                        {/* Tasks Grid */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bunch.tasks.map((task) => (
                                    <div
                                        key={task._id}
                                        onClick={() => {
                                            setShowTasksModal(false);
                                            setSelectedTask(task);
                                        }}
                                        className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-blue-500/30 hover:bg-zinc-900/70 transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h5 className="font-semibold text-white text-base group-hover:text-blue-300 transition-colors">
                                                        {task.title}
                                                    </h5>
                                                    {task.status === 'completed' && (
                                                        <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} />
                                                    )}
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{task.description}</p>
                                                )}

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTaskStatusColor(task.status)}`}>
                                                        {task.status.replace('-', ' ').toUpperCase()}
                                                    </span>

                                                    {task.priority && (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${task.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                            task.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                                                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                                    'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                                                            }`}>
                                                            {task.priority.toUpperCase()}
                                                        </span>
                                                    )}

                                                    {task.points && (
                                                        <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full">
                                                            {task.points} PTS
                                                        </span>
                                                    )}
                                                </div>

                                                {task.requiredSkills && task.requiredSkills.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {task.requiredSkills.slice(0, 3).map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-lg border border-blue-500/20 font-medium"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {task.requiredSkills.length > 3 && (
                                                            <span className="px-2 py-1 text-zinc-400 text-xs">
                                                                +{task.requiredSkills.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Show delegated to info if task is delegated */}
                                        {task.delegatedBy && task.assignedTo && (
                                            <div className="mt-2 px-2 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                                                <p className="text-blue-300">
                                                    <span className="font-medium">Assigned to:</span> {task.assignedTo.firstName} {task.assignedTo.lastName}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                            <p className="text-xs text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                                                Click for full details →
                                            </p>
                                            {task.status !== 'completed' && onDelegateTask && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelegateTask(task);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-white/10"
                                                >
                                                    <Users size={12} />
                                                    {task.delegatedBy ? 'Re-delegate' : 'Delegate'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onTaskUpdate={onTaskUpdate}
                    onAcceptTask={onAcceptTask}
                    onSubmitTask={onSubmitTask}
                />
            )}
        </>
    );
};

export default BunchCard;
