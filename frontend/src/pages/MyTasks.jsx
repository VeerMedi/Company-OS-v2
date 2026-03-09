import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Target,
  AlertCircle,
  Eye,
  Upload,
  Link,
  Image,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Search
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TaskStatusDropdown from '../components/TaskStatusDropdown';
import TaskEvidenceModal from '../components/TaskEvidenceModal';
import TaskDetailModal from '../components/TaskDetailModal';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast as toast } from '../utils/toast';

const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-tasks'); // 'my-tasks' or 'review'
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Task evidence modal states
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

  // Checkpoint form state
  const [checkpointEvidence, setCheckpointEvidence] = useState({
    verificationUrl: '',
    verificationMethod: 'url',
    screenshot: null,
    caption: ''
  });

  // Preview state for uploaded images
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        let endpoint = '/tasks/assigned';
        if (activeTab === 'review') {
          endpoint = '/tasks/review';
        }

        const tasksRes = await api.get(endpoint);
        setTasks(tasksRes.data.data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [activeTab]);

  // Handle input change for checkpoint evidence
  const handleEvidenceInputChange = (e) => {
    const { name, value } = e.target;
    setCheckpointEvidence({ ...checkpointEvidence, [name]: value });
  };

  // Handle screenshot file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCheckpointEvidence({
        ...checkpointEvidence,
        screenshot: file,
        verificationMethod: 'screenshot'
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear file preview and selection
  const clearFileSelection = () => {
    setCheckpointEvidence({
      ...checkpointEvidence,
      screenshot: null
    });
    setPreviewUrl(null);
  };

  // Submit checkpoint evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();

    if (!selectedCheckpoint) return;

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('checkpointId', selectedCheckpoint._id);
      formData.append('verificationMethod', checkpointEvidence.verificationMethod);

      if (checkpointEvidence.verificationMethod === 'url') {
        formData.append('verificationUrl', checkpointEvidence.verificationUrl);
      } else if (checkpointEvidence.verificationMethod === 'screenshot' && checkpointEvidence.screenshot) {
        formData.append('screenshot', checkpointEvidence.screenshot);
        formData.append('caption', checkpointEvidence.caption);
      }

      // Submit checkpoint completion
      const res = await api.post('/checkpoints/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update task in state
      const updatedTasks = tasks.map(task => {
        if (task.checkpoints && task.checkpoints.some(cp => cp._id === selectedCheckpoint._id)) {
          const updatedCheckpoints = task.checkpoints.map(cp =>
            cp._id === selectedCheckpoint._id
              ? { ...cp, isCompleted: true, ...res.data.data }
              : cp
          );
          return { ...task, checkpoints: updatedCheckpoints };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Reset form and close modal
      setCheckpointEvidence({
        verificationUrl: '',
        verificationMethod: 'url',
        screenshot: null,
        caption: ''
      });
      setPreviewUrl(null);
      setShowCheckpointModal(false);
      setSelectedCheckpoint(null);

      toast.success('Checkpoint completed successfully');
    } catch (err) {
      console.error('Error completing checkpoint:', err);
      setError('Failed to complete checkpoint. Please try again.');
      toast.error('Failed to complete checkpoint');
    }
  };

  // Toggle task details expansion
  const toggleTaskExpand = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
    }
  };

  // Handle evidence requirement for status changes
  const handleEvidenceRequired = (newStatus, task) => {
    setSelectedTask(task);
    setPendingStatus(newStatus);
    setShowEvidenceModal(true);
  };

  // Handle direct status changes (no evidence required)
  const handleDirectStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Updating task status:', { taskId, newStatus });

      let res;
      if (newStatus === 'accept') {
        // Use the accept endpoint for accepting tasks
        res = await api.patch(`/tasks/${taskId}/accept`);
      } else {
        // Use the status endpoint for other status changes
        res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      }

      // Update task status in state
      const updatedTasks = tasks.map(task =>
        task._id === taskId
          ? {
            ...task,
            status: newStatus === 'accept' ? 'in-progress' : newStatus,
            updatedAt: new Date(),
            ...(newStatus === 'accept' ? { acceptedAt: new Date() } : {})
          }
          : task
      );

      setTasks(updatedTasks);
      const statusLabel = newStatus === 'accept' ? 'accepted' : newStatus.replace('-', ' ');
      toast.success(`Task ${statusLabel} successfully`);
    } catch (err) {
      console.error('Error updating task status:', err);
      console.error('Error details:', err.response?.data);
      toast.error('Failed to update task status');
    }
  };

  // Submit evidence with status change
  const handleTaskEvidenceSubmit = async (formData) => {
    try {
      const res = await api.post('/tasks/update-with-evidence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update task in state
      const updatedTasks = tasks.map(task =>
        task._id === selectedTask._id
          ? { ...task, ...res.data.data }
          : task
      );

      setTasks(updatedTasks);

      const statusLabel = pendingStatus === 'accept' ? 'accepted' : pendingStatus;
      toast.success(`Task ${statusLabel} successfully with evidence!`);

    } catch (err) {
      console.error('Error submitting evidence:', err);
      toast.error('Failed to submit evidence');
      throw err;
    }
  };

  // Accept a task
  const handleAcceptTask = async (taskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/accept`);

      // Update task status in state
      const updatedTasks = tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'in-progress', acceptedAt: new Date() }
          : task
      );

      setTasks(updatedTasks);
      toast.success('Task accepted successfully');
    } catch (err) {
      console.error('Error accepting task:', err);
      toast.error('Failed to accept task');
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });

      // Update task status in state
      const updatedTasks = tasks.map(task =>
        task._id === taskId
          ? { ...task, status: newStatus }
          : task
      );

      setTasks(updatedTasks);
      toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status');
    }
  };

  // Mark task as completed
  const handleCompleteTask = async (taskId) => {
    try {
      console.log('Starting task completion for taskId:', taskId);

      // Try force complete first
      const res = await api.patch(`/tasks/${taskId}/force-complete`);
      console.log('Task completion response:', res.data);

      if (res.data.success) {
        // Update task status in state using the response data
        const updatedTask = res.data.data; // Get the task from the response
        console.log('Updated task from server:', updatedTask);

        const updatedTasks = tasks.map(task =>
          task._id === taskId ? updatedTask : task
        );

        console.log('Updated tasks array:', updatedTasks.find(t => t._id === taskId));
        setTasks(updatedTasks);
        toast.success('Task completed successfully!');

        // Refresh data to ensure consistency
        setTimeout(() => {
          console.log('Refreshing task data...');
          // Re-fetch tasks to ensure data consistency
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle resubmission after revision
  const handleResubmitTask = async (taskId) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/resolve-revision`);

      // Update the task in local state
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'review', revisionRequired: false }
          : task
      ));

      toast.success('Task resubmitted for review successfully');
    } catch (err) {
      console.error('Error resubmitting task:', err);
      toast.error('Failed to resubmit task: ' + (err.response?.data?.message || err.message));
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-gray-100 text-gray-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cant-complete':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'needs-revision':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format deadline with color based on proximity
  const formatDeadline = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    let colorClass = 'text-gray-600';
    if (daysUntil < 0) {
      colorClass = 'text-red-600 font-medium';
    } else if (daysUntil <= 3) {
      colorClass = 'text-amber-600 font-medium';
    } else if (daysUntil <= 7) {
      colorClass = 'text-orange-500';
    }

    return <span className={colorClass}>{formatDate(deadline)}</span>;
  };

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const taskStats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        {/* Header */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 p-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">My Tasks</h1>
              <p className="text-zinc-400 mt-1">Manage and track your assigned tasks</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{tasks.length}</div>
              <div className="text-sm text-zinc-500 font-medium">Total Tasks</div>
            </div>
          </div>
        </div>

        {/* Tabs for higher roles */}
        {/* Tabs for higher roles */}
        {['team-lead', 'manager', 'ceo', 'co-founder', 'hr'].includes(user?.role) && (
          <div className="flex border-b border-white/10">
            <button
              className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'my-tasks'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
              onClick={() => setActiveTab('my-tasks')}
            >
              My Tasks
              {activeTab === 'my-tasks' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}
            </button>
            <button
              className={`px-8 py-4 font-bold text-sm transition-all relative ${activeTab === 'review'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
              onClick={() => setActiveTab('review')}
            >
              Review Tasks
              {activeTab === 'review' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              )}
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Assigned', value: taskStats.assigned, color: 'text-zinc-400', filter: 'assigned' },
            { label: 'In Progress', value: taskStats.inProgress, color: 'text-blue-400', filter: 'in-progress' },
            { label: 'Review', value: taskStats.review, color: 'text-amber-400', filter: 'review' },
            { label: 'Completed', value: taskStats.completed, color: 'text-emerald-400', filter: 'completed' },
            { label: 'Blocked', value: taskStats.blocked, color: 'text-red-400', filter: 'blocked' },
            { label: 'Total', value: taskStats.total, color: 'text-white', filter: 'all' }
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={() => setStatusFilter(stat.filter)}
              className={`bg-zinc-900/50 backdrop-blur-sm rounded-xl border p-4 transition-all cursor-pointer ${statusFilter === stat.filter
                  ? 'border-blue-500/50 ring-1 ring-blue-500/50 bg-blue-500/10'
                  : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                }`}
            >
              <div className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold mb-3 bg-white/5 ${stat.color} border border-white/10`}>
                {stat.label}
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-600 transition-all font-medium"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white font-medium appearance-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">All Status</option>
                <option value="assigned" className="bg-zinc-900">Assigned</option>
                <option value="in-progress" className="bg-zinc-900">In Progress</option>
                <option value="review" className="bg-zinc-900">Review</option>
                <option value="completed" className="bg-zinc-900">Completed</option>
                <option value="blocked" className="bg-zinc-900">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-zinc-900/30 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-cyan-500 border-r-cyan-500 border-b-transparent border-l-transparent"></div>
              <p className="mt-4 text-zinc-500 font-medium">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-400">
              <AlertCircle className="h-10 w-10 mx-auto mb-3" />
              <p className="font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-20 text-center">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-zinc-700" />
              <h3 className="text-white text-lg font-bold mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No tasks match your filters' : 'No tasks assigned yet'}
              </h3>
              <p className="text-zinc-500 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Tasks will appear here once they are assigned to you'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredTasks.map((task) => (
                <div key={task._id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div
                    className="flex items-center justify-between cursor-pointer p-2 rounded-xl"
                    onClick={() => toggleTaskExpand(task._id)}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`h-2.5 w-2.5 rounded-full mr-4 shadow-[0_0_8px_currentColor] ${task.status === 'completed' ? 'bg-emerald-500 text-emerald-500' :
                        task.status === 'in-progress' ? 'bg-blue-500 text-blue-500' :
                          task.status === 'blocked' ? 'bg-red-500 text-red-500' :
                            task.status === 'review' ? 'bg-amber-500 text-amber-500' :
                              task.status === 'needs-revision' ? 'bg-orange-500 text-orange-500' :
                                'bg-zinc-500 text-zinc-500'
                        }`}></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white truncate">{task.title}</h3>
                          <div className="flex items-center space-x-3 ml-4">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-lg border bg-opacity-20 ${task.priority === 'urgent' ? 'bg-red-500 border-red-500/30 text-red-400' :
                              task.priority === 'high' ? 'bg-orange-500 border-orange-500/30 text-orange-400' :
                                task.priority === 'medium' ? 'bg-blue-500 border-blue-500/30 text-blue-400' :
                                  'bg-green-500 border-green-500/30 text-green-400'
                              }`}>
                              {task.priority?.toUpperCase()}
                            </span>
                            <TaskStatusDropdown
                              task={task}
                              onStatusChange={handleDirectStatusChange}
                              onEvidenceRequired={handleEvidenceRequired}
                            />
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-zinc-400 mt-2 font-medium">
                          <span className="truncate flex items-center gap-2">
                            <Target size={14} className="text-zinc-500" />
                            {task.project?.name || 'General Task'}
                          </span>
                          <span className="mx-2 text-white/10">•</span>
                          <span className="flex items-center gap-1.5 text-purple-400">
                            {task.points} PTS
                          </span>
                          <span className="mx-2 text-white/10">•</span>
                          <span className="flex items-center gap-2">
                            Due: {formatDeadline(task.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedTaskId === task._id ? <ChevronUp className="h-5 w-5 text-zinc-500" /> : <ChevronDown className="h-5 w-5 text-zinc-500" />}
                    </div>
                  </div>

                  {expandedTaskId === task._id && (
                    <div className="mt-4 pl-6 space-y-6 pt-4 border-t border-white/5">
                      {/* Description */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">{task.description}</p>
                      </div>

                      {/* Revision Feedback Request */}
                      {task.status === 'needs-revision' && task.revisionHistory && task.revisionHistory.length > 0 && (
                        <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Revision Requested by Team Lead
                          </h4>
                          <p className="text-base font-medium text-orange-200 leading-relaxed">
                            "{task.revisionHistory[task.revisionHistory.length - 1].feedback}"
                          </p>
                          {task.revisionHistory[task.revisionHistory.length - 1].newDeadline && (
                            <p className="text-xs text-orange-400/80 mt-2">
                              New Deadline: {formatDeadline(task.revisionHistory[task.revisionHistory.length - 1].newDeadline)}
                            </p>
                          )}
                          <div className="mt-3">
                            <p className="text-xs text-zinc-400">
                              Please address the feedback and then change the status back to <span className="text-white font-bold">Review</span>.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Assigned By */}
                      {task.assignedBy && (
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Assigned By</h4>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-black">
                              {task.assignedBy.firstName?.[0]}{task.assignedBy.lastName?.[0]}
                            </div>
                            <span className="ml-3 text-sm text-white font-medium">
                              {task.assignedBy.firstName} {task.assignedBy.lastName}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Checkpoints */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Checkpoints</h4>

                        {task.checkpoints && task.checkpoints.length > 0 ? (
                          <div className="space-y-3">
                            {task.checkpoints.map((checkpoint) => (
                              <div key={checkpoint._id} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-xl transition-colors hover:border-white/10">
                                <div className="flex items-center">
                                  <div className={`h-5 w-5 mr-4 rounded-full flex items-center justify-center border-2 transition-all ${checkpoint.isCompleted
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                                    : 'border-zinc-700 bg-transparent text-transparent'
                                    }`}>
                                    {checkpoint.isCompleted && <CheckCircle size={12} strokeWidth={4} />}
                                  </div>
                                  <div>
                                    <span className={`text-sm font-medium ${checkpoint.isCompleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                      {checkpoint.title}
                                    </span>
                                    {checkpoint.description && (
                                      <p className="text-xs text-zinc-500 mt-1">{checkpoint.description}</p>
                                    )}
                                    {checkpoint.isCompleted && checkpoint.completedAt && (
                                      <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                                        <Clock size={10} /> Completed on {formatDate(checkpoint.completedAt)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {!checkpoint.isCompleted && task.status !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCheckpoint(checkpoint);
                                      setShowCheckpointModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-2" />
                                    Complete
                                  </button>
                                )}
                                {checkpoint.isCompleted && (
                                  <span className="text-xs text-emerald-500 font-bold flex items-center bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                    <CheckCircle className="h-3 w-3 mr-1.5" />
                                    Completed
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 italic">No checkpoints for this task</p>
                        )}
                      </div>

                      {/* Task Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="text-xs text-zinc-500 font-medium">
                          {/* Helper text space */}
                        </div>

                        {(['manager', 'ceo', 'hr', 'team-lead', 'co-founder'].includes(user?.role) && activeTab === 'review') ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/task/${task._id}`);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Review Task</span>
                          </button>
                        ) : (
                          <div className="text-xs text-zinc-500 font-medium">
                            Use the status dropdown above to update task progress
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Checkpoint Modal */}
      {showCheckpointModal && selectedCheckpoint && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmitEvidence}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Checkpoint</h3>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Checkpoint: {selectedCheckpoint.title}</h4>
                    {selectedCheckpoint.description && (
                      <p className="text-sm text-gray-600 mb-4">{selectedCheckpoint.description}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="url"
                          checked={checkpointEvidence.verificationMethod === 'url'}
                          onChange={handleEvidenceInputChange}
                          className="mr-2"
                        />
                        URL Link
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="screenshot"
                          checked={checkpointEvidence.verificationMethod === 'screenshot'}
                          onChange={handleEvidenceInputChange}
                          className="mr-2"
                        />
                        Screenshot
                      </label>
                    </div>
                  </div>

                  {checkpointEvidence.verificationMethod === 'url' ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification URL
                      </label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          name="verificationUrl"
                          value={checkpointEvidence.verificationUrl}
                          onChange={handleEvidenceInputChange}
                          placeholder="https://example.com/proof"
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Screenshot
                      </label>

                      {!previewUrl ? (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <Image className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                <span>Upload a file</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                          <button
                            type="button"
                            onClick={clearFileSelection}
                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {previewUrl && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Caption (Optional)
                          </label>
                          <textarea
                            name="caption"
                            value={checkpointEvidence.caption}
                            onChange={handleEvidenceInputChange}
                            rows={2}
                            placeholder="Describe what this screenshot shows..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={
                      (checkpointEvidence.verificationMethod === 'url' && !checkpointEvidence.verificationUrl) ||
                      (checkpointEvidence.verificationMethod === 'screenshot' && !checkpointEvidence.screenshot)
                    }
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Checkpoint
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckpointModal(false);
                      setSelectedCheckpoint(null);
                      setCheckpointEvidence({
                        verificationUrl: '',
                        verificationMethod: 'url',
                        screenshot: null,
                        caption: ''
                      });
                      setPreviewUrl(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Evidence Modal */}
      <TaskEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => {
          setShowEvidenceModal(false);
          setSelectedTask(null);
          setPendingStatus(null);
        }}
        task={selectedTask}
        newStatus={pendingStatus}
        onSubmit={handleTaskEvidenceSubmit}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={showTaskDetailModal}
        onClose={() => {
          setShowTaskDetailModal(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdate={(taskId, newStatus) => {
          fetchTasks();
        }}
      />
    </DashboardLayout>
  );
};

export default MyTasks;
