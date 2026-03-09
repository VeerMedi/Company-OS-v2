import React, { useState, useEffect } from 'react';
import {
    Package,
    Users,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    UserPlus,
    Sparkles,
    Target
} from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';
import { formatDate } from '../../utils/helpers';

const BunchManagement = ({ projectId }) => {
    const [bunches, setBunches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBunch, setExpandedBunch] = useState(null);
    const [assigningBunch, setAssigningBunch] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState('');

    useEffect(() => {
        if (projectId) {
            fetchBunches();
            fetchEmployees();
        }
    }, [projectId]);

    const fetchBunches = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projects/${projectId}/bunches`);
            if (response.data.success) {
                setBunches(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching bunches:', error);
            toast.error('Failed to load task bunches');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/users/individuals');
            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleAssignBunch = async () => {
        if (!selectedEmployee) {
            toast.error('Please select an employee');
            return;
        }

        try {
            const response = await api.post(
                `/projects/${projectId}/bunches/${assigningBunch}/assign`,
                { employeeId: selectedEmployee }
            );

            if (response.data.success) {
                toast.success('Bunch assigned successfully');
                fetchBunches();
                setAssigningBunch(null);
                setSelectedEmployee('');
            }
        } catch (error) {
            console.error('Error assigning bunch:', error);
            toast.error(error.response?.data?.message || 'Failed to assign bunch');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-gray-500/10 text-gray-500',
            'in-progress': 'bg-primary/10 text-primary',
            'completed': 'bg-green-500/10 text-green-500',
            'blocked': 'bg-red-500/10 text-red-500'
        };
        return colors[status] || colors['not-started'];
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
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (bunches.length === 0) {
        return (
            <div className="dashboard-card p-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Task Bunches</h3>
                <p className="text-muted-foreground">Task bunches will appear here after AI generation</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">AI-Generated Task Bunches</h2>
                    <p className="text-sm text-muted-foreground">Assign parallel execution phases to team members</p>
                </div>
            </div>

            {/* Bunches Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {bunches.map((bunch) => {
                    const isExpanded = expandedBunch === bunch._id;
                    const isAssigning = assigningBunch === bunch._id;

                    return (
                        <div key={bunch._id} className="dashboard-card overflow-hidden">
                            {/* Bunch Header */}
                            <div
                                className="p-5 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setExpandedBunch(isExpanded ? null : bunch._id)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-2xl">{getPhaseIcon(bunch.name)}</span>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-foreground">{bunch.name}</h3>
                                            <p className="text-sm text-muted-foreground">{bunch.phase}</p>
                                        </div>
                                    </div>
                                    <button className="p-1 hover:bg-muted rounded-lg">
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tasks</p>
                                            <p className="text-sm font-semibold text-foreground">{bunch.tasks?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-orange-500" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Progress</p>
                                            <p className="text-sm font-semibold text-foreground">{bunch.progress || 0}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-green-500" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Assigned</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {bunch.assignedTo?.firstName || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bunch.status)}`}>
                                        {bunch.status?.replace('-', ' ').toUpperCase() || 'NOT STARTED'}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="px-5 pb-5 pt-0 border-t border-border bg-muted/30">
                                    <div className="space-y-4 mt-4">
                                        {/* Tasks List */}
                                        {bunch.tasks && bunch.tasks.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                                    <Target className="h-4 w-4" />
                                                    Microtasks ({bunch.tasks.length})
                                                </p>
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {bunch.tasks.map((task, idx) => (
                                                        <div
                                                            key={task._id || idx}
                                                            className="p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-foreground mb-1">
                                                                        {task.title}
                                                                    </p>
                                                                    {task.description && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                                            {task.description}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex items-center gap-3 mt-2">
                                                                        {task.complexity && (
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.complexity === 'High' ? 'bg-red-500/10 text-red-500' :
                                                                                task.complexity === 'Low' ? 'bg-green-500/10 text-green-500' :
                                                                                    'bg-yellow-500/10 text-yellow-500'
                                                                                }`}>
                                                                                {task.complexity}
                                                                            </span>
                                                                        )}
                                                                        {task.points && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {task.points} pts
                                                                            </span>
                                                                        )}
                                                                        {task.assignedTo && (
                                                                            <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded ml-auto">
                                                                                <Users className="h-3 w-3" />
                                                                                {typeof task.assignedTo === 'object' ? `${task.assignedTo.firstName}` : 'Assigned'}
                                                                                {task.delegatedBy && task.delegatedBy._id !== (typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo) && (
                                                                                    <span className="text-muted-foreground ml-1">
                                                                                        (delegated by {task.delegatedBy.firstName})
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Required Skills */}
                                        {bunch.requiredSkills && bunch.requiredSkills.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-2">Required Skills:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {bunch.requiredSkills.map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                                                        >
                                                            {skill}
                                                        </span>
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

                                        {/* Assign Button */}
                                        {!isAssigning ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAssigningBunch(bunch._id);
                                                }}
                                                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                {bunch.assignedTo ? 'Reassign Bunch' : 'Assign Bunch'}
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <select
                                                    value={selectedEmployee}
                                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                                    className="input-modern w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="">Select an employee...</option>
                                                    {employees.map((emp) => (
                                                        <option key={emp._id} value={emp._id}>
                                                            {emp.firstName} {emp.lastName} - {emp.role}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAssignBunch();
                                                        }}
                                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssigningBunch(null);
                                                            setSelectedEmployee('');
                                                        }}
                                                        className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BunchManagement;
