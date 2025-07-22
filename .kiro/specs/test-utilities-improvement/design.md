# Design Document: Test Utilities Improvement

## Overview

Based on the test run results, we've identified several issues with the current testing approach in the WayrApp monorepo. This design document outlines a comprehensive plan to improve the test utilities and establish consistent testing patterns across the entire codebase, including backend API, frontend applications, and shared components.

## Architecture

The improved testing architecture will consist of:

1. **Enhanced Test Utilities**: A set of type-safe utility functions for creating mock objects
2. **Test Patterns Library**: A collection of reusable patterns for common testing scenarios
3. **Test Fixtures**: Pre-configured test data for different testing scenarios
4. **Test Helpers**: Additional helper functions for common testing tasks

## Components and Interfaces

### 1. Enhanced Test Utilities

#### Mock Request Utility
```typescript
/**
 * Create a mock Express request object with proper typing
 */
export function createMockRequest<
  P = Record<string, any>,
  B = Record<string, any>,
  Q = Record<string, any>
>(overrides: Partial<Request<P, any, B, Q>> = {}): Partial<Request<P, any, B, Q>> {
  return {
    body: {} as B,
    params: {} as P,
    query: {} as Q,
    headers: {},
    path: '/test-path',
    method: 'GET',
    ip: '127.0.0.1',
    get: jest.fn((header: string) => header === 'User-Agent' ? 'Test User Agent' : undefined),
    user: {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'student' as UserRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    },
    ...overrides,
  };
}
```

#### Mock Response Utility
```typescript
/**
 * Create a mock Express response object with proper typing
 */
export function createMockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.locals = {};
  res.headersSent = false;
  return res as Response;
}
```

#### Mock Prisma Client Utility
```typescript
/**
 * Create a mock Prisma client with proper typing and methods
 */
export function createMockPrismaClient(): DeepMockProxy<PrismaClient> {
  const mockClient = mockDeep<PrismaClient>();
  
  // Add common mock implementations
  mockClient.$connect.mockResolvedValue(undefined);
  mockClient.$disconnect.mockResolvedValue(undefined);
  
  return mockClient;
}
```

### 2. Test Patterns Library

#### Controller Test Pattern
```typescript
/**
 * Standard pattern for controller tests
 */
export function setupControllerTest<T>(controller: T) {
  const mockRequest = createMockRequest();
  const mockResponse = createMockResponse();
  const mockNext = jest.fn();
  
  return {
    controller,
    mockRequest,
    mockResponse,
    mockNext,
    // Helper to reset mocks between tests
    reset: () => {
      jest.clearAllMocks();
      Object.assign(mockRequest, createMockRequest());
      Object.assign(mockResponse, createMockResponse());
      mockNext.mockReset();
    }
  };
}
```

#### Service Test Pattern
```typescript
/**
 * Standard pattern for service tests
 */
export function setupServiceTest<T>(service: T, mockRepository: any) {
  return {
    service,
    mockRepository,
    // Helper to reset mocks between tests
    reset: () => {
      jest.clearAllMocks();
    }
  };
}
```

### 3. Test Fixtures

```typescript
/**
 * User test fixtures
 */
export const userFixtures = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    role: 'student' as UserRole,
    is_active: true,
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01')
  },
  adminUser: {
    id: 'admin-123',
    email: 'admin@example.com',
    username: 'adminuser',
    password_hash: 'hashed_password',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin' as UserRole,
    is_active: true,
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01')
  }
};
```

### 4. Test Helpers

```typescript
/**
 * Helper to mock date for consistent testing
 */
export function mockDate(date: Date = new Date('2025-01-01T00:00:00Z')) {
  const RealDate = Date;
  
  class MockDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) {
        super(date);
      } else {
        super(...args);
      }
    }
    
    static now() {
      return date.getTime();
    }
  }
  
  global.Date = MockDate as DateConstructor;
  
  return {
    restore: () => {
      global.Date = RealDate;
    }
  };
}

/**
 * Helper to mock JWT functions
 */
export function mockJwt() {
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn().mockImplementation((token, secret) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }
      return {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
    })
  }));
  
  return {
    restore: () => {
      jest.unmock('jsonwebtoken');
    }
  };
}
```

## Data Models

No new data models are required for this feature. The existing types and interfaces will be used.

## Error Handling

The improved test utilities will include better error handling:

1. **Type Safety**: All utilities will be properly typed to catch type errors at compile time
2. **Clear Error Messages**: When tests fail, the error messages should be clear and helpful
3. **Consistent Error Handling**: All tests should handle errors in a consistent way

## Testing Strategy

The testing strategy for this feature will involve:

1. **Unit Tests**: Each utility function will have its own unit tests
2. **Integration Tests**: The utilities will be tested together to ensure they work correctly
3. **Example Tests**: Example tests will be provided to demonstrate how to use the utilities
4. **Documentation**: Comprehensive documentation will be provided for all utilities

## Implementation Considerations

### Type Safety

All test utilities must be properly typed to catch type errors at compile time. This includes:

- Using generics where appropriate
- Using proper type assertions
- Avoiding `any` types where possible

### Consistency

All test utilities should follow a consistent pattern:

- Naming conventions
- Function signatures
- Return types
- Error handling

### Performance

The test utilities should be optimized for performance:

- Minimize unnecessary object creation
- Reuse objects where possible
- Avoid deep cloning where not needed

### Maintainability

The test utilities should be designed for maintainability:

- Clear documentation
- Simple, focused functions
- Consistent patterns
- Easy to extend

## Common Test Failures and Solutions

Based on the test run results, we've identified several common test failures:

1. **Type Errors**: Issues with type compatibility between mock objects and expected types
   - Solution: Properly type all mock objects and use generics where appropriate

2. **Missing Mock Implementations**: Functions like `mockRejectedValueOnce` not available on mocks
   - Solution: Ensure all mocks are created with Jest mock functions

3. **Inconsistent Date Handling**: Tests failing due to date/time differences
   - Solution: Use a consistent date mocking strategy

4. **XSS Protection Issues**: Tests expecting sanitized output but getting raw or differently sanitized output
   - Solution: Ensure XSS protection middleware is properly tested and mock sanitization functions

5. **Pagination Issues**: Tests expecting pagination properties that don't exist
   - Solution: Ensure pagination middleware properly adds pagination properties to request objects

6. **Unimplemented Functions**: Tests failing because functions are not implemented
   - Solution: Implement all required functions or properly mock them