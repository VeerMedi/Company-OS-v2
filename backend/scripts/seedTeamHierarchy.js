const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Task = require('../models/Task');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedTeamHierarchy = async () => {
  try {
    console.log('\n🌱 Seeding Hierarchical Team Structure...\n');

    // ========================================
    // STEP 1: Create/Update Manager
    // ========================================
    console.log('👔 Creating Manager...');
    
    let manager = await User.findOne({ email: 'sourabh@hustle.com' });
    
    if (manager) {
      // Update existing manager
      manager.firstName = 'Sourabh';
      manager.lastName = 'Singh';
      manager.role = 'manager';
      manager.designation = 'Manager';
      manager.department = 'Management';
      manager.reportingTo = null; // Reports to CEO if exists
      await manager.save();
      console.log('   ✓ Updated existing manager: Sourabh Singh');
    } else {
      // Create new manager
      manager = new User({
        firstName: 'Sourabh',
        lastName: 'Singh',
        email: 'sourabh@hustle.com',
        password: 'krishna123',
        role: 'manager',
        designation: 'Manager',
        department: 'Management',
        dateOfBirth: new Date('1988-05-15'),
        phoneNumber: '+919876543200',
        reportingTo: null
      });
      await manager.save();
      console.log('   ✓ Created manager: Sourabh Singh (MGR001)');
    }

    // ========================================
    // STEP 2: Create Team Lead
    // ========================================
    console.log('\n👨‍💼 Creating Team Lead...');
    
    // Delete existing if necessary
    await User.deleteOne({ email: 'sourabh.tl@hustle.com' });
    
    const teamLead = new User({
      firstName: 'Sourabh',
      lastName: 'TL',
      email: 'sourabh.tl@hustle.com',
      password: 'krishna123',
      role: 'team-lead',
      designation: 'Team Lead',
      department: 'Development',
      dateOfBirth: new Date('1990-03-20'),
      phoneNumber: '+919876543201',
      reportingTo: manager._id,
      skills: ['Team Management', 'Project Planning', 'Code Review']
    });
    await teamLead.save();
    console.log(`   ✓ Created team lead: ${teamLead.fullName || teamLead.firstName} (${teamLead.employeeId}) - Reports to: ${manager.fullName}`);

    // ========================================
    // STEP 3: Create Developers
    // ========================================
    console.log('\n💻 Creating Developers...');
    
    // Delete existing developers
    await User.deleteMany({
      email: { $in: ['veer@hustle.com', 'krishna.mehra@hustle.com'] }
    });
    
    // Developer 1: Veer Singh
    const veerSingh = new User({
      firstName: 'Veer',
      lastName: 'Singh',
      email: 'veer@hustle.com',
      password: 'krishna123',
      role: 'developer',
      designation: 'Developer',
      department: 'Development',
      dateOfBirth: new Date('1994-05-22'),
      phoneNumber: '+919876543202',
      reportingTo: teamLead._id,
      specializations: ['AI Dev', 'Fullstack', 'DevOps'],
      skills: ['AI/ML', 'Python', 'Automation', 'OpenAI', 'Vector Databases', 'Machine Learning', 'Docker', 'Kubernetes']
    });
    await veerSingh.save();
    console.log(`   ✓ Created developer: Veer Singh (${veerSingh.employeeId})`);
    console.log(`      Specializations: ${veerSingh.specializations.join(', ')}`);
    console.log(`      Reports to: ${teamLead.fullName}`);
    
    // Developer 2: Krishna Mehra
    const krishnaMehra = new User({
      firstName: 'Krishna',
      lastName: 'Mehra',
      email: 'krishna.mehra@hustle.com',
      password: 'krishna123',
      role: 'developer',
      designation: 'Developer',
      department: 'Development',
      dateOfBirth: new Date('1995-08-10'),
      phoneNumber: '+919876543203',
      reportingTo: teamLead._id,
      specializations: ['Backend', 'Fullstack'],
      skills: ['Node.js', 'MongoDB', 'Express', 'React', 'JavaScript', 'Full-Stack', 'REST API', 'Database Design']
    });
    await krishnaMehra.save();
    console.log(`   ✓ Created developer: Krishna Mehra (${krishnaMehra.employeeId})`);
    console.log(`      Specializations: ${krishnaMehra.specializations.join(', ')}`);
    console.log(`      Reports to: ${teamLead.fullName}`);

    // ========================================
    // STEP 4: Create Interns
    // ========================================
    console.log('\n🎓 Creating Interns...');
    
    // Delete existing interns
    await User.deleteMany({
      email: { $in: ['rahul@hustle.com', 'mohit.sharma@hustle.com'] }
    });
    
    // Intern 1: Rahul Nema (under Veer Singh)
    const rahulNema = new User({
      firstName: 'Rahul',
      lastName: 'Nema',
      email: 'rahul@hustle.com',
      password: 'krishna123',
      role: 'intern',
      designation: 'Intern',
      department: 'Development',
      dateOfBirth: new Date('1998-01-15'),
      phoneNumber: '+919876543204',
      reportingTo: veerSingh._id,
      specializations: ['AI Dev', 'Fullstack'],
      skills: ['AI/ML', 'Python', 'Automation', 'LangChain', 'RAG Systems', 'OpenAI', 'React', 'JavaScript']
    });
    await rahulNema.save();
    console.log(`   ✓ Created intern: Rahul Nema (${rahulNema.employeeId})`);
    console.log(`      Specializations: ${rahulNema.specializations.join(', ')}`);
    console.log(`      Reports to (Mentor): ${veerSingh.fullName}`);
    
    // Intern 2: Mohit Sharma (under Krishna Mehra)
    const mohitSharma = new User({
      firstName: 'Mohit',
      lastName: 'Sharma',
      email: 'mohit.sharma@hustle.com',
      password: 'krishna123',
      role: 'intern',
      designation: 'Intern',
      department: 'Development',
      dateOfBirth: new Date('1999-11-25'),
      phoneNumber: '+919876543205',
      reportingTo: krishnaMehra._id,
      specializations: ['Frontend', 'Fullstack'],
      skills: ['React', 'JavaScript', 'CSS', 'HTML5', 'UI/UX', 'Node.js', 'Express']
    });
    await mohitSharma.save();
    console.log(`   ✓ Created intern: Mohit Sharma (${mohitSharma.employeeId})`);
    console.log(`      Specializations: ${mohitSharma.specializations.join(', ')}`);
    console.log(`      Reports to (Mentor): ${krishnaMehra.fullName}`);

    // ========================================
    // STEP 5: Update Mentorship Relationships
    // ========================================
    console.log('\n🤝 Setting up mentorship relationships...');
    
    veerSingh.mentorFor = [rahulNema._id];
    await veerSingh.save();
    console.log(`   ✓ Veer Singh is now mentoring Rahul Nema`);
    
    krishnaMehra.mentorFor = [mohitSharma._id];
    await krishnaMehra.save();
    console.log(`   ✓ Krishna Mehra is now mentoring Mohit Sharma`);

    // ========================================
    // STEP 6: Display Team Structure
    // ========================================
    console.log('\n\n📊 TEAM HIERARCHY STRUCTURE:');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`\n${manager.fullName} (${manager.designation} - ${manager.employeeId})`);
    console.log(`└── ${teamLead.fullName} (${teamLead.designation} - ${teamLead.employeeId})`);
    console.log(`    ├── ${veerSingh.fullName} (${veerSingh.designation} - ${veerSingh.employeeId})`);
    console.log(`    │   ├── Specializations: ${veerSingh.specializations.join(', ')}`);
    console.log(`    │   └── ${rahulNema.fullName} (${rahulNema.designation} - ${rahulNema.employeeId})`);
    console.log(`    │       └── Specializations: ${rahulNema.specializations.join(', ')}`);
    console.log(`    └── ${krishnaMehra.fullName} (${krishnaMehra.designation} - ${krishnaMehra.employeeId})`);
    console.log(`        ├── Specializations: ${krishnaMehra.specializations.join(', ')}`);
    console.log(`        └── ${mohitSharma.fullName} (${mohitSharma.designation} - ${mohitSharma.employeeId})`);
    console.log(`            └── Specializations: ${mohitSharma.specializations.join(', ')}`);
    
    console.log('\n\n🔑 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════');
    console.log(`Manager:     sourabh@hustle.com / krishna123`);
    console.log(`Team Lead:   sourabh.tl@hustle.com / krishna123`);
    console.log(`Developer 1: veer@hustle.com / krishna123`);
    console.log(`Developer 2: krishna.mehra@hustle.com / krishna123`);
    console.log(`Intern 1:    rahul@hustle.com / krishna123`);
    console.log(`Intern 2:    mohit.sharma@hustle.com / krishna123`);
    
    console.log('\n✅ Team hierarchy seeded successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding team hierarchy:', error);
    process.exit(1);
  }
};

// Run the seed function
(async () => {
  await connectDB();
  await seedTeamHierarchy();
})();
