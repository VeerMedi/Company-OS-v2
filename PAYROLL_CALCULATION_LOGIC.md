# Simplified Payroll Calculation Logic

## Overview
The payroll system now uses a **simple, transparent formula** based on 4 core parameters:
1. **Basic Salary** - Base monthly salary
2. **Attendance** - Present days
3. **Leaves** - Approved leave days
4. **Performance** - Task completion rate and points earned

**NO deductions** for tax, PF, or insurance.

---

## Calculation Formula

### Step 1: Attendance-Adjusted Base Salary (70% Weightage)

```
Effective Days = Present Days + Approved Leave Days

Attendance Factor = Effective Days / Total Working Days

Attendance-Adjusted Salary = Basic Salary × Attendance Factor
```

**Logic:**
- Approved leaves count as valid working days
- If employee has 20 present + 2 leave out of 22 working days = 100% of base salary
- If employee has 15 present + 0 leave out of 22 working days = 68% of base salary
- This ensures fair payment for actual work + approved time off

**Example:**
```
Basic Salary: ₹30,000
Total Working Days: 22 (excluding weekends)
Present Days: 18
Leave Days: 2

Effective Days = 18 + 2 = 20
Attendance Factor = 20/22 = 0.909 (90.9%)
Attendance-Adjusted Salary = ₹30,000 × 0.909 = ₹27,270
```

---

### Step 2: Performance Bonus (30% Weightage)

Based on **Task Completion Rate**:

| Completion Rate | Bonus % | Tier |
|----------------|---------|------|
| ≥ 90% | 25% | Excellent |
| 80-89% | 20% | Great |
| 70-79% | 15% | Good |
| 60-69% | 10% | Satisfactory |
| < 60% | 0% | Needs Improvement |

```
Performance Bonus = Attendance-Adjusted Salary × Bonus Percentage
```

**Example:**
```
Attendance-Adjusted Salary: ₹27,270
Completion Rate: 85% → Great (20% bonus)

Performance Bonus = ₹27,270 × 0.20 = ₹5,454
```

---

### Step 3: Points-Based Incentive

```
Points Incentive = Total Points Earned × ₹100 per point
```

**Logic:**
- Each task has points assigned
- Only completed tasks earn points
- Direct monetary value: ₹100 per point

**Example:**
```
Completed Tasks: 20 tasks
Total Points Earned: 150 points

Points Incentive = 150 × ₹100 = ₹15,000
```

---

### Step 4: Final Net Salary

```
Net Salary = Attendance-Adjusted Salary + Performance Bonus + Points Incentive
```

**Complete Example:**
```
Basic Salary:                    ₹30,000
Attendance-Adjusted Salary:      ₹27,270  (20/22 days)
Performance Bonus (20%):       + ₹5,454   (85% completion rate)
Points Incentive (150 pts):    + ₹15,000  (150 × ₹100)
─────────────────────────────────────────
NET SALARY:                      ₹47,724
```

---

## Weightage Breakdown

```
┌─────────────────────────────────────────┐
│  SALARY COMPOSITION                     │
├─────────────────────────────────────────┤
│                                         │
│  Base Salary Component: 70% weightage   │
│  ├─ Attendance (Present Days)          │
│  └─ Approved Leaves                    │
│                                         │
│  Performance Component: 30% weightage   │
│  ├─ Completion Rate Bonus (0-25%)      │
│  └─ Points Incentive (₹100/point)      │
│                                         │
└─────────────────────────────────────────┘
```

---

## Parameter Impact Analysis

### 1. Attendance Impact (70%)
- **High Impact**: Directly affects base salary
- **Fair Treatment**: Approved leaves = working days
- **Weekend Exclusion**: Only working days counted

| Scenario | Days Present | Leave Days | Effective % | Salary Impact |
|----------|-------------|-----------|-------------|---------------|
| Perfect | 22/22 | 0 | 100% | Full base salary |
| Good | 20/22 | 2 | 100% | Full base salary |
| Average | 18/22 | 0 | 82% | 82% of base salary |
| Poor | 15/22 | 0 | 68% | 68% of base salary |

### 2. Performance Impact (30%)
- **Variable Bonus**: 0% to 25% of adjusted salary
- **Completion-Based**: Clear thresholds
- **Motivational**: Encourages high completion rates

| Completion Rate | Bonus on ₹30K | Tier |
|----------------|---------------|------|
| 95% | +₹7,500 | Excellent |
| 85% | +₹6,000 | Great |
| 75% | +₹4,500 | Good |
| 65% | +₹3,000 | Satisfactory |
| 50% | ₹0 | Needs Improvement |

### 3. Points Impact (Additional Incentive)
- **Direct Reward**: ₹100 per point
- **Task Quality**: Encourages completing high-value tasks
- **Unlimited Potential**: No cap on points

| Points Earned | Incentive Amount |
|--------------|------------------|
| 50 | ₹5,000 |
| 100 | ₹10,000 |
| 150 | ₹15,000 |
| 200 | ₹20,000 |

---

## Comparison: Old vs New System

| Aspect | Old System | New System |
|--------|-----------|------------|
| Parameters | 10+ (salary, HRA, tax, PF, insurance, etc.) | 4 (salary, attendance, leave, performance) |
| Deductions | Tax, PF, Insurance | **None** |
| Complexity | High (multiple allowances) | Low (transparent formula) |
| Attendance Weight | Proportional deduction only | 70% of total calculation |
| Performance Weight | Fixed incentive tiers | 30% bonus + points (₹100 each) |
| Leave Treatment | Counted as absent | Counted as working days |
| Transparency | Complex breakdown | Simple 3-step calculation |
| Employee Understanding | Difficult | Easy |

---

## Real-World Scenarios

### Scenario 1: High Performer, Perfect Attendance
```
Basic Salary: ₹35,000
Present: 22/22 days
Leave: 0 days
Completion Rate: 92% (Excellent)
Points: 180

Calculation:
1. Attendance-Adjusted: ₹35,000 × 100% = ₹35,000
2. Performance Bonus: ₹35,000 × 25% = ₹8,750
3. Points Incentive: 180 × ₹100 = ₹18,000

NET SALARY: ₹61,750 (76% higher than base)
```

### Scenario 2: Average Performer, Some Absences
```
Basic Salary: ₹30,000
Present: 16/22 days
Leave: 0 days
Completion Rate: 65% (Satisfactory)
Points: 80

Calculation:
1. Attendance-Adjusted: ₹30,000 × 73% = ₹21,818
2. Performance Bonus: ₹21,818 × 10% = ₹2,182
3. Points Incentive: 80 × ₹100 = ₹8,000

NET SALARY: ₹32,000 (7% higher than base despite absences)
```

### Scenario 3: Poor Performer, Good Attendance
```
Basic Salary: ₹28,000
Present: 20/22 days
Leave: 2 days
Completion Rate: 45% (Needs Improvement)
Points: 30

Calculation:
1. Attendance-Adjusted: ₹28,000 × 100% = ₹28,000
2. Performance Bonus: ₹28,000 × 0% = ₹0
3. Points Incentive: 30 × ₹100 = ₹3,000

NET SALARY: ₹31,000 (11% higher than base)
```

### Scenario 4: Good Performer, Approved Leaves
```
Basic Salary: ₹32,000
Present: 18/22 days
Leave: 4 days (approved)
Completion Rate: 78% (Good)
Points: 120

Calculation:
1. Attendance-Adjusted: ₹32,000 × 100% = ₹32,000 (22/22 effective)
2. Performance Bonus: ₹32,000 × 15% = ₹4,800
3. Points Incentive: 120 × ₹100 = ₹12,000

NET SALARY: ₹48,800 (53% higher than base)
```

---

## Key Benefits

### 1. **Simplicity**
- Only 4 parameters to track
- Easy to understand for employees
- Transparent calculation

### 2. **Fairness**
- Approved leaves don't penalize salary
- Performance directly rewarded
- Clear bonus thresholds

### 3. **Motivation**
- High performers earn significantly more
- Points system encourages quality work
- Attendance matters but not punishing

### 4. **Flexibility**
- No complex tax/deduction rules
- Easy to adjust point values
- Simple to modify bonus percentages

### 5. **Scalability**
- Works for all employee levels
- No role-specific allowances needed
- Uniform calculation across organization

---

## Implementation Details

### Backend
- **Location**: `backend/controllers/hrController.js`
- **Function**: `getAllEmployeePayrollPreview()`
- **Models Used**: User, Task, Attendance, Leave
- **Performance**: Parallel processing for all employees

### Frontend
- **Location**: `frontend/src/pages/HRPayroll.jsx`
- **Features**: 
  - Real-time calculation display
  - Color-coded performance tiers
  - Detailed breakdown in table
  - CSV export with all components

### API Endpoint
```
GET /api/hr/payroll/preview?month=1&year=2026
```

### Response Fields
```json
{
  "payroll": {
    "basicSalary": 30000,
    "attendanceAdjustedSalary": 27270,
    "attendanceFactor": 91,
    "performanceBonus": 5454,
    "performanceBonusPercentage": 20,
    "pointsIncentive": 15000,
    "pointValue": 100,
    "netSalary": 47724,
    "performanceTier": "Great",
    "workingDays": {
      "total": 22,
      "present": 18,
      "leave": 2,
      "effective": 20
    }
  }
}
```

---

## Future Adjustments

The system is designed to be easily tunable:

1. **Point Value**: Currently ₹100/point
   - Can adjust based on task difficulty
   - Can vary by role/level

2. **Bonus Percentages**: Currently 0-25%
   - Can increase for senior roles
   - Can add more tiers

3. **Attendance Weightage**: Currently 70%
   - Can adjust based on company policy
   - Can make performance higher priority

4. **Working Days**: Currently excludes weekends
   - Can customize for shift-based work
   - Can adjust for company holidays

---

## Summary

**Simple Formula:**
```
NET SALARY = (Basic × Attendance%) + (Basic × Attendance% × Performance%) + (Points × ₹100)
```

**Core Philosophy:**
- Reward presence and approved time off equally
- Bonus for good performance
- Extra incentive for completing valuable tasks
- No hidden deductions
- Total transparency

This system balances **fairness** (attendance + leaves), **meritocracy** (performance bonus), and **motivation** (points incentive) in a simple, easy-to-understand package.
