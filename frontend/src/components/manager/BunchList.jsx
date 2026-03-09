import React, { useState, useEffect } from 'react';
import {
    Package,
    Users,
    User,
    ChevronDown,
    ChevronUp,
    UserPlus,
    CheckCircle,
    Clock,
    AlertCircle,
    Target,
    UserX,
    Crown,
    FileText,
    UserCheck,
    Eye,
    RefreshCw,
    X,
    Award
} from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';
import { formatDate } from '../../utils/helpers';
import AssignBunchModal from './AssignBunchModal';
import AssignTaskModal from './AssignTaskModal';

const BunchList = () => {
    const [bunches, setBunches] = useState([]);
    const [executiveTasks, setExecutiveTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBunch, setExpandedBunch] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showTaskAssignModal, setShowTaskAssignModal] = useState(false);
    const [selectedBunch, setSelectedBunch] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedExecutiveTask, setSelectedExecutiveTask] = useState(null);
    const [showExecutiveTaskModal, setShowExecutiveTaskModal] = useState(false);
    const [developers, setDevelopers] = useState([]);
    const [redelegateLoading, setRedelegateLoading] = useState(false);
    const [newAssignee, setNewAssignee] = useState('');

    useEffect(() => {
        fetchAllBunches();
        fetchExecutiveTasks();
        fetchDevelopers();
    }, []);

    const fetchAllBunches = async () => {
        try {
            setLoading(true);
            // Fetch all bunches for manager's projects
            const response = await api.get('/task-bunches/manager-bunches');
            console.log('📦 Task Bunches API Response:', response.data);
            console.log('📦 Number of bunches:', response.data.data?.length || 0);
            console.log('📦 Bunches data:', response.data.data);
            if (response.data.success) {
                setBunches(response.data.data);
            }
        } catch (error) {
            console.error('❌ Error fetching bunches:', error);
            console.error('❌ Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to load task bunches');
        } finally {
            setLoading(false);
        }
    };

    const fetchExecutiveTasks = async () => {
        try {
            const response = await api.get('/executive-tasks/my-tasks');
            console.log('🎯 Executive Tasks Response:', response.data);
            if (response.data.success) {
                // Show ALL executive tasks that have been delegated (converted to regular tasks)
                const delegatedTasks = response.data.data.filter(
                    task => task.status === 'delegated' && task.delegatedTask
                );
                console.log('🎯 Delegated Tasks:', delegatedTasks);
                setExecutiveTasks(delegatedTasks);
            }
        } catch (error) {
            console.error('Error fetching executive tasks:', error);
            // Silent fail - executive tasks are optional
        }
    };

    const fetchDevelopers = async () => {
        try {
            // Fetch developers and interns separately and combine
            const [devResponse, internResponse] = await Promise.all([
                api.get('/users?role=developer'),
                api.get('/users?role=intern')
            ]);

            const developers = devResponse.data.data?.users || devResponse.data.users || devResponse.data.data || [];
            const interns = internResponse.data.data?.users || internResponse.data.users || internResponse.data.data || [];

            // Combine and sort by name
            const allUsers = [...developers, ...interns].sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
            );

            setDevelopers(allUsers);
        } catch (error) {
            console.error('Error fetching developers:', error);
            // Silent fail - executive tasks are optional
        }
    };

    const handleAssignBunch = (bunch) => {
        setSelectedBunch(bunch);
        setShowAssignModal(true);
    };

    const handleAssignTask = (bunch, task) => {
        setSelectedBunch(bunch);
        setSelectedTask(task);
        setShowTaskAssignModal(true);
    };

    const handleAssignmentComplete = () => {
        fetchAllBunches(); // Refresh the list after assignment
        setShowAssignModal(false); // Close bunch assignment modal
        setShowTaskAssignModal(false); // Close task assignment modal
        setSelectedBunch(null);
        setSelectedTask(null);
    };

    const handleUnassignBunch = async (bunch) => {
        try {
            const response = await api.put(`/task-bunches/${bunch._id}/unassign`);
            if (response.data.success) {
                toast.success('Bunch unassigned successfully');
                fetchAllBunches();
            }
        } catch (error) {
            console.error('Error unassigning bunch:', error);
            toast.error(error.response?.data?.message || 'Failed to unassign bunch');
        }
    };

    const handleUnassignTask = async (taskId) => {
        try {
            const response = await api.put(`/tasks/${taskId}/unassign`);
            if (response.data.success) {
                toast.success('Task unassigned successfully');
                fetchAllBunches();
            }
        } catch (error) {
            console.error('Error unassigning task:', error);
            toast.error(error.response?.data?.message || 'Failed to unassign task');
        }
    };

    const handleViewExecutiveTask = (task) => {
        setSelectedExecutiveTask(task);
        setNewAssignee(task.delegatedTask.assignedTo?._id || '');
        setShowExecutiveTaskModal(true);
    };

    const handleRedelegateTask = async () => {
        if (!newAssignee) {
            toast.error('Please select a developer');
            return;
        }

        try {
            setRedelegateLoading(true);
            const response = await api.put(`/tasks/${selectedExecutiveTask.delegatedTask._id}`, {
                assignedTo: newAssignee
            });

            if (response.data.success) {
                toast.success('Task redelegated successfully');
                setShowExecutiveTaskModal(false);
                fetchExecutiveTasks();
            }
        } catch (error) {
            console.error('Error redelegating task:', error);
            toast.error(error.response?.data?.message || 'Failed to redelegate task');
        } finally {
            setRedelegateLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending-assignment': 'bg-gray-500/10 text-gray-500',
            'assigned': 'bg-blue-500/10 text-blue-500',
            'in-progress': 'bg-primary/10 text-primary',
            'completed': 'bg-green-500/10 text-green-500',
            'blocked': 'bg-red-500/10 text-red-500'
        };
        return colors[status] || colors['pending-assignment'];
    };

    const getPhaseIcon = (phase) => {
        const icons = {
            'Frontend Development': '🎨',
            'Backend Development': '⚙️',
            'Full Stack Development': '💻',
            'AI Functionalities': '🤖',
            'Testing & QA': '🧪',
            'DevOps & Deployment': '🚀',
            'Integration': '🔗',
            'Database & Architecture': '🗄️',
            'Security & Performance': '🔒',
            'Documentation': '📚'
        };
        return icons[phase] || '📦';
    };

    if (loading) {
        return (
            <div className="dashboard-card p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-3 text-muted-foreground">Loading bunches...</p>
                </div>
            </div>
        );
    }

    if (bunches.length === 0 && executiveTasks.length === 0) {
        return (
            <div className="dashboard-card p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Task Bunches</h3>
                <p className="text-sm text-muted-foreground">Create an AI-automated project to generate task bunches</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Executive Tasks Bunch - Tasks from CEO/Co-Founder */}
            {executiveTasks.length > 0 && (
                <div className="dashboard-card overflow-hidden border-2 border-green-500/30 bg-gradient-to-br from-green-900/20 to-transparent">
                    {/* Executive Bunch Header */}
                    <div
                        className="p-4 cursor-pointer hover:bg-green-500/5 transition-colors"
                        onClick={() => setExpandedBunch(expandedBunch === 'executive' ? null : 'executive')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Crown className="h-6 w-6 text-green-400" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-green-400">Tasks Created by CEO/Co-Founder</h3>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                            {executiveTasks.length} {executiveTasks.length === 1 ? 'TASK' : 'TASKS'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Tasks delegated from executive assignments
                                    </p>
                                </div>
                            </div>
                            <button className="p-1 hover:bg-green-500/10 rounded-lg">
                                {expandedBunch === 'executive' ? (
                                    <ChevronUp className="h-5 w-5 text-green-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-green-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Expanded Executive Tasks */}
                    {expandedBunch === 'executive' && (
                        <div className="px-4 pb-4 pt-0 border-t border-green-500/20 bg-green-900/10">
                            <div className="space-y-3 mt-4">
                                {executiveTasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                                <h4 className="text-base font-semibold text-white">{task.description}</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                                                <div className="flex items-center text-gray-400">
                                                    <UserCheck className="h-4 w-4 mr-2 text-blue-400" />
                                                    <span>From: <span className="text-white">{task.assignedBy?.firstName} {task.assignedBy?.lastName}</span></span>
                                                </div>

                                                {task.projectId && (
                                                    <div className="flex items-center text-gray-400">
                                                        <FileText className="h-4 w-4 mr-2 text-green-400" />
                                                        <span>Project: <span className="text-white">{task.projectId.name}</span></span>
                                                    </div>
                                                )}

                                                <div className="flex items-center text-gray-400">
                                                    <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                                                    <span>CEO Deadline: <span className="text-white">{new Date(task.executiveDeadline).toLocaleDateString()}</span></span>
                                                </div>

                                                <div className="flex items-center text-gray-400">
                                                    <Users className="h-4 w-4 mr-2 text-green-400" />
                                                    <span>Assigned to: <span className="text-white">
                                                        {task.delegatedTask.assignedTo
                                                            ? `${task.delegatedTask.assignedTo.firstName} ${task.delegatedTask.assignedTo.lastName}`
                                                            : 'Unknown'}
                                                    </span></span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-green-500/20">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Developer Deadline:</span>
                                                    <span className="text-white font-medium">{new Date(task.delegatedTask.deadline).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => handleViewExecutiveTask(task)}
                                                    className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleViewExecutiveTask(task)}
                                                    className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                    Redelegate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {bunches.map((bunch) => {
                const isExpanded = expandedBunch === bunch._id;

                return (
                    <div key={bunch._id} className="dashboard-card overflow-hidden">
                        {/* Bunch Header */}
                        <div
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedBunch(isExpanded ? null : bunch._id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-2xl">{getPhaseIcon(bunch.name)}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-foreground">{bunch.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bunch.status)}`}>
                                                {bunch.status?.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {bunch.project?.name} • {bunch.tasks?.length || 0} tasks
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {bunch.assignedTo ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
                                                <Users className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-medium text-primary">
                                                    {bunch.assignedTo.firstName} {bunch.assignedTo.lastName}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnassignBunch(bunch);
                                                }}
                                                className="px-2 py-1 text-xs bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1"
                                                title="Unassign bunch"
                                            >
                                                <UserX className="h-3 w-3" />
                                                Unassign
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-lg">
                                            Unassigned
                                        </span>
                                    )}
                                    <button className="p-1 hover:bg-muted rounded-lg">
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/30">
                                <div className="space-y-4 mt-4">
                                    {/* Tasks List */}
                                    {bunch.tasks && bunch.tasks.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Microtasks ({bunch.tasks.length})
                                            </p>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                {bunch.tasks.map((task, idx) => (
                                                    <div
                                                        key={task._id || idx}
                                                        className={`p-3 bg-card rounded-lg border transition-colors ${task.assignedTo
                                                            ? 'border-blue-500/50 hover:border-blue-500'
                                                            : 'border-border hover:border-primary/30'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {task.title}
                                                                    </p>
                                                                    {task.metadata?.isExecutiveTask && (
                                                                        <>
                                                                            <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-lg shadow-orange-500/30">
                                                                                NEW
                                                                            </span>
                                                                            <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg shadow-purple-500/30">
                                                                                {task.metadata.createdByRole === 'ceo' ? 'CEO Task' : 'Co-Founder Task'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {task.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center flex-wrap gap-2">
                                                                    {task.priority && (
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                                                                            task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                'bg-green-500/10 text-green-500'
                                                                            }`}>
                                                                            {task.priority}
                                                                        </span>
                                                                    )}
                                                                    {task.points && (
                                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                                            {task.points} pts
                                                                        </span>
                                                                    )}

                                                                    {/* Status Badge - Shows "assigned" in blue if task is assigned */}
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.assignedTo
                                                                        ? 'bg-blue-500/10 text-blue-500'
                                                                        : task.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                                            task.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                task.status === 'review' ? 'bg-purple-500/10 text-purple-500' :
                                                                                    'bg-gray-500/10 text-gray-500'
                                                                        }`}>
                                                                        {task.assignedTo ? 'assigned' : (task.status?.replace('-', ' ') || 'not started')}
                                                                    </span>

                                                                    {task.assignedTo && (
                                                                        <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                                                            <User className="h-3 w-3" />
                                                                            {task.assignedTo.firstName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {task.assignedTo && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUnassignTask(task._id);
                                                                        }}
                                                                        className="px-2 py-1.5 text-xs bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1"
                                                                        title="Unassign task"
                                                                    >
                                                                        <UserX className="h-3 w-3" />
                                                                        Unassign
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAssignTask(bunch, task);
                                                                    }}
                                                                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0"
                                                                >
                                                                    {task.assignedTo ? 'Reassign' : 'Assign'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatDate(bunch.startDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatDate(bunch.deadline)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Required Skills */}
                                    {bunch.requiredSkills && bunch.requiredSkills.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Required Skills:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {bunch.requiredSkills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assign Bunch Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssignBunch(bunch);
                                        }}
                                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {bunch.assignedTo ? 'Reassign Bunch' : 'Assign Bunch'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Modals */}
            {showAssignModal && (
                <AssignBunchModal
                    bunch={selectedBunch}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={handleAssignmentComplete}
                />
            )}

            {showTaskAssignModal && (
                <AssignTaskModal
                    bunch={selectedBunch}
                    task={selectedTask}
                    onClose={() => setShowTaskAssignModal(false)}
                    onSuccess={handleAssignmentComplete}
                />
            )}

            {/* Executive Task Detail and Redelegate Modal */}
            {showExecutiveTaskModal && selectedExecutiveTask && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ isolation: 'isolate' }}>
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-green-500/30">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-4 py-2.5 border-b border-green-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-green-400" />
                                <h2 className="text-lg font-bold text-white">Executive Task Details</h2>
                            </div>
                            <button
                                onClick={() => setShowExecutiveTaskModal(false)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 space-y-3">
                            {/* Task Description */}
                            <div>
                                <h3 className="text-xs font-medium text-gray-400 mb-1.5">Task Description</h3>
                                <p className="text-sm text-white font-semibold bg-green-900/20 p-2.5 rounded-lg border border-green-500/20">
                                    {selectedExecutiveTask.description}
                                </p>
                            </div>

                            {/* Task Information Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserCheck className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm text-gray-400">Assigned By</span>
                                    </div>
                                    <p className="text-white font-medium">
                                        {selectedExecutiveTask.assignedBy?.firstName} {selectedExecutiveTask.assignedBy?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{selectedExecutiveTask.assignedBy?.role}</p>
                                </div>

                                {selectedExecutiveTask.projectId && (
                                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-4 w-4 text-green-400" />
                                            <span className="text-sm text-gray-400">Project</span>
                                        </div>
                                        <p className="text-white font-medium">{selectedExecutiveTask.projectId.name}</p>
                                        <p className="text-xs text-gray-500">{selectedExecutiveTask.projectId.clientName}</p>
                                    </div>
                                )}

                                <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-4 w-4 text-yellow-400" />
                                        <span className="text-sm text-gray-400">CEO Deadline</span>
                                    </div>
                                    <p className="text-white font-medium">
                                        {new Date(selectedExecutiveTask.executiveDeadline).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>

                                <div className="bg-black/30 p-2.5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-4 w-4 text-orange-400" />
                                        <span className="text-sm text-gray-400">Developer Deadline</span>
                                    </div>
                                    <p className="text-white font-medium">
                                        {new Date(selectedExecutiveTask.delegatedTask.deadline).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Current Assignment */}
                            <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 p-3 rounded-lg border border-blue-500/30">
                                <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Currently Assigned To
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-semibold">
                                            {selectedExecutiveTask.delegatedTask.assignedTo?.firstName} {selectedExecutiveTask.delegatedTask.assignedTo?.lastName}
                                        </p>
                                        <p className="text-sm text-gray-400 capitalize">
                                            {selectedExecutiveTask.delegatedTask.assignedTo?.role}
                                        </p>
                                    </div>
                                    {selectedExecutiveTask.delegatedTask.points && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-lg">
                                            <Award className="h-4 w-4 text-blue-400" />
                                            <span className="text-blue-400 font-medium">{selectedExecutiveTask.delegatedTask.points} pts</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Redelegate Section */}
                            <div className="bg-gradient-to-r from-green-900/20 to-green-800/10 p-3 rounded-lg border border-green-500/30">
                                <h3 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Redelegate Task
                                </h3>
                                <p className="text-xs text-gray-400 mb-2">Click on a team member to reassign this task</p>

                                <div className="space-y-2">
                                    {/* All Developers/Interns List */}
                                    <div className="max-h-40 overflow-y-auto space-y-2 bg-black/20 p-3 rounded-lg border border-white/10">
                                        <p className="text-xs text-gray-400 mb-2 sticky top-0 bg-black/40 py-1 rounded">Available Team Members ({developers.length})</p>
                                        {developers.map((dev) => (
                                            <div
                                                key={dev._id}
                                                className={`p-2 rounded-lg border transition-all cursor-pointer ${newAssignee === dev._id
                                                        ? 'bg-green-500/20 border-green-500/50'
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    }`}
                                                onClick={() => setNewAssignee(dev._id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-white font-medium">
                                                            {dev.firstName} {dev.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-400 capitalize">{dev.role}</p>
                                                    </div>
                                                    {newAssignee === dev._id && (
                                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleRedelegateTask}
                                        disabled={redelegateLoading || !newAssignee || newAssignee === selectedExecutiveTask.delegatedTask.assignedTo?._id}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium shadow-lg">
                                        {redelegateLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Redelegating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4" />
                                                <span>Redelegate Task</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BunchList;
