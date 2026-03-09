/**
 * Deployment Verification Script
 * Run this on production to verify follow-up feature is properly deployed
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}`)
};

async function verifyDeployment() {
  let hasErrors = false;

  try {
    log.section('FOLLOW-UP FEATURE DEPLOYMENT VERIFICATION');

    // 1. Check Environment Variables
    log.section('1. Environment Variables');
    
    const requiredEnvVars = {
      'MONGODB_URI or MONGO_URI': process.env.MONGODB_URI || process.env.MONGO_URI,
      'NODE_ENV': process.env.NODE_ENV,
      'PORT': process.env.PORT
    };

    const optionalEnvVars = {
      'EMAIL_SERVICE': process.env.EMAIL_SERVICE,
      'EMAIL_USER': process.env.EMAIL_USER,
      'EMAIL_PASS': process.env.EMAIL_PASS ? '***' : undefined,
      'SMTP_HOST': process.env.SMTP_HOST,
      'FRONTEND_URL': process.env.FRONTEND_URL
    };

    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (value) {
        log.success(`${key}: ${key.includes('URI') ? '***' : value}`);
      } else {
        log.error(`${key}: NOT SET (REQUIRED)`);
        hasErrors = true;
      }
    }

    console.log('');
    for (const [key, value] of Object.entries(optionalEnvVars)) {
      if (value) {
        log.success(`${key}: ${value}`);
      } else {
        log.warning(`${key}: NOT SET (Email features disabled)`);
      }
    }

    // 2. Check File Structure
    log.section('2. File Structure');
    
    const requiredFiles = [
      'services/FollowUpReminderScheduler.js',
      'services/NotificationService.js',
      'utils/emailService.js',
      'controllers/leadController.js',
      'models/Lead.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        log.success(`${file}`);
      } else {
        log.error(`${file} - NOT FOUND`);
        hasErrors = true;
      }
    }

    // 3. Check Upload Directories
    log.section('3. Upload Directories');
    
    const requiredDirs = [
      'uploads/follow-up-evidence',
      'uploads/screenshots',
      'uploads/documents',
      'uploads/temp'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        const permissions = (stats.mode & parseInt('777', 8)).toString(8);
        log.success(`${dir} (permissions: ${permissions})`);
      } else {
        log.warning(`${dir} - NOT FOUND (will be created on first use)`);
      }
    }

    // 4. Check MongoDB Connection
    log.section('4. Database Connection');
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      log.error('MongoDB URI not found in environment variables');
      hasErrors = true;
    } else {
      try {
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        log.success('Connected to MongoDB successfully');

        // 5. Check Database Schema
        log.section('5. Database Schema Verification');
        
        const Lead = require('../models/Lead');
        
        // Check if any leads exist
        const leadCount = await Lead.countDocuments();
        log.info(`Total leads in database: ${leadCount}`);

        if (leadCount > 0) {
          // Check if any leads have follow-ups
          const leadsWithFollowUps = await Lead.countDocuments({
            'followUps.0': { $exists: true }
          });
          log.info(`Leads with follow-ups: ${leadsWithFollowUps}`);

          if (leadsWithFollowUps > 0) {
            // Check for new fields
            const sampleLead = await Lead.findOne({
              'followUps.0': { $exists: true }
            });

            const firstFollowUp = sampleLead.followUps[0];
            const newFields = {
              'lastEvidenceReminderSent': firstFollowUp.lastEvidenceReminderSent !== undefined,
              'scheduledReminderSent': firstFollowUp.scheduledReminderSent !== undefined,
              'nextFollowUpReminderSent': firstFollowUp.nextFollowUpReminderSent !== undefined
            };

            for (const [field, exists] of Object.entries(newFields)) {
              if (exists) {
                log.success(`Schema field '${field}' exists`);
              } else {
                log.warning(`Schema field '${field}' not found (will be added on save)`);
              }
            }
          }
        }

        // 6. Check Services
        log.section('6. Service Modules');
        
        try {
          const FollowUpReminderScheduler = require('../services/FollowUpReminderScheduler');
          if (FollowUpReminderScheduler && typeof FollowUpReminderScheduler.start === 'function') {
            log.success('FollowUpReminderScheduler loaded successfully');
            const status = FollowUpReminderScheduler.getStatus();
            log.info(`Scheduler status: ${status.isRunning ? 'RUNNING' : 'STOPPED'}`);
            log.info(`Check interval: ${status.checkIntervalHours} hours`);
          } else {
            log.error('FollowUpReminderScheduler loaded but invalid structure');
            hasErrors = true;
          }
        } catch (error) {
          log.error(`Failed to load FollowUpReminderScheduler: ${error.message}`);
          hasErrors = true;
        }

        try {
          const NotificationService = require('../services/NotificationService');
          if (NotificationService && typeof NotificationService.notifyFollowUpAdded === 'function') {
            log.success('NotificationService loaded successfully');
          } else {
            log.error('NotificationService loaded but missing required functions');
            hasErrors = true;
          }
        } catch (error) {
          log.error(`Failed to load NotificationService: ${error.message}`);
          hasErrors = true;
        }

        try {
          const emailService = require('../utils/emailService');
          if (emailService && typeof emailService.sendFollowUpEvidencePendingReminder === 'function') {
            log.success('EmailService loaded successfully');
            
            // Check if email is configured
            if (process.env.EMAIL_SERVICE || process.env.SMTP_HOST) {
              log.success('Email service configured');
            } else {
              log.warning('Email service not configured (notifications will be logged only)');
            }
          } else {
            log.error('EmailService loaded but missing required functions');
            hasErrors = true;
          }
        } catch (error) {
          log.error(`Failed to load EmailService: ${error.message}`);
          hasErrors = true;
        }

        await mongoose.connection.close();
        log.success('Database connection closed');

      } catch (error) {
        log.error(`MongoDB connection failed: ${error.message}`);
        hasErrors = true;
      }
    }

    // 7. Summary
    log.section('VERIFICATION SUMMARY');
    
    if (hasErrors) {
      log.error('Deployment verification FAILED - Please fix the errors above');
      console.log('\nCommon fixes:');
      console.log('1. Add missing environment variables to .env file');
      console.log('2. Ensure all files are deployed from Git repository');
      console.log('3. Run: mkdir -p uploads/follow-up-evidence');
      console.log('4. Restart your server (pm2 restart all)');
      process.exit(1);
    } else {
      log.success('All checks passed! Follow-up feature is properly deployed');
      console.log('\nRecommendations:');
      if (!process.env.EMAIL_SERVICE && !process.env.SMTP_HOST) {
        console.log('- Configure email service for notifications');
      }
      console.log('- Monitor logs for scheduler messages every 6 hours');
      console.log('- Test by creating a follow-up and checking notifications');
      process.exit(0);
    }

  } catch (error) {
    log.error(`Verification script failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run verification
verifyDeployment();
