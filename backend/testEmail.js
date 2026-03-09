const nodemailer = require('nodemailer');
require('dotenv').config();

// Create test email transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
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

// Send test notification email
const sendTestEmail = async () => {
  try {
    console.log('🔍 Checking email configuration...');
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email service not configured!');
      console.log('\n📝 Please add these to your .env file:');
      console.log('EMAIL_SERVICE=gmail');
      console.log('EMAIL_USER=your-email@gmail.com');
      console.log('EMAIL_PASS=your-app-password');
      console.log('EMAIL_FROM=The Hustle OS <your-email@gmail.com>');
      process.exit(1);
    }

    console.log('✅ Email transporter created');
    console.log(`📧 Sending test email to: rawatsanidhya10@gmail.com, sourabhsompandey@gmail.com`);
    
    const testNote = {
      noteTitle: "GF Reminder",
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      type: "urgent",
      message: "Please GF se baat karlo sir mera kya hai mai to karta rahunga kam. Personal life is also important CEO sahab"
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'rawatsanidhya10@gmail.com, sourabhsompandey@gmail.com',
      subject: `⏰ URGENT - Personal Reminder: ${testNote.noteTitle}`,
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
            .test-banner { background: #48bb78; color: white; padding: 15px; text-align: center; font-weight: bold; border-radius: 8px; margin-bottom: 20px; }
            .footer { background: #2d3748; color: #a0aec0; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-banner">
              🚨 URGENT PERSONAL REMINDER - TEST EMAIL
            </div>
            
            <div class="header">
              <h1>� Personal Reminder</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Important Life Balance Notification</p>
            </div>
            
            <div class="content">
              <div class="success-icon">💕</div>
              <h2 style="text-align: center; color: #e53e3e;">GF Reminder - Urgent!</h2>
              
              <p>Hello CEO Sahab,</p>
              
              <p style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; border-radius: 4px;">
                <strong>🚨 Urgent Reminder!</strong> This is your personal life reminder. Work is important but so is your relationship!
              </p>
              
              <div class="note-box">
                <div class="note-title">� ${testNote.noteTitle}</div>
                <div class="deadline-info">
                  <div style="font-weight: bold; margin-bottom: 15px; font-size: 18px;">⏰ Please take action now!</div>
                  <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="font-size: 16px; line-height: 1.8; margin: 0; color: #2d3748;">
                      ${testNote.message}
                    </p>
                  </div>
                  <div class="deadline-time" style="margin-top: 10px;">
                    Scheduled for: ${new Date(testNote.deadline).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <p style="color: #4a5568; margin-top: 15px; font-style: italic;">
                  Remember: All the success in the world means nothing if you don't have someone to share it with. Take a break and call her! 💕
                </p>
              </div>
              
              <div style="background: #fff5f5; border: 2px solid #fc8181; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin-top: 0; color: #c53030;">� Why This Matters</h3>
                <ul style="color: #742a2a; line-height: 1.8;">
                  <li><strong>Work-Life Balance</strong> - You're building an empire, but don't forget who you're building it for</li>
                  <li><strong>Relationships Need Time</strong> - Success tastes better when shared with loved ones</li>
                  <li><strong>Mental Health</strong> - Taking breaks for personal time actually improves productivity</li>
                  <li><strong>She's Waiting</strong> - A simple call can make someone's entire day better</li>
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #fbb6ce 0%, #feb2b2 100%); border-radius: 8px; color: #742a2a;">
                <h3 style="margin-top: 0;">� Action Required</h3>
                <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                  Close this laptop. Pick up that phone. Call her! 💕
                </p>
                <p style="font-size: 14px; margin: 10px 0; font-style: italic;">
                  "Work will always be there. The moment to make someone smile won't."
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">💝 The Hustle OS - Personal Life Reminder System</p>
              <p style="margin: 10px 0 0 0; font-size: 13px;">
                Test email sent at: ${new Date().toLocaleString()}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">
                ✅ Email service working! This reminder system will help balance work and personal life.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
🚨 URGENT PERSONAL REMINDER - TEST EMAIL

Hello CEO Sahab,

💝 ${testNote.noteTitle}

${testNote.message}

Deadline: ${new Date(testNote.deadline).toLocaleString()}

💕 Remember: Work will always be there. The moment to make someone smile won't.

Action Required:
📱 Close this laptop. Pick up that phone. Call her!

Why This Matters:
- Work-Life Balance - You're building an empire, but don't forget who you're building it for
- Relationships Need Time - Success tastes better when shared with loved ones  
- Mental Health - Taking breaks for personal time actually improves productivity
- She's Waiting - A simple call can make someone's entire day better

---
💝 The Hustle OS - Personal Life Reminder System
✅ Email service working!
Test email sent at: ${new Date().toLocaleString()}
      `
    };

    console.log('📤 Sending email...');
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ SUCCESS! Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Recipients: rawatsanidhya10@gmail.com, sourabhsompandey@gmail.com');
    console.log('\n✨ Please check your inbox (and spam folder) for the GF reminder test email!');
    console.log('\n🎉 Your email notification system is working correctly!');
    console.log('💝 Personal reminder sent: "Please GF se baat karlo sir..."');
    
  } catch (error) {
    console.error('\n❌ Error sending test email:');
    console.error(error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Tip: If using Gmail, you need to:');
      console.log('1. Enable 2-Factor Authentication');
      console.log('2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.log('3. Use the App Password in EMAIL_PASS (not your regular password)');
    }
    
    process.exit(1);
  }
};

// Run the test
sendTestEmail();
