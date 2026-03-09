const Handbook = require('../models/Handbook');
const HandbookVersion = require('../models/HandbookVersion');
const handbookRAGSync = require('../services/handbookRAGSync');

/**
 * @desc    Get all handbooks (filtered by user role and department)
 * @route   GET /api/handbooks
 * @access  Private
 */
exports.getAllHandbooks = async (req, res) => {
  try {
    const { department, status } = req.query;
    const user = req.user;
    
    // Build query
    const query = {};
    
    // Filter by department if specified
    if (department) {
      query.department = department;
    }
    
    // Filter by status (default to published for non-admin users)
    if (status) {
      query.status = status;
    } else if (!['hr', 'ceo'].includes(user.role)) {
      query.status = 'published';
    }
    
    const handbooks = await Handbook.find(query)
      .populate('publishedBy', 'firstName lastName')
      .populate('managedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    // Filter sections based on user role
    const filteredHandbooks = handbooks.map(handbook => {
      const handbookObj = handbook.toObject();
      
      handbookObj.sections = handbookObj.sections.filter(section => {
        return section.visibleToRoles.includes('all') || 
               section.visibleToRoles.includes(user.role) ||
               section.visibleToRoles.includes(user.jobCategory);
      });
      
      return handbookObj;
    });
    
    res.status(200).json({
      success: true,
      count: filteredHandbooks.length,
      data: filteredHandbooks
    });
    
  } catch (error) {
    console.error('Get handbooks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handbooks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Get handbook by ID
 * @route   GET /api/handbooks/:id
 * @access  Private
 */
exports.getHandbook = async (req, res) => {
  try {
    const handbook = await Handbook.findById(req.params.id)
      .populate('publishedBy', 'firstName lastName')
      .populate('managedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName');
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    // Filter sections by user role
    const handbookObj = handbook.toObject();
    handbookObj.sections = handbookObj.sections.filter(section => {
      return section.visibleToRoles.includes('all') || 
             section.visibleToRoles.includes(req.user.role) ||
             section.visibleToRoles.includes(req.user.jobCategory);
    });
    
    res.status(200).json({
      success: true,
      data: handbookObj
    });
    
  } catch (error) {
    console.error('Get handbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handbook'
    });
  }
};

/**
 * @desc    Get handbook by department
 * @route   GET /api/handbooks/department/:department
 * @access  Private
 */
exports.getHandbookByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const handbook = await Handbook.findOne({ 
      department,
      status: 'published'
    })
      .populate('publishedBy', 'firstName lastName')
      .sort({ publishedAt: -1 });
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: `No published handbook found for ${department} department`
      });
    }
    
    // Filter sections by user role
    const handbookObj = handbook.toObject();
    handbookObj.sections = handbookObj.sections.filter(section => {
      return section.visibleToRoles.includes('all') || 
             section.visibleToRoles.includes(req.user.role) ||
             section.visibleToRoles.includes(req.user.jobCategory);
    });
    
    res.status(200).json({
      success: true,
      data: handbookObj
    });
    
  } catch (error) {
    console.error('Get handbook by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handbook'
    });
  }
};

/**
 * @desc    Create new handbook
 * @route   POST /api/handbooks
 * @access  Private (HR, CEO only)
 */
exports.createHandbook = async (req, res) => {
  try {
    const { department, title, subtitle, sections, managedBy } = req.body;
    
    // Validate required fields
    if (!department || !title || !sections || sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Department, title, and at least one section are required'
      });
    }
    
    // Create handbook
    const handbook = await Handbook.create({
      department,
      title,
      subtitle,
      sections: sections.map((section, index) => ({
        ...section,
        order: section.order || index,
        lastEditedBy: req.user._id,
        lastEditedAt: new Date()
      })),
      managedBy: managedBy || [req.user._id],
      status: 'draft'
    });
    
    // Create initial version
    await handbook.createVersion();
    
    res.status(201).json({
      success: true,
      message: 'Handbook created successfully',
      data: handbook
    });
    
  } catch (error) {
    console.error('Create handbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create handbook',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

/**
 * @desc    Update handbook
 * @route   PUT /api/handbooks/:id
 * @access  Private (HR, CEO, or handbook managers)
 */
exports.updateHandbook = async (req, res) => {
  try {
    const handbook = await Handbook.findById(req.params.id);
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    // Check permissions
    if (!handbook.canBeEditedBy(req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this handbook'
      });
    }
    
    const { title, subtitle, sections, changesSummary } = req.body;
    
    // Create new version before updating
    const oldVersion = await handbook.createVersion();
    
    // Update handbook
    if (title) handbook.title = title;
    if (subtitle !== undefined) handbook.subtitle = subtitle;
    if (sections) {
      handbook.sections = sections.map((section, index) => ({
        ...section,
        order: section.order || index,
        lastEditedBy: req.user._id,
        lastEditedAt: new Date()
      }));
    }
    
    // Increment version number
    handbook.currentVersion += 1;
    
    // Reset approval if it was previously approved
    if (handbook.status === 'approved') {
      handbook.status = 'draft';
      handbook.approvedBy = null;
      handbook.approvedAt = null;
    }
    
    // Mark RAG as pending sync
    if (handbook.status === 'published') {
      handbook.ragSyncStatus = 'pending';
    }
    
    await handbook.save();
    
    // Update the version with changes summary
    if (changesSummary) {
      oldVersion.changesSummary = changesSummary;
      await oldVersion.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Handbook updated successfully',
      data: handbook
    });
    
  } catch (error) {
    console.error('Update handbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update handbook'
    });
  }
};

/**
 * @desc    Submit handbook for approval
 * @route   POST /api/handbooks/:id/submit-approval
 * @access  Private (HR, CEO, or handbook managers)
 */
exports.submitForApproval = async (req, res) => {
  try {
    const handbook = await Handbook.findById(req.params.id);
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    // Check permissions
    if (!handbook.canBeEditedBy(req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to submit this handbook'
      });
    }
    
    if (handbook.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft handbooks can be submitted for approval'
      });
    }
    
    handbook.status = 'pending_approval';
    await handbook.save();
    
    // TODO: Send notification to approvers
    
    res.status(200).json({
      success: true,
      message: 'Handbook submitted for approval',
      data: handbook
    });
    
  } catch (error) {
    console.error('Submit for approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit handbook for approval'
    });
  }
};

/**
 * @desc    Approve handbook
 * @route   POST /api/handbooks/:id/approve
 * @access  Private (HR, CEO only)
 */
exports.approveHandbook = async (req, res) => {
  try {
    const handbook = await Handbook.findById(req.params.id);
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    if (handbook.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Handbook must be pending approval'
      });
    }
    
    const { approvalNotes } = req.body;
    
    handbook.status = 'approved';
    handbook.approvedBy = req.user._id;
    handbook.approvedAt = new Date();
    handbook.approvalNotes = approvalNotes;
    
    await handbook.save();
    
    res.status(200).json({
      success: true,
      message: 'Handbook approved successfully',
      data: handbook
    });
    
  } catch (error) {
    console.error('Approve handbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve handbook'
    });
  }
};

/**
 * @desc    Publish handbook (triggers RAG sync)
 * @route   POST /api/handbooks/:id/publish
 * @access  Private (HR, CEO only)
 */
exports.publishHandbook = async (req, res) => {
  try {
    const handbook = await Handbook.findById(req.params.id);
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    if (handbook.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Handbook must be approved before publishing'
      });
    }
    
    handbook.status = 'published';
    handbook.publishedBy = req.user._id;
    handbook.publishedAt = new Date();
    handbook.ragSyncStatus = 'pending';
    
    await handbook.save();
    
    // Trigger RAG sync asynchronously
    handbookRAGSync.syncHandbook(handbook._id)
      .then(result => {
        console.log('✅ Handbook synced to RAG:', result);
      })
      .catch(error => {
        console.error('❌ RAG sync failed:', error);
      });
    
    res.status(200).json({
      success: true,
      message: 'Handbook published and queued for RAG sync',
      data: handbook
    });
    
  } catch (error) {
    console.error('Publish handbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish handbook'
    });
  }
};

/**
 * @desc    Get version history
 * @route   GET /api/handbooks/:id/versions
 * @access  Private
 */
exports.getVersionHistory = async (req, res) => {
  try {
    const versions = await HandbookVersion.getAllVersions(req.params.id);
    
    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions
    });
    
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch version history'
    });
  }
};

/**
 * @desc    Rollback to specific version
 * @route   POST /api/handbooks/:id/rollback/:versionNumber
 * @access  Private (HR, CEO only)
 */
exports.rollbackToVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    
    const handbook = await Handbook.findById(id);
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    const version = await HandbookVersion.findOne({
      handbookId: id,
      versionNumber: parseInt(versionNumber)
    });
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }
    
    // Create a backup of current state
    await handbook.createVersion();
    
    // Restore from version snapshot
    handbook.title = version.snapshot.title;
    handbook.subtitle = version.snapshot.subtitle;
    handbook.sections = version.snapshot.sections;
    handbook.currentVersion += 1;
    
    // Reset status to draft for review
    handbook.status = 'draft';
    handbook.approvedBy = null;
    handbook.approvedAt = null;
    
    await handbook.save();
    
    res.status(200).json({
      success: true,
      message: `Handbook rolled back to version ${versionNumber}`,
      data: handbook
    });
    
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback handbook'
    });
  }
};

/**
 * @desc    Archive handbook
 * @route   DELETE /api/handbooks/:id
 * @access  Private (CEO only)
 */
exports.archiveHandbook = async (req, res) => {
  try {
    const handbook = await Handbook.findById(req.params.id);
    
    if (!handbook) {
      return res.status(404).json({
        success: false,
        message: 'Handbook not found'
      });
    }
    
    handbook.status = 'archived';
    await handbook.save();
    
    // Remove from RAG if it was published
    if (handbook.ragSyncStatus === 'synced') {
      handbookRAGSync.removeHandbook(handbook._id)
        .catch(error => console.error('Failed to remove from RAG:', error));
    }
    
    res.status(200).json({
      success: true,
      message: 'Handbook archived successfully'
    });
    
  } catch (error) {
    console.error('Archive handbook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive handbook'
    });
  }
};

/**
 * @desc    Manually trigger RAG sync
 * @route   POST /api/handbooks/:id/sync-rag
 * @access  Private (HR, CEO only)
 */
exports.syncToRAG = async (req, res) => {
  try {
    const result = await handbookRAGSync.syncHandbook(req.params.id);
    
    res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Manual RAG sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync handbook to RAG'
    });
  }
};

/**
 * @desc    Sync all published handbooks to RAG
 * @route   POST /api/handbooks/sync-all
 * @access  Private (HR, CEO only)
 */
exports.syncAllToRAG = async (req, res) => {
  try {
    const result = await handbookRAGSync.syncAllPublished();
    
    res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync handbooks to RAG'
    });
  }
};
