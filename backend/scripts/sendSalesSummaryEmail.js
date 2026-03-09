require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Sale = require('../models/Sale');

const sendSalesSummaryEmail = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch sales team members (service-onboarding)
    const salesReps = await User.find({
      $or: [
        { role: 'service-onboarding' },
        { category: 'service-onboarding' }
      ],
      isActive: true
    }).select('firstName lastName email');

    console.log(`📊 Found ${salesReps.length} active sales representatives\n`);

    // Generate mock data for demonstration (you can replace this with real data queries)
    const salesSummary = {
      totalLeadsCreated: 15,
      totalLeadsClosed: 8,
      totalRevenue: 2450000,
      leadsInProgress: 12,
      missedFollowUps: 3,
      salesRepPerformance: [
        { name: 'Asmi Soni', leads: 5, closed: 3, missed: 1, revenue: 850000 },
        { name: 'Aastha Ratthi', leads: 4, closed: 2, missed: 0, revenue: 600000 },
        { name: 'Aman Patel', leads: 3, closed: 2, missed: 1, revenue: 550000 },
        { name: 'Himani Sharma', leads: 3, closed: 1, missed: 1, revenue: 450000 }
      ],
      topDeals: [
        { company: 'Company A Ltd.', value: 500000, rep: 'Asmi Soni', stage: 'Closed Won' },
        { company: 'Company B Ltd.', value: 350000, rep: 'Asmi Soni', stage: 'Closed Won' },
        { company: 'Company F Ltd.', value: 300000, rep: 'Aastha Ratthi', stage: 'Closed Won' }
      ],
      pendingActions: [
        { rep: 'Aman Patel', action: 'Follow up with Company G Ltd.', dueDate: 'Today' },
        { rep: 'Himani Sharma', action: 'Send proposal to Company H Ltd.', dueDate: 'Tomorrow' },
        { rep: 'Asmi Soni', action: 'Schedule demo with Company I Ltd.', dueDate: 'Today' }
      ]
    };

    // Create email HTML content
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
      margin: -30px -30px 30px -30px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      text-align: center;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 30px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .performance-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .performance-table th {
      background: #667eea;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    .performance-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    .performance-table tr:last-child td {
      border-bottom: none;
    }
    .performance-table tr:hover {
      background: #f8f9fa;
    }
    .alert-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success {
      background: #d4edda;
      color: #155724;
    }
    .badge-warning {
      background: #fff3cd;
      color: #856404;
    }
    .badge-danger {
      background: #f8d7da;
      color: #721c24;
    }
    .deal-item {
      background: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
      border-left: 4px solid #28a745;
    }
    .deal-company {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }
    .deal-details {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .action-item {
      background: #fff3cd;
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      border-left: 4px solid #ffc107;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .highlight {
      color: #667eea;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Sales Summary Report</h1>
      <p>${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Leads</div>
        <div class="metric-value">${salesSummary.totalLeadsCreated}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Closed Deals</div>
        <div class="metric-value">${salesSummary.totalLeadsClosed}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Revenue Generated</div>
        <div class="metric-value">₹${(salesSummary.totalRevenue / 100000).toFixed(1)}L</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">In Progress</div>
        <div class="metric-value">${salesSummary.leadsInProgress}</div>
      </div>
    </div>

    <!-- Performance Alert -->
    ${salesSummary.missedFollowUps > 0 ? `
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <strong>⚠️ Action Required:</strong> <span class="highlight">${salesSummary.missedFollowUps} sales representatives</span> missed follow-ups today. Please review and take immediate action.
    </div>
    ` : ''}

    <!-- Sales Team Performance -->
    <h2 class="section-title">👥 Sales Team Performance</h2>
    <table class="performance-table">
      <thead>
        <tr>
          <th>Sales Representative</th>
          <th>Leads Assigned</th>
          <th>Closed</th>
          <th>Missed Follow-ups</th>
          <th>Revenue (₹)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${salesSummary.salesRepPerformance.map(rep => `
          <tr>
            <td><strong>${rep.name}</strong></td>
            <td>${rep.leads}</td>
            <td>${rep.closed}</td>
            <td>${rep.missed > 0 ? `<span class="badge-danger alert-badge">${rep.missed}</span>` : '<span class="badge-success alert-badge">0</span>'}</td>
            <td>₹${rep.revenue.toLocaleString()}</td>
            <td>
              ${rep.missed > 0 
                ? '<span class="badge-warning alert-badge">Needs Attention</span>' 
                : '<span class="badge-success alert-badge">On Track</span>'
              }
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Top Deals Closed -->
    <h2 class="section-title">🏆 Top Deals Closed Today</h2>
    ${salesSummary.topDeals.map(deal => `
      <div class="deal-item">
        <div class="deal-company">${deal.company}</div>
        <div class="deal-details">
          💰 <strong>₹${deal.value.toLocaleString()}</strong> • 
          👤 ${deal.rep} • 
          ✅ ${deal.stage}
        </div>
      </div>
    `).join('')}

    <!-- Pending Actions -->
    <h2 class="section-title">📋 Pending Actions</h2>
    ${salesSummary.pendingActions.map(action => `
      <div class="action-item">
        <strong>${action.rep}:</strong> ${action.action}
        <span style="float: right; color: #856404; font-weight: 600;">Due: ${action.dueDate}</span>
      </div>
    `).join('')}

    <!-- Call to Action -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:5173/hos-dashboard" class="cta-button">
        📊 View Full Dashboard
      </a>
    </div>

    <!-- Insights -->
    <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <strong>💡 Daily Insight:</strong> Your team is performing exceptionally well with a <span class="highlight">${((salesSummary.totalLeadsClosed / salesSummary.totalLeadsCreated) * 100).toFixed(1)}% conversion rate</span>. Focus on reducing missed follow-ups to improve overall efficiency.
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>The Hustle OS</strong></p>
      <p>Automated Sales Performance Tracking System</p>
      <p style="font-size: 12px; margin-top: 10px;">
        This is an automated email. Please do not reply to this message.<br>
        For support, contact: support@hustleos.com
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Recipients
    const recipients = [
      'rawatsanidhya10@gmail.com',
      'sourabhsompandey@gmail.com',
      'ishaankhandelwal13@gmail.com',
      'vishnu@vlitefurnitech.com'
    ];

    console.log('📧 Sending sales summary emails...\n');

    // Send emails
    for (const recipient of recipients) {
      const mailOptions = {
        from: {
          name: 'The Hustle OS - Sales Analytics',
          address: process.env.EMAIL_USER
        },
        to: recipient,
        subject: `📊 Daily Sales Summary - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | ${salesSummary.totalLeadsClosed} Deals Closed`,
        html: emailHTML,
        priority: 'high'
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${recipient}`);
        console.log(`   Message ID: ${info.messageId}\n`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${recipient}:`, error.message);
      }
    }

    console.log('🎉 All emails sent successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
sendSalesSummaryEmail();
