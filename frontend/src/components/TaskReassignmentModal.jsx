import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import ModernButton from './ModernButton';

const TaskReassignmentModal = ({
    isOpen,
    onClose,
    leaveId,
    employeeName,
    leaveStartDate,
    leaveEndDate,
    onReassignmentComplete
}) => {
    const [affectedTasks, setAffectedTasks] = useState([]);
    const [availableAssignees, setAvailableAssignees] = useState([]);
    const [reassignments, setReassignments] = useState({});
    const [notes, setNotes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && leaveId) {
            fetchAffectedTasks();
        }
    }, [isOpen, leaveId]);

    const fetchAffectedTasks = async () => {
        setIsLoading(true);
        try {
            console.log('Fetching affected tasks for leave ID:', leaveId);
            const response = await api.get(`/tasks/reassignment/leave/${leaveId}`);
            console.log('API Response:', response.data);
            const { tasks, availableAssignees: assignees } = response.data.data;

            // If no tasks need reassignment, auto-approve the leave
            if (!tasks || tasks.length === 0) {
                console.log('No tasks need reassignment - auto-approving leave');
                showToast.success('No tasks need reassignment. Proceeding with leave approval.');
                onReassignmentComplete(true);
                return;
            }

            setAffectedTasks(tasks);
            setAvailableAssignees(assignees);

            // Initialize reassignments object
            const initialReassignments = {};
            tasks.forEach(task => {
                initialReassignments[task._id] = '';
            });
            setReassignments(initialReassignments);

        } catch (error) {
            console.error('Error fetching affected tasks:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            showToast.error('Failed to load affected tasks');
            onReassignmentComplete(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssigneeChange = (taskId, assigneeId) => {
        setReassignments(prev => ({
            ...prev,
            [taskId]: assigneeId
        }));
    };

    const handleNotesChange = (taskId, noteText) => {
        setNotes(prev => ({
            ...prev,
            [taskId]: noteText
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Build reassignments array
            const reassignmentArray = Object.entries(reassignments)
                .filter(([taskId, assigneeId]) => assigneeId) // Only include tasks with selected assignee
                .map(([taskId, assigneeId]) => ({
                    taskId,
                    newAssigneeId: assigneeId,
                    notes: notes[taskId] || ''
                }));

            if (reassignmentArray.length === 0) {
                // No tasks reassigned - just close and continue
                showToast.info('No tasks reassigned. Proceeding with leave approval.');
                onReassignmentComplete(true);
                return;
            }

            // Submit bulk reassignment
            const response = await api.post('/tasks/reassignment/bulk', {
                leaveId,
                reassignments: reassignmentArray
            });

            const { success, failed, skipped } = response.data.data;

            if (success.length > 0) {
                showToast.success(`Successfully reassigned ${success.length} task(s)`);
            }
            if (failed.length > 0) {
                showToast.warning(`Failed to reassign ${failed.length} task(s)`);
            }

            // Call completion callback
            onReassignmentComplete(true);

        } catch (error) {
            console.error('Error reassigning tasks:', error);
            showToast.error('Failed to reassign tasks');
            onReassignmentComplete(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipAll = () => {
        showToast.info('Skipped task reassignment');
        onReassignmentComplete(true);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-blue-600 bg-blue-50';
            case 'low': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom glass-card rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Task Reassignment Required</h3>
                                    <p className="text-sm text-purple-100 mt-1">
                                        {employeeName} will be on leave from {formatDate(leaveStartDate)} to {formatDate(leaveEndDate)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                            </div>
                        ) : affectedTasks.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No tasks affected by this leave period</p>
                                <p className="text-sm text-gray-500 mt-2">You can approve the leave directly</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{affectedTasks.length} task(s) need reassignment. Select new assignees below:</span>
                                </div>

                                {affectedTasks.map((task, index) => (
                                    <div key={task._id} className={`modern-card animate-fadeInUp stagger-${Math.min(index + 1, 5)}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Task Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>

                                                {task.project && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        📁 Project: {task.project.name}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>Due: {formatDate(task.deadline)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Status: {task.status.replace(/-/g, ' ')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reassignment Controls */}
                                            <div className="flex items-center gap-3">
                                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                                <div className="min-w-[200px]">
                                                    <select
                                                        value={reassignments[task._id] || ''}
                                                        onChange={(e) => handleAssigneeChange(task._id, e.target.value)}
                                                        className="input-modern w-full text-sm"
                                                    >
                                                        <option value="">-- Select Assignee --</option>
                                                        {availableAssignees.map(assignee => (
                                                            <option key={assignee._id} value={assignee._id}>
                                                                {assignee.firstName} {assignee.lastName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Optional Notes */}
                                        {reassignments[task._id] && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <input
                                                    type="text"
                                                    placeholder="Optional notes for new assignee..."
                                                    value={notes[task._id] || ''}
                                                    onChange={(e) => handleNotesChange(task._id, e.target.value)}
                                                    className="input-modern w-full text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="glass-card border-t border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {affectedTasks.length > 0 && (
                                    <span>
                                        {Object.values(reassignments).filter(Boolean).length} of {affectedTasks.length} tasks assigned
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <ModernButton
                                    variant="glass"
                                    onClick={handleSkipAll}
                                    disabled={isSubmitting}
                                >
                                    Skip & Approve Anyway
                                </ModernButton>
                                <ModernButton
                                    variant="gradient"
                                    onClick={handleSubmit}
                                    loading={isSubmitting}
                                    disabled={isLoading}
                                >
                                    {affectedTasks.length === 0 ? 'Continue' : 'Approve Leave & Reassign Tasks'}
                                </ModernButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskReassignmentModal;
