const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const salesController = require('../controllers/salesController');

// Configure multer for proof document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt|png|jpg|jpeg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document and image files are allowed!'));
    }
  }
});

// Protect all routes
router.use(authenticateToken);

// Sales CRUD routes
router.get('/all', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.getAllSales
);

router.get('/my-sales', 
  authorizeRoles('service-onboarding'), 
  salesController.getMySales
);

router.get('/team-overview', 
  authorizeRoles('ceo', 'head-of-sales'), 
  salesController.getSalesTeamOverview
);

router.get('/analytics', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.getSalesAnalytics
);

router.post('/create', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.createSale
);

router.get('/:id', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.getSaleById
);

router.put('/:id', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.updateSale
);

router.post('/:id/follow-up', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.addFollowUp
);

router.post('/:id/update-stage', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'),
  upload.single('proofDocument'),
  salesController.updateStageWithProof
);

router.delete('/:id', 
  authorizeRoles('ceo', 'head-of-sales'), 
  salesController.deleteSale
);

// Sales Target routes
router.post('/targets/create', 
  authorizeRoles('ceo', 'head-of-sales'), 
  salesController.createSalesTarget
);

router.get('/targets/all', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.getSalesTargets
);

router.get('/targets/analytics', 
  authorizeRoles('ceo', 'head-of-sales', 'service-onboarding'), 
  salesController.getMyTargetAnalytics
);

router.put('/targets/:id', 
  authorizeRoles('ceo', 'head-of-sales'), 
  salesController.updateSalesTarget
);

router.delete('/targets/:id', 
  authorizeRoles('ceo', 'head-of-sales'), 
  salesController.deleteSalesTarget
);

// Legacy route for compatibility
router.get('/leads', 
  authorizeRoles('service-onboarding'), 
  salesController.getMySales
);

module.exports = router;
