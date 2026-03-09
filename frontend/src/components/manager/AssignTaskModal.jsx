import React, { useState, useEffect } from 'react';
import { X, Users, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';

const AssignTaskModal = ({ bunch, task, onClose, onSuccess }) => {
    const [developers, setDevelopers] = useState([]);
    const [selectedDeveloper, setSelectedDeveloper] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDevs, setLoadingDevs] = useState(true);

    useEffect(() => {
        fetchDevelopers();
    }, []);

    const fetchDevelopers = async () => {
        try {
            setLoadingDevs(true);
            const response = await api.get('/task-bunches/assignable-users');
            setDevelopers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching developers:', error);
            toast.error('Failed to load developers');
        } finally {
            setLoadingDevs(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedDeveloper) {
            toast.error('Please select a developer');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post(
                `/task-bunches/${bunch._id}/tasks/${task._id}/assign`,
                {
                    assignedTo: selectedDeveloper,
                    notes
                }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Task assigned successfully');
                onSuccess();
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            toast.error(error.response?.data?.error || 'Failed to assign task');
        } finally {
            setLoading(false);
        }
    };

    const selectedDev = developers.find(d => d._id === selectedDeveloper);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Assign Individual Task</h3>
                        <p className="text-sm text-gray-500 mt-0.5">From bunch: {bunch?.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Task Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1">{task?.title}</h4>
                        {task?.description && (
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                            {task?.priority && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                    {task.priority}
                                </span>
                            )}
                            {task?.points && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                    {task.points} points
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Warning if bunch is already assigned */}
                    {bunch?.assignedTo && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-orange-600 mt-0.5" size={18} />
                                <div className="text-sm text-orange-800">
                                    <p className="font-medium">Override Bunch Assignment</p>
                                    <p className="mt-1">
                                        This bunch is assigned to {bunch.assignedTo.firstName} {bunch.assignedTo.lastName}.
                                        Assigning this task to someone else will override the bunch-level assignment for this specific task.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Developer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign To
                        </label>
                        {loadingDevs ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                            </div>
                        ) : (
                            <select
                                value={selectedDeveloper}
                                onChange={(e) => setSelectedDeveloper(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Choose a developer...</option>
                                {developers.map((dev) => (
                                    <option key={dev._id} value={dev._id}>
                                        {dev.firstName} {dev.lastName} - {dev.role}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any special instructions or context..."
                            rows={3}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Selected Developer Details */}
                    {selectedDev && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 rounded-full">
                                    <Users className="text-primary-600" size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {selectedDev.firstName} {selectedDev.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedDev.email}</p>
                                    {selectedDev.skills && selectedDev.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedDev.skills.slice(0, 5).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedDeveloper || loading}
                        className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        )}
                        Assign Task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignTaskModal;
