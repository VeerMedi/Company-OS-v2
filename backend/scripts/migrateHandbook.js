/**
 * Migration Script: Migrate existing handbook from JS file to MongoDB
 * 
 * This script migrates the development handbook from the hardcoded JS file
 * to the new MongoDB-based Handbook CMS system.
 * 
 * Run with: node backend/scripts/migrateHandbook.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const HandbookVersion = require('../models/HandbookVersion');
const Handbook = require('../models/Handbook');
const User = require('../models/User');

// Import existing handbook data
const developmentHandbook = {
  title: "Development Team Handbook",
  subtitle: "Guidelines, Best Practices, and Resources for The Hustle Development Team",
  sections: [
    {
      id: "code-standards",
      title: "Code Standards & Quality",
      content: `## Code Quality Standards

### General Principles
1. **Write clean, readable code**: Code should be self-documenting
2. **Follow DRY principle**: Don't Repeat Yourself
3. **KISS principle**: Keep It Simple, Stupid
4. **Single Responsibility**: Each function/class should do one thing well

### Coding Conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Comment complex logic
- Use consistent formatting (Prettier/ESLint)
- Follow language-specific style guides

### Code Review Standards
- All code must be reviewed before merging
- Review for: logic, performance, security, readability
- Provide constructive feedback
- Approve only when confident in changes`,
      principles: [
        "Write clean, readable code",
        "Follow DRY and KISS principles",
        "All code must be reviewed"
      ],
      tags: ["code-quality", "standards", "review"]
    },
    {
      id: "git-workflow",
      title: "Git Workflow & Branching",
      content: `## Git Best Practices

### Branch Naming
- \`feature/description\`: New features
- \`fix/description\`: Bug fixes
- \`hotfix/description\`: Urgent production fixes
- \`refactor/description\`: Code refactoring
- \`docs/description\`: Documentation updates

### Commit Messages
Follow conventional commits format:
\`\`\`
type(scope): description

[optional body]

[optional footer]
\`\`\`

Types: feat, fix, docs, style, refactor, test, chore

Example:
\`\`\`
feat(auth): add two-factor authentication

Implemented TOTP-based 2FA using speakeasy library.
Users can enable/disable in settings.

Closes #123
\`\`\`

### Pull Request Process
1. Create feature branch from \`main\`
2. Make changes with clear commits
3. Push and create PR
4. Request code review
5. Address feedback
6. Merge after approval
7. Delete feature branch`,
      principles: [
        "Use clear branch naming conventions",
        "Write descriptive commit messages",
        "Always create PRs for code review"
      ],
      tags: ["git", "version-control", "workflow"]
    },
    {
      id: "testing",
      title: "Testing Standards",
      content: `## Testing Requirements

### Unit Testing
- **Coverage target**: 70%+ for critical code
- **Test all edge cases**: Happy path + error scenarios
- **Mock external dependencies**: APIs, databases, etc.
- **Keep tests fast**: < 1 second per test

### Integration Testing
- Test API endpoints end-to-end
- Verify database interactions
- Test authentication/authorization
- Check error handling

### Frontend Testing
- Component unit tests
- User interaction testing
- Visual regression testing (where applicable)

### Before Merging
- All tests must pass
- No failing CI/CD checks
- Code coverage maintained or improved`,
      principles: [
        "70%+ code coverage for critical paths",
        "All tests must pass before merging",
        "Test both success and failure scenarios"
      ],
      tags: ["testing", "quality-assurance", "ci-cd"]
    },
    {
      id: "security",
      title: "Security Best Practices",
      content: `## Security Guidelines

### Authentication & Authorization
- Never store passwords in plain text
- Use bcrypt for password hashing
- Implement JWT properly with expiration
- Validate tokens on every request
- Use role-based access control (RBAC)

### Data Protection
- Sanitize all user inputs
- Use parameterized queries (prevent SQL injection)
- Validate and sanitize file uploads
- Never expose sensitive data in logs
- Use HTTPS for all communications

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Input validation on all endpoints
- Protect against XSS, CSRF attacks
- Use security headers (helmet.js)

### Secrets Management
- Never commit secrets to Git
- Use environment variables
- Rotate credentials regularly
- Use secrets management tools in production`,
      principles: [
        "Never commit secrets or credentials",
        "Always validate and sanitize inputs",
        "Use industry-standard security practices"
      ],
      tags: ["security", "authentication", "data-protection"]
    },
    {
      id: "performance",
      title: "Performance Optimization",
      content: `## Performance Best Practices

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization (WebP, lazy loading)
- Minimize bundle size
- Use React.memo, useMemo, useCallback wisely
- Avoid unnecessary re-renders
- Implement virtual scrolling for long lists

### Backend Optimization
- Database indexing on frequently queried fields
- Query optimization (avoid N+1 problems)
- Caching strategies (Redis)
- Connection pooling
- Batch operations where possible
- Use pagination for large datasets

### Monitoring
- Track performance metrics
- Set up alerts for degradation
- Regular performance audits
- Load testing before releases`,
      principles: [
        "Optimize for user experience",
        "Monitor and measure performance",
        "Prevent performance regressions"
      ],
      tags: ["performance", "optimization", "monitoring"]
    },
    {
      id: "documentation",
      title: "Documentation Standards",
      content: `## Documentation Requirements

### Code Documentation
- Document all public APIs
- Use JSDoc for functions and classes
- Explain complex algorithms
- Keep comments up-to-date
- README files for each major component

### API Documentation
- Document all endpoints
- Include request/response examples
- List all parameters and types
- Document error codes and messages
- Keep API docs updated with changes

### Project Documentation
- README.md with setup instructions
- Architecture diagrams
- Deployment guides
- Troubleshooting guides
- Changelog for releases`,
      principles: [
        "Document intent, not just implementation",
        "Keep documentation up-to-date",
        "Make it easy for new developers to onboard"
      ],
      tags: ["documentation", "knowledge-sharing"]
    },
    {
      id: "deployment",
      title: "Deployment Process",
      content: `## Deployment Guidelines

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Stakeholders notified

### Deployment Steps
1. Merge to main branch
2. CI/CD pipeline runs automated tests
3. Build production bundle
4. Deploy to staging first
5. Run smoke tests on staging
6. Deploy to production
7. Monitor for errors
8. Update deployment docs

### Post-Deployment
- Monitor error rates
- Check performance metrics
- Verify all features working
- Document any issues
- Communicate with team

### Rollback Procedure
- Keep previous version ready
- Know how to quickly rollback
- Test rollback process regularly
- Document rollback steps`,
      principles: [
        "Deploy to staging first",
        "Always have a rollback plan",
        "Monitor after every deployment"
      ],
      tags: ["deployment", "devops", "ci-cd"]
    }
  ]
};

async function migrateHandbook() {
  try {
    console.log('🚀 Starting handbook migration...\n');
    
    // Find CEO or HR user to assign as manager
    const ceo = await User.findOne({ role: 'ceo' });
    if (!ceo) {
      console.warn('⚠️  No CEO found, creating handbook without manager');
    }
    
    // Check if handbook already exists
    const existing = await Handbook.findOne({ department: 'development' });
    if (existing) {
      console.log('ℹ️  Development handbook already exists');
      console.log(`   Status: ${existing.status}`);
      console.log(`   Version: ${existing.currentVersion}`);
      console.log('\n✅ Migration skipped (handbook already migrated)');
      return;
    }
    
    // Create new handbook
    const handbook = await Handbook.create({
      department: 'development',
      title: developmentHandbook.title,
      subtitle: developmentHandbook.subtitle,
      sections: developmentHandbook.sections.map((section, index) => ({
        sectionId: section.id,
        title: section.title,
        content: section.content,
        order: index,
        principles: section.principles || [],
        tags: section.tags || [],
        visibleToRoles: ['all'],
        lastEditedBy: ceo?._id,
        lastEditedAt: new Date()
      })),
      status: 'published',  // Mark as published since it's existing content
      currentVersion: 1,
      publishedAt: new Date(),
      publishedBy: ceo?._id,
      managedBy: ceo ? [ceo._id] : [],
      ragSyncStatus: 'pending'  // Will need to be synced
    });
    
    // Create initial version
    await handbook.createVersion();
    
    console.log('✅ Handbook migrated successfully!');
    console.log(`   ID: ${handbook._id}`);
    console.log(`   Title: ${handbook.title}`);
    console.log(`   Department: ${handbook.department}`);
    console.log(`   Sections: ${handbook.sections.length}`);
    console.log(`   Status: ${handbook.status}`);
    console.log(`   RAG Sync Status: ${handbook.ragSyncStatus}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Sync handbook to RAG: POST /api/handbooks/' + handbook._id + '/sync-rag');
    console.log('   2. Verify in UI: Navigate to Handbook Management');
    console.log('   3. Test RAG queries with handbook content');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
migrateHandbook()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
