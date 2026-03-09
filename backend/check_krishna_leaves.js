const mongoose = require('mongoose');
require('dotenv').config();

const checkKrishnaLeaves = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system');
    console.log('✅ MongoDB Connected\n');

    const { Leave } = require('./models/Leave');
    const User = require('./models/User');

    // Find Krishna by email
    const krishna = await User.findOne({ email: 'krishna.mehra@hustle.com' });
    
    if (!krishna) {
      console.log('❌ Krishna user not found!');
      process.exit(1);
    }

    console.log('✅ Found Krishna:');
    console.log(`   ID: ${krishna._id}`);
    console.log(`   Name: ${krishna.firstName} ${krishna.lastName}`);
    console.log(`   Email: ${krishna.email}`);
    console.log(`   Employee ID: ${krishna.employeeId}\n`);

    // Find all leaves
    const allLeaves = await Leave.find({}).populate('employee', 'firstName lastName email employeeId');
    console.log(`📊 Total Leaves in Database: ${allLeaves.length}\n`);

    // Find leaves by Krishna's ID
    const krishnaLeavesById = await Leave.find({ employee: krishna._id }).populate('employee', 'firstName lastName email');
    console.log(`🔍 Leaves with Krishna's ID (${krishna._id}):`);
    console.log(`   Count: ${krishnaLeavesById.length}`);
    if (krishnaLeavesById.length > 0) {
      krishnaLeavesById.forEach((l, i) => {
        console.log(`   ${i + 1}. Leave ID: ${l._id}, Status: ${l.status}, Days: ${l.totalDays}, StartDate: ${l.startDate}`);
      });
    }
    console.log('');

    // Find leaves by Krishna's email (backup check)
    const krishnaLeavesByEmail = allLeaves.filter(l => l.employee?.email === 'krishna.mehra@hustle.com');
    console.log(`🔍 Leaves with Krishna's Email (krishna.mehra@hustle.com):`);
    console.log(`   Count: ${krishnaLeavesByEmail.length}`);
    if (krishnaLeavesByEmail.length > 0) {
      krishnaLeavesByEmail.forEach((l, i) => {
        console.log(`   ${i + 1}. Leave ID: ${l._id}, Employee ID: ${l.employee._id}, Status: ${l.status}, Days: ${l.totalDays}`);
      });
    }
    console.log('');

    // Show all leaves grouped by employee
    const leavesByEmployee = {};
    allLeaves.forEach(l => {
      if (l.employee) {
        const key = `${l.employee.firstName} ${l.employee.lastName} (${l.employee.email})`;
        if (!leavesByEmployee[key]) {
          leavesByEmployee[key] = [];
        }
        leavesByEmployee[key].push(l);
      }
    });

    console.log('📋 All Leaves Grouped by Employee:');
    Object.keys(leavesByEmployee).sort().forEach(empKey => {
      const empLeaves = leavesByEmployee[empKey];
      console.log(`   ${empKey}: ${empLeaves.length} leaves`);
    });

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkKrishnaLeaves();
