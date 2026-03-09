import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Link as LinkIcon,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/helpers';

const SalesTaskManagement = ({ userRole = 'individual' }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    taskType: 'sales',
    documentLink: '',
    recurring: {
      enabled: false,
      frequency: 'daily',
      interval: 1,
      endDate: ''
    },
    salesContext: {
      company: '',
      lead: '',
      revenueTarget: ''
    }
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const endpoint = userRole === 'head-of-sales'
        ? '/tasks?taskType=sales'
        : '/tasks?assignedTo=me&taskType=sales';
      
      const response = await api.get(endpoint);
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = { ...newTask };
      
      // Remove recurring if not enabled
      if (!taskData.recurring.enabled) {
        delete taskData.recurring;
      }
      
      // Clean up empty fields
      if (!taskData.documentLink) delete taskData.documentLink;
      if (!taskData.salesContext.company) delete taskData.salesContext.company;
      if (!taskData.salesContext.lead) delete taskData.salesContext.lead;
      if (!taskData.salesContext.revenueTarget) delete taskData.salesContext.revenueTarget;
      
      await api.post('/tasks', taskData);
      showToast.success('Task created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      showToast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      showToast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      showToast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      showToast.error('Failed to delete task');
    }
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
      taskType: 'sales',
      documentLink: '',
      recurring: {
        enabled: false,
        frequency: 'daily',
        interval: 1,
        endDate: ''
      },
      salesContext: {
        company: '',
        lead: '',
        revenueTarget: ''
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getFilteredTasks = () => {
    if (filterStatus === 'all') return tasks;
    return tasks.filter(task => task.status === filterStatus);
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && dueDate;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Tasks</h2>
          <p className="text-gray-600 mt-1">
            {userRole === 'head-of-sales' 
              ? 'Manage and assign sales tasks to your team'
              : 'Track and complete your assigned sales tasks'}
          </p>
        </div>
        {userRole === 'head-of-sales' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filterStatus === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({tasks.filter(t => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('in-progress')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filterStatus === 'in-progress'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({tasks.filter(t => t.status === 'in-progress').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filterStatus === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({tasks.filter(t => t.status === 'completed').length})
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {getFilteredTasks().length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No tasks found. {userRole === 'head-of-sales' && 'Create your first task to get started.'}
            </div>
          ) : (
            getFilteredTasks().map((task) => (
              <div key={task._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckSquare className={`w-5 h-5 ${getPriorityColor(task.priority)}`} />
                      <h4 className="text-lg font-semibold text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.recurring?.enabled && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Recurring
                        </span>
                      )}
                      {isOverdue(task.dueDate) && task.status !== 'completed' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Assigned To</p>
                        <p className="font-medium text-gray-900">
                          {task.assignedTo?.name || 'Unassigned'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Due Date</p>
                        <p className={`font-medium ${
                          isOverdue(task.dueDate) && task.status !== 'completed' 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Priority</p>
                        <p className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                        </p>
                      </div>
                      {task.documentLink && (
                        <div>
                          <p className="text-gray-600">Document</p>
                          <a 
                            href={task.documentLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            View
                          </a>
                        </div>
                      )}
                    </div>
                    {task.salesContext && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                        <span className="font-medium">Related to:</span>
                        {task.salesContext.company && (
                          <span className="ml-2">Company: {task.salesContext.company.companyName}</span>
                        )}
                        {task.salesContext.lead && (
                          <span className="ml-2">Lead: {task.salesContext.lead.contactPerson?.name}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Start Task"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => handleUpdateStatus(task._id, 'completed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Complete Task"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {userRole === 'head-of-sales' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                          title="Edit Task"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Task"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTask ? 'Edit Task' : 'Create New Task'}
              </h3>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Task details..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="User ID or email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Link</label>
                  <input
                    type="url"
                    value={newTask.documentLink}
                    onChange={(e) => setNewTask({ ...newTask, documentLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Recurring Settings */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={newTask.recurring.enabled}
                    onChange={(e) => setNewTask({ 
                      ...newTask, 
                      recurring: { ...newTask.recurring, enabled: e.target.checked }
                    })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label className="text-sm font-medium text-gray-700">Recurring Task</label>
                </div>
                {newTask.recurring.enabled && (
                  <div className="grid grid-cols-3 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={newTask.recurring.frequency}
                        onChange={(e) => setNewTask({ 
                          ...newTask, 
                          recurring: { ...newTask.recurring, frequency: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                      <input
                        type="number"
                        min="1"
                        value={newTask.recurring.interval}
                        onChange={(e) => setNewTask({ 
                          ...newTask, 
                          recurring: { ...newTask.recurring, interval: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={newTask.recurring.endDate}
                        onChange={(e) => setNewTask({ 
                          ...newTask, 
                          recurring: { ...newTask.recurring, endDate: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTask(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {selectedTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTaskManagement;
