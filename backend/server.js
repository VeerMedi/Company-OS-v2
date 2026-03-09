// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const projectRoutes = require('./routes/projects');
// const taskRoutes = require('./routes/tasks');
// const checkpointRoutes = require('./routes/checkpoints');
// const performanceRoutes = require('./routes/performance');
// const payrollRoutes = require('./routes/payroll');
// const payrollSchedulerRoutes = require('./routes/payrollScheduler');
// const leaveRoutes = require('./routes/leave');
// const attendanceRoutes = require('./routes/attendance');
// const hrRoutes = require('./routes/hr');
// const salesRoutes = require('./routes/sales');
// const revenueRoutes = require('./routes/revenue');
// const companyLeadRoutes = require('./routes/companyLead');
// const noteNotificationsRoutes = require('./routes/noteNotifications');

// // New Sales Management Routes
// const companiesRoutes = require('./routes/companies');
// const leadsRoutes = require('./routes/leads');
// const salesTasksRoutes = require('./routes/salesTasks');
// const notificationsRoutes = require('./routes/notifications');
// const hosMonitoringRoutes = require('./routes/hosMonitoring');
// const analyticsRoutes = require('./routes/analytics');

// // Import payroll scheduler
// const payrollScheduler = require('./services/PayrollScheduler');

// const app = express();

// // Security middleware
// app.use(helmet());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// // CORS configuration
// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);

//     const allowedOrigins = [
//       // Local development
//       'http://localhost:3000',
//       'http://localhost:5173',
//       'http://127.0.0.1:3000',
//       'http://127.0.0.1:5173',

//       // Production frontends
//       'http://193.203.160.42:9000',
//       'http://HustleOs.thehustlehouseofficial.com',
//       'https://HustleOs.thehustlehouseofficial.com',

//       // Environment variable
//       process.env.FRONTEND_URL
//     ].filter(Boolean); // Remove undefined values

//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.log('⚠️ CORS blocked origin:', origin);
//       callback(null, true); // Allow anyway but log it
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type', 
//     'Authorization', 
//     'X-Requested-With',
//     'Accept',
//     'Origin',
//     'Cache-Control',
//     'X-File-Name'
//   ],
//   exposedHeaders: ['Authorization'],
//   preflightContinue: false,
//   optionsSuccessStatus: 204
// }));

// // Additional CORS handling for preflight requests
// app.options('*', cors());

// // Additional middleware to ensure CORS headers on all responses
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   const allowedOrigins = [
//     // Local development
//     'http://localhost:3000',
//     'http://localhost:5173',
//     'http://127.0.0.1:3000',
//     'http://127.0.0.1:5173',

//     // Production frontends
//     'http://193.203.160.42:9000',
//     'http://HustleOs.thehustlehouseofficial.com',
//     'https://HustleOs.thehustlehouseofficial.com',

//     // Environment variable
//     process.env.FRONTEND_URL
//   ].filter(Boolean);

//   if (allowedOrigins.includes(origin) || !origin) {
//     res.header('Access-Control-Allow-Origin', origin || '*');
//     res.header('Access-Control-Allow-Credentials', 'true');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
//   }
//   next();
// });

// // Body parsing middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Serve static files from uploads directory
// app.use('/uploads', express.static('uploads'));

// // Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB connected successfully'))
// .catch(err => console.error('MongoDB connection error:', err));

// // CORS and no-cache middleware for API routes
// app.use('/api', (req, res, next) => {
//   // Explicit CORS headers
//   res.setHeader('Access-Control-Allow-Origin', req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');

//   // No-cache headers
//   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//   res.setHeader('Pragma', 'no-cache');
//   res.setHeader('Expires', '0');
//   res.setHeader('Surrogate-Control', 'no-store');

//   next();
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/checkpoints', checkpointRoutes);
// app.use('/api/performance', performanceRoutes);
// app.use('/api/payroll', payrollRoutes);
// app.use('/api/notes', noteNotificationsRoutes);
// app.use('/api/payroll-scheduler', payrollSchedulerRoutes);
// app.use('/api/leave', leaveRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/hr', hrRoutes);
// app.use('/api/sales', salesRoutes);
// app.use('/api/revenue', revenueRoutes);
// app.use('/api/company-lead', companyLeadRoutes);

// // New Sales Management Routes
// app.use('/api/companies', companiesRoutes);
// app.use('/api/leads', leadsRoutes);
// app.use('/api/sales-tasks', salesTasksRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/hos-monitoring', hosMonitoringRoutes);
// app.use('/api/analytics', analyticsRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ 
//     status: 'OK', 
//     message: 'The Hustle System API is running',
//     timestamp: new Date().toISOString()
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : {}
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

//   // Initialize payroll scheduler
//   payrollScheduler.init();
// });

// module.exports = app;



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const checkpointRoutes = require('./routes/checkpoints');
const performanceRoutes = require('./routes/performance');
const payrollRoutes = require('./routes/payroll');
const payrollSchedulerRoutes = require('./routes/payrollScheduler');
const leaveRoutes = require('./routes/leave');
const attendanceRoutes = require('./routes/attendance');
const hrRoutes = require('./routes/hr');
const salesRoutes = require('./routes/sales');
const revenueRoutes = require('./routes/revenue');
const companyLeadRoutes = require('./routes/companyLead');
const noteNotificationsRoutes = require('./routes/noteNotifications');
const personalNotesRoutes = require('./routes/personalNotes');

// New Sales Management Routes
const companiesRoutes = require('./routes/companies');
const leadsRoutes = require('./routes/leads');
const salesTasksRoutes = require('./routes/salesTasks');
const notificationsRoutes = require('./routes/notifications');
const hosMonitoringRoutes = require('./routes/hosMonitoring');
const analyticsRoutes = require('./routes/analytics');
const handbooksRoutes = require('./routes/handbooks');
const incentiveMatrixRoutes = require('./routes/incentiveMatrix');
const performanceEvaluationRoutes = require('./routes/performanceEvaluations');
const clientRoutes = require('./routes/clients');

// Import payroll scheduler
const payrollScheduler = require('./services/PayrollScheduler');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting (relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000 // limit each IP to 5000 requests per windowMs (increased for dev)
});
app.use(limiter);

// ✅ CORS configuration (clean & fixed)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'http://193.203.160.42:9000',
  'http://HustleOs.thehustlehouseofficial.com',
  'https://HustleOs.thehustlehouseofficial.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow no-origin requests (like Postman, same-origin, or internal requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn('⚠️ CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name'
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Additional explicit CORS headers for preflight
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/reassignment', require('./routes/taskReassignment'));
app.use('/api/task-bunches', require('./routes/taskBunches'));
app.use('/api/executive-tasks', require('./routes/executiveTasks'));
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notes', noteNotificationsRoutes);
app.use('/api/personal-notes', personalNotesRoutes);
app.use('/api/payroll-scheduler', payrollSchedulerRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/company-lead', companyLeadRoutes);

// New Sales Management Routes
app.use('/api/companies', companiesRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/sales-tasks', salesTasksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/hos-monitoring', hosMonitoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/handbooks', handbooksRoutes);
app.use('/api/ceo', require('./routes/ceo'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/performance-evaluations', require('./routes/performanceEvaluations'));
app.use('/api/team-reports', require('./routes/teamReports'));
app.use('/api/performance-reports', require('./routes/performanceReports'));
app.use('/api/clients', clientRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'The Hustle System API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize payroll scheduler
  payrollScheduler.init();
});


// Force restart
module.exports = app;
