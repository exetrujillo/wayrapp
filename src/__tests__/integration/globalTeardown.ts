/**
 * @module __tests__/integration/globalTeardown
 * 
 * Global Teardown for Integration Tests
 * Runs once after all integration tests complete
 * 
 * @author Exequiel Trujillo
 * 
 * @since 1.0.0
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up after integration tests...');
  
  try {
    // Any global cleanup can be done here
    // For example, cleaning up test databases, stopping test servers, etc.
    
    console.log('✅ Integration test cleanup complete');
  } catch (error) {
    console.error('❌ Integration test cleanup failed:', error);
    // Don't throw here as tests have already completed
  }
}