import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Eye,
  Plus,
  XCircle,
  CheckCircle
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const EmployeeLeaveManagement = () => {
  const [myLeaves, setMyLeaves] = useState([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);

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
    isHalfDay: false,
    halfDayPeriod: 'first-half'
  });

  useEffect(() => {
    fetchMyLeaves();
    fetchMyLeaveBalance();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/leave/requests');
      setMyLeaves(response.data.data.docs);
    } catch (error) {
      console.error('Error fetching my leaves:', error);
      showToast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyLeaveBalance = async () => {
    try {
      const response = await api.get('/leave/balance');
      setMyLeaveBalance(response.data.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
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
        isHalfDay: false,
        halfDayPeriod: 'first-half'
      });
      fetchMyLeaves();
      fetchMyLeaveBalance();
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
      fetchMyLeaveBalance();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      showToast.error('Failed to cancel leave request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      manager_approved: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      hr_approved: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      approved: 'bg-green-500/20 text-green-300 border border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
      cancelled: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
    };
    return colors[status] || colors.pending;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: 'bg-red-500/10 text-red-400 border-red-500/20',
      casual: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      vacation: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      emergency: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      maternity: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      paternity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      compensatory: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    };
    return colors[type] || colors.casual;
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Waiting for manager approval',
      manager_approved: 'Approved by manager, waiting for HR approval',
      hr_approved: 'Approved by HR, waiting for final approval',
      approved: 'Leave approved! Enjoy your time off.',
      rejected: 'Leave request was rejected',
      cancelled: 'Leave request was cancelled'
    };
    return messages[status] || 'Unknown status';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">My Leave Management</h2>
            <p className="text-zinc-400 mt-1">Track your leaves and submit new requests</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center font-medium shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="h-5 w-5 mr-2" />
            Request Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Card */}
      {myLeaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="h-16 w-16 text-blue-500" />
            </div>
            <div className="relative z-10">
              <div className="text-sm text-blue-400 font-medium mb-1">Casual Leave</div>
              <div className="text-4xl font-bold text-white mb-2">
                {myLeaveBalance.balances.casual.remaining}
              </div>
              <div className="text-xs text-zinc-500">
                of {myLeaveBalance.balances.casual.allocated} days available
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="h-16 w-16 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="text-sm text-emerald-400 font-medium mb-1">Vacation</div>
              <div className="text-4xl font-bold text-white mb-2">
                {myLeaveBalance.balances.vacation.remaining}
              </div>
              <div className="text-xs text-zinc-500">
                of {myLeaveBalance.balances.vacation.allocated} days available
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-red-500/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="h-16 w-16 text-red-500" />
            </div>
            <div className="relative z-10">
              <div className="text-sm text-red-400 font-medium mb-1">Sick Leave</div>
              <div className="text-4xl font-bold text-white mb-2">
                {myLeaveBalance.balances.sick.remaining}
              </div>
              <div className="text-xs text-zinc-500">
                of {myLeaveBalance.balances.sick.allocated} days available
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="h-16 w-16 text-purple-500" />
            </div>
            <div className="relative z-10">
              <div className="text-sm text-purple-400 font-medium mb-1">Compensatory</div>
              <div className="text-4xl font-bold text-white mb-2">
                {myLeaveBalance.balances.compensatory.remaining}
              </div>
              <div className="text-xs text-zinc-500">
                of {myLeaveBalance.balances.compensatory.allocated} days available
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Leave Requests */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">My Leave Requests</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading leave requests...</p>
          </div>
        ) : myLeaves.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <div className="bg-zinc-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="text-lg font-medium text-zinc-300">No leave requests found</p>
            <p className="text-sm mt-2">Click "Request Leave" above to submit your first request</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {myLeaves.map((leave) => (
              <div key={leave._id} className="p-6 hover:bg-white/5 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getLeaveTypeColor(leave.leaveType)} uppercase tracking-wide`}>
                        {leave.leaveType}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(leave.status)} uppercase tracking-wide`}>
                        {leave.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center text-zinc-300 text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-zinc-500" />
                        <span className="font-medium">{formatDate(leave.startDate)}</span>
                        <span className="mx-2 text-zinc-600">to</span>
                        <span className="font-medium">{formatDate(leave.endDate)}</span>
                        <span className="ml-2 text-zinc-500">({leave.totalDays} days)</span>
                      </div>
                      <div className="hidden md:flex items-center text-zinc-400 text-sm">
                        <span className="w-1 h-1 bg-zinc-600 rounded-full mr-3"></span>
                        <span className="truncate max-w-xs">{leave.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowLeaveDetails(true);
                      }}
                      className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-white/5"
                    >
                      View Details
                    </button>
                    {['pending', 'manager_approved'].includes(leave.status) && (
                      <button
                        onClick={() => handleCancelLeave(leave._id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleLeaveRequest}>
              <div className="p-6 border-b border-white/10 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Request Leave</h3>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Leave Type</label>
                    <select
                      value={leaveRequest.leaveType}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, leaveType: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="vacation">Vacation</option>
                      <option value="emergency">Emergency</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="compensatory">Compensatory Leave</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-zinc-400">Duration</label>
                      <label className="flex items-center text-sm text-blue-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leaveRequest.isHalfDay}
                          onChange={(e) => {
                            const isHalfDay = e.target.checked;
                            setLeaveRequest({
                              ...leaveRequest,
                              isHalfDay,
                              endDate: isHalfDay ? leaveRequest.startDate : leaveRequest.endDate
                            });
                          }}
                          className="mr-2 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-offset-0"
                        />
                        Half Day
                      </label>
                    </div>
                    {leaveRequest.isHalfDay ? (
                      <select
                        value={leaveRequest.halfDayPeriod}
                        onChange={(e) => setLeaveRequest({ ...leaveRequest, halfDayPeriod: e.target.value })}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="first-half">First Half</option>
                        <option value="second-half">Second Half</option>
                      </select>
                    ) : (
                      <div className="h-[46px] w-full bg-zinc-800/50 border border-white/5 rounded-xl flex items-center px-4 text-zinc-500 text-sm">
                        Full Day Leave
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={leaveRequest.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        setLeaveRequest({
                          ...leaveRequest,
                          startDate,
                          endDate: leaveRequest.isHalfDay ? startDate : leaveRequest.endDate
                        });
                      }}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      {leaveRequest.isHalfDay ? 'End Date (Same as Start)' : 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={leaveRequest.endDate}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
                      disabled={leaveRequest.isHalfDay}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Reason for Leave</label>
                  <textarea
                    value={leaveRequest.reason}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white h-24 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    placeholder="Please explain why you are requesting leave..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Handover Details (Optional)</label>
                  <textarea
                    value={leaveRequest.handoverDetails}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, handoverDetails: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white h-24 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    placeholder="Describe any pending tasks or handover arrangements..."
                  />
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Emergency Contact (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={leaveRequest.emergencyContact.name}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, name: e.target.value }
                      })}
                      className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={leaveRequest.emergencyContact.phone}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, phone: e.target.value }
                      })}
                      className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={leaveRequest.emergencyContact.relationship}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, relationship: e.target.value }
                      })}
                      className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-zinc-900/95 backdrop-blur flex justify-end space-x-3 sticky bottom-0 z-10 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-blue-500/20"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Leave Request Details</h3>
                <button
                  onClick={() => setShowLeaveDetails(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${getStatusColor(selectedLeave.status)} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg uppercase tracking-wide">
                    {selectedLeave.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm opacity-80 font-medium">
                  {getStatusMessage(selectedLeave.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Leave Type</label>
                  <p className="text-white text-lg font-medium capitalize mt-1">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Duration</label>
                  <p className="text-white text-lg font-medium mt-1">{selectedLeave.totalDays} Days</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
                  <p className="text-zinc-300 mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-zinc-500" />
                    {formatDate(selectedLeave.startDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
                  <p className="text-zinc-300 mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-zinc-500" />
                    {formatDate(selectedLeave.endDate)}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Reason</label>
                <p className="text-zinc-300 leading-relaxed">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.handoverDetails && (
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Handover Details</label>
                  <p className="text-zinc-300 leading-relaxed">{selectedLeave.handoverDetails}</p>
                </div>
              )}

              {/* Approvals Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-sm font-bold text-white mb-4">Approval Chain</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                    <span className="text-zinc-400">Manager Approval</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${selectedLeave.managerApproval.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        selectedLeave.managerApproval.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      } uppercase tracking-wide`}>
                      {selectedLeave.managerApproval.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                    <span className="text-zinc-400">HR Approval</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${selectedLeave.hrApproval.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        selectedLeave.hrApproval.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      } uppercase tracking-wide`}>
                      {selectedLeave.hrApproval.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-zinc-900/95 backdrop-blur flex justify-end space-x-3 sticky bottom-0 z-10 rounded-b-2xl">
              {['pending', 'manager_approved'].includes(selectedLeave.status) && (
                <button
                  onClick={() => {
                    handleCancelLeave(selectedLeave._id);
                    setShowLeaveDetails(false);
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-bold border border-red-500/20 transition-colors"
                >
                  Cancel Request
                </button>
              )}
              <button
                onClick={() => setShowLeaveDetails(false)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
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

export default EmployeeLeaveManagement;