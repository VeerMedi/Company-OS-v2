// This script will help identify login issues
console.log('=== User Login Diagnostic ===\n');
console.log('Please check:');
console.log('1. Which email did you use to login?');
console.log('2. Are you on the correct dashboard (DeveloperDashboard vs IndividualDeveloperDashboard)?');
console.log('3. When you click Accept, check browser DevTools > Network tab');
console.log('   - Look at the request to /tasks/:id/accept');
console.log('   - Check the Authorization header');
console.log('\nAvailable test users:');
console.log('  - rahul@hustle.com (role: intern)');
console.log('  - veer@hustle.com (role: individual)');  
console.log('  - krishna@hustle.com (role: individual)');
console.log('  - mohit@hustle.com (role: individual)');
console.log('  - manager@hustlesystem.com (role: manager)');
console.log('\nPassword for all: krishna123 or 123456 or password123');
