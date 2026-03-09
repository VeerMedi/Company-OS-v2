const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const verifyOrgStructure = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({})
      .populate('reportingTo', 'firstName lastName role employeeId')
      .populate('mentorFor', 'firstName lastName role employeeId')
      .select('firstName lastName email role employeeId reportingTo mentorFor isActive')
      .sort('employeeId');

    console.log('=' .repeat(90));
    console.log('📊 ORGANIZATIONAL STRUCTURE VERIFICATION');
    console.log('='.repeat(90));
    console.log('\n');

    users.forEach(user => {
      console.log(`👤 ${user.firstName} ${user.lastName}`.padEnd(30));
      console.log(`   Role: ${user.role.padEnd(15)} | ID: ${user.employeeId.padEnd(10)} | Email: ${user.email}`);
      
      if (user.reportingTo) {
        console.log(`   📈 Reports to: ${user.reportingTo.firstName} ${user.reportingTo.lastName} (${user.reportingTo.role}) - ${user.reportingTo.employeeId}`);
      } else {
        console.log(`   📈 Reports to: None (Top Level)`);
      }
      
      if (user.mentorFor && user.mentorFor.length > 0) {
        user.mentorFor.forEach(mentee => {
          console.log(`   🎓 Mentors: ${mentee.firstName} ${mentee.lastName} (${mentee.role}) - ${mentee.employeeId}`);
        });
      }
      
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log('');
    });

    console.log('='.repeat(90));
    console.log(`✅ Total Users: ${users.length}`);
    console.log('='.repeat(90));

    // Verify hierarchy chain
    console.log('\n🔗 HIERARCHY CHAIN VERIFICATION:\n');
    
    const ceo = users.find(u => u.role === 'ceo');
    const cofounder = users.find(u => u.role === 'co-founder');
    const manager = users.find(u => u.role === 'manager');
    const teamLead = users.find(u => u.role === 'team-lead');
    const developers = users.filter(u => u.role === 'developer');
    const interns = users.filter(u => u.role === 'intern');

    const checks = [
      { name: 'CEO has no manager', pass: !ceo.reportingTo },
      { name: 'Co-founder reports to CEO', pass: cofounder.reportingTo?._id.equals(ceo._id) },
      { name: 'Manager reports to Co-founder', pass: manager.reportingTo?._id.equals(cofounder._id) },
      { name: 'Team Lead reports to Manager', pass: teamLead.reportingTo?._id.equals(manager._id) },
      { name: 'All Developers report to Team Lead', pass: developers.every(d => d.reportingTo?._id.equals(teamLead._id)) },
      { name: 'All Developers have mentees', pass: developers.every(d => d.mentorFor && d.mentorFor.length > 0) },
      { name: 'All Interns have mentors', pass: interns.every(i => i.reportingTo && developers.some(d => d._id.equals(i.reportingTo._id))) }
    ];

    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(c => c.pass);
    console.log('\n' + '='.repeat(90));
    if (allPassed) {
      console.log('🎉 ALL HIERARCHY CHECKS PASSED!');
    } else {
      console.log('⚠️  SOME CHECKS FAILED - Review hierarchy setup');
    }
    console.log('='.repeat(90));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  verifyOrgStructure().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = verifyOrgStructure;
