const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Configure email transporter (you'll need to set up SMTP or use a service like SendGrid)
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

// Send deadline notifications via email
router.post('/send-deadline-notifications', authenticateToken, async (req, res) => {
  try {
    const { notifications, userEmail, userName } = req.body;

    if (!notifications || notifications.length === 0) {
      return res.status(400).json({ message: 'No notifications to send' });
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email service not configured. Notifications logged instead:');
      console.log(JSON.stringify(notifications, null, 2));
      return res.status(200).json({ 
        message: 'Email service not configured. Notifications logged to console.',
        notifications 
      });
    }

    // Send email for each notification
    const emailPromises = notifications.map(async (notification) => {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: userEmail,
        subject: `⏰ Note Deadline Reminder: ${notification.noteTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
              .note-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .note-title { font-size: 20px; font-weight: bold; color: #2d3748; margin-bottom: 10px; }
              .deadline-info { background: #fff5f5; border: 1px solid #fc8181; color: #c53030; padding: 15px; border-radius: 6px; margin: 15px 0; }
              .deadline-time { font-size: 18px; font-weight: bold; }
              .alert-badge { display: inline-block; background: #f56565; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
              .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
              .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📝 Note Deadline Reminder</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Time-sensitive notification</p>
              </div>
              
              <div class="content">
                <p>Hello ${userName || 'there'},</p>
                
                <div class="note-box">
                  <div class="note-title">📌 ${notification.noteTitle}</div>
                  <div class="deadline-info">
                    <div style="font-weight: bold; margin-bottom: 5px;">⏰ Deadline Approaching!</div>
                    <div class="deadline-time">
                      ${new Date(notification.deadline).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div class="alert-badge">
                      ${notification.message}
                    </div>
                  </div>
                  
                  <p style="color: #4a5568; margin-top: 15px;">
                    This is an automated reminder for your note deadline. 
                    ${notification.type === '10min3' ? '<strong>Final reminder!</strong>' : 'More reminders will follow as the deadline approaches.'}
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <p style="color: #718096;">You will receive notifications at:</p>
                  <ul style="list-style: none; padding: 0; color: #4a5568;">
                    <li>✓ 1 day before deadline</li>
                    <li>✓ 1 hour before deadline</li>
                    <li>✓ 10 minutes before deadline (3 reminders)</li>
                  </ul>
                </div>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">The Hustle OS - Personal Notes System</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">
                  This is an automated notification. Please do not reply to this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Note Deadline Reminder

Hello ${userName || 'there'},

Your note "${notification.noteTitle}" has an approaching deadline:

Deadline: ${new Date(notification.deadline).toLocaleString()}
Alert: ${notification.message}

You will receive notifications at:
- 1 day before deadline
- 1 hour before deadline  
- 10 minutes before deadline (3 reminders)

---
The Hustle OS - Personal Notes System
This is an automated notification.
        `
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.status(200).json({ 
      message: 'Email notifications sent successfully',
      count: notifications.length 
    });

  } catch (error) {
    console.error('Error sending email notifications:', error);
    res.status(500).json({ 
      message: 'Failed to send email notifications', 
      error: error.message 
    });
  }
});

// Test email endpoint (for testing email configuration)
router.post('/test-email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address required' });
    }

    const transporter = createTransporter();

    if (!transporter) {
      return res.status(503).json({ 
        message: 'Email service not configured',
        instructions: 'Please set up environment variables: EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS or SMTP settings'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Test Email from The Hustle OS Notes System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">✅ Email Configuration Test</h2>
          <p>This is a test email from your Personal Notes system.</p>
          <p>If you're receiving this, your email notifications are configured correctly!</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #718096; font-size: 14px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: The Hustle OS - Personal Notes System
          </p>
        </div>
      `,
      text: 'This is a test email from your Personal Notes system. If you\'re receiving this, your email notifications are configured correctly!'
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Test email sent successfully',
      recipient: email
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      message: 'Failed to send test email', 
      error: error.message 
    });
  }
});

module.exports = router;
