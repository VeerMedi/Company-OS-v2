# Analytics LLM Frontend Integration Guide

## Overview

The Analytics LLM provides AI-powered insights for your Analytics Dashboard. This guide shows you how to integrate it with your React frontend.

## Step 1: Start the Analytics LLM Server

```bash
cd "d:\Coding\vscode\Hustle House\The-Hustle-OS-v1\Auto-LLM\analytics-llm"
python start_server.py
```

The server will run on `http://localhost:5001`

## Step 2: Use the Analytics Service

The service file is located at:
`frontend/src/services/analyticsLLM.service.js`

### Import the service in your Analytics Dashboard component:

```javascript
import analyticsLLMService from '../services/analyticsLLM.service';
```

## Step 3: Integration Examples

### Example 1: Fetch Analytics Summary

```javascript
// In your Analytics Dashboard component
import { useState, useEffect } from 'react';
import analyticsLLMService from '../services/analyticsLLM.service';

function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsLLMService.getSummary();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Projects</h3>
          <p>{analyticsData?.summary_stats?.total_projects}</p>
        </div>
        <div className="stat-card">
          <h3>Active Projects</h3>
          <p>{analyticsData?.summary_stats?.active_projects}</p>
        </div>
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p>{analyticsData?.summary_stats?.total_employees}</p>
        </div>
        <div className="stat-card">
          <h3>Task Completion</h3>
          <p>{analyticsData?.summary_stats?.task_completion_rate}%</p>
        </div>
      </div>

      {/* Projects List */}
      <div className="projects-section">
        <h2>Projects</h2>
        {analyticsData?.projects?.map(project => (
          <div key={project.id} className="project-card">
            <h3>{project.name}</h3>
            <p>Status: {project.status}</p>
            <p>Progress: {project.progress}%</p>
            <p>Tasks: {project.completed_tasks}/{project.total_tasks}</p>
          </div>
        ))}
      </div>

      {/* Employees List */}
      <div className="employees-section">
        <h2>Employees</h2>
        {analyticsData?.employees?.map(employee => (
          <div key={employee.id} className="employee-card">
            <h3>{employee.name}</h3>
            <p>Role: {employee.role}</p>
            <p>Completion Rate: {employee.completion_rate}%</p>
            <p>Total Points: {employee.total_points}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Fetch AI Insights

```javascript
import { useState } from 'react';
import analyticsLLMService from '../services/analyticsLLM.service';

function AIInsightsPanel() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await analyticsLLMService.getInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-insights">
      <button onClick={loadInsights} disabled={loading}>
        {loading ? 'Generating Insights...' : 'Get AI Insights'}
      </button>

      {insights && (
        <>
          {/* Project Insights */}
          <div className="project-insights">
            <h2>Project Insights</h2>
            <p>{insights.project_insights.summary}</p>
            
            <h3>At Risk Projects</h3>
            {insights.project_insights.at_risk?.map((item, idx) => (
              <div key={idx} className="alert-card">
                <h4>{item.project_name}</h4>
                <p><strong>Reason:</strong> {item.reason}</p>
                <p><strong>Recommendation:</strong> {item.recommendation}</p>
              </div>
            ))}

            <h3>Top Performers</h3>
            {insights.project_insights.top_performers?.map((item, idx) => (
              <div key={idx} className="success-card">
                <h4>{item.project_name}</h4>
                <p>{item.reason}</p>
                <p>Completion: {item.completion_rate}%</p>
              </div>
            ))}

            <h3>Recommendations</h3>
            <ul>
              {insights.project_insights.recommendations?.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Employee Insights */}
          <div className="employee-insights">
            <h2>Employee Insights</h2>
            <p>{insights.employee_insights.summary}</p>
            
            <h3>Top Performers</h3>
            {insights.employee_insights.top_performers?.map((emp, idx) => (
              <div key={idx} className="success-card">
                <h4>{emp.name} ({emp.employee_id})</h4>
                <p><strong>Strengths:</strong> {emp.strengths}</p>
                <p>Completion Rate: {emp.completion_rate}%</p>
                <p>Points: {emp.total_points}</p>
              </div>
            ))}

            <h3>Needs Attention</h3>
            {insights.employee_insights.needs_attention?.map((emp, idx) => (
              <div key={idx} className="warning-card">
                <h4>{emp.name} ({emp.employee_id})</h4>
                <p><strong>Concerns:</strong> {emp.concerns}</p>
                <p><strong>Actions:</strong> {emp.suggested_actions}</p>
              </div>
            ))}

            <h3>Recommendations</h3>
            <ul>
              {insights.employee_insights.recommendations?.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
```

### Example 3: Refresh Data

```javascript
const handleRefresh = async () => {
  try {
    await analyticsLLMService.refreshCache();
    // Reload the data
    await loadAnalytics();
    toast.success('Analytics data refreshed!');
  } catch (error) {
    toast.error('Failed to refresh data');
  }
};
```

## Step 4: Where to Show LLM Insights

The LLM insights should be displayed in your **Analytics Dashboard**. Here are the key locations:

### Location 1: Main Analytics Dashboard
**File:** `frontend/src/pages/AnalyticsDashboard.jsx` or similar

Add an "AI Insights" section that shows:
- Project health analysis
- At-risk projects
- Top performing projects
- Employee performance analysis
- Top performers
- Employees needing attention
- Actionable recommendations

### Location 2: Project Details Page
Show project-specific insights when viewing individual projects.

### Location 3: Employee Performance Page
Show employee-specific insights when viewing individual employee reports.

## API Endpoints Reference

```javascript
// Get summary (projects + employees + stats)
analyticsLLMService.getSummary()

// Get only projects
analyticsLLMService.getProjects()

// Get only employees (last 30 days)
analyticsLLMService.getEmployees(30)

// Get AI insights
analyticsLLMService.getInsights()

// Refresh cache
analyticsLLMService.refreshCache()

// Health check
analyticsLLMService.checkHealth()
```

## Response Data Structure

### Summary Response
```javascript
{
  projects: [...],           // Array of project objects
  employees: [...],          // Array of employee objects
  summary_stats: {
    total_projects: 10,
    active_projects: 5,
    total_employees: 15,
    task_completion_rate: 60.0
  },
  timestamp: "2024-01-15T10:30:00"
}
```

### Insights Response
```javascript
{
  project_insights: {
    summary: "Overall analysis...",
    at_risk: [...],
    top_performers: [...],
    recommendations: [...]
  },
  employee_insights: {
    summary: "Overall analysis...",
    top_performers: [...],
    needs_attention: [...],
    recommendations: [...]
  },
  metadata: {
    total_projects: 10,
    total_employees: 15,
    model_used: "gemini-2.0-flash-exp"
  }
}
```

## Troubleshooting

### LLM Server Not Running
- Check if the server is running: `http://localhost:5001/api/analytics/health`
- Start the server: `python start_server.py`

### CORS Issues
- The API already has CORS enabled for all origins
- If issues persist, check browser console for specific errors

### No Data Returned
- Verify MongoDB connection in the server logs
- Check if database name is correct in `.env`
- Run `python test_connection.py` to verify data fetching

### Slow Response
- First request may be slow due to LLM processing
- Subsequent requests use cached data (5 minutes TTL)
- Use refresh button sparingly to avoid rate limits

## Best Practices

1. **Cache Usage**: Don't refresh too frequently (5-minute cache is optimal)
2. **Loading States**: Always show loading indicators during API calls
3. **Error Handling**: Gracefully handle API failures
4. **Progressive Enhancement**: Show basic data first, then load AI insights
5. **User Feedback**: Provide clear feedback when insights are being generated

## Next Steps

1. Create a dedicated "AI Insights" tab in your Analytics Dashboard
2. Add visualizations (charts/graphs) for the analytics data
3. Implement real-time updates using webhooks (optional)
4. Add export functionality for reports
