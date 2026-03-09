import React, { useState } from 'react';
import { AlertCircle, Calendar, Settings } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

const PayrollTestPanel = () => {
  const [loading, setLoading] = useState(false);

  const forceReminder = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('payroll-scheduler/force-reminder', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to force reminder');
      }

      alert('Reminder triggered! Refresh the page to see the popup.');
    } catch (error) {
      console.error('Error forcing reminder:', error);
      alert('Failed to force reminder');
    } finally {
      setLoading(false);
    }
  };

  const generatePayroll = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('payroll-scheduler/generate-monthly', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate payroll');
      }

      const data = await response.json();
      alert(`Payroll generated! Created: ${data.data.created.length}, Skipped: ${data.data.skipped.length}`);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Settings className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-yellow-800">Payroll Test Panel</h3>
      </div>
      
      <p className="text-sm text-yellow-700 mb-4">
        Testing tools for payroll automation (HR only)
      </p>
      
      <div className="flex space-x-3">
        <button
          onClick={forceReminder}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Force Reminder</span>
        </button>
        
        <button
          onClick={generatePayroll}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Calendar className="h-4 w-4" />
          <span>Generate Monthly Payroll</span>
        </button>
      </div>
    </div>
  );
};

export default PayrollTestPanel;