---
layout: default
title: Integration Tests
---

# Integration Tests

This directory contains comprehensive integration tests for the WayrApp backend API. These tests verify the interaction between different modules, database operations, authentication flows, and error handling scenarios.

## Test Structure

### Test Files

- **`auth.integration.test.ts`** - Authentication and authorization flows
- **`content.integration.test.ts`** - Content management CRUD operations and hierarchical relationships
- **`database.integration.test.ts`** - Database connections, transactions, and data integrity
- **`crossModule.integration.test.ts`** - Cross-module interactions between users, content, and progress
- **`errorHandling.integration.test.ts`** - Error scenarios, edge cases, and error response consistency

### Test Categories

#### Authentication Tests
- User registration with validation
- Login/logout flows
- JWT token management (access and refresh tokens)
- Token expiration and revocation
- Rate limiting on auth endpoints
- Complete authentication workflow

#### Content Management Tests
- CRUD operations for all content entities (courses, levels, sections, modules, lessons)
- Hierarchical content relationships
- Authorization checks (admin, content_creator, student roles)
- Packaged content API for offline support
- Content validation and error handling
- Cascading deletes

#### Database Integration Tests
- Database connection stability
- Transaction handling (commit and rollback)
- Concurrent operations
- Data integrity constraints
- Foreign key relationships
- Query performance
- Connection pooling

#### Cross-Module Integration Tests
- User authentication with content access
- Progress tracking with lesson completion
- Content deletion impact on user progress
- User role changes affecting permissions
- Data isolation between users
- Performance across modules

#### Error Handling Tests
- Authentication and authorization errors
- Validation error consistency
- Not found and conflict errors
- Rate limiting and request size errors
- Database error handling
- Error response structure consistency
- Edge cases and error recovery

## Running Integration Tests

### Prerequisites

1. **Database Setup**: Ensure you have a test database configured
   ```bash
   # Set up your test database URL in .env
   DATABASE_URL="postgresql://username:password@localhost:5432/wayrapp_test"
   ```

2. **Environment Variables**: Copy `.env.example` to `.env` and configure test values
   ```bash
   cp .env.example .env
   ```

### Running Tests

```bash
# Run ALL backend tests (unit and integration, sequentially)
npm run test:backend

# Run ONLY unit tests
npm run test:unit

# Run ONLY integration tests (sequentially)
npm run test:integration

# Run a specific integration test file
npx jest --config jest.integration.config.js path/to/your/test/file.ts

# Run a specific integration test by name
npx jest --config jest.integration.config.js --testNamePattern="should register a new user"
```

### Test Configuration

Integration tests use a separate Jest configuration (`jest.integration.config.js`) which is **critical** as it enforces:
- **Sequential execution (`maxWorkers: 1`)** to prevent race conditions and data conflicts in the database.
- A `testMatch` pattern that only finds files ending in `.integration.test.ts`.

## Test Data Management

### Test Factories

Integration tests use factory patterns for generating test data:

```typescript
// User factory
const testUser = UserFactory.build({
  email: 'test@example.com',
  role: 'student'
});

// Content factory
const testCourse = CourseFactory.build({
  id: 'test-course-123',
  name: 'Test Course'
});
```

### Data Cleanup

Each test suite includes:
- **beforeEach**: Clean up test data before each test
- **afterAll**: Final cleanup after all tests complete
- **Unique identifiers**: Tests use unique IDs to avoid conflicts

### Database Isolation

- Tests use unique prefixes for test data (e.g., `integration-test-*`)
- Cleanup is performed before and after tests
- Foreign key relationships are properly handled during cleanup

## Test Patterns

### Authentication Pattern

```typescript
// Create test user and token
const testUser = await prisma.user.create({
  data: UserFactory.build({ email: 'test@example.com' })
});

const token = jwt.sign(
  { sub: testUser.id, email: testUser.email, role: testUser.role },
  process.env['JWT_SECRET'],
  { expiresIn: '1h' }
);

// Use token in requests
const response = await request(app)
  .get('/api/v1/users/profile')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

### Error Testing Pattern

```typescript
// Test error response structure
const response = await request(app)
  .post('/api/v1/courses')
  .send(invalidData)
  .expect(400);

expect(response.body).toMatchObject({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: expect.any(String),
    timestamp: expect.any(String),
    path: expect.any(String)
  }
});
```

### Cross-Module Testing Pattern

```typescript
// Test interaction between modules
// 1. Create content
const course = await createTestCourse();

// 2. Complete lesson as user
await request(app)
  .post(`/api/v1/progress/lesson/${lessonId}`)
  .set('Authorization', `Bearer ${userToken}`)
  .send({ score: 85 });

// 3. Verify progress was updated
const progress = await request(app)
  .get('/api/v1/progress')
  .set('Authorization', `Bearer ${userToken}`)
  .expect(200);
```

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names that explain the scenario
- Follow the AAA pattern (Arrange, Act, Assert)

### Data Management
- Always clean up test data
- Use unique identifiers to avoid conflicts
- Handle foreign key relationships properly

### Error Testing
- Test both success and failure scenarios
- Verify error response structure consistency
- Test edge cases and boundary conditions

### Performance
- Keep tests focused and fast
- Use database transactions where appropriate
- Avoid unnecessary database operations

### Maintenance
- Update tests when API changes
- Keep test data factories up to date
- Document complex test scenarios

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database URL
   echo $DATABASE_URL
   
   # Test database connection
   npm run db:test
   ```

2. **Test Timeouts**
   ```bash
   # Increase timeout in jest.integration.config.js
   testTimeout: 60000 // 60 seconds
   ```

3. **Port Conflicts**
   ```bash
   # Ensure test server uses different port
   PORT=3001 npm run test:integration
   ```

4. **Memory Issues**
   ```bash
   # Run with more memory
   NODE_OPTIONS="--max-old-space-size=4096" npm run test:integration
   ```

### Debugging Tests

```bash
# Run single test with debug output
npm run test:integration -- --testNamePattern="should register user" --verbose

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --config jest.integration.config.js --runInBand

# Enable Prisma query logging
DEBUG="prisma:query" npm run test:integration
```

## Contributing

When adding new integration tests:

1. Follow existing patterns and naming conventions
2. Include both success and failure scenarios
3. Add proper cleanup for test data
4. Update this README if adding new test categories
5. Ensure tests are deterministic and can run in any order

## Coverage Goals

Integration tests should achieve:
- **API Endpoints**: 100% of public endpoints tested
- **Authentication Flows**: All auth scenarios covered
- **Error Handling**: All error types and edge cases
- **Cross-Module Interactions**: Key integration points tested
- **Database Operations**: Transaction and constraint testing