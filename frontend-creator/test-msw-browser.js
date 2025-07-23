// Test script to verify MSW browser setup
// This would be run in the browser console

async function testMSW() {
  console.log('Testing MSW browser setup...');
  
  try {
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login endpoint test:', loginData);
    
    // Test courses endpoint
    const coursesResponse = await fetch('http://localhost:3000/api/v1/courses');
    const coursesData = await coursesResponse.json();
    console.log('✅ Courses endpoint test:', coursesData);
    
    // Test dashboard endpoint
    const dashboardResponse = await fetch('http://localhost:3000/api/v1/dashboard/statistics');
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard endpoint test:', dashboardData);
    
    console.log('🎉 All MSW tests passed!');
    
  } catch (error) {
    console.error('❌ MSW test failed:', error);
  }
}

// Run the test
testMSW();