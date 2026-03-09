# HR Payroll with Performance Metrics

## Overview
The HR Payroll system now integrates **performance metrics**, **attendance data**, and **leave records** to automatically calculate employee salaries. This provides a comprehensive view of each employee's compensation based on their actual work output and attendance.

## Features

### 1. Automated Payroll Calculation
- **Basic Salary**: Retrieved from employee profile or set manually
- **Attendance-based Adjustments**: Salary adjusted based on present days vs total working days
- **Performance Incentives**: Automatic calculation based on productivity score and points
- **Leave Integration**: Leave days properly accounted in working day calculations
- **Overtime Pay**: Calculated from approved overtime hours
- **Deductions**: Tax, PF, insurance, and other deductions applied

### 2. Performance Metrics Included
- ✅ **Task Completion Rate**: Percentage of completed tasks vs total assigned
- ⭐ **Total Points Earned**: Sum of points from completed tasks
- ✓ **Tasks Completed**: Number of successfully completed tasks
- ⚠️ **Overdue Tasks**: Number of tasks past their due date

### 3. Attendance Metrics Included
- 📅 **Total Working Days**: Calculated excluding weekends
- ✓ **Present Days**: Days marked as present/partial/late/early-departure
- 🏖️ **Leave Days**: Approved leave days within the month
- 📊 **Attendance Rate**: Percentage of present days vs total working days

### 4. Salary Breakdown Display
- **Basic Salary**: Base pay (adjusted for attendance)
- **Gross Salary**: Basic + Allowances + Overtime + Bonus
- **Incentive Amount**: Performance-based bonus (with tier badge)
- **Total Deductions**: All deductions combined
- **Net Salary**: Final take-home amount

## API Endpoints

### Get Payroll Preview for All Employees
```
GET /api/hr/payroll/preview
```

**Query Parameters:**
- `month` (optional): Month number (1-12), defaults to current month
- `year` (optional): Year (e.g., 2026), defaults to current year

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "employeeId": "...",
      "employeeCode": "EMP001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "developer",
      "department": "Engineering",
      "performance": {
        "totalTasks": 25,
        "completedTasks": 20,
        "overdueTasks": 2,
        "completionRate": 80,
        "totalPointsEarned": 150
      },
      "attendance": {
        "totalWorkingDays": 22,
        "presentDays": 20,
        "leaveDays": 2,
        "attendanceRate": 91
      },
      "payroll": {
        "basicSalary": 30000,
        "grossSalary": 45000,
        "netSalary": 38250,
        "totalDeductions": 6750,
        "workingDays": {
          "total": 22,
          "present": 20,
          "absent": 0,
          "leave": 2
        },
        "incentiveAmount": 5000,
        "incentiveTier": "Gold"
      }
    }
  ],
  "month": 1,
  "year": 2026,
  "count": 15
}
```

## Frontend Implementation

### Page Location
`frontend/src/pages/HRPayroll.jsx`

### Access
Navigate to: **HR Dashboard → Payroll**

### Features Available in UI

#### 1. Summary Cards
- Total Employees count
- Total Net Payroll amount
- Average Completion Rate
- Average Attendance Rate

#### 2. Filters & Sorting
- **Month/Year Selector**: Choose any month/year for payroll calculation
- **Search**: Filter by name, employee code, or email
- **Sort By**: Name, Net Salary, Completion Rate, or Attendance
- **Sort Order**: Ascending or Descending

#### 3. Data Table Columns
- **Employee**: Name, code, role with avatar
- **Performance**: Completion rate, tasks completed, overdue tasks, points earned
- **Attendance**: Attendance rate, present days, leave days
- **Salary Breakdown**: Basic, Gross, Incentive, Deductions
- **Net Salary**: Final amount with tier badge if incentive earned

#### 4. Export Functionality
- Export to CSV with all employee data
- Includes all metrics and salary details
- Filename format: `payroll_Month_Year.csv`

#### 5. Color-Coded Status
- **Completion Rate**:
  - ≥80%: Green
  - 60-79%: Yellow
  - <60%: Red
  
- **Attendance Rate**:
  - ≥90%: Green
  - 75-89%: Yellow
  - <75%: Red

## Backend Implementation

### Controller Location
`backend/controllers/hrController.js`

### Function: `getAllEmployeePayrollPreview`

**Key Features:**
1. Fetches all active employees (excludes CEO, Co-founder, HR)
2. Calculates performance metrics from Task model
3. Retrieves attendance records from Attendance model
4. Fetches leave data from Leave model
5. Uses `AutomatedPayrollService` for salary calculation
6. Processes all employees in parallel for performance
7. Returns comprehensive payroll preview data

**Dependencies:**
- `User` model
- `Task` model
- `Attendance` model
- `Leave` model
- `AutomatedPayrollService`

### Service Used
`backend/services/AutomatedPayrollService.js`

**Method:** `calculateAutomatedPayroll()`

Handles:
- Working days calculation (excluding weekends)
- Attendance-based salary adjustment
- Overtime calculation
- Incentive calculation (via IncentiveCalculator)
- Allowances calculation (HRA, Transport, Medical, Performance, Other)
- Deductions calculation (Tax, PF, Insurance, Loan, Other)
- Final salary computation (Gross and Net)

## Calculation Logic

### 1. Task Completion Rate
```javascript
completionRate = (completedTasks / totalTasks) * 100
```

### 2. Attendance Rate
```javascript
attendanceRate = (presentDays / totalWorkingDays) * 100
```

### 3. Attendance-based Salary Adjustment
```javascript
adjustedBasicSalary = basicSalary * (presentDays / totalWorkingDays)
```

### 4. Working Days Calculation
- Counts only weekdays (Monday-Friday)
- Excludes weekends (Saturday-Sunday)
- Considers date range within the selected month

### 5. Leave Days Calculation
- Only approved/hr_approved leaves counted
- Calculates overlap with selected month
- Counts only working days within leave period

### 6. Gross Salary
```javascript
grossSalary = adjustedBasicSalary + allowances + bonus + overtime
```

### 7. Net Salary
```javascript
netSalary = grossSalary - totalDeductions
```

## Incentive Tiers

Based on `IncentiveCalculator` service:
- 🥉 **Bronze**: Entry level incentive
- 🥈 **Silver**: Good performance
- 🥇 **Gold**: High performance
- 💎 **Platinum**: Excellent performance
- 💎 **Diamond**: Outstanding performance

Incentive amount added to performance allowance automatically.

## Usage Example

### For HR User:

1. **Login** as HR user
2. **Navigate** to HR Dashboard
3. **Click** "Payroll" in sidebar
4. **Select** desired month and year
5. **Review** all employee payroll data with metrics
6. **Filter/Sort** as needed
7. **Export** to CSV for records

### Sample Use Cases:

**1. Monthly Payroll Processing:**
- Set month to current month
- Review all employees' calculated salaries
- Check for anomalies (low attendance, low completion rate)
- Export data for accounting/finance team

**2. Performance-based Bonus Review:**
- Sort by Completion Rate (descending)
- Identify top performers
- Verify incentive tier and amounts
- Compare with attendance data

**3. Attendance Impact Analysis:**
- Sort by Attendance Rate
- Identify employees with low attendance
- Review salary adjustments
- Check leave balance vs present days

**4. Individual Employee Verification:**
- Search for specific employee
- Review their performance metrics
- Check attendance record
- Verify final salary calculation

## Data Flow

```
User Request → Frontend (HRPayroll.jsx)
              ↓
        API Call: GET /hr/payroll/preview
              ↓
        Backend Route (hr.js)
              ↓
        Controller: getAllEmployeePayrollPreview
              ↓
        Database Queries:
        - User (employees)
        - Task (performance metrics)
        - Attendance (present days)
        - Leave (leave days)
              ↓
        AutomatedPayrollService
              ↓
        Calculate for each employee:
        - Working days
        - Attendance adjustment
        - Overtime
        - Incentive (via IncentiveCalculator)
        - Allowances & Deductions
        - Gross & Net Salary
              ↓
        Return Response → Frontend
              ↓
        Display in Table with Filters
```

## Security & Permissions

### Role-based Access:
- ✅ HR
- ✅ CEO
- ✅ Co-founder
- ❌ Other roles (managers, developers, etc.)

### Rate Limiting:
- 50 requests per 5 minutes per IP
- Protects against API abuse

### Authentication:
- JWT token required
- Verified via `authenticateToken` middleware

## Future Enhancements

1. **Bulk Payroll Generation**
   - Generate actual payroll records from preview
   - Mark as paid/processing/pending
   - Send email notifications to employees

2. **Custom Allowance Rules**
   - Set different allowance percentages per role
   - Department-specific allowances
   - Tenure-based increments

3. **Advanced Filters**
   - Filter by department
   - Filter by role
   - Filter by salary range
   - Filter by performance tier

4. **Payroll History**
   - View past month's payroll records
   - Compare month-over-month changes
   - Track salary adjustments over time

5. **Approval Workflow**
   - HR prepares payroll
   - CEO/Co-founder approves
   - Finance processes payment
   - Status tracking

## Troubleshooting

### Issue: No employees showing in payroll
**Solution**: Check if employees have:
- Active status (`isActive: true`)
- Role other than CEO/Co-founder/HR
- Employee profile with salary field

### Issue: Incorrect salary calculation
**Solution**: Verify:
- Attendance records exist for the month
- Task assignments are properly dated
- Leave records are approved
- Employee salary field is set

### Issue: Performance metrics showing zero
**Solution**: Check:
- Tasks are assigned to employee
- Tasks have proper `createdAt` dates within month
- Task status is set correctly
- Points are assigned to tasks

### Issue: Attendance rate incorrect
**Solution**: Validate:
- Attendance records exist for employee
- Date range matches selected month
- Status values are correct (present/partial/late/early-departure)
- Working days calculation excludes weekends

## Contact & Support

For issues or questions regarding HR Payroll:
- Check this documentation first
- Review backend logs for errors
- Verify database records for test data
- Contact development team if issues persist
