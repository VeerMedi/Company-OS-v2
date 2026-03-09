import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Users,
  Filter,
  UserCheck
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const CoFounderLeaveApproval = () => {
  const [managerLeaves, setManagerLeaves] = useState([]);
  const [hrLeaves, setHrLeaves] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('pending'); // 'pending', 'manager-leaves', 'hr-leaves'
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);



  useEffect(() => {
    fetchPendingApprovals();
    fetchManagerLeaves();
    fetchHrLeaves();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/leave/pending-approvals');
      setPendingApprovals(response.data.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      showToast.error('Failed to fetch pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagerLeaves = async () => {
    try {
      const response = await api.get('/leave/requests?status=all');
      // Filter for manager leaves
      const managerLeaveRequests = response.data.data.docs.filter(
        leave => leave.employee.role === 'manager'
      );
      setManagerLeaves(managerLeaveRequests);
    } catch (error) {
      console.error('Error fetching manager leaves:', error);
    }
  };

  const fetchHrLeaves = async () => {
    try {
      const response = await api.get('/leave/requests?status=all');
      // Filter for HR leaves
      const hrLeaveRequests = response.data.data.docs.filter(
        leave => leave.employee.role === 'hr'
      );
      setHrLeaves(hrLeaveRequests);
    } catch (error) {
      console.error('Error fetching HR leaves:', error);
    }
  };



  const handleApproval = async (leaveId, action, comments = '') => {
    try {
      await api.put(`/ leave / approve / ${leaveId} `, { action, comments });
      showToast.success(`Leave request ${action}d successfully`);
      fetchPendingApprovals();
      fetchManagerLeaves();
      fetchHrLeaves();
    } catch (error) {
      console.error(`Error ${action}ing leave: `, error);
      showToast.error(`Failed to ${action} leave request`);
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
            Pending Approvals - Manager & HR Leaves ({pendingApprovals.length})
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
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {leave.employee.role.toUpperCase()}
                      </span>
                      <span className={`ml - 3 inline - flex px - 2 py - 1 text - xs font - semibold rounded - full ${getLeaveTypeColor(leave.leaveType)} `}>
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

                    {/* Show approval status */}
                    <div className="flex space-x-4 text-xs">
                      {leave.employee.role === 'manager' && (
                        <div className="flex items-center">
                          <span className="text-gray-500">HR Approval:</span>
                          <span className={`ml - 1 px - 2 py - 1 rounded - full ${leave.hrApproval.status === 'approved' ? 'bg-green-100 text-green-800' :
                            leave.hrApproval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            } `}>
                            {leave.hrApproval.status}
                          </span>
                        </div>
                      )}
                    </div>
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

  const LeaveHistoryTable = ({ leaves, title }) => (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
            {leaves.map((leave) => (
              <tr key={leave._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {leave.employee.firstName} {leave.employee.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{leave.employee.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline - flex px - 2 py - 1 text - xs font - semibold rounded - full ${getLeaveTypeColor(leave.leaveType)} `}>
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
                  <span className={`inline - flex px - 2 py - 1 text - xs font - semibold rounded - full ${getStatusColor(leave.status)} `}>
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
              className={`py - 2 px - 1 border - b - 2 font - medium text - sm ${currentView === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } `}
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
              onClick={() => setCurrentView('manager-leaves')}
              className={`py - 2 px - 1 border - b - 2 font - medium text - sm ${currentView === 'manager-leaves'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } `}
            >
              <div className="flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                Manager Leaves
              </div>
            </button>
            <button
              onClick={() => setCurrentView('hr-leaves')}
              className={`py - 2 px - 1 border - b - 2 font - medium text - sm ${currentView === 'hr-leaves'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } `}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                HR Leaves
              </div>
            </button>

          </nav>
        </div>
      </div>

      {/* Content based on current view */}
      {currentView === 'pending' && <PendingApprovalsView />}
      {currentView === 'manager-leaves' && <LeaveHistoryTable leaves={managerLeaves} title="Manager Leave History" />}
      {currentView === 'hr-leaves' && <LeaveHistoryTable leaves={hrLeaves} title="HR Leave History" />}



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
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-900 capitalize">{selectedLeave.employee.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Leave Type</label>
                  <p className="text-gray-900 capitalize">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Days</label>
                  <p className="text-gray-900">{selectedLeave.totalDays} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.endDate)}</p>
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
                  {/* HR Approval (for manager leaves) */}
                  {selectedLeave.employee?.role === 'manager' && (
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
                  )}

                  {/* Cofounder Approval */}
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
                </div>
              </div>
            </div>"

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
    </div>
  );
};

export default CoFounderLeaveApproval;