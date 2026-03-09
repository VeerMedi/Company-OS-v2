// Test the new date parsing logic
const testNewDateHandling = () => {
  console.log('Testing new date parsing logic...\n');
  
  const dateString = '2025-10-07';
  console.log('Input date string:', dateString);
  
  // Old method (problematic)
  const oldTargetDate = new Date(dateString);
  oldTargetDate.setHours(0, 0, 0, 0);
  console.log('Old method result:', oldTargetDate);
  
  // New method (should work better)
  const [year, month, day] = dateString.split('-').map(Number);
  const newTargetDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  console.log('New method result:', newTargetDate);
  
  // Check what's in the database
  console.log('\nDatabase records show dates like:');
  console.log('Wed Oct 08 2025 00:00:00 GMT+0530 (India Standard Time)');
  
  // Test for today's date
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];
  console.log('\nToday\'s date string:', todayFormatted);
  
  const [todayYear, todayMonth, todayDay] = todayFormatted.split('-').map(Number);
  const todayLocal = new Date(todayYear, todayMonth - 1, todayDay, 0, 0, 0, 0);
  const tomorrowLocal = new Date(todayLocal);
  tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
  
  console.log('Today range (new method):');
  console.log('Start:', todayLocal);
  console.log('End:', tomorrowLocal);
};

testNewDateHandling();