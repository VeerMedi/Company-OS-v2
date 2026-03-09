import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, Image, Video, Link, Download, CheckCircle, AlertCircle, X, Clock, Zap, ChevronRight, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const TaskDetailView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pointsToAward, setPointsToAward] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Helper function to get user's full name
  const getUserName = (user) => {
    if (!user) return 'Unknown User';
    return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown User';
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/details`);
      const taskData = response.data.data || response.data;
      setTask(taskData);
      setPointsToAward(taskData.points || '');
    } catch (error) {
      console.error('Error fetching task details:', error);
      showToast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!pointsToAward || pointsToAward <= 0) {
      showToast.error('Please enter valid points to award');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/manager-complete`, {
        pointsAwarded: parseInt(pointsToAward)
      });

      setTask(response.data);
      showToast.success(`Task completed and ${pointsToAward} points awarded to ${getUserName(task.assignedTo)}`);

      // Navigate back to tasks list
      navigate('/tasks');
    } catch (error) {
      console.error('Error completing task:', error);
      showToast.error('Failed to complete task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      showToast.error('Please provide feedback for the revision request');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        feedback: revisionFeedback.trim()
      };

      if (newDeadline) {
        requestData.newDeadline = newDeadline;
      }

      const response = await api.patch(`/tasks/${taskId}/request-revision`, requestData);

      setTask(response.data.data);
      showToast.success('Revision requested successfully. The individual has been notified.');

      // Close modal and reset form
      setShowRevisionModal(false);
      setRevisionFeedback('');
      setNewDeadline('');

      // Navigate back to tasks list
      navigate('/tasks');
    } catch (error) {
      console.error('Error requesting revision:', error);
      showToast.error(error.response?.data?.message || 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'not-started': 'bg-zinc-800 text-zinc-400 border-zinc-700',
      'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'cant-complete': 'bg-red-500/10 text-red-400 border-red-500/20',
      'needs-revision': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };
    return colors[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const renderEvidence = (task) => {
    // Check both evidence field and statusHistory for evidence
    let evidence = task.evidence;

    // If no evidence in main field, check latest statusHistory entry with evidence
    if ((!evidence || (!evidence.files?.length && !evidence.urls?.length)) && task.statusHistory?.length > 0) {
      // Find the most recent status entry that has evidence
      for (let i = task.statusHistory.length - 1; i >= 0; i--) {
        const statusEntry = task.statusHistory[i];
        if (statusEntry.evidence && (statusEntry.evidence.files?.length > 0 || statusEntry.evidence.urls?.length > 0)) {
          evidence = statusEntry.evidence;
          break;
        }
      }
    }

    if (!evidence) {
      return <p className="text-zinc-500 italic">No evidence submitted</p>;
    }

    const evidenceItems = [];

    // Handle files
    if (evidence.files && evidence.files.length > 0) {
      const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://193.203.160.42:9000';
      evidence.files.forEach((file, index) => {
        evidenceItems.push({
          type: file.mimetype?.startsWith('image/') ? 'image' :
            file.mimetype?.startsWith('video/') ? 'video' : 'document',
          filename: file.originalName || file.filename,
          url: `${baseURL}/uploads/screenshots/${file.filename}`,
          uploadedAt: evidence.submittedAt,
          description: evidence.description
        });
      });
    }

    // Handle URLs
    if (evidence.urls && evidence.urls.length > 0) {
      evidence.urls.forEach((url, index) => {
        evidenceItems.push({
          type: 'url',
          url: url,
          uploadedAt: evidence.submittedAt,
          description: evidence.description
        });
      });
    }

    if (evidenceItems.length === 0) {
      return <p className="text-zinc-500 italic">No evidence submitted</p>;
    }

    return (
      <div className="space-y-4">
        {evidenceItems.map((item, index) => (
          <div key={index} className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  {item.type === 'image' && <Image className="w-5 h-5 text-blue-400" />}
                  {item.type === 'video' && <Video className="w-5 h-5 text-purple-400" />}
                  {item.type === 'url' && <Link className="w-5 h-5 text-emerald-400" />}
                  {item.type === 'document' && <FileText className="w-5 h-5 text-red-400" />}
                </div>
                <span className="font-medium text-white capitalize">{item.type}</span>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {formatDate(item.uploadedAt)}
              </span>
            </div>

            {item.type === 'url' ? (
              <div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
                >
                  {item.url}
                </a>
                {item.description && (
                  <p className="mt-3 text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm font-medium truncate pr-4">{item.filename}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View</span>
                  </a>
                </div>
                {item.description && (
                  <p className="mt-3 text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderNotes = (task) => {
    if (!task.comments || task.comments.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        {task.comments.map((note, index) => (
          <div key={index} className="bg-black/20 border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-300 font-bold">
                {note.user?.firstName?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-zinc-300">
                {note.user?.firstName} {note.user?.lastName}
              </span>
              <span className="text-xs text-zinc-500 ml-auto">
                {formatDate(note.createdAt)}
              </span>
            </div>
            <p className="text-sm text-zinc-400 pl-8">{note.text}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-500 animate-pulse">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Task not found</p>
          <button
            onClick={() => navigate('/tasks')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Return to Tasks
          </button>
        </div>
      </div>
    );
  }

  const canReview = ['manager', 'ceo', 'hr', 'team-lead', 'co-founder'].includes(user?.role);
  // Allow review if task is in 'review' status, OR if it's 'in-progress'/'completed'/'needs-revision' and user is authorized
  const isReviewable = canReview && ['review', 'completed', 'in-progress', 'needs-revision'].includes(task.status);

  // Only show actions for active statuses where action makes sense. 
  // e.g. if completed, maybe we don't want to complete again, but feedback might still be valid? 
  // For now, let's allow actions on all these statuses as requested "sub ka kam review kr sakta hai"
  const showActions = isReviewable;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">

      {/* Header Blur Backdrop */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">

        {/* Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-zinc-500 mb-8">
          <button onClick={() => navigate('/tasks')} className="hover:text-white transition-colors">Tasks</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-200">Review</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${getStatusBadgeColor(task.status)}`}>
                {task.status?.replace('-', ' ')}
              </span>
              {task.source === 'cofounder_rag' && (
                <span className="flex items-center text-xs font-bold text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 rounded uppercase tracking-wider">
                  <Zap className="w-3 h-3 mr-1" />
                  Priority
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
              {task.title}
            </h1>
            {task.project && (
              <p className="text-zinc-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                {task.project.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/tasks')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-all text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Details & Evidence */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Description</h3>
              <p className="text-zinc-200 leading-relaxed text-lg">
                {task.description || "No description provided."}
              </p>
            </div>

            {/* Submitted Evidence */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Submitted Evidence
              </h3>
              {renderEvidence(task)}
            </div>

            {/* Notes & Updates */}
            {task.comments && task.comments.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Notes & Updates
                </h3>
                {renderNotes(task)}
              </div>
            )}

            {/* Revision History */}
            {task.revisionHistory && task.revisionHistory.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Revision History
                </h3>
                <div className="space-y-4">
                  {task.revisionHistory.map((revision, index) => (
                    <div key={index} className="border border-white/5 rounded-xl p-4 bg-black/20">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-bold border uppercase tracking-wide ${revision.isResolved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                            {revision.isResolved ? 'Resolved' : 'Pending'}
                          </span>
                          <span className="text-xs text-zinc-500">
                            #{task.revisionHistory.length - index}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono">
                          {formatDate(revision.requestedAt)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Feedback</p>
                        <p className="text-zinc-300 text-sm">{revision.feedback}</p>
                      </div>

                      {(revision.resolvedAt || revision.newDeadline) && (
                        <div className="flex gap-4 pt-2 border-t border-white/5 mt-2">
                          {revision.newDeadline && (
                            <div>
                              <p className="text-xs text-zinc-500">New Deadline</p>
                              <p className="text-xs text-zinc-300">{formatDate(revision.newDeadline)}</p>
                            </div>
                          )}
                          {revision.resolvedAt && (
                            <div>
                              <p className="text-xs text-zinc-500">Resolved At</p>
                              <p className="text-xs text-zinc-300">{formatDate(revision.resolvedAt)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Meta & Actions */}
          <div className="space-y-6">

            {/* Meta Card */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {getUserName(task.assignedTo).charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Assigned To</p>
                  <p className="font-semibold text-white">{getUserName(task.assignedTo)}</p>
                  <p className="text-xs text-zinc-400">{task.assignedTo?.email}</p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Due Date</p>
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                    {task.deadline ? formatDate(task.deadline).split(',')[0] : 'None'}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Points</p>
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    {task.points} PTS
                  </div>
                </div>
              </div>
            </div>

            {/* Manager Actions Card */}
            {showActions && (
              <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-1 overflow-hidden shadow-lg shadow-blue-900/10">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-5 py-3 border-b border-blue-500/10 mb-1">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Review Actions
                  </h3>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Award Points
                    </label>
                    <input
                      type="number"
                      value={pointsToAward}
                      onChange={(e) => setPointsToAward(e.target.value)}
                      min="1"
                      max="1000"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                      placeholder="0"
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      Will be added to {getUserName(task.assignedTo)}'s wallet
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCompleteTask}
                      disabled={submitting || !pointsToAward}
                      className="col-span-2 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-900/20 font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve & Award
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowRevisionModal(true)}
                      disabled={submitting}
                      className="col-span-2 flex items-center justify-center px-4 py-3 bg-white/5 hover:bg-white/10 text-orange-400 hover:text-orange-300 rounded-xl border border-white/10 font-bold text-sm transition-all hover:border-orange-500/30"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Revision Modal - Dark Theme */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRevisionModal(false)} />

          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg relative z-50 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Request Changes</h3>
                <button onClick={() => setShowRevisionModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Feedback *
                  </label>
                  <textarea
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all resize-none"
                    placeholder="Explain what needs to be improved..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    New Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all scheme-dark"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRevisionModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestRevision}
                    disabled={submitting || !revisionFeedback.trim()}
                    className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailView;