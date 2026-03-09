const axios = require('axios');
const Handbook = require('../models/Handbook');

class HandbookRAGSync {
  constructor() {
    this.ragEndpoint = process.env.DEV_HANDBOOK_RAG_URL || 'http://localhost:5003';
  }
  
  /**
   * Sync a single handbook to RAG system
   */
  async syncHandbook(handbookId) {
    try {
      const handbook = await Handbook.findById(handbookId)
        .populate('publishedBy', 'firstName lastName');
      
      if (!handbook) {
        throw new Error('Handbook not found');
      }
      
      if (handbook.status !== 'published') {
        throw new Error('Handbook must be published before syncing to RAG');
      }
      
      // Format for RAG ingestion
      const ragPayload = this.formatForRAG(handbook);
      
      console.log(`📤 Syncing handbook ${handbook.title} to RAG...`);
      
      // Send to RAG sync endpoint
      const response = await axios.post(
        `${this.ragEndpoint}/api/dev-handbook/sync`,
        ragPayload,
        { 
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update sync status
      handbook.lastSyncedToRAG = new Date();
      handbook.ragSyncStatus = 'synced';
      handbook.ragSyncError = null;
      await handbook.save();
      
      console.log(`✅ Handbook ${handbook.title} synced successfully`);
      
      return {
        success: true,
        message: 'Handbook synced to RAG successfully',
        stats: response.data.stats || {}
      };
      
    } catch (error) {
      console.error('❌ RAG sync error:', error.message);
      
      // Update sync status to failed
      try {
        const handbook = await Handbook.findById(handbookId);
        if (handbook) {
          handbook.ragSyncStatus = 'failed';
          handbook.ragSyncError = error.message;
          await handbook.save();
        }
      } catch (updateError) {
        console.error('Failed to update sync status:', updateError);
      }
      
      throw error;
    }
  }
  
  /**
   * Format handbook data for RAG ingestion
   */
  formatForRAG(handbook) {
    return {
      department: handbook.department,
      title: handbook.title,
      subtitle: handbook.subtitle || '',
      sections: handbook.sections
        .sort((a, b) => a.order - b.order)
        .map(section => ({
          id: section.sectionId,
          title: section.title,
          content: section.content,
          principles: section.principles || [],
          tags: section.tags || []
        })),
      version: handbook.currentVersion,
      publishedAt: handbook.publishedAt,
      publishedBy: handbook.publishedBy ? 
        `${handbook.publishedBy.firstName} ${handbook.publishedBy.lastName}` : 
        'System'
    };
  }
  
  /**
   * Sync all published handbooks
   */
  async syncAllPublished() {
    try {
      const handbooks = await Handbook.find({ status: 'published' });
      
      console.log(`📚 Found ${handbooks.length} published handbooks to sync`);
      
      const results = [];
      
      for (const handbook of handbooks) {
        try {
          const result = await this.syncHandbook(handbook._id);
          results.push({ 
            handbookId: handbook._id,
            title: handbook.title,
            department: handbook.department,
            ...result 
          });
        } catch (error) {
          results.push({
            handbookId: handbook._id,
            title: handbook.title,
            department: handbook.department,
            success: false,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Synced ${successCount}/${handbooks.length} handbooks successfully`);
      
      return {
        total: handbooks.length,
        successful: successCount,
        failed: handbooks.length - successCount,
        results
      };
      
    } catch (error) {
      console.error('Error syncing all handbooks:', error);
      throw error;
    }
  }
  
  /**
   * Remove handbook from RAG (when archived)
   */
  async removeHandbook(handbookId) {
    try {
      const handbook = await Handbook.findById(handbookId);
      
      if (!handbook) {
        throw new Error('Handbook not found');
      }
      
      // Send delete request to RAG
      await axios.delete(
        `${this.ragEndpoint}/api/dev-handbook/handbooks/${handbook.department}`,
        { timeout: 10000 }
      );
      
      handbook.ragSyncStatus = 'not_required';
      handbook.lastSyncedToRAG = null;
      await handbook.save();
      
      console.log(`🗑️  Removed handbook ${handbook.title} from RAG`);
      
      return {
        success: true,
        message: 'Handbook removed from RAG'
      };
      
    } catch (error) {
      console.error('Error removing handbook from RAG:', error);
      throw error;
    }
  }
}

module.exports = new HandbookRAGSync();
