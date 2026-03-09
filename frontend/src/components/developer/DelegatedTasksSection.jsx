import React from 'react';
import { Users, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const DelegatedTasksSection = ({ delegatedTasks, loading }) => {
    const getStatusBadge = (status) => {
        const badges = {
            'not-started': { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'Not Started', icon: Clock },
            'in-progress': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'In Progress', icon: Clock },
            'review': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'Under Review', icon: Eye },
            'completed': { color: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Completed', icon: CheckCircle },
            'cant-complete': { color: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Can\'t Complete', icon: AlertCircle }
        };
        return badges[status] || badges['not-started'];
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'low': 'border-l-green-500',
            'medium': 'border-l-yellow-500',
            'high': 'border-l-orange-500',
            'critical': 'border-l-red-500'
        };
        return colors[priority] || colors['medium'];
    };

    if (loading) {
        return (
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                <div className="flex items-center space-x-3 mb-6">
                    <Users className="h-6 w-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Tasks I've Delegated</h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (!delegatedTasks || delegatedTasks.length === 0) {
        return null; // Don't show section if no delegated tasks
    }

    return (
        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center space-x-3 mb-6">
                <Users className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Tasks I've Delegated</h2>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-sm font-semibold">
                    {delegatedTasks.length}
                </span>
            </div>

            <div className="space-y-4">
                {delegatedTasks.map((task) => {
                    const statusBadge = getStatusBadge(task.status);
                    const StatusIcon = statusBadge.icon;

                    return (
                        <div
                            key={task._id}
                            className={`bg-zinc-800/50 border-l-4 ${getPriorityColor(task.priority)} rounded-lg p-5 hover:bg-zinc-800/70 transition-colors`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold text-lg mb-2">{task.title}</h3>
                                    {task.description && (
                                        <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Delegated To Info */}
                            <div className="flex items-center gap-2 mb-3 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2">
                                <Users className="h-4 w-4 text-purple-300" />
                                <span className="text-sm text-purple-200">
                                    Delegated to: <span className="font-semibold">{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span>
                                </span>
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs font-medium ml-auto">
                                    {task.assignedTo?.role}
                                </span>
                            </div>

                            {/* Footer - Status & Metadata */}
                            <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                                <div className="flex items-center gap-4">
                                    {/* Status Badge */}
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusBadge.color}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        <span className="text-xs font-semibold">{statusBadge.text}</span>
                                    </div>

                                    {/* Priority Badge */}
                                    <span className="px-2 py-1 bg-zinc-700/50 text-zinc-300 rounded text-xs font-medium capitalize">
                                        {task.priority} Priority
                                    </span>

                                    {/* Points */}
                                    {task.points && (
                                        <span className="px-2 py-1 bg-amber-500/10 text-amber-300 rounded text-xs font-medium">
                                            {task.points} pts
                                        </span>
                                    )}
                                </div>

                                {/* Delegated Time */}
                                <div className="text-xs text-zinc-500">
                                    Delegated {formatDate(task.delegatedAt)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DelegatedTasksSection;
