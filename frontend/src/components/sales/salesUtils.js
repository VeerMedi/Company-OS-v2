import React from 'react';

export const getStageColor = (stage) => {
  const colors = {
    'lead': 'bg-gray-100 text-gray-800',
    'qualified': 'bg-blue-100 text-blue-800',
    'proposal': 'bg-yellow-100 text-yellow-800',
    'negotiation': 'bg-orange-100 text-orange-800',
    'closed-won': 'bg-green-100 text-green-800',
    'closed-lost': 'bg-red-100 text-red-800'
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (status) => {
  const colors = {
    'active': 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-yellow-100 text-yellow-800',
    'won': 'bg-green-100 text-green-800',
    'lost': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getLeadTypeColor = (type) => {
  const colors = {
    'hot': 'bg-red-100 text-red-800',
    'warm': 'bg-orange-100 text-orange-800',
    'cold': 'bg-blue-100 text-blue-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const colors = {
    'critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-gray-100 text-gray-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};
