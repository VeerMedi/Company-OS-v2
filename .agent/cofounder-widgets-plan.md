# Co-Founder Dashboard - Resizable Widgets Implementation Plan

## Objective
Transform Co-Founder Dashboard main view to use HR Dashboard-style resizable widgets with drag handles and localStorage persistence.

## Current State
- Co-Founder Dashboard has traditional card-based layout
- Stats displayed in static grid
- No widget resizing capability
- No persistence across refreshes

## Target State
- 6 Resizable widgets (small/medium/large)
- Drag handle at bottom-right corner
- localStorage persistence (cleared on logout)
- Same design language as HR Dashboard

## Widgets to Create

### 1. Projects Widget
- **Data**: Total, In Progress, Completed projects
- **Graph**: Bar chart showing project status distribution
- **Colors**: Purple gradient
- **Sizes**: small (count only), medium (with chart), large (detailed chart)

### 2. Revenue Widget  
- **Data**: Total revenue, target, achievement %
- **Graph**: Line chart showing revenue trend
- **Colors**: Green gradient
- **Sizes**: small (amount), medium (with progress), large (with chart)

### 3. Attendance Widget
- **Data**: Present today, total employees
- **Graph**: Circular ring (like HR dashboard)
- **Colors**: Emerald gradient
- **Sizes**: small (count), medium (ring), large (ring + details)

### 4. Leaves Widget
- **Data**: Pending approvals, approved count
- **Graph**: List of recent leave requests
- **Colors**: Orange gradient
- **Sizes**: small (count), medium (list), large (detailed list)

### 5. Companies Widget
- **Data**: Total, approved, pending companies
- **Graph**: Pie chart or donut chart
- **Colors**: Blue gradient
- **Sizes**: small (count), medium (with breakdown), large (with chart)

### 6. Leads Widget
- **Data**: Total, active, won leads
- **Graph**: Funnel or bar chart
- **Colors**: Cyan gradient
- **Sizes**: small (count), medium (with breakdown), large (with chart)

## Implementation Steps

### Step 1: Add Required Imports
```javascript
import { motion, LayoutGroup } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  Cell, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';
```

### Step 2: Create Widget Component (Reuse from HR Dashboard)
- Copy Widget component structure
- Copy WidgetHeader component
- Copy drag handle logic
- Add to CoFounderDashboard file

### Step 3: Add Widget State Management
```javascript
const [widgetStates, setWidgetStates] = useState(() => {
  const saved = localStorage.getItem('cofounderDashboardWidgetSizes');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved widget sizes:', e);
    }
  }
  return {
    projects: 'large',
    revenue: 'medium',
    attendance: 'medium',
    leaves: 'medium',
    companies: 'small',
    leads: 'small'
  };
});

useEffect(() => {
  localStorage.setItem('cofounderDashboardWidgetSizes', JSON.stringify(widgetStates));
}, [widgetStates]);
```

### Step 4: Update AuthContext Logout
Add to logout function:
```javascript
localStorage.removeItem('cofounderDashboardWidgetSizes');
```

### Step 5: Replace Main Dashboard View
Replace lines 943-1150 with new widget-based layout using LayoutGroup and motion.div grid.

### Step 6: Create Individual Widget Content
For each widget, create size-specific content (small/medium/large views).

## File Changes Required

### Files to Modify:
1. `frontend/src/pages/CoFounderDashboard.jsx` - Main changes
2. `frontend/src/context/AuthContext.jsx` - Add localStorage clear on logout

### Estimated Lines of Code:
- ~400 lines for Widget components
- ~600 lines for widget content (6 widgets × 100 lines each)
- Total: ~1000 new lines

## Testing Checklist
- [ ] Widgets resize on drag
- [ ] Sizes persist on refresh
- [ ] Sizes reset on logout
- [ ] All 6 widgets show correct data
- [ ] Graphs render properly
- [ ] Responsive on different screen sizes
- [ ] Drag handle appears on hover
- [ ] No performance issues

## Notes
- Keep existing views (sales, attendance, leave, analytics) unchanged
- Only modify main dashboard view (currentView === 'dashboard')
- Reuse as much code as possible from HRDashboard.jsx
- Maintain same color scheme and design language
