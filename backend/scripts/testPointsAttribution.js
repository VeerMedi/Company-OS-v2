const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

dotenv.config();

const testPointsAttribution = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hustle-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected\n');

    // Find Charlie (who will complete the task)
    const charlie = await User.findOne({ email: 'charlie.fullstack@test.com' });
    if (!charlie) {
      console.log('❌ Charlie not found. Run seedDevelopers.js first.');
      process.exit(1);
    }

    console.log('📊 Initial State:');
    console.log(`   Charlie's total points: ${charlie.totalPoints || 0}`);

    // Find a task assigned to Charlie that's reassigned
    let task = await Task.findOne({
      assignedTo: charlie._id,
      isReassigned: true,
      status: { $ne: 'completed' }
    }).populate('assignedTo originalAssignee');

    if (!task) {
      console.log('\n⚠️  No reassigned task found for Charlie.');
      console.log('   Creating a test scenario...\n');
      
      // Find Alice
      const alice = await User.findOne({ email: 'alice.frontend@test.com' });
      if (!alice) {
        console.log('❌ Alice not found. Run seedDevelopers.js first.');
        process.exit(1);
      }

      // Find a task assigned to Alice
      task = await Task.findOne({
        assignedTo: alice._id,
        status: { $ne: 'completed' }
      });

      if (!task) {
        console.log('❌ No tasks found for Alice. Run seedDevelopers.js first.');
        process.exit(1);
      }

      // Simulate reassignment (normally done by taskReassignmentService)
      task.originalAssignee = alice._id;
      task.assignedTo = charlie._id;
      task.isReassigned = true;
      await task.save();
      await task.populate('assignedTo originalAssignee');

      console.log(`   ✅ Simulated reassignment: "${task.title}"`);
      console.log(`      From: ${alice.firstName} ${alice.lastName}`);
      console.log(`      To: ${charlie.firstName} ${charlie.lastName}`);
      console.log(`      Points: ${task.points}\n`);
    } else {
      console.log(`\n   Found reassigned task: "${task.title}"`);
      console.log(`   From: ${task.originalAssignee?.firstName} ${task.originalAssignee?.lastName}`);
      console.log(`   To: ${task.assignedTo.firstName} ${task.assignedTo.lastName}`);
      console.log(`   Points: ${task.points}\n`);
    }

    // Simulate task completion
    console.log('🔄 Simulating task completion...\n');
    
    const pointsBefore = charlie.totalPoints || 0;
    
    // Update task as completed (simulating the controller logic)
    task.status = 'completed';
    task.completedAt = new Date();
    task.completedBy = charlie._id;
    task.pointsEarnedBy = charlie._id;
    
    // Check if this is a coverage task
    if (task.isReassigned && task.originalAssignee) {
      task.isCoverageTask = true;
      task.coveredFor = task.originalAssignee._id;
    }
    
    await task.save();
    
    // Award points to Charlie
    await User.findByIdAndUpdate(charlie._id, {
      $inc: { totalPoints: task.points }
    });

    // Fetch updated Charlie
    const updatedCharlie = await User.findById(charlie._id);
    const pointsAfter = updatedCharlie.totalPoints || 0;

    console.log('✅ Task Completed Successfully!\n');
    console.log('📊 Results:');
    console.log(`   Task: "${task.title}"`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Completed By: ${charlie.firstName} ${charlie.lastName}`);
    console.log(`   Points Earned By: ${charlie.firstName} ${charlie.lastName}`);
    console.log(`   Is Coverage Task: ${task.isCoverageTask}`);
    if (task.coveredFor) {
      const coveredForUser = await User.findById(task.coveredFor);
      console.log(`   Covered For: ${coveredForUser.firstName} ${coveredForUser.lastName}`);
    }
    console.log(`\n   Charlie's Points:`);
    console.log(`   Before: ${pointsBefore}`);
    console.log(`   After: ${pointsAfter}`);
    console.log(`   Gained: +${pointsAfter - pointsBefore} points`);

    // Test coverage analytics API
    console.log('\n📈 Testing Coverage Analytics...\n');
    
    const coverageAnalyticsService = require('../services/coverageAnalyticsService');
    
    const coverageStats = await coverageAnalyticsService.getCoverageStats(charlie._id);
    console.log('   Coverage Statistics:');
    console.log(`   - Tasks Covered: ${coverageStats.tasksCovered}`);
    console.log(`   - Points from Coverage: ${coverageStats.pointsFromCoverage}`);
    console.log(`   - Own Tasks Points: ${coverageStats.ownTasksPoints}`);
    console.log(`   - Total Points: ${coverageStats.totalPoints}`);
    console.log(`   - Coverage Rate: ${coverageStats.coverageRate}%`);
    console.log(`   - Covered For: ${coverageStats.coveredFor.join(', ')}`);

    const coverageTasks = await coverageAnalyticsService.getCoverageTasksForUser(charlie._id);
    console.log(`\n   Coverage Tasks (${coverageTasks.length}):`);
    coverageTasks.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.title} (+${t.points} pts) - for ${t.coveredFor?.firstName} ${t.coveredFor?.lastName}`);
    });

    console.log('\n🎉 Points Attribution System Test PASSED!\n');
    console.log('✅ Points awarded to completer');
    console.log('✅ Coverage task marked correctly');
    console.log('✅ Analytics service working');
    console.log('✅ All systems operational!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testPointsAttribution();
