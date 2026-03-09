# HR Performance Tracking Guide

## Overview
This guide explains how HR can track and monitor employee performance metrics across the organization. The system now provides comprehensive performance tracking for **every employee** with detailed metrics.

## Available Endpoints

### 1. Get All Employee Performance
**Endpoint:** `GET /api/hr/performance/all`  
**Access:** HR, CEO, Co-founder

Get detailed performance metrics for all employees with pagination and filtering.

#### Query Parameters:
- `period` (optional): Time period for metrics
  - `all-time` (default)
  - `this-month`
  - `last-30-days`
  - `this-quarter`
  - `this-year`
- `sortBy` (optional): Sort results by
  - `completionRate` (default)
  - `totalTasks`
  - `points`
  - `productivity`
  - `name`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

#### Example Request:
```bash
GET /api/hr/performance/all?period=this-month&sortBy=completionRate&page=1&limit=50
```

#### Response Structure:
```json
{
  "success": true,
  "data": [
    {
      "employeeId": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "employeeCode": "EMP001",
      "department": "Development",
      "joinedDate": "2024-01-15T00:00:00.000Z",
      
      "totalTasks": 45,
      "completedTasks": 40,
      "inProgressTasks": 3,
      "notStartedTasks": 2,
      "overdueTasks": 1,
      
      "completionRate": 89,
      "avgCompletionTime": 3,
      "onTimeDeliveryRate": 85,
      
      "totalPointsEarned": 450,
      "totalPointsAvailable": 500,
      "pointsCompletionRate": 90,
      
      "productivityScore": 87,
      "currentStreak": 5,
      "longestStreak": 12,
      
      "lastTaskCompleted": "2026-01-06T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalEmployees": 125,
    "hasNext": true,
    "hasPrev": false
  },
  "statistics": {
    "totalEmployees": 125,
    "avgCompletionRate": 82,
    "totalPointsEarned": 45680,
    "totalTasksCompleted": 3456,
    "avgProductivityScore": 79,
    "period": "this-month"
  },
  "generatedAt": "2026-01-07T12:00:00.000Z"
}
```

### 2. Get Individual Employee Performance
**Endpoint:** `GET /api/hr/performance/:employeeId`  
**Access:** HR, CEO, Co-founder

Get comprehensive performance details for a specific employee.

#### Query Parameters:
- `period` (optional): Time period for metrics
  - `all-time` (default)
  - `this-month`
  - `last-30-days`
  - `this-quarter`
  - `this-year`

#### Example Request:
```bash
GET /api/hr/performance/64abc123def456/period=this-month
```

#### Response Structure:
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "employeeCode": "EMP001",
      "department": "Development",
      "role": "individual",
      "isActive": true,
      "joinedDate": "2024-01-15T00:00:00.000Z"
    },
    
    "taskStats": {
      "total": 45,
      "completed": 40,
      "inProgress": 3,
      "notStarted": 2,
      "review": 0,
      "cantComplete": 0,
      "overdue": 1
    },
    
    "metrics": {
      "completionRate": 89,
      "avgCompletionTime": 3,
      "onTimeDeliveryRate": 85,
      "productivityScore": 87,
      "averagePointsPerTask": 10.2
    },
    
    "pointsStats": {
      "totalEarned": 450,
      "totalAvailable": 500,
      "completionRate": 90
    },
    
    "streak": {
      "current": 5,
      "longest": 12,
      "lastActiveDate": "2026-01-06T00:00:00.000Z"
    },
    
    "periodStats": {
      "daily": {
        "tasksCompleted": 2,
        "pointsEarned": 25,
        "onTimeCompletions": 2
      },
      "weekly": {
        "tasksCompleted": 8,
        "pointsEarned": 95,
        "onTimeCompletions": 7
      },
      "monthly": {
        "tasksCompleted": 40,
        "pointsEarned": 450,
        "onTimeCompletions": 34
      }
    },
    
    "recentCompletedTasks": [
      {
        "id": "task123",
        "title": "Implement user dashboard",
        "points": 15,
        "completedAt": "2026-01-06T10:30:00.000Z",
        "project": "HuslOS v2"
      }
    ],
    
    "lastTaskCompleted": "2026-01-06T10:30:00.000Z",
    "period": "this-month",
    "generatedAt": "2026-01-07T12:00:00.000Z"
  }
}
```

## Performance Metrics Explained

### Task Metrics
- **Total Tasks**: All tasks assigned to the employee
- **Completed Tasks**: Tasks with status 'completed'
- **In Progress Tasks**: Tasks currently being worked on
- **Not Started Tasks**: Tasks not yet started
- **Overdue Tasks**: Incomplete tasks past their deadline

### Performance Metrics
- **Completion Rate**: (Completed Tasks / Total Tasks) × 100
  - Measures how many assigned tasks are completed
  - Target: Above 80%
  
- **Average Completion Time**: Average days to complete a task
  - Calculated from acceptance to completion
  - Lower is better (more efficient)
  
- **On-Time Delivery Rate**: (On-time completions / Total completions) × 100
  - Measures tasks completed before deadline
  - Target: Above 85%
  
- **Productivity Score**: Weighted composite score (0-100)
  - 40% Completion Rate
  - 30% On-Time Delivery
  - 20% Extra Tasks
  - 10% Coverage/Team Support
  - Target: Above 75%

### Points Metrics
- **Total Points Earned**: Sum of points from completed tasks
- **Total Points Available**: Sum of points from all assigned tasks
- **Points Completion Rate**: (Points Earned / Points Available) × 100

### Streak Information
- **Current Streak**: Consecutive days with completed tasks
- **Longest Streak**: Best streak achieved
- **Last Active Date**: Most recent task completion

## Use Cases

### 1. Monthly Performance Review
```bash
# Get all employees' performance for this month
GET /api/hr/performance/all?period=this-month&sortBy=completionRate&limit=100
```
Use this to:
- Identify top performers
- Find employees needing support
- Calculate team-wide metrics
- Prepare performance reports

### 2. Individual Employee Review
```bash
# Get detailed metrics for specific employee
GET /api/hr/performance/64abc123def456?period=this-quarter
```
Use this for:
- One-on-one performance discussions
- Identifying training needs
- Tracking improvement over time
- Performance appraisals

### 3. Department Analysis
```bash
# Get all employees and filter by department in frontend
GET /api/hr/performance/all?period=this-year&sortBy=productivity
```
Use this to:
- Compare department performance
- Identify department-specific issues
- Resource allocation decisions

### 4. Quick Dashboard Overview
```bash
# Get summary with top 20 performers
GET /api/hr/performance/all?limit=20&sortBy=points
```
Use this for:
- Daily dashboard monitoring
- Quick performance snapshots
- Leadership updates

## Performance Benchmarks

### Excellent Performance (90-100%)
- Completion Rate: 95%+
- On-Time Delivery: 90%+
- Productivity Score: 85+
- Action: Recognition, potential promotion

### Good Performance (75-89%)
- Completion Rate: 80-94%
- On-Time Delivery: 80-89%
- Productivity Score: 70-84
- Action: Maintain current trajectory

### Needs Improvement (60-74%)
- Completion Rate: 65-79%
- On-Time Delivery: 65-79%
- Productivity Score: 55-69
- Action: Provide support, training

### Concerning Performance (<60%)
- Completion Rate: <65%
- On-Time Delivery: <65%
- Productivity Score: <55
- Action: Urgent intervention needed

## Integration with Existing Systems

### HR Dashboard
The existing HR dashboard (`/api/hr/dashboard`) provides:
- Quick overview of top 10 performers
- Team-wide statistics
- Recent projects and tasks

For detailed analysis, use the new performance endpoints.

### Performance Controller
The performance controller (`/api/performance/individuals`) provides:
- Individual contributor rankings
- Manager-filtered views
- Alternative sorting options

The HR endpoints provide more detailed metrics specifically for HR needs.

## Data Accuracy

### Real-time Calculation
All metrics are calculated in real-time from:
- Task collection (assignments, completions, status)
- DeveloperPerformance model (pre-calculated metrics)
- User records (employee information)

### Performance Model Updates
The `DeveloperPerformance` model is automatically updated when:
- Tasks are completed
- Daily/weekly/monthly rollover occurs
- Streak calculations run

### Caching
- HR dashboard data is cached for 3 minutes
- Performance endpoints calculate fresh data on each request
- For real-time accuracy, use performance endpoints

## Best Practices

1. **Regular Monitoring**: Check performance metrics weekly
2. **Use Appropriate Periods**: Match period to review cycle
3. **Compare Trends**: Use different periods to spot trends
4. **Combine Data**: Use both summary and detailed endpoints
5. **Document Actions**: Track what actions were taken based on metrics

## Troubleshooting

### Employee Shows Zero Metrics
**Cause**: No tasks assigned or no completed tasks  
**Solution**: Check if employee has assigned tasks

### Metrics Seem Inaccurate
**Cause**: Recent task updates not reflected  
**Solution**: Metrics are calculated in real-time; verify task status in database

### Performance Score is 0
**Cause**: No tasks completed or DeveloperPerformance record doesn't exist  
**Solution**: Score requires completed tasks to calculate

## Next Steps

1. Access the endpoints using your HR credentials
2. Test with a few employees first
3. Build dashboards or reports using the data
4. Set up regular performance review schedules
5. Document your performance review process

## Support

For technical issues or questions:
- Check the backend logs for errors
- Verify employee IDs are correct
- Ensure proper authentication headers
- Contact the development team for API issues
