import React, { useState, useEffect } from 'react';
import { X, Users, Send } from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';

const DelegateTaskModal = ({ task, onClose, onSuccess }) => {
    const [mentees, setMentees] = useState([]);
    const [selectedMentee, setSelectedMentee] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMentees, setLoadingMentees] = useState(true);

    useEffect(() => {
        fetchMentees();
    }, []);

    const fetchMentees = async () => {
        try {
            setLoadingMentees(true);
            // For leave handover context, fetch all available interns/developers
            // Not just mentees
            const response = await api.get('/users/available-for-delegation');
            setMentees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching available users:', error);
            toast.error('Failed to load available users');
        } finally {
            setLoadingMentees(false);
        }
    };

    const handleDelegate = async () => {
        if (!selectedMentee) {
            toast.error('Please select a mentee');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post(`/tasks/${task._id}/delegate`, {
                delegateToId: selectedMentee,
                notes
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Task delegated successfully');
                onSuccess();
            }
        } catch (error) {
            console.error('Error delegating task:', error);
            toast.error(error.response?.data?.message || 'Failed to delegate task');
        } finally {
            setLoading(false);
        }
    };

    const selectedMenteeData = mentees.find(m => m._id === selectedMentee);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-400" />
                            {task?.delegatedBy ? 'Re-delegate Task to Intern' : 'Delegate Task to Intern'}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-0.5">
                            {task?.delegatedBy ? 'Reassign this task to another intern' : 'Assign this task to an available intern'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Task Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-1">{task?.title}</h4>
                        {task?.description && (
                            <p className="text-sm text-zinc-300 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                            {task?.priority && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                        'bg-green-500/20 text-green-300'
                                    }`}>
                                    {task.priority}
                                </span>
                            )}
                            {task?.points && (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded font-medium">
                                    {task.points} points
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mentee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Select Intern <span className="text-red-400">*</span>
                        </label>
                        {loadingMentees ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : mentees.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400 bg-zinc-800/50 rounded-lg">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No interns available to delegate</p>
                            </div>
                        ) : (
                            <select
                                value={selectedMentee}
                                onChange={(e) => setSelectedMentee(e.target.value)}
                                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            >
                                <option value="">Choose an intern...</option>
                                {mentees.map((mentee) => (
                                    <option key={mentee._id} value={mentee._id}>
                                        {mentee.firstName} {mentee.lastName} - {mentee.role} ({mentee.employeeId})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Delegation Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any special instructions or context for the intern..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-zinc-500 resize-none"
                        />
                    </div>

                    {/* Selected Mentee Details */}
                    {selectedMenteeData && (
                        <div className="bg-zinc-800/70 border border-zinc-700 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-full">
                                    <Users className="text-blue-400 h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">
                                        {selectedMenteeData.firstName} {selectedMenteeData.lastName}
                                    </p>
                                    <p className="text-sm text-zinc-400">{selectedMenteeData.email}</p>
                                    {selectedMenteeData.specializations && selectedMenteeData.specializations.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedMenteeData.specializations.slice(0, 3).map((spec, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded"
                                                >
                                                    {spec}
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
                <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-zinc-900/50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelegate}
                        disabled={!selectedMentee || loading || mentees.length === 0}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        )}
                        <Send className="h-4 w-4" />
                        {task?.delegatedBy ? 'Re-delegate Task' : 'Delegate Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DelegateTaskModal;
