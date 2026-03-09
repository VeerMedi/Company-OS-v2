import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, DollarSign, Users, X, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchWithAuth } from '../utils/api';

const PayrollReminderPopup = ({ userRole }) => {
  const [reminderData, setReminderData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show for HR, Manager, and CEO
    if (['hr', 'manager', 'ceo'].includes(userRole)) {
      fetchDashboardData();
      
      // Check every 30 minutes for updates
      const interval = setInterval(fetchDashboardData, 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetchWithAuth('payroll-scheduler/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      if (data.success) {
        setReminderData(data.data);
        
        // Show popup if reminder should be displayed
        if (data.data.reminderState.shouldShowReminder) {
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const dismissReminder = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('payroll-scheduler/dismiss-reminder', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss reminder');
      }

      setShowPopup(false);
      setReminderData(prev => ({
        ...prev,
        reminderState: { ...prev.reminderState, shouldShowReminder: false }
      }));
      
      toast.success('Reminder dismissed');
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      toast.error('Failed to dismiss reminder');
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    if (userRole !== 'hr') {
      toast.error('Only HR can generate payroll');
      return;
    }

    try {
      setLoading(true);
      const response = await fetchWithAuth('payroll-scheduler/generate-monthly', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate payroll');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Payroll generated successfully! Created: ${data.data.created.length}, Skipped: ${data.data.skipped.length}`);
        setShowPopup(false);
        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error('Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const getReminderMessage = () => {
    if (!reminderData) return '';

    const { payrollStatus, pendingSummary, currentMonth } = reminderData;
    const currentDate = new Date().getDate();

    if (currentDate === 30 && pendingSummary?.totalPending > 0) {
      return {
        type: 'payment',
        title: 'Salary Processing Reminder',
        message: `${pendingSummary.totalPending} employees are waiting for salary processing for ${currentMonth}`,
        amount: pendingSummary.totalAmount,
        urgent: true
      };
    }

    if (payrollStatus?.needsGeneration) {
      return {
        type: 'generation',
        title: 'Monthly Payroll Generation',
        message: `Payroll for ${currentMonth} needs to be generated for ${payrollStatus.eligibleEmployees} employees`,
        urgent: false
      };
    }

    if (payrollStatus?.needsPaymentProcessing) {
      return {
        type: 'processing',
        title: 'Pending Payments',
        message: `${payrollStatus.pendingPayments} payroll payments are pending for ${currentMonth}`,
        urgent: currentDate >= 25
      };
    }

    return null;
  };

  if (!showPopup || !reminderData) return null;

  const reminderInfo = getReminderMessage();
  if (!reminderInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className={`p-4 rounded-t-lg ${reminderInfo.urgent ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {reminderInfo.urgent ? (
                <AlertCircle className="h-6 w-6" />
              ) : (
                <Calendar className="h-6 w-6" />
              )}
              <h3 className="text-lg font-semibold">{reminderInfo.title}</h3>
            </div>
            <button
              onClick={dismissReminder}
              disabled={loading}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{reminderInfo.message}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {reminderData.payrollStatus && (
              <>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Employees</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {reminderData.payrollStatus.eligibleEmployees}
                  </p>
                </div>
                
                {reminderInfo.type === 'payment' && reminderInfo.amount && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Total Amount</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{reminderInfo.amount?.toLocaleString()}
                    </p>
                  </div>
                )}
                
                {reminderData.payrollStatus.pendingPayments > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {reminderData.payrollStatus.pendingPayments}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {reminderInfo.type === 'generation' && userRole === 'hr' && (
              <button
                onClick={generatePayroll}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>Generate Payroll</span>
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={dismissReminder}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Got it</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Last checked: {new Date(reminderData.reminderState.lastChecked).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayrollReminderPopup;