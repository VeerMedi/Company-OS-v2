// Test CEO Dashboard API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCEODashboard() {
  try {
    console.log('🧪 Testing CEO Dashboard API...\n');

    // First, login as CEO to get token
    console.log('1️⃣ Logging in as CEO...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ceo@hustlesystem.com',
      password: 'CEO@2024!Secure'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');

    // Test CEO Dashboard endpoint
    console.log('2️⃣ Fetching CEO Dashboard data...');
    const dashboardResponse = await axios.get(`${BASE_URL}/ceo/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (dashboardResponse.data.success) {
      console.log('✅ CEO Dashboard API working!\n');
      console.log('📊 Dashboard Data Summary:');
      console.log('==========================================');
      
      const data = dashboardResponse.data.data;
      
      // Financial Overview
      console.log('\n💰 FINANCIAL OVERVIEW:');
      console.log(`   Current Funds: ${data.financials.currentFunds.formatted}`);
      console.log(`   Monthly Revenue: ${data.financials.monthlyRevenue.formatted} (${data.financials.monthlyRevenue.growth}% growth)`);
      console.log(`   Monthly Profit: ${data.financials.monthlyProfit.formatted} (${data.financials.monthlyProfit.margin}% margin)`);
      console.log(`   Monthly Expenses: ${data.financials.monthlyExpenses.formatted}`);
      console.log(`   YTD Revenue: ${data.financials.ytdRevenue.formatted}`);

      // Business Metrics
      console.log('\n🏢 BUSINESS METRICS:');
      console.log(`   Active Clients: ${data.business.activeClients.value} / ${data.business.activeClients.total}`);
      console.log(`   Active Projects: ${data.business.activeProjects.value} / ${data.business.activeProjects.total}`);
      console.log(`   Pipeline Value: ${data.business.pipelineValue.formatted}`);

      // Team Overview
      console.log('\n👥 TEAM OVERVIEW:');
      console.log(`   Total Employees: ${data.team.totalEmployees}`);
      console.log(`   Today's Attendance: ${data.team.attendanceRate.value}% (${data.team.attendanceRate.present}/${data.team.attendanceRate.total})`);
      console.log(`   Departments: ${Object.keys(data.team.departmentBreakdown).length}`);

      // Sales & Leads
      console.log('\n🎯 SALES & LEADS:');
      console.log(`   Active Prospects: ${data.sales.activeLeads.value}`);
      console.log(`   Lead Flow - Today: ${data.sales.leadFlow.today}, Week: ${data.sales.leadFlow.week}, Month: ${data.sales.leadFlow.month}`);
      console.log(`   Conversion Rate: ${data.sales.conversionRate.value}%`);

      // Meetings
      console.log('\n📅 MEETINGS:');
      console.log(`   Today: ${data.meetings.today}, Week: ${data.meetings.week}, Month: ${data.meetings.month}`);
      console.log(`   Upcoming Meetings: ${data.meetings.upcoming.length}`);

      // Leadership
      console.log('\n👔 LEADERSHIP TEAM:');
      console.log(`   Executives: ${data.leadership.executives.length}`);
      data.leadership.executives.forEach(exec => {
        console.log(`   - ${exec.name} (${exec.role})`);
      });

      // Recent Activity
      console.log('\n🔔 RECENT ACTIVITIES:');
      console.log(`   Total Activities: ${data.recentActivities.length}`);
      data.recentActivities.slice(0, 5).forEach(activity => {
        console.log(`   - ${activity.title}`);
      });

      console.log('\n==========================================');
      console.log('✅ All tests passed successfully!');
    } else {
      console.log('❌ Dashboard API returned unsuccessful response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
console.log('🚀 Starting CEO Dashboard API Test...');
console.log('📝 Make sure the backend server is running on http://localhost:5000\n');

testCEODashboard();
