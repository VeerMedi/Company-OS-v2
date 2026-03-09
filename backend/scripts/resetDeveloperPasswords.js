const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    const developers = [
      { email: 'alice.frontend@test.com', password: '123456' },
      { email: 'bob.backend@test.com', password: '123456' },
      { email: 'charlie.fullstack@test.com', password: '123456' }
    ];

    for (const dev of developers) {
      const user = await User.findOne({ email: dev.email });
      if (user) {
        user.password = dev.password;
        await user.save();
        console.log(`✅ Reset password for ${user.firstName} ${user.lastName} (${dev.email})`);
      } else {
        console.log(`❌ User not found: ${dev.email}`);
      }
    }

    console.log('\n🎉 All passwords reset to: 123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetPasswords();
