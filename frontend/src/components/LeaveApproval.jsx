import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Plus,
  User,
  Users,
  Filter
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';
import TaskReassignmentModal from './TaskReassignmentModal';

const LeaveApproval = () => {
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('pending'); // 'pending', 'team', 'my-leaves', 'request'
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // New leave request form
  const [leaveRequest, setLeaveRequest] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    handoverDetails: '',
    handoverTo: '',
    isHalfDay: false,
    halfDayPeriod: 'first-half'
  });

  const [teamMembers, setTeamMembers] = useState([]);

  // Task Reassignment Modal State
  const [showTaskReassignmentModal, setShowTaskReassignmentModal] = useState(false);
  const [pendingApprovalLeave, setPendingApprovalLeave] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
    fetchTeamLeaves();
    fetchMyLeaves();
    fetchMyLeaveBalance();
    fetchTeamMembers();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const response = await api.get(`/leave/pending-approvals?t=${timestamp}`);
      setPendingApprovals(response.data.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      showToast.error('Failed to fetch pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamLeaves = async () => {
    try {
      const timestamp = Date.now();
      const response = await api.get(`/leave/requests?status=all&t=${timestamp}`);
      // Filter for team members (individuals)
      const teamLeaveRequests = response.data.data.docs.filter(
        leave => leave.employee.role === 'individual'
      );
      setTeamLeaves(teamLeaveRequests);
    } catch (error) {
      console.error('Error fetching team leaves:', error);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const response = await api.get('/leave/my-leaves');
      // This will return only current user's leaves
      setMyLeaves(response.data.data);
    } catch (error) {
      console.error('Error fetching my leaves:', error);
    }
  };

  const fetchMyLeaveBalance = async () => {
    try {
      const response = await api.get('/leave/my-balance');
      setMyLeaveBalance(response.data.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Interns need to select developers for handover
      const endpoint = user.role === 'intern' ? '/users/developers-for-handover' : '/users/individuals';
      const response = await api.get(endpoint);
      setTeamMembers(response.data.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleApproval = async (leaveId, action, comments = '') => {
    // If approving, show task reassignment modal first
    if (action === 'approve') {
      const leave = pendingApprovals.find(l => l._id === leaveId);
      setPendingApprovalLeave({ ...leave, action, comments });
      setShowTaskReassignmentModal(true);
      return;
    }

    // For rejection, proceed directly
    try {
      await api.put(`/leave/approve/${leaveId}`, { action, comments });
      showToast.success(`Leave request ${action}d successfully`);
      fetchPendingApprovals();
      fetchTeamLeaves();
    } catch (error) {
      console.error(`Error ${action}ing leave:`, error);
      showToast.error(`Failed to ${action} leave request`);
    }
  };

  const handleTaskReassignmentComplete = async (success) => {
    setShowTaskReassignmentModal(false);

    if (success && pendingApprovalLeave) {
      // Now approve the leave after task reassignment
      try {
        console.log('Approving leave:', {
          leaveId: pendingApprovalLeave._id,
          action: pendingApprovalLeave.action,
          comments: pendingApprovalLeave.comments
        });

        await api.put(`/leave/approve/${pendingApprovalLeave._id}`, {
          action: pendingApprovalLeave.action,
          comments: pendingApprovalLeave.comments
        });
        showToast.success('Leave approved successfully with task reassignments');
        fetchPendingApprovals();
        fetchTeamLeaves();
      } catch (error) {
        console.error('Error approving leave:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        showToast.error('Failed to approve leave request');
      }
    } else {
      console.log('Skipping leave approval:', { success, hasPendingLeave: !!pendingApprovalLeave });
    }

    setPendingApprovalLeave(null);
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave/request', leaveRequest);
      showToast.success('Leave request submitted successfully');
      setShowRequestModal(false);
      setLeaveRequest({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: { name: '', phone: '', relationship: '' },
        handoverDetails: '',
        handoverTo: '',
        isHalfDay: false,
        halfDayPeriod: 'first-half'
      });
      fetchMyLeaves();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showToast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await api.put(`/leave/cancel/${leaveId}`);
      showToast.success('Leave request cancelled successfully');
      fetchMyLeaves();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      showToast.error('Failed to cancel leave request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      manager_approved: 'bg-blue-100 text-blue-800',
      hr_approved: 'bg-indigo-100 text-indigo-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: 'bg-red-50 text-red-700',
      casual: 'bg-blue-50 text-blue-700',
      vacation: 'bg-green-50 text-green-700',
      emergency: 'bg-orange-50 text-orange-700',
      maternity: 'bg-pink-50 text-pink-700',
      paternity: 'bg-purple-50 text-purple-700',
      compensatory: 'bg-indigo-50 text-indigo-700'
    };
    return colors[type] || colors.casual;
  };

  const PendingApprovalsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Approvals ({pendingApprovals.length})
          </h3>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pending leave approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingApprovals.map((leave) => (
              <div key={leave._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </h4>
                      <span className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Duration:</span> {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.totalDays} days)
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Reason:</span> {leave.reason}
                    </div>

                    {leave.handoverDetails && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Handover:</span> {leave.handoverDetails}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowLeaveDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleApproval(leave._id, 'approve')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 inline" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(leave._id, 'reject')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-2 inline" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const TeamLeavesView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Team Leave History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {leave.employee.firstName} {leave.employee.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                      {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                    <div className="text-xs text-gray-500">{leave.totalDays} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                      {leave.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowLeaveDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const MyLeavesView = () => (
    <div className="space-y-6">
      {/* Leave Balance Card */}
      {myLeaveBalance && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Leave Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Casual Leave</div>
              <div className="text-2xl font-bold text-blue-900">
                {myLeaveBalance.balances.casual.remaining}/{myLeaveBalance.balances.casual.allocated}
              </div>
              <div className="text-xs text-blue-600">Available/Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Vacation</div>
              <div className="text-2xl font-bold text-green-900">
                {myLeaveBalance.balances.vacation.remaining}/{myLeaveBalance.balances.vacation.allocated}
              </div>
              <div className="text-xs text-green-600">Available/Total</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Sick Leave</div>
              <div className="text-2xl font-bold text-red-900">
                {myLeaveBalance.balances.sick.remaining}/{myLeaveBalance.balances.sick.allocated}
              </div>
              <div className="text-xs text-red-600">Available/Total</div>
            </div>
          </div>
        </div>
      )}

      {/* My Leave Requests */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">My Leave Requests</h3>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                      {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                    <div className="text-xs text-gray-500">{leave.totalDays} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                      {leave.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(leave.appliedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowLeaveDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {['pending', 'manager_approved'].includes(leave.status) && (
                      <button
                        onClick={() => handleCancelLeave(leave._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentView('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pending Approvals
                {pendingApprovals.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setCurrentView('team')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Team Leaves
              </div>
            </button>
            <button
              onClick={() => setCurrentView('my-leaves')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'my-leaves'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                My Leaves
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on current view */}
      {currentView === 'pending' && <PendingApprovalsView />}
      {currentView === 'team' && <TeamLeavesView />}
      {currentView === 'my-leaves' && <MyLeavesView />}

      {/* Leave Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleLeaveRequest}>
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Request Leave</h3>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                    <select
                      value={leaveRequest.leaveType}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, leaveType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="vacation">Vacation</option>
                      <option value="emergency">Emergency</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="compensatory">Compensatory Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Handover To</label>
                    <select
                      value={leaveRequest.handoverTo}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, handoverTo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select team member</option>
                      {teamMembers.map(member => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={leaveRequest.startDate}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={leaveRequest.endDate}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={leaveRequest.reason}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                    placeholder="Please provide a reason for your leave request"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handover Details</label>
                  <textarea
                    value={leaveRequest.handoverDetails}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, handoverDetails: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                    placeholder="Describe work handover arrangements"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={leaveRequest.emergencyContact.name}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, name: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={leaveRequest.emergencyContact.phone}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, phone: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={leaveRequest.emergencyContact.relationship}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, relationship: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showLeaveDetails && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Leave Request Details</h3>
                <button
                  onClick={() => setShowLeaveDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Employee</label>
                  <p className="text-gray-900">
                    {selectedLeave.employee.firstName} {selectedLeave.employee.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Leave Type</label>
                  <p className="text-gray-900 capitalize">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Days</label>
                  <p className="text-gray-900">{selectedLeave.totalDays} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLeave.status)}`}>
                    {selectedLeave.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Reason</label>
                <p className="text-gray-900 mt-1">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.handoverDetails && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Handover Details</label>
                  <p className="text-gray-900 mt-1">{selectedLeave.handoverDetails}</p>
                </div>
              )}

              {/* Approval Progress Timeline */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Approval Progress</h4>
                <div className="space-y-3">
                  {/* Manager Approval */}
                  {(selectedLeave.managerApproval || selectedLeave.employee?.role === 'individual' || selectedLeave.employee?.role === 'service-delivery' || selectedLeave.employee?.role === 'service-onboarding') && (
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedLeave.managerApproval?.status === 'approved' ? 'bg-green-100' :
                        selectedLeave.managerApproval?.status === 'rejected' ? 'bg-red-100' :
                          'bg-yellow-100'
                        }`}>
                        {selectedLeave.managerApproval?.status === 'approved' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : selectedLeave.managerApproval?.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">Manager Approval</p>
                        <p className="text-xs text-gray-500">
                          {selectedLeave.managerApproval?.status === 'approved' && selectedLeave.managerApproval?.approvedAt
                            ? `Approved on ${formatDate(selectedLeave.managerApproval.approvedAt)}`
                            : selectedLeave.managerApproval?.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HR Approval */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedLeave.hrApproval?.status === 'approved' ? 'bg-green-100' :
                      selectedLeave.hrApproval?.status === 'rejected' ? 'bg-red-100' :
                        'bg-yellow-100'
                      }`}>
                      {selectedLeave.hrApproval?.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : selectedLeave.hrApproval?.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">HR Approval</p>
                      <p className="text-xs text-gray-500">
                        {selectedLeave.hrApproval?.status === 'approved' && selectedLeave.hrApproval?.approvedAt
                          ? `Approved on ${formatDate(selectedLeave.hrApproval.approvedAt)}`
                          : selectedLeave.hrApproval?.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Cofounder Approval (only for manager/HR leaves) */}
                  {(selectedLeave.employee?.role === 'manager' || selectedLeave.employee?.role === 'hr') && (
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedLeave.coFounderApproval?.status === 'approved' ? 'bg-green-100' :
                        selectedLeave.coFounderApproval?.status === 'rejected' ? 'bg-red-100' :
                          'bg-yellow-100'
                        }`}>
                        {selectedLeave.coFounderApproval?.status === 'approved' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : selectedLeave.coFounderApproval?.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">Co-Founder Approval</p>
                        <p className="text-xs text-gray-500">
                          {selectedLeave.coFounderApproval?.status === 'approved' && selectedLeave.coFounderApproval?.approvedAt
                            ? `Approved on ${formatDate(selectedLeave.coFounderApproval.approvedAt)}`
                            : selectedLeave.coFounderApproval?.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              {currentView === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApproval(selectedLeave._id, 'approve');
                      setShowLeaveDetails(false);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleApproval(selectedLeave._id, 'reject');
                      setShowLeaveDetails(false);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setShowLeaveDetails(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Reassignment Modal */}
      {showTaskReassignmentModal && pendingApprovalLeave && (
        <TaskReassignmentModal
          isOpen={showTaskReassignmentModal}
          onClose={() => {
            setShowTaskReassignmentModal(false);
            setPendingApprovalLeave(null);
          }}
          leaveId={pendingApprovalLeave._id}
          employeeName={`${pendingApprovalLeave.employee?.firstName} ${pendingApprovalLeave.employee?.lastName}`}
          leaveStartDate={pendingApprovalLeave.startDate}
          leaveEndDate={pendingApprovalLeave.endDate}
          onReassignmentComplete={handleTaskReassignmentComplete}
        />
      )}
    </div>
  );
};

export default LeaveApproval;