const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const employeesToDelete = [
  { firstName: 'Aastha', lastName: 'Rathi' },
  { firstName: 'Mahati', lastName: 'Agrawal' },
  { firstName: 'Vinay', lastName: 'Patel' },
  { firstName: 'Aayushi', lastName: 'Trivedi' }
];

async function deleteEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    for (const employee of employeesToDelete) {
      const result = await User.deleteOne({ 
        firstName: employee.firstName, 
        lastName: employee.lastName 
      });
      
      if (result.deletedCount > 0) {
        console.log(`✅ Deleted: ${employee.firstName} ${employee.lastName}`);
      } else {
        console.log(`⚠️  Not found: ${employee.firstName} ${employee.lastName}`);
      }
    }
    
    console.log('\n✅ Employee deletion complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteEmployees();
