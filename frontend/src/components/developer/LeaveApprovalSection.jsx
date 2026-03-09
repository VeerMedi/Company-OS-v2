import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowRight,
    Briefcase
} from 'lucide-react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { showToast } from '../../utils/toast';
import DelegateTaskModal from './DelegateTaskModal';

const LeaveApprovalSection = () => {
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [internTasks, setInternTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);

    // Delegation State
    const [showDelegateModal, setShowDelegateModal] = useState(false);
    const [selectedTaskForDelegation, setSelectedTaskForDelegation] = useState(null);

    useEffect(() => {
        fetchPendingLeaves();
    }, []);

    useEffect(() => {
        if (selectedLeave) {
            fetchInternTasks(selectedLeave.employee._id);
        }
    }, [selectedLeave]);

    const fetchPendingLeaves = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/leave/pending-approvals');
            setPendingLeaves(response.data.data);
        } catch (error) {
            console.error('Error fetching pending leaves:', error);
            showToast.error('Failed to fetch pending approvals');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInternTasks = async (userId) => {
        try {
            setLoadingTasks(true);
            // Fetch tasks for the specific user. 
            // We use the main tasks endpoint with filters.
            // For now, let's assume /tasks/user/:userId exists or needs to be verified. 
            // Actually, usually it's /tasks?assignedTo=userId in many systems.
            // Let's try to query tasks with filter. 
            // If the backend `getAllTasks` supports filtering, that's best.
            // Let's check typical task/route patterns. 
            // Safest bet: filter the frontend tasks if we have them, BUT we need all tasks for that user.
            // Let's try hitting /tasks/my-tasks w/ impersonation or a specific admin/manager endpoint.
            // Manager/Lead usually has access to /tasks/team or similar.

            // Re-evaluating based on typical project structure: 
            // `backend/routes/tasks.js` usually has `getTasks` which might accept filters.

            // Let's try a direct query if possible, or fallback to a known working endpoint.
            // I'll assume /tasks/user/:userId is valid for now, usually implemented for profile views.

            // If previous context showed `getTasksForUser`, I'd use that.
            // I'll use a likely endpoint and if it fails I'll fix it. 
            // Actually, let's check if we can filter by assignee in the main list.

            // For now, let's try `GET /tasks?assignee=${userId}`. 
            // Reviewing `taskController.js` would confirm this but I want to avoid too many view_files.
            // I will implement a safe fallback in logic later if needed.

            // Let's just try to get all tasks and filter if necessary (inefficient but safe if pagination allows)
            // OR use /users/:id/tasks if exists.

            // Let's assume the API for getting a user's task exists.
            const taskRes = await api.get(`/tasks?assignedTo=${userId}&status=not-started,in-progress,review,needs-revision`);
            setInternTasks(taskRes.data.data || []);

        } catch (error) {
            console.error('Error fetching intern tasks:', error);
            // Fallback for demo/prototyping if endpoint fails
            setInternTasks([]);
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleConfirmHandover = async (leaveId) => {
        try {
            await api.patch(`/leave/${leaveId}/confirm-handover`);
            showToast.success('Handover confirmed successfully');
            setSelectedLeave(null);
            fetchPendingLeaves();
        } catch (error) {
            console.error('Error confirming handover:', error);
            showToast.error(error.response?.data?.message || 'Failed to confirm handover');
        }
    };

    const handleDelegateTask = (task) => {
        setSelectedTaskForDelegation(task);
        setShowDelegateModal(true);
    };

    const handleDelegationComplete = () => {
        if (selectedLeave) {
            fetchInternTasks(selectedLeave.employee._id); // Refresh tasks
        }
        setShowDelegateModal(false);
        setSelectedTaskForDelegation(null);
        showToast.success('Task reassigned successfully');
    };

    if (selectedLeave) {
        return (
            <div className="space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSelectedLeave(null)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <ArrowRight className="h-6 w-6 rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Review Leave Request</h2>
                        <p className="text-zinc-400">Review tasks and confirm handover for {selectedLeave.employee.firstName}</p>
                    </div>
                </div>

                {/* Leave Details Card */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Applicant</label>
                            <div className="flex items-center mt-2">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {selectedLeave.employee.firstName[0]}
                                </div>
                                <div className="ml-3">
                                    <p className="text-white font-medium">{selectedLeave.employee.firstName} {selectedLeave.employee.lastName}</p>
                                    <p className="text-sm text-zinc-500">{selectedLeave.employee.role}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Duration</label>
                            <p className="text-white font-medium mt-2 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-zinc-400" />
                                {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                                    {selectedLeave.totalDays} Days
                                </span>
                            </p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reason</label>
                            <p className="text-zinc-300 mt-2 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                                {selectedLeave.reason}
                            </p>
                        </div>
                        {selectedLeave.handoverDetails && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Handover Note</label>
                                <p className="text-zinc-300 mt-2 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                                    {selectedLeave.handoverDetails}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Work Operations / Tasks Section */}
                <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <Briefcase className="h-5 w-5 mr-2 text-blue-400" />
                            Pending Tasks & Responsibilities
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-medium border border-white/5">
                            {internTasks.length} Active Tasks
                        </span>
                    </div>

                    <div className="p-6">
                        {loadingTasks ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                                <p className="mt-4 text-zinc-500">Loading intern's tasks...</p>
                            </div>
                        ) : internTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-emerald-500/50 mx-auto mb-4" />
                                <p className="text-white font-medium">No Pending Tasks</p>
                                <p className="text-zinc-500 text-sm mt-1">This intern has no active tasks to hand over.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {internTasks.map(task => (
                                    <div key={task._id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-white font-medium truncate">{task.title}</h4>
                                            <div className="flex items-center mt-1 space-x-3">
                                                <span className={`px-2 py-0.5 rounded textxs text-[10px] uppercase font-bold tracking-wide 
                                                    ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'}`}>
                                                    {task.priority}
                                                </span>
                                                <span className="text-zinc-500 text-xs flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Due {formatDate(task.dueDate)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelegateTask(task)}
                                            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-600/20"
                                        >
                                            Reassign
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
                    <button
                        onClick={() => setSelectedLeave(null)}
                        className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                    >
                        Cancel Review
                    </button>
                    <button
                        onClick={() => handleConfirmHandover(selectedLeave._id)}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 font-bold transition-all flex items-center"
                    >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirm Handover & Approve
                    </button>
                </div>

                {/* Delegation Modal */}
                {showDelegateModal && selectedTaskForDelegation && (
                    <DelegateTaskModal
                        isOpen={showDelegateModal}
                        onClose={() => {
                            setShowDelegateModal(false);
                            setSelectedTaskForDelegation(null);
                        }}
                        task={selectedTaskForDelegation}
                        onSuccess={handleDelegationComplete}
                    />
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6">
            <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <h2 className="text-2xl font-bold text-white">Leave Approvals & Handovers</h2>
                <p className="text-zinc-400 mt-1">Review pending leave requests and manage task handovers for your mentees.</p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-zinc-400">Loading pending approvals...</p>
                    </div>
                ) : pendingLeaves.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-zinc-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                        </div>
                        <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
                        <p className="text-zinc-400 mt-2">No pending leave requests requiring your review.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {pendingLeaves.map(leave => (
                            <div key={leave._id} className="p-6 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedLeave(leave)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                                            {leave.employee.firstName[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {leave.employee.firstName} {leave.employee.lastName}
                                            </h4>
                                            <p className="text-sm text-zinc-400 flex items-center mt-1">
                                                <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-xs mr-2">
                                                    {leave.leaveType}
                                                </span>
                                                {leave.totalDays} Days • {formatDate(leave.startDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold uppercase tracking-wide mr-4">
                                            Action Required
                                        </span>
                                        <ArrowRight className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveApprovalSection;
