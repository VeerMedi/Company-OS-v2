import React, { useState } from 'react';
import { ChevronDown, CheckCircle, Clock, AlertCircle, Eye, FileText } from 'lucide-react';

const TaskStatusDropdown = ({ task, onStatusChange, onEvidenceRequired }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    {
      value: 'not-started',
      label: 'Not Started',
      icon: Clock,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-800',
      borderColor: 'border-zinc-700',
      available: task.status === 'not-started'
    },
    {
      value: 'accept',
      label: 'Accept Task',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      available: task.status === 'not-started' || task.status === 'assigned',
      requiresEvidence: false // Changed to false for single click
    },
    {
      value: 'in-progress',
      label: 'In Progress',
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      available: task.status === 'accepted' || task.status === 'in-progress' || task.status === 'needs-revision'
    },
    {
      value: 'review',
      label: 'Ready for Review',
      icon: Eye,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      available: task.status === 'in-progress' || task.status === 'needs-revision',
      requiresEvidence: true // Require evidence when submitting for review
    },
    {
      value: 'cant-complete',
      label: "Can't Complete",
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      available: task.status === 'in-progress',
      requiresEvidence: true // Requires details/reason
    }
  ];

  const getCurrentStatus = () => {
    const currentStatus = statusOptions.find(option => option.value === task.status);
    if (currentStatus) return currentStatus;

    // Handle special cases
    if (task.status === 'assigned') {
      return {
        value: 'assigned',
        label: 'Assigned',
        icon: FileText,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
      };
    }

    if (task.status === 'needs-revision') {
      return {
        value: 'needs-revision',
        label: 'Needs Revision',
        icon: AlertCircle,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20'
      };
    }

    if (task.status === 'completed') {
      return {
        value: 'completed',
        label: 'Completed',
        icon: CheckCircle,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20'
      };
    }

    return statusOptions[0]; // Default to not-started
  };

  const currentStatus = getCurrentStatus();
  const CurrentIcon = currentStatus.icon;

  const handleStatusSelect = (option) => {
    setIsOpen(false);

    if (option.requiresEvidence) {
      // Open evidence modal
      onEvidenceRequired(option.value, task);
    } else {
      // Direct status change
      onStatusChange(task._id, option.value);
    }
  };

  const availableOptions = statusOptions.filter(option =>
    option.available && option.value !== task.status
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${currentStatus.bgColor} ${currentStatus.color} border ${currentStatus.borderColor || 'border-transparent'} hover:opacity-80 shadow-sm`}
      >
        <CurrentIcon className="h-3.5 w-3.5 mr-2" />
        {currentStatus.label.toUpperCase()}
        <ChevronDown className={`h-3.5 w-3.5 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {availableOptions.length > 0 ? (
                availableOptions.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option)}
                      className="w-full flex items-center px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <OptionIcon className={`h-4 w-4 mr-3 ${option.color}`} />
                      {option.label}
                      {option.requiresEvidence && (
                        <span className="ml-auto text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Evidence</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-zinc-500 text-center italic">
                  No status changes available
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskStatusDropdown;