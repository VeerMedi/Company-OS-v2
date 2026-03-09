import React, { useState, useEffect, useRef } from 'react';
import { Send, TrendingUp, AlertTriangle, CheckCircle, Eye, Sparkles, RefreshCw, BarChart3, Users, FolderKanban, Mic, Square, Loader, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../utils/api';
import analyticsLLMService from '../services/analyticsLLM.service';
import AudioPlayer from './voice/AudioPlayer';
import VoiceAgentModal from './voice/VoiceAgentModal';
const ANALYTICS_API = `${import.meta.env.VITE_BACKEND_URL}/api/analytics`;

const AnalyticsDashboard = () => {
  const [serviceType, setServiceType] = useState('service-onboarding');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [llmInsights, setLlmInsights] = useState(null);
  const [llmSummary, setLlmSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLLM, setIsLoadingLLM] = useState(false);
  const [showLLMInsights, setShowLLMInsights] = useState(true);
  const [llmError, setLlmError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [conversationState, setConversationState] = useState(null); // Track multi-turn task creation
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceSessionSummaries, setVoiceSessionSummaries] = useState([]);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchAnalytics();
    checkLLMServerAndFetchData();
  }, [serviceType]);

  const checkLLMServerAndFetchData = async () => {
    setIsLoadingLLM(true);
    setServerStatus('checking');
    setLlmError(null);

    // Artificial delay to ensure "Checking" state is visible/felt by user
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // First check if the LLM server is running
      console.log('Checking Analytics LLM server health...');
      const health = await analyticsLLMService.checkHealth();

      if (!health) {
        setServerStatus('offline');
        setLlmError('Analytics LLM server is not running. Please start it with: python api.py');
        setIsLoadingLLM(false);
        return;
      }

      console.log('Server health:', health);
      setServerStatus('online');

      // Fetch summary and insights
      await fetchLLMData();

    } catch (error) {
      console.error('Error checking LLM server:', error);
      setServerStatus('error');
      setLlmError(`Failed to connect to Analytics LLM server: ${error.message}`);
      setIsLoadingLLM(false);
    }
  };

  const fetchLLMData = async () => {
    setIsLoadingLLM(true);
    setLlmError(null);

    try {
      // Map service type to category
      const category = serviceType === 'service-delivery' ? 'service-delivery' : 'service-onboarding';

      console.log(`Fetching summary from Analytics LLM for ${category}...`);
      const summaryData = await analyticsLLMService.getSummary(category);
      console.log('Summary received:', summaryData);
      setLlmSummary(summaryData);

      console.log(`Fetching insights from Analytics LLM for ${category}...`);
      const insightsData = await analyticsLLMService.getInsights(category);
      console.log('Insights received:', insightsData);
      setLlmInsights(insightsData);

    } catch (error) {
      console.error('Error fetching LLM data:', error);
      setLlmError(`Error: ${error.message}. Make sure the Analytics LLM server is running on port 5002.`);
    } finally {
      setIsLoadingLLM(false);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/analytics/voice?serviceType=${serviceType}`);
      setAnalyticsData(response.data.data);

      setMessages([]);
      addSystemMessage(generateOverviewMessage(response.data.data));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      addSystemMessage('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateOverviewMessage = (data) => {
    if (!data) return 'No data available.';

    const { overview, voiceCategories } = data;

    return `
### ${serviceType === 'service-onboarding' ? 'Service Onboarding' : 'Service Delivery'} Analytics Overview

**Team Performance Summary:**
- **Total Team Members:** ${overview.totalMembers}
- **Average TQS Score:** ${overview.averageTQS.toFixed(2)}
- **Overall Performance:** ${getPerformanceLabel(overview.averageTQS)}

**VOICE Interface Breakdown:**
- 🟢 **Going Good:** ${voiceCategories.goingGood.length} members
- 🟡 **Needs Improvement:** ${voiceCategories.needsImprovement.length} members
- 🔴 **Terribly Bad:** ${voiceCategories.terriblyBad.length} members
- 🔵 **Needs Attention:** ${voiceCategories.needsAttention.length} members

**Key Insights:**
${generateKeyInsights(data)}

Ask me anything about the team's performance, specific members, or detailed breakdowns!
    `;
  };

  const generateKeyInsights = (data) => {
    const insights = [];
    const { voiceCategories, metrics } = data;

    if (voiceCategories.terriblyBad.length > 0) {
      insights.push(`⚠️ **Critical:** ${voiceCategories.terriblyBad.length} team members require immediate attention`);
    }

    if (metrics.avgEfficiency < 0.75) {
      insights.push(`📊 **Efficiency Alert:** Team efficiency at ${(metrics.avgEfficiency * 100).toFixed(1)}% - below optimal`);
    }

    if (metrics.avgCompletion < 0.8) {
      insights.push(`✅ **Completion Rate:** ${(metrics.avgCompletion * 100).toFixed(1)}% - needs improvement`);
    }

    if (voiceCategories.goingGood.length > voiceCategories.needsImprovement.length + voiceCategories.terriblyBad.length) {
      insights.push(`🎉 **Positive Trend:** Majority of team performing well!`);
    }

    return insights.length > 0 ? insights.join('\n') : '✨ Team is performing within expected parameters';
  };

  const getPriorityCard = () => {
    if (!analyticsData) return null;

    const { voiceCategories } = analyticsData;

    // Priority order: Terribly Bad > Needs Improvement > Needs Attention > Going Good
    if (voiceCategories.terriblyBad.length > 0) {
      return { category: 'terriblyBad', data: voiceCategories.terriblyBad };
    }
    if (voiceCategories.needsImprovement.length > 0) {
      return { category: 'needsImprovement', data: voiceCategories.needsImprovement };
    }
    if (voiceCategories.needsAttention.length > 0) {
      return { category: 'needsAttention', data: voiceCategories.needsAttention };
    }
    if (voiceCategories.goingGood.length > 0) {
      return { category: 'goingGood', data: voiceCategories.goingGood };
    }

    return null;
  };

  const getPerformanceLabel = (score) => {
    if (score >= 0.85) return '🟢 Excellent';
    if (score >= 0.6) return '🟡 Good';
    if (score >= 0.4) return '🟠 Fair';
    return '🔴 Needs Attention';
  };

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, {
      type: 'system',
      content,
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (content) => {
    setMessages(prev => [...prev, {
      type: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userQuery = inputMessage.trim();
    addUserMessage(userQuery);
    setInputMessage('');
    setIsLoading(true);

    // Scroll to bottom only when user sends a message
    setTimeout(() => scrollToBottom(), 100);

    try {
      // Call Python RAG server directly for ChatGPT-style responses
      const requestBody = {
        question: userQuery,
        category: serviceType
      };

      // Include conversation state if in the middle of task creation
      if (conversationState) {
        requestBody.conversation_state = conversationState;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // Handle conversation state for multi-turn task creation
      if (data.is_action && data.conversation_state) {
        // Update conversation state for next turn
        setConversationState(data.conversation_state);

        // Show the response (question or confirmation)
        addSystemMessage(data.answer);

        // Show suggestions if available
        if (data.suggestions && data.suggestions.length > 0) {
          const suggestionsText = data.suggestions.map((s, i) =>
            `${i + 1}. ${s.label || s}`
          ).join('\n');
          addSystemMessage(`**Quick selections:**\n${suggestionsText}`);
        }
      } else if (data.action_complete) {
        // Task creation completed or cancelled - clear conversation state
        setConversationState(null);
        addSystemMessage(data.answer);
      } else if (data.answer) {
        // Regular query response - clear any stale conversation state
        if (!data.is_action) {
          setConversationState(null);
        }
        addSystemMessage(data.answer);
      } else {
        // Fallback if no answer field
        addSystemMessage(data.error || 'Failed to get response. Please try again.');
      }
    } catch (error) {
      console.error('Error processing query:', error);
      addSystemMessage('Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice Recording Functions
  const playGreeting = async () => {
    try {
      // Get a greeting audio from TTS to let user know we're listening
      const greetings = [
        "I'm listening, go ahead.",
        "Yes, how can I help you?",
        "I'm ready, what would you like to know?",
        "Go ahead, I'm listening."
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/rag/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: greeting })
      });

      const data = await response.json();

      if (data.success && data.audio_base64) {
        // Play the greeting audio
        const audioData = atob(data.audio_base64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: data.mime_type || 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Return a promise that resolves when audio finishes
        return new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            resolve(); // Continue even if greeting fails
          };
          audio.play().catch(() => resolve());
        });
      }
    } catch (error) {
      console.log('Greeting audio skipped:', error.message);
      // Continue even if greeting fails
    }
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];

      // Play greeting audio first to confirm we're listening
      setIsProcessingVoice(true);
      await playGreeting();
      setIsProcessingVoice(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleVoiceQuery(audioBlob, mimeType);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsProcessingVoice(false);
      addSystemMessage('❌ Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleVoiceQuery = async (audioBlob, mimeType) => {
    if (!audioBlob || audioBlob.size === 0) {
      console.error('Empty audio blob');
      return;
    }

    setIsProcessingVoice(true);
    addUserMessage('🎤 Voice message...');
    setTimeout(() => scrollToBottom(), 100);

    // Play a quick acknowledgment that we're processing
    try {
      const acks = [
        "Let me check that for you.",
        "One moment please.",
        "Looking into that now.",
        "Got it, checking now."
      ];
      const ack = acks[Math.floor(Math.random() * acks.length)];

      const ackResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/rag/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: ack })
      });

      const ackData = await ackResponse.json();
      if (ackData.success && ackData.audio_base64) {
        const audioData = atob(ackData.audio_base64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: ackData.mime_type || 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(() => { });
        // Don't wait for this to finish - let it play while we process
      }
    } catch (error) {
      console.log('Acknowledgment audio skipped:', error.message);
    }


    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], 'voice_query.webm', { type: mimeType });
      formData.append('audio', audioFile);
      formData.append('category', serviceType);

      if (conversationState) {
        formData.append('conversation_state', JSON.stringify(conversationState));
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/rag/voice-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Voice query failed');
      }

      // Update the user message with transcribed text
      setMessages(prev => {
        const updated = [...prev];
        const lastUserIdx = updated.findLastIndex(m => m.type === 'user' && m.content.includes('🎤'));
        if (lastUserIdx !== -1) {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            content: `🎤 ${data.question}`
          };
        }
        return updated;
      });

      // Add assistant response with streaming text effect
      const messageId = Date.now();
      const fullText = data.answer;

      // Add message with empty content initially (will be filled progressively)
      setMessages(prev => [...prev, {
        id: messageId,
        type: 'system',
        content: '',
        fullContent: fullText,
        isVoice: true,
        isStreaming: true,
        audioBase64: data.audio_base64,
        audioMimeType: data.audio_mime_type || 'audio/mp3',
        timestamp: new Date()
      }]);

      // Play audio and stream text simultaneously
      if (data.audio_base64 && autoPlayAudio) {
        const audioData = atob(data.audio_base64);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: data.audio_mime_type || 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Estimate speech duration (rough: 150 words per minute for TTS)
        const wordCount = fullText.split(/\s+/).length;
        const estimatedDuration = Math.max(2000, (wordCount / 150) * 60 * 1000);
        const words = fullText.split(/(\s+)/); // Keep spaces
        const intervalTime = estimatedDuration / words.length;

        let wordIndex = 0;
        let displayedText = '';

        // Start streaming text when audio begins
        audio.onplay = () => {
          const streamInterval = setInterval(() => {
            if (wordIndex < words.length) {
              displayedText += words[wordIndex];
              wordIndex++;

              setMessages(prev => prev.map(msg =>
                msg.id === messageId
                  ? { ...msg, content: displayedText }
                  : msg
              ));
            } else {
              clearInterval(streamInterval);
            }
          }, intervalTime);

          // Cleanup when audio ends
          audio.onended = () => {
            clearInterval(streamInterval);
            // Ensure full text is shown
            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? { ...msg, content: fullText, isStreaming: false }
                : msg
            ));
            URL.revokeObjectURL(audioUrl);
          };
        };

        audio.onerror = () => {
          // If audio fails, show full text immediately
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: fullText, isStreaming: false }
              : msg
          ));
          URL.revokeObjectURL(audioUrl);
        };

        audio.play().catch(() => {
          // If play fails, show full text immediately
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: fullText, isStreaming: false }
              : msg
          ));
        });
      } else {
        // No audio - show full text with typewriter effect
        const words = fullText.split(/(\s+)/);
        let wordIndex = 0;
        let displayedText = '';

        const streamInterval = setInterval(() => {
          if (wordIndex < words.length) {
            displayedText += words[wordIndex];
            wordIndex++;

            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? { ...msg, content: displayedText }
                : msg
            ));
          } else {
            clearInterval(streamInterval);
            setMessages(prev => prev.map(msg =>
              msg.id === messageId
                ? { ...msg, isStreaming: false }
                : msg
            ));
          }
        }, 50); // Fast typewriter for text-only
      }

      // Handle conversation state
      if (data.is_action && data.conversation_state) {
        setConversationState(data.conversation_state);
      } else if (data.action_complete || !data.is_action) {
        setConversationState(null);
      }

    } catch (error) {
      console.error('Voice query error:', error);
      addSystemMessage(`❌ Voice query failed: ${error.message}`);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const loadProjectsAndManagers = async () => {
    try {
      // Load projects
      const projectsResponse = await api.get('/projects');
      const projectData = projectsResponse.data.data || projectsResponse.data || [];
      setProjects(Array.isArray(projectData) ? projectData : []);

      // Load managers and HR users
      const usersResponse = await api.get('/users');
      const userData = usersResponse.data.data || usersResponse.data || [];
      const usersArray = Array.isArray(userData) ? userData : [];
      const managerUsers = usersArray.filter(user =>
        ['manager', 'hr'].includes(user.role) && user.isActive
      );
      setManagers(managerUsers);
    } catch (error) {
      console.error('Error loading projects/managers:', error);
    }
  };

  const handleExecuteAction = async (confirmedParams) => {
    setIsExecutingAction(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${ANALYTICS_API}/rag/execute-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action_type: actionProposal.action_type,
          action_params: confirmedParams
        })
      });

      const result = await response.json();

      if (result.success) {
        addSystemMessage(`✅ **Task created successfully!**\\n\\nTask ID: ${result.task_id}\\n\\n${result.message}`);

        if (result.overriddenTasks && result.overriddenTasks.length > 0) {
          addSystemMessage(`⚠️ **${result.overriddenTasks.length} task(s) were postponed** due to the urgency of this task.`);
        }

        setShowActionModal(false);
        setActionProposal(null);
      } else {
        addSystemMessage(`❌ **Failed to create task:** ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      addSystemMessage(`❌ **Error:** ${error.message}`);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleCancelAction = () => {
    setShowActionModal(false);
    setActionProposal(null);
    addSystemMessage('Action cancelled.');
  };

  const handleRefreshLLM = async () => {
    setIsLoadingLLM(true);
    try {
      await analyticsLLMService.refreshCache();
    } catch (err) {
      console.warn('Cache refresh failed/skipped:', err);
    }
    await checkLLMServerAndFetchData();
  };

  const renderLLMSummaryStats = () => {
    if (!llmSummary || !llmSummary.summary_stats) return null;

    const stats = llmSummary.summary_stats;
    const isServiceDelivery = serviceType === 'service-delivery';
    
    // Calculate completion rates
    const taskCompletionRate = stats.total_tasks > 0 
      ? ((stats.completed_tasks / stats.total_tasks) * 100).toFixed(1)
      : 0;
    
    const projectCompletionRate = stats.total_projects > 0
      ? ((stats.completed_projects / stats.total_projects) * 100).toFixed(1)
      : 0;
    
    // Debug logging
    console.log('📊 Rendering stats:', {
      total_bunches: stats.total_bunches,
      total_tasks: stats.total_tasks,
      category: serviceType,
      timestamp: llmSummary.timestamp
    });

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Projects or Leads */}
        <div className="bg-[#09090b] bg-opacity-80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <FolderKanban className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-zinc-400">
              {isServiceDelivery ? 'Total Projects' : 'Sales Pipeline'}
            </p>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{stats.total_projects}</p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            <span className="text-emerald-400">{stats.active_projects} active</span> • {stats.completed_projects} {isServiceDelivery ? 'completed' : 'won'}
          </p>
        </div>

        {/* Card 2: Task Bunches or Leads */}
        <div className="bg-[#09090b] bg-opacity-80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-zinc-400">
              {isServiceDelivery ? 'Task Bunches' : 'Total Tasks'}
            </p>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">
            {isServiceDelivery ? (stats.total_bunches || 0) : (stats.total_tasks || 0)}
          </p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            <span className="text-emerald-400">{taskCompletionRate}%</span> completion rate
          </p>
        </div>

        {/* Card 3: Team Members */}
        <div className="bg-[#09090b] bg-opacity-80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Users className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-zinc-400">
              {isServiceDelivery ? 'Team Members' : 'Sales Team'}
            </p>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{stats.total_employees}</p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            {isServiceDelivery ? 'Active employees' : 'Active sales reps'}
          </p>
        </div>

        {/* Card 4: Progress or Conversion */}
        <div className="bg-[#09090b] bg-opacity-80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <p className="text-sm text-zinc-400">
              {isServiceDelivery ? 'Project Progress' : 'Success Rate'}
            </p>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{projectCompletionRate}%</p>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            {isServiceDelivery ? 'Overall completion' : 'Overall success'}
          </p>
        </div>
      </div>
    );
  };

  const renderLLMInsights = () => {
    if (!llmInsights) return null;

    const { project_insights, employee_insights, insights } = llmInsights;
    const isServiceDelivery = serviceType === 'service-delivery';
    const categoryTitle = isServiceDelivery ? 'Service Delivery' : 'Service Onboarding';

    // If we have raw insights text (new structured format), render it with enhanced UI
    if (insights && typeof insights === 'string') {
      // Parse markdown sections for structured display
      const sections = parseInsightsSections(insights);
      
      return (
        <div className="space-y-6">
          {/* Main Insights Card with Gradient Header */}
          <div className="relative bg-gradient-to-br from-[#09090b] via-[#18181b] to-[#09090b] rounded-[28px] border border-white/10 shadow-2xl overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
            
            {/* Header with Icon */}
            <div className="relative border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-400/30 backdrop-blur-sm">
                      <Sparkles className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 tracking-tight">
                      AI-Powered Insights
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1 font-medium">
                      {categoryTitle} • Organizational Intelligence Report
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-400/20">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Analysis</span>
                </div>
              </div>
            </div>

            {/* Content Area with Structured Sections */}
            <div className="relative p-8 space-y-8">
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => (
                      <h1 className="text-3xl font-black text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4" {...props}>
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                        {props.children}
                      </h1>
                    ),
                    h2: ({node, ...props}) => (
                      <h2 className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-3" {...props}>
                        <div className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
                        {props.children}
                      </h2>
                    ),
                    h3: ({node, ...props}) => (
                      <h3 className="text-xl font-bold text-blue-200 mt-6 mb-3 flex items-center gap-2" {...props}>
                        <span className="text-blue-400">▸</span>
                        {props.children}
                      </h3>
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="space-y-3 my-4" {...props} />
                    ),
                    li: ({node, ...props}) => (
                      <li className="flex items-start gap-3 text-zinc-300 leading-relaxed" {...props}>
                        <span className="text-blue-400 mt-1.5 text-xs">●</span>
                        <span className="flex-1">{props.children}</span>
                      </li>
                    ),
                    p: ({node, ...props}) => (
                      <p className="text-zinc-300 leading-relaxed my-4" {...props} />
                    ),
                    strong: ({node, ...props}) => (
                      <strong className="text-white font-bold" {...props} />
                    ),
                    em: ({node, ...props}) => (
                      <em className="text-blue-300 not-italic font-semibold" {...props} />
                    ),
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-500/50 bg-blue-500/5 pl-6 py-4 my-6 rounded-r-lg" {...props} />
                    ),
                    code: ({node, inline, ...props}) => 
                      inline ? (
                        <code className="px-2 py-0.5 rounded bg-zinc-800 text-blue-300 text-sm font-mono border border-zinc-700" {...props} />
                      ) : (
                        <code className="block p-4 rounded-lg bg-zinc-900 text-emerald-300 text-sm font-mono border border-zinc-800 overflow-x-auto" {...props} />
                      )
                  }}
                >
                  {insights}
                </ReactMarkdown>
              </div>
            </div>

            {/* Footer with Metadata */}
            <div className="relative border-t border-white/10 bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 px-8 py-4">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    AI Model Active
                  </span>
                  <span>•</span>
                  <span>Generated {new Date().toLocaleTimeString()}</span>
                </div>
                <span className="text-zinc-600">Powered by GPT-4</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Helper function to parse insights (not used in current flow but kept for future)
    function parseInsightsSections(text) {
      const sections = [];
      const lines = text.split('\n');
      let currentSection = null;
      
      lines.forEach(line => {
        if (line.startsWith('##')) {
          if (currentSection) sections.push(currentSection);
          currentSection = { title: line.replace('##', '').trim(), content: [] };
        } else if (currentSection) {
          currentSection.content.push(line);
        }
      });
      
      if (currentSection) sections.push(currentSection);
      return sections;
    }

    // Add defensive checks for undefined insights
    if (!project_insights || !employee_insights) {
      return (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-[24px] border border-white/10 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Generating Insights...</h3>
          </div>
          <p className="text-zinc-400 text-center">AI is analyzing your data. This may take a few moments. Please wait or refresh.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Project Insights */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-[24px] border border-white/10 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">AI Project Insights</h3>
          </div>

          <div className="prose prose-invert prose-sm max-w-none mb-8 text-zinc-300 leading-relaxed">
            <p>{project_insights.summary}</p>
          </div>

          {/* At Risk Projects */}
          {project_insights.at_risk && project_insights.at_risk.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Projects At Risk
              </h4>
              <div className="grid gap-4">
                {project_insights.at_risk.map((item, idx) => (
                  <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 hover:bg-red-500/10 transition-colors">
                    <h5 className="font-bold text-red-200 text-lg mb-1">{item.project_name}</h5>
                    <p className="text-sm text-red-300/80 mb-2"><strong>Reason:</strong> {item.reason}</p>
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/10">
                      <p className="text-sm text-red-200"><strong>Recommendation:</strong> {item.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performing Projects */}
          {project_insights.top_performers && project_insights.top_performers.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Top Performing Projects
              </h4>
              <div className="grid gap-4">
                {project_insights.top_performers.map((item, idx) => (
                  <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 hover:bg-emerald-500/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-emerald-200 text-lg">{item.project_name}</h5>
                      {item.completion_rate && (
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs font-bold border border-emerald-500/20">
                          {item.completion_rate}% Done
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-emerald-300/80 mt-2">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {project_insights.recommendations && project_insights.recommendations.length > 0 && (
            <div className="bg-blue-500/5 rounded-xl border border-blue-500/10 p-6">
              <h4 className="text-lg font-bold text-blue-200 mb-4">Strategic Recommendations</h4>
              <ul className="space-y-3">
                {project_insights.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-zinc-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Employee Insights */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-[24px] border border-white/10 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">AI Employee Insights</h3>
          </div>

          <div className="prose prose-invert prose-sm max-w-none mb-8 text-zinc-300 leading-relaxed">
            <p>{employee_insights.summary}</p>
          </div>

          {/* Top Performers */}
          {employee_insights.top_performers && employee_insights.top_performers.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Top Performers
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {employee_insights.top_performers.map((emp, idx) => (
                  <div key={idx} className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 hover:bg-emerald-500/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-bold text-emerald-200 text-lg">{emp.name}</h5>
                        <p className="text-xs text-emerald-500 font-mono">{emp.employee_id}</p>
                      </div>
                      <div className="text-right">
                        {emp.completion_rate && (
                          <div className="text-xl font-bold text-emerald-300">{emp.completion_rate}%</div>
                        )}
                        {emp.total_points && (
                          <p className="text-xs text-emerald-500">{emp.total_points} pts</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-emerald-300/90"><strong>Strengths:</strong> {emp.strengths}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs Attention */}
          {employee_insights.needs_attention && employee_insights.needs_attention.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Employees Needing Attention
              </h4>
              <div className="grid gap-4">
                {employee_insights.needs_attention.map((emp, idx) => (
                  <div key={idx} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 hover:bg-amber-500/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-bold text-amber-200 text-lg">{emp.name} <span className="text-amber-500/70 text-sm font-normal">({emp.employee_id})</span></h5>
                    </div>
                    <p className="text-sm text-amber-300/80 mb-2"><strong>Concerns:</strong> {emp.concerns}</p>
                    <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/10 mt-2">
                      <p className="text-sm text-amber-200"><strong>Actions:</strong> {emp.suggested_actions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {employee_insights.recommendations && employee_insights.recommendations.length > 0 && (
            <div className="bg-purple-500/5 rounded-xl border border-purple-500/10 p-6">
              <h4 className="text-lg font-bold text-purple-200 mb-4">Talent Recommendations</h4>
              <ul className="space-y-3">
                {employee_insights.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="text-zinc-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVOICECard = (category, data) => {
    const configs = {
      goingGood: {
        title: '1. Going Good',
        subtitle: 'Highlights of high performance and success',
        icon: CheckCircle,
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        iconColor: 'text-emerald-400',
        textColor: 'text-emerald-200'
      },
      needsImprovement: {
        title: '2. Needs Improvement',
        subtitle: 'Areas of underperformance or slow pace',
        icon: AlertTriangle,
        borderColor: 'border-amber-500/20',
        bgColor: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-200'
      },
      terriblyBad: {
        title: '3. Terribly Bad',
        subtitle: 'Critical failures requiring immediate intervention',
        icon: AlertTriangle,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        iconColor: 'text-red-400',
        textColor: 'text-red-200'
      },
      needsAttention: {
        title: '4. Needs Attention (Low Priority)',
        subtitle: 'Emerging risks or conflicts requiring monitoring',
        icon: Eye,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-200'
      }
    };

    const config = configs[category];
    const Icon = config.icon;

    return (
      <div className={`${config.bgColor} ${config.borderColor} border rounded-[24px] p-8`}>
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-4 ${config.bgColor} rounded-full border ${config.borderColor}`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-bold ${config.textColor}`}>{config.title}</h3>
            <p className="text-sm text-zinc-400 mt-1 font-medium">{config.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-zinc-500 italic text-center py-4">No team members in this category</p>
          ) : (
            data.map((member, idx) => (
              <div key={idx} className="bg-black/20 rounded-xl p-5 border border-white/5 backdrop-blur-sm hover:bg-black/40 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white text-lg">{member.name}</p>
                    <p className="text-sm text-zinc-500">{member.email}</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${member.tqs >= 0.85 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' :
                    member.tqs >= 0.6 ? 'bg-amber-500/20 text-amber-300 border-amber-500/20' :
                      'bg-red-500/20 text-red-300 border-red-500/20'
                    }`}>
                    TQS: {member.tqs.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Alignment</p>
                    <p className="text-base font-bold text-white">{(member.scores.alignment * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Efficiency</p>
                    <p className="text-base font-bold text-white">{(member.scores.efficiency * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Completion</p>
                    <p className="text-base font-bold text-white">{(member.scores.completion * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">Compliance</p>
                    <p className="text-base font-bold text-white">{(member.scores.compliance * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {member.triggers && member.triggers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Trigger Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {member.triggers.map((trigger, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/10 text-zinc-300 rounded-md text-xs font-medium border border-white/5">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderServerStatus = () => {
    if (serverStatus === 'checking') {
      return (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 text-blue-400 animate-spin" />
            <p className="text-blue-300 font-medium">Connecting to Analytics Brain...</p>
          </div>
        </div>
      );
    }

    if (serverStatus === 'offline' || serverStatus === 'error') {
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h4 className="text-red-200 font-bold text-lg">Analytics Brain Offline</h4>
            </div>
            <p className="text-red-300/80 text-sm mb-4 max-w-2xl">{llmError || 'The Analytics LLM server is currently unreachable. Please start the server to access AI insights.'}</p>

            <div className="bg-black/30 rounded-lg p-4 border border-red-500/10 font-mono text-xs overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Startup Command</span>
              </div>
              <code className="block text-emerald-400">
                cd "d:\Coding\vscode\Hustle House\The-Hustle-OS-v1\Auto-LLM\analytics-llm"<br />
                python api.py
              </code>
            </div>

            <button
              onClick={checkLLMServerAndFetchData}
              className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    if (serverStatus === 'online') {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6">
          <p className="text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Analytics Brain Connected & Active
          </p>
        </div>
      );
    }

    return null;
  };

  const renderDebugInfo = () => {
    if (!showLLMInsights) return null;

    return (
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 mb-6 backdrop-blur-sm">
        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          System Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold mb-1">Server Status</span>
            <span className={`font-bold text-lg ${serverStatus === 'online'
              ? 'text-emerald-400'
              : serverStatus === 'offline'
                ? 'text-red-400'
                : 'text-amber-400'
              }`}>
              {serverStatus.charAt(0).toUpperCase() + serverStatus.slice(1)}
            </span>
          </div>
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold mb-1">Summary Loaded</span>
            <span className={`font-bold text-lg ${llmSummary ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {llmSummary ? 'Ready' : 'Pending'}
            </span>
          </div>
          <div className="bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold mb-1">Insights Loaded</span>
            <span className={`font-bold text-lg ${llmInsights ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {llmInsights ? 'Ready' : 'Pending'}
            </span>
          </div>

          {llmSummary && (
            <>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold mb-1">Projects Found</span>
                <span className="font-bold text-lg text-blue-400">
                  {llmSummary.projects?.length || 0}
                </span>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold mb-1">Employees Found</span>
                <span className="font-bold text-lg text-purple-400">
                  {llmSummary.employees?.length || 0}
                </span>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5 col-span-2">
                <span className="text-zinc-500 block text-xs uppercase tracking-wider font-bold mb-1">Last Updated</span>
                <span className="font-bold text-xs text-emerald-400">
                  {llmSummary.timestamp ? new Date(llmSummary.timestamp).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </>
          )}
        </div>
        {llmError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-mono">{llmError}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a0a] to-[#18181b] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#18181b] to-[#09090b] border-b border-white/5 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight drop-shadow-lg">Analytics Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium tracking-wide">VOICE Interface - Team Quality Score Analysis</p>
          </div>
          <div className="flex gap-3">

            <button
              onClick={handleRefreshLLM}
              disabled={isLoadingLLM}
              className="px-4 py-2 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 flex items-center gap-2 border border-white/10 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLLM ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Service Type Selection */}
      <div className="bg-gradient-to-b from-[#09090b] to-[#18181b] border-b border-white/5 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Service Type</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setServiceType('service-onboarding')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${serviceType === 'service-onboarding'
                ? 'bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.4)] transform scale-105'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-white/10'
                }`}
            >
              Service Onboarding
            </button>
            <button
              onClick={() => setServiceType('service-delivery')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${serviceType === 'service-delivery'
                ? 'bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.4)] transform scale-105'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-white/10'
                }`}
            >
              Service Delivery
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Server Status & Debug Info */}
          {renderServerStatus()}
          {renderDebugInfo()}

          {/* LLM Summary Stats */}
          {serverStatus === 'online' && renderLLMSummaryStats()}

          {/* LLM Insights */}
          {serverStatus === 'online' && !isLoadingLLM && renderLLMInsights()}

          {/* Loading LLM */}
          {isLoadingLLM && (
            <div className="bg-gradient-to-b from-[#18181b] to-[#09090b] rounded-[24px] border border-white/10 p-8 text-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              <p className="text-zinc-300 font-medium">Generating AI insights...</p>
            </div>
          )}
        </div>
      </div>



      {/* Voice Modal (HTTP-based with Socket.IO voice pipeline) */}
      <VoiceAgentModal
        isOpen={showVoiceModal}
        onClose={() => {
          setShowVoiceModal(false);
        }}
        backendUrl={import.meta.env.VITE_BACKEND_URL}
        category={serviceType}
        onSessionEnd={(summary) => {
          // Add voice session summary to chat messages
          if (summary && summary.history && summary.history.length > 0) {
            const summaryText = summary.history.map((ex, i) =>
              `**Q${i + 1}:** ${ex.user}\n**A${i + 1}:** ${ex.assistant}`
            ).join('\n\n');

            setMessages(prev => [...prev, {
              type: 'system',
              content: `### 🎤 Voice Session Summary\n\n${summaryText}`,
              timestamp: new Date()
            }]);

            setVoiceSessionSummaries(prev => [...prev, {
              exchanges: summary.history,
              timestamp: new Date()
            }]);
          }
        }}
      />
    </div>
  );
};

export default AnalyticsDashboard;

