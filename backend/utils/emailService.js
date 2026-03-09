const nodemailer = require('nodemailer');

// Configure email transporter
const createTransporter = () => {
  // Check if email service is configured
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'gmail', 'outlook'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
};

/**
 * Send email notification for new revenue target assignment
 */
exports.sendRevenueTargetNotification = async (targetData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Target notification logged instead.');
      console.log('Revenue Target Created:', targetData);
      return { success: false, message: 'Email service not configured' };
    }

    const { hosEmail, hosName, targetAmount, currency, periodDescription, cofounderName } = targetData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: hosEmail,
      subject: `🎯 New Revenue Target Assigned - ${periodDescription}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .target-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .target-amount { font-size: 32px; font-weight: bold; color: #059669; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .alert-box { background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #059669; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Revenue Target Assigned</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${hosName}</strong>,</p>
              
              <p>A new revenue target has been assigned to you by <strong>${cofounderName}</strong>.</p>
              
              <div class="target-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">TARGET AMOUNT</div>
                <div class="target-amount">${currency} ${targetAmount?.toLocaleString()}</div>
                
                <div class="info-row">
                  <span class="info-label">Period:</span>
                  <span class="info-value">${periodDescription}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Status:</span>
                  <span class="info-value">In Progress</span>
                </div>
              </div>

              <div class="alert-box">
                <strong>⚡ Next Steps:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review the target details in your dashboard</li>
                  <li>Submit your strategy proposal with target locations</li>
                  <li>Assign sales representatives to locations</li>
                  <li>Track progress and update achievements regularly</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sales/dashboard" class="btn">
                  View Target Details →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Please submit your strategy proposal as soon as possible to begin working towards this target.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Revenue Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Revenue target notification sent to ${hosEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: hosEmail };
  } catch (error) {
    console.error('Error sending revenue target email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification when HOS submits strategy proposal
 */
exports.sendStrategyProposalNotification = async (strategyData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Strategy proposal notification logged instead.');
      console.log('Strategy Proposal Submitted:', strategyData);
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      cofounderEmail, 
      cofounderName, 
      hosName, 
      targetAmount, 
      currency, 
      periodDescription,
      locationCount,
      expectedCompanies,
      expectedLeads
    } = strategyData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: cofounderEmail,
      subject: `📊 Strategy Proposal Submitted - ${periodDescription}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .strategy-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .target-amount { font-size: 28px; font-weight: bold; color: #2563eb; margin: 15px 0; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: #f0f9ff; padding: 15px; border-radius: 6px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .alert-box { background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #2563eb; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Strategy Proposal Submitted</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Review Required</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${cofounderName}</strong>,</p>
              
              <p><strong>${hosName}</strong> (Head of Sales) has submitted a strategy proposal for the revenue target.</p>
              
              <div class="strategy-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">TARGET DETAILS</div>
                <div class="target-amount">${currency} ${targetAmount?.toLocaleString()}</div>
                
                <div class="info-row">
                  <span class="info-label">Period:</span>
                  <span class="info-value">${periodDescription}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Submitted By:</span>
                  <span class="info-value">${hosName}</span>
                </div>
              </div>

              <div style="margin: 25px 0;">
                <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 15px;">📍 Strategy Summary</div>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${locationCount}</div>
                    <div class="stat-label">Target Locations</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${expectedCompanies || 0}</div>
                    <div class="stat-label">Expected Companies</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${expectedLeads || 0}</div>
                    <div class="stat-label">Expected Leads</div>
                  </div>
                </div>
              </div>

              <div class="alert-box">
                <strong>⏰ Action Required:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review the proposed strategy details</li>
                  <li>Check target locations and allocations</li>
                  <li>Verify sales representative assignments</li>
                  <li>Approve or provide feedback on the strategy</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
                  Review Strategy Proposal →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Please review and respond to the strategy proposal at your earliest convenience to keep the revenue targets on track.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Revenue Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Strategy proposal notification sent to ${cofounderEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: cofounderEmail };
  } catch (error) {
    console.error('Error sending strategy proposal email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification when Co-Founder approves strategy
 */
exports.sendStrategyApprovedNotification = async (approvalData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Strategy approval notification logged instead.');
      console.log('Strategy Approved:', approvalData);
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      hosEmail, 
      hosName, 
      cofounderName, 
      targetAmount, 
      currency, 
      periodDescription,
      feedback
    } = approvalData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: hosEmail,
      subject: `✅ Strategy Approved - ${periodDescription}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .success-box { background: #d1fae5; border: 2px solid #10b981; color: #065f46; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .target-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .target-amount { font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .feedback-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .alert-box { background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #059669; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Strategy Approved!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Great News</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <div class="success-icon">🎉</div>
                <h2 style="margin: 10px 0; color: #065f46;">Strategy Approved Successfully!</h2>
                <p style="margin: 5px 0;">Your strategy proposal has been approved by ${cofounderName}</p>
              </div>

              <p>Hello <strong>${hosName}</strong>,</p>
              
              <p>Congratulations! <strong>${cofounderName}</strong> has approved your strategy proposal for the revenue target.</p>
              
              <div class="target-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">TARGET DETAILS</div>
                <div class="target-amount">${currency} ${targetAmount?.toLocaleString()}</div>
                
                <div class="info-row">
                  <span class="info-label">Period:</span>
                  <span class="info-value">${periodDescription}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #10b981; font-weight: bold;">✓ Approved</span>
                </div>
              </div>

              ${feedback ? `
              <div class="feedback-box">
                <strong>💬 Co-Founder Feedback:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${feedback}</p>
              </div>
              ` : ''}

              <div class="alert-box">
                <strong>🚀 Next Steps:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Begin executing the approved strategy</li>
                  <li>Coordinate with assigned sales representatives</li>
                  <li>Monitor progress across target locations</li>
                  <li>Update revenue achievements regularly</li>
                  <li>Report any challenges or adjustments needed</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sales/dashboard" class="btn">
                  View Dashboard & Start Execution →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Let's work together to achieve this revenue target. Good luck!
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Revenue Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Strategy approval notification sent to ${hosEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: hosEmail };
  } catch (error) {
    console.error('Error sending strategy approval email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification when Co-Founder rejects strategy
 */
exports.sendStrategyRejectedNotification = async (rejectionData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Strategy rejection notification logged instead.');
      console.log('Strategy Rejected:', rejectionData);
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      hosEmail, 
      hosName, 
      cofounderName, 
      targetAmount, 
      currency, 
      periodDescription,
      feedback
    } = rejectionData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: hosEmail,
      subject: `⚠️ Strategy Needs Revision - ${periodDescription}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .warning-box { background: #fef3c7; border: 2px solid #f59e0b; color: #92400e; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .warning-icon { font-size: 48px; margin-bottom: 10px; }
            .target-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .target-amount { font-size: 24px; font-weight: bold; color: #d97706; margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .feedback-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .alert-box { background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #d97706; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Strategy Needs Revision</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required</p>
            </div>
            
            <div class="content">
              <div class="warning-box">
                <div class="warning-icon">📋</div>
                <h2 style="margin: 10px 0; color: #92400e;">Strategy Requires Changes</h2>
                <p style="margin: 5px 0;">Your strategy proposal needs revision as per ${cofounderName}'s feedback</p>
              </div>

              <p>Hello <strong>${hosName}</strong>,</p>
              
              <p><strong>${cofounderName}</strong> has reviewed your strategy proposal and has requested some changes before approval.</p>
              
              <div class="target-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">TARGET DETAILS</div>
                <div class="target-amount">${currency} ${targetAmount?.toLocaleString()}</div>
                
                <div class="info-row">
                  <span class="info-label">Period:</span>
                  <span class="info-value">${periodDescription}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #f59e0b; font-weight: bold;">⚠ Needs Revision</span>
                </div>
              </div>

              ${feedback ? `
              <div class="feedback-box">
                <strong>💬 Co-Founder Feedback:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937; font-weight: 500;">${feedback}</p>
              </div>
              ` : ''}

              <div class="alert-box">
                <strong>🔄 Next Steps:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review the feedback carefully</li>
                  <li>Revise your strategy proposal accordingly</li>
                  <li>Update target locations and allocations if needed</li>
                  <li>Adjust sales representative assignments</li>
                  <li>Re-submit the updated strategy for approval</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sales/dashboard" class="btn">
                  Revise Strategy Now →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Please address the feedback and resubmit your strategy at your earliest convenience.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Revenue Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Strategy rejection notification sent to ${hosEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: hosEmail };
  } catch (error) {
    console.error('Error sending strategy rejection email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification for new sales target assignment
 */
exports.sendSalesTargetNotification = async (targetData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Sales target notification logged instead.');
      console.log('Sales Target Created:', targetData);
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      salesRepEmail, 
      salesRepName, 
      revenueTarget,
      companiesTarget,
      leadsTarget,
      conversionsTarget,
      targetPeriod, 
      startDate,
      endDate,
      notes,
      assignedByName,
      linkedRevenueTarget
    } = targetData;

    const periodLabels = {
      'monthly': 'Monthly',
      'quarterly': 'Quarterly (3 months)',
      'half-yearly': 'Half-Yearly (6 months)',
      'yearly': 'Yearly'
    };

    const periodLabel = periodLabels[targetPeriod] || targetPeriod;
    const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: salesRepEmail,
      subject: `🎯 New Sales Target Assigned - ${periodLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .target-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .target-amount { font-size: 32px; font-weight: bold; color: #7c3aed; margin: 15px 0; }
            .funnel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .funnel-card { background: #faf5ff; padding: 15px; border-radius: 8px; border: 1px solid #e9d5ff; text-align: center; }
            .funnel-value { font-size: 24px; font-weight: bold; color: #6b21a8; }
            .funnel-label { font-size: 12px; color: #6b7280; margin-top: 5px; text-transform: uppercase; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .alert-box { background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .notes-box { background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #7c3aed; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
            .linked-badge { background: #c7d2fe; color: #3730a3; padding: 8px 12px; border-radius: 6px; display: inline-block; margin: 10px 0; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Sales Target Assigned</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Time to Achieve Your Goals!</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${salesRepName}</strong>,</p>
              
              <p>A new sales target has been assigned to you by <strong>${assignedByName}</strong>.</p>
              
              ${linkedRevenueTarget ? `
              <div class="linked-badge">
                🔗 Linked to Co-Founder Revenue Target: ₹${linkedRevenueTarget.toLocaleString('en-IN')}
              </div>
              ` : ''}
              
              <div class="target-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">REVENUE TARGET</div>
                <div class="target-amount">₹${revenueTarget?.toLocaleString('en-IN')}</div>
                
                <div class="info-row">
                  <span class="info-label">Period:</span>
                  <span class="info-value">${periodLabel}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Duration:</span>
                  <span class="info-value">${formattedStartDate} - ${formattedEndDate}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #10b981; font-weight: bold;">Active</span>
                </div>
              </div>

              <h3 style="color: #374151; margin: 25px 0 15px 0;">📊 Sales Funnel Targets</h3>
              <div class="funnel-grid">
                ${companiesTarget ? `
                <div class="funnel-card">
                  <div class="funnel-value">${companiesTarget}</div>
                  <div class="funnel-label">Companies</div>
                </div>
                ` : ''}
                
                ${leadsTarget ? `
                <div class="funnel-card">
                  <div class="funnel-value">${leadsTarget}</div>
                  <div class="funnel-label">Leads</div>
                </div>
                ` : ''}
                
                ${conversionsTarget ? `
                <div class="funnel-card">
                  <div class="funnel-value">${conversionsTarget}</div>
                  <div class="funnel-label">Conversions</div>
                </div>
                ` : ''}
              </div>

              ${notes ? `
              <div class="notes-box">
                <strong>📝 Instructions from ${assignedByName}:</strong>
                <p style="margin: 10px 0 0 0;">${notes}</p>
              </div>
              ` : ''}

              <div class="alert-box">
                <strong>⚡ Next Steps:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review your target details in your dashboard</li>
                  <li>Plan your sales strategy and activities</li>
                  <li>Submit new companies for approval</li>
                  <li>Generate and convert leads</li>
                  <li>Track your progress regularly</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
                  View Target in Dashboard →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Your progress will be tracked automatically based on your sales activities. Good luck! 🚀
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Sales target notification sent to ${salesRepEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: salesRepEmail };
  } catch (error) {
    console.error('Error sending sales target email:', error);
    return { success: false, message: error.message };
  }
};

// Send Company Submitted for Approval Notification
exports.sendCompanySubmissionNotification = async (companyData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Company submission notification logged instead.');
      console.log('Company Submitted:', companyData);
      return { success: false, message: 'Email service not configured' };
    }

    const { hosEmail, hosName, companyName, submittedBy, submittedByEmail, industry, location, potentialValue, priority, website } = companyData;

    const priorityColors = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444'
    };

    const priorityColor = priorityColors[priority?.toLowerCase()] || '#3b82f6';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: hosEmail,
      subject: `🏢 New Company Submitted for Approval - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .company-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .company-name { font-size: 26px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; color: white; font-size: 12px; text-transform: uppercase; }
            .alert-box { background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #2563eb; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 New Company Submitted for Approval</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Review Required</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${hosName}</strong>,</p>
              
              <p>A new company has been submitted for your approval by <strong>${submittedBy}</strong> (${submittedByEmail}).</p>
              
              <div class="company-box">
                <h2 class="company-name">${companyName}</h2>
                
                <div class="info-row">
                  <span class="info-label">Industry:</span>
                  <span class="info-value">${industry || 'Not specified'}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${location || 'Not specified'}</span>
                </div>
                
                ${website ? `
                <div class="info-row">
                  <span class="info-label">Website:</span>
                  <span class="info-value"><a href="${website}" target="_blank">${website}</a></span>
                </div>
                ` : ''}
                
                <div class="info-row">
                  <span class="info-label">Potential Value:</span>
                  <span class="info-value">₹${potentialValue ? Number(potentialValue).toLocaleString() : '0'}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Priority:</span>
                  <span class="info-value">
                    <span class="priority-badge" style="background-color: ${priorityColor};">${priority || 'Medium'}</span>
                  </span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Submitted By:</span>
                  <span class="info-value">${submittedBy}</span>
                </div>
              </div>
              
              <div class="alert-box">
                <strong>📋 Next Steps:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review the company details and research information</li>
                  <li>Evaluate the potential value and priority level</li>
                  <li>Approve or reject the company submission</li>
                  <li>If approved, the company will be added to your active pipeline</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
                  Review Company Submission
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This company has been marked as <strong>${priority || 'medium'}</strong> priority. 
                Please review and take action at your earliest convenience.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Company submission notification sent to ${hosEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: hosEmail };
  } catch (error) {
    console.error('Error sending company submission email:', error);
    return { success: false, message: error.message };
  }
};

// Send Company Review Decision Notification
exports.sendCompanyReviewNotification = async (reviewData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Company review notification logged instead.');
      console.log('Company Review:', reviewData);
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      submitterEmail, 
      submitterName, 
      companyName, 
      decision, 
      reviewedBy, 
      reviewNotes, 
      assignedTo 
    } = reviewData;

    let subject, headerText, statusColor, statusBadge, decisionMessage;

    if (decision === 'approved') {
      subject = `✅ Company Approved - ${companyName}`;
      headerText = 'Company Approved';
      statusColor = '#10b981';
      statusBadge = 'APPROVED';
      decisionMessage = `Great news! Your company submission for <strong>${companyName}</strong> has been approved by ${reviewedBy}.`;
    } else if (decision === 'rejected') {
      subject = `❌ Company Rejected - ${companyName}`;
      headerText = 'Company Rejected';
      statusColor = '#ef4444';
      statusBadge = 'REJECTED';
      decisionMessage = `Your company submission for <strong>${companyName}</strong> has been rejected by ${reviewedBy}.`;
    } else {
      subject = `📝 Revision Needed - ${companyName}`;
      headerText = 'Revision Required';
      statusColor = '#f59e0b';
      statusBadge = 'NEEDS REVISION';
      decisionMessage = `Your company submission for <strong>${companyName}</strong> requires revision. Please review the feedback and resubmit.`;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: submitterEmail,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .company-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; color: white; font-size: 14px; background-color: ${statusColor}; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .notes-box { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: ${statusColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { opacity: 0.9; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${headerText}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Review Decision</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${submitterName}</strong>,</p>
              
              <p>${decisionMessage}</p>
              
              <div class="company-box">
                <h2 style="margin: 0 0 10px 0; color: #1e40af; font-size: 22px;">${companyName}</h2>
                <div class="status-badge">${statusBadge}</div>
                
                <div class="info-row">
                  <span class="info-label">Reviewed By:</span>
                  <span class="info-value">${reviewedBy}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Decision:</span>
                  <span class="info-value" style="color: ${statusColor}; font-weight: bold;">${statusBadge}</span>
                </div>
                
                ${assignedTo ? `
                <div class="info-row">
                  <span class="info-label">Assigned To:</span>
                  <span class="info-value">${assignedTo}</span>
                </div>
                ` : ''}
              </div>
              
              ${reviewNotes ? `
              <div class="notes-box">
                <strong>📝 Feedback from ${reviewedBy}:</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${reviewNotes}</p>
              </div>
              ` : ''}
              
              <div style="background: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>Next Steps:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  ${decision === 'approved' ? `
                    <li>The company has been added to your active pipeline</li>
                    <li>You can now create leads and start outreach</li>
                    <li>Track progress and update company status regularly</li>
                  ` : decision === 'rejected' ? `
                    <li>Review the feedback provided above</li>
                    <li>Consider if this company should be re-evaluated later</li>
                    <li>Focus on other opportunities in your pipeline</li>
                  ` : `
                    <li>Review the feedback and make necessary changes</li>
                    <li>Update company information and research</li>
                    <li>Resubmit the company for approval</li>
                  `}
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">
                  View Dashboard
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Company review notification sent to ${submitterEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: submitterEmail };
  } catch (error) {
    console.error('Error sending company review email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification when follow-up is added
 */
exports.sendFollowUpAddedNotification = async (notificationData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email not configured. Skipping follow-up notification email.');
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      hosEmail, 
      hosName, 
      salesRepName, 
      leadName,
      companyName,
      contactMethod,
      scheduledDate,
      scheduledTime,
      summary,
      nextStep,
      leadId
    } = notificationData;

    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: hosEmail,
      subject: `📅 New Follow-up Scheduled - ${leadName} @ ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .summary-box { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #2563eb; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .badge-linkedin { background: #dbeafe; color: #1e40af; }
            .badge-email { background: #fef3c7; color: #92400e; }
            .badge-call { background: #dcfce7; color: #166534; }
            .badge-meeting { background: #f3e8ff; color: #6b21a8; }
            .badge-whatsapp { background: #d1fae5; color: #065f46; }
            .badge-other { background: #e5e7eb; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 New Follow-up Scheduled</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Sales Activity Update</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${hosName}</strong>,</p>
              
              <p><strong>${salesRepName}</strong> has scheduled a new follow-up activity.</p>
              
              <div class="info-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">FOLLOW-UP DETAILS</div>
                
                <div class="info-row">
                  <span class="info-label">Lead:</span>
                  <span class="info-value">${leadName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Company:</span>
                  <span class="info-value">${companyName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Sales Rep:</span>
                  <span class="info-value">${salesRepName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Contact Method:</span>
                  <span class="info-value">
                    <span class="badge badge-${contactMethod}">${contactMethod}</span>
                  </span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Scheduled:</span>
                  <span class="info-value">${formattedDate} at ${scheduledTime}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #f59e0b; font-weight: bold;">⏳ Pending Evidence</span>
                </div>
              </div>

              ${summary ? `
              <div class="summary-box">
                <strong>📝 Summary:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${summary}</p>
              </div>
              ` : ''}

              ${nextStep ? `
              <div class="summary-box">
                <strong>🎯 Next Step:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${nextStep}</p>
              </div>
              ` : ''}

              <div style="background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>⚠️ Evidence Required:</strong>
                <p style="margin: 10px 0 0 0;">The sales rep must submit evidence after completing this follow-up to track accountability.</p>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sales/lead/${leadId}" class="btn">
                  View Lead Details →
                </a>
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Follow-up notification sent to ${hosEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: hosEmail };
  } catch (error) {
    console.error('Error sending follow-up notification email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification when follow-up evidence is submitted
 */
exports.sendFollowUpEvidenceSubmittedNotification = async (notificationData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email not configured. Skipping evidence notification email.');
      return { success: false, message: 'Email service not configured' };
    }

    const { 
      hosEmail, 
      hosName, 
      salesRepName, 
      leadName,
      companyName,
      contactMethod,
      scheduledDate,
      summary,
      conclusion,
      evidenceCount,
      evidenceNotes,
      leadId,
      followUpId
    } = notificationData;

    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: hosEmail,
      subject: `✅ Follow-up Evidence Submitted - ${leadName} @ ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .success-box { background: #d1fae5; border: 2px solid #10b981; color: #065f46; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-label { font-weight: bold; color: #4b5563; }
            .info-value { color: #1f2937; }
            .summary-box { background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .evidence-box { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .btn:hover { background: #059669; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .badge-linkedin { background: #dbeafe; color: #1e40af; }
            .badge-email { background: #fef3c7; color: #92400e; }
            .badge-call { background: #dcfce7; color: #166534; }
            .badge-meeting { background: #f3e8ff; color: #6b21a8; }
            .badge-whatsapp { background: #d1fae5; color: #065f46; }
            .badge-other { background: #e5e7eb; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Follow-up Evidence Submitted</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Completion Confirmation</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <div style="font-size: 36px; margin-bottom: 10px;">✓</div>
                <h2 style="margin: 10px 0; color: #065f46;">Evidence Submitted Successfully</h2>
                <p style="margin: 5px 0;"><strong>${salesRepName}</strong> has completed the follow-up</p>
              </div>

              <p>Hello <strong>${hosName}</strong>,</p>
              
              <p><strong>${salesRepName}</strong> has submitted evidence for a completed follow-up activity.</p>
              
              <div class="info-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">FOLLOW-UP DETAILS</div>
                
                <div class="info-row">
                  <span class="info-label">Lead:</span>
                  <span class="info-value">${leadName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Company:</span>
                  <span class="info-value">${companyName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Sales Rep:</span>
                  <span class="info-value">${salesRepName}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Contact Method:</span>
                  <span class="info-value">
                    <span class="badge badge-${contactMethod}">${contactMethod}</span>
                  </span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${formattedDate}</span>
                </div>
                
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: #10b981; font-weight: bold;">✓ Completed</span>
                </div>
              </div>

              ${summary ? `
              <div class="summary-box">
                <strong>📝 Summary:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${summary}</p>
              </div>
              ` : ''}

              ${conclusion ? `
              <div class="summary-box">
                <strong>💡 Conclusion:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${conclusion}</p>
              </div>
              ` : ''}

              <div class="evidence-box">
                <strong>📎 Evidence Submitted:</strong>
                <p style="margin: 10px 0 0 0;">
                  <strong>${evidenceCount}</strong> file(s) uploaded
                </p>
                ${evidenceNotes ? `
                <p style="margin: 10px 0 0 0; color: #1f2937;">
                  <em>${evidenceNotes}</em>
                </p>
                ` : ''}
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sales/lead/${leadId}" class="btn">
                  View Full Details & Evidence →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                You can review the submitted evidence and follow-up details in the lead management dashboard.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Follow-up evidence notification sent to ${hosEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: hosEmail };
  } catch (error) {
    console.error('Error sending follow-up evidence notification email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email notification for pending evidence submission (reminder)
 */
exports.sendFollowUpEvidencePendingReminder = async (reminderData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email service not configured. Reminder logged instead.');
      return { success: false, message: 'Email service not configured' };
    }

    const {
      salesRepEmail,
      salesRepName,
      leadName,
      companyName,
      contactMethod,
      scheduledDate,
      daysSinceFollowUp,
      leadId,
      followUpId
    } = reminderData;

    const urgencyLevel = daysSinceFollowUp >= 3 ? 'URGENT' : 'IMPORTANT';
    const urgencyColor = daysSinceFollowUp >= 3 ? '#dc2626' : '#f59e0b';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: salesRepEmail,
      subject: `⚠️ ${urgencyLevel}: Evidence Submission Pending - ${leadName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${urgencyColor} 0%, #c2410c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .alert-box { background: #fef2f2; border: 2px solid ${urgencyColor}; color: #991b1b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor}; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .btn { display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Evidence Submission Reminder</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${urgencyLevel} - Action Required</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${salesRepName}</strong>,</p>
              
              <div class="alert-box">
                <h3 style="margin: 0 0 10px 0;">⏰ Evidence Submission Overdue</h3>
                <p style="margin: 0;">You have a follow-up that requires evidence submission. It has been <strong>${daysSinceFollowUp} days</strong> since the scheduled follow-up date.</p>
              </div>

              <div class="info-box">
                <h4 style="margin: 0 0 15px 0; color: #1f2937;">Follow-up Details:</h4>
                <div class="info-row">
                  <span><strong>Lead:</strong></span>
                  <span>${leadName}</span>
                </div>
                <div class="info-row">
                  <span><strong>Company:</strong></span>
                  <span>${companyName}</span>
                </div>
                <div class="info-row">
                  <span><strong>Contact Method:</strong></span>
                  <span style="text-transform: capitalize;">${contactMethod}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span><strong>Scheduled Date:</strong></span>
                  <span>${new Date(scheduledDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>📋 What You Need to Do:</strong>
                <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Upload screenshots/evidence of your ${contactMethod}</li>
                  <li>Provide a summary of the conversation/outcome</li>
                  <li>Note any next steps or commitments made</li>
                </ol>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}/submit-evidence/${followUpId}" class="btn">
                  Submit Evidence Now →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                <strong>Note:</strong> Timely evidence submission helps maintain accountability and allows management to track progress effectively.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated reminder. Please submit your evidence promptly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Evidence pending reminder sent to ${salesRepEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: salesRepEmail };
  } catch (error) {
    console.error('Error sending evidence pending reminder:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send scheduled follow-up reminder (1 day before)
 */
exports.sendFollowUpScheduledReminder = async (reminderData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email service not configured. Reminder logged instead.');
      return { success: false, message: 'Email service not configured' };
    }

    const {
      salesRepEmail,
      salesRepName,
      leadName,
      companyName,
      contactMethod,
      scheduledDate,
      scheduledTime,
      summary,
      messageSent,
      leadId
    } = reminderData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: salesRepEmail,
      subject: `🔔 Reminder: Follow-up Tomorrow - ${leadName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .reminder-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Follow-up Reminder</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Scheduled for Tomorrow</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${salesRepName}</strong>,</p>
              
              <p>This is a friendly reminder about your upcoming follow-up:</p>

              <div class="reminder-box">
                <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Tomorrow's Follow-up</h3>
                
                <div class="info-row">
                  <span><strong>Lead:</strong></span>
                  <span>${leadName}</span>
                </div>
                <div class="info-row">
                  <span><strong>Company:</strong></span>
                  <span>${companyName}</span>
                </div>
                <div class="info-row">
                  <span><strong>Contact Method:</strong></span>
                  <span style="text-transform: capitalize;">${contactMethod}</span>
                </div>
                <div class="info-row">
                  <span><strong>Date:</strong></span>
                  <span>${new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span><strong>Time:</strong></span>
                  <span>${scheduledTime || 'Not specified'}</span>
                </div>
              </div>

              ${summary ? `
              <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6;">
                <strong>📝 Planned Discussion:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937;">${summary}</p>
              </div>
              ` : ''}

              ${messageSent ? `
              <div style="background: #dcfce7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a;">
                <strong>✉️ Message to Send:</strong>
                <p style="margin: 10px 0 0 0; color: #1f2937; font-style: italic;">"${messageSent}"</p>
              </div>
              ` : ''}

              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>💡 Preparation Tips:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Review previous conversations and notes</li>
                  <li>Prepare key talking points</li>
                  <li>Have relevant documents ready</li>
                  <li>Remember to take screenshots/notes for evidence</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}" class="btn">
                  View Lead Details →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Good luck with your follow-up! Remember to submit evidence after completion.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated reminder to help you stay on track.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Scheduled follow-up reminder sent to ${salesRepEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: salesRepEmail };
  } catch (error) {
    console.error('Error sending scheduled follow-up reminder:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send next follow-up date reminder
 */
exports.sendNextFollowUpReminder = async (reminderData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('Email service not configured. Reminder logged instead.');
      return { success: false, message: 'Email service not configured' };
    }

    const {
      salesRepEmail,
      salesRepName,
      leadName,
      companyName,
      nextFollowUpDate,
      nextStep,
      leadId
    } = reminderData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: salesRepEmail,
      subject: `📅 Next Follow-up Due Tomorrow - ${leadName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
            .next-step-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #8b5cf6; }
            .btn { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Next Follow-up Due</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Time to Plan Your Next Step</p>
            </div>
            
            <div class="content">
              <p>Hello <strong>${salesRepName}</strong>,</p>
              
              <p>Based on your previous follow-up, it's time for the next contact with:</p>

              <div class="next-step-box">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">📞 Lead Information</h3>
                <p style="margin: 5px 0; font-size: 18px;"><strong>${leadName}</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">${companyName}</p>
                <p style="margin: 20px 0 10px 0; font-size: 14px; color: #6b7280;">Next Follow-up Date:</p>
                <p style="margin: 0; font-size: 20px; color: #8b5cf6; font-weight: bold;">
                  ${new Date(nextFollowUpDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              ${nextStep ? `
              <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
                <h4 style="margin: 0 0 10px 0; color: #5b21b6;">🎯 Planned Next Step:</h4>
                <p style="margin: 0; color: #1f2937; font-size: 16px;">${nextStep}</p>
              </div>
              ` : ''}

              <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <strong>✅ Action Items:</strong>
                <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Schedule the follow-up in your calendar</li>
                  <li>Prepare any materials or information needed</li>
                  <li>Review previous conversation notes</li>
                  <li>Add the follow-up to the system when ready</li>
                </ol>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}" class="btn">
                  Schedule Follow-up Now →
                </a>
              </p>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Consistent follow-ups are key to moving leads through the pipeline. Don't let this opportunity slip away!
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">The Hustle OS - Sales Management System</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">Stay organized, stay productive!</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Next follow-up reminder sent to ${salesRepEmail}`);
    return { success: true, message: 'Email sent successfully', recipient: salesRepEmail };
  } catch (error) {
    console.error('Error sending next follow-up reminder:', error);
    return { success: false, message: error.message };
  }
};
