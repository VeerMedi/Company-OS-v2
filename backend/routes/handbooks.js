const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const handbookController = require('../controllers/handbookController');

// Sync all published handbooks to RAG (must be before /:id routes)
router.post('/sync-all',
  authenticateToken,
  authorizeRoles('ceo', 'hr'),
  handbookController.syncAllToRAG
);

// Get handbook by department (must be before /:id routes)
router.get('/department/:department',
  authenticateToken,
  handbookController.getHandbookByDepartment
);

// Get all handbooks (filtered by role)
router.get('/',
  authenticateToken,
  handbookController.getAllHandbooks
);

// Get specific handbook
router.get('/:id',
  authenticateToken,
  handbookController.getHandbook
);

// Create new handbook (HR/CEO only)
router.post('/',
  authenticateToken,
  authorizeRoles('hr', 'ceo'),
  handbookController.createHandbook
);

// Update handbook (creates new version)
router.put('/:id',
  authenticateToken,
  authorizeRoles('hr', 'ceo'),
  handbookController.updateHandbook
);

// Submit for approval
router.post('/:id/submit-approval',
  authenticateToken,
  authorizeRoles('hr', 'ceo'),
  handbookController.submitForApproval
);

// Approve handbook
router.post('/:id/approve',
  authenticateToken,
  authorizeRoles('ceo', 'hr'),
  handbookController.approveHandbook
);

// Publish handbook (triggers RAG sync)
router.post('/:id/publish',
  authenticateToken,
  authorizeRoles('ceo', 'hr'),
  handbookController.publishHandbook
);

// Get version history
router.get('/:id/versions',
  authenticateToken,
  handbookController.getVersionHistory
);

// Rollback to version
router.post('/:id/rollback/:versionNumber',
  authenticateToken,
  authorizeRoles('ceo', 'hr'),
  handbookController.rollbackToVersion
);

// Manually trigger RAG sync
router.post('/:id/sync-rag',
  authenticateToken,
  authorizeRoles('ceo', 'hr'),
  handbookController.syncToRAG
);

// Archive handbook
router.delete('/:id',
  authenticateToken,
  authorizeRoles('ceo'),
  handbookController.archiveHandbook
);

module.exports = router;
