# WayrApp API Documentation

## Table of Contents

- [Database Setup](DATABASE_SETUP.md) - Database configuration and migration guide
- [Authentication](AUTHENTICATION.md) - Registration, Login, Token Management
- [Users](USERS.md) - User Profile Management, Admin User Operations
- [Content](CONTENT.md) - Courses, Levels, Sections, Modules Management
- [Lessons & Exercises](LESSONS_EXERCISES.md) - Lesson Management and Exercise Assignment
- [Progress](PROGRESS.md) - Progress Tracking and Analytics
- [Packaged Content API](PACKAGED_CONTENT_API.md) - Offline Support Implementation Guide

## Base URL
All API endpoints are prefixed with `/api`

## Consistent Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    // Response data here
  }
}
```

For error responses:
```json
{
  "success": false,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      // Error details here
    }
  }
}
```

## Pagination

For paginated responses, pagination information is included in response headers:
- `X-Total-Count`: Total number of items
- `X-Total-Pages`: Total number of pages
- `X-Current-Page`: Current page number
- `X-Has-Next`: Whether there are more pages
- `X-Has-Prev`: Whether there are previous pages

Standard pagination query parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Field to sort by
- `sortOrder` (optional): Sort order (asc/desc)

## Authentication Security Features

### Password Security
- Passwords are hashed using bcrypt before storage
- Password requirements enforced:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### JWT Authentication
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Refresh tokens can be revoked on logout
- Blacklisted tokens are stored in the database

### Role-Based Access Control
- Three user roles: student, content_creator, admin
- Granular permissions system for each role
- Resource ownership validation for user-specific resources

### Security Measures
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS protection
- Secure HTTP headers

## HTTP Status Codes

The API uses standard HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `304 Not Modified` - Resource not modified (for conditional requests)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate ID)
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Error Codes

The API uses specific error codes for different types of errors:

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `INTERNAL_ERROR` - Internal server error
- `DATABASE_ERROR` - Database operation failed
- `RATE_LIMIT_ERROR` - Rate limit exceeded

## Rate Limiting

API endpoints have different rate limits based on their usage patterns:

- **Authentication endpoints**: 5 requests per minute per IP
- **Content creation endpoints**: 10 requests per minute per user
- **General read endpoints**: 100 requests per minute per user
- **Progress tracking**: 50 requests per minute per user

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Content Hierarchy

The WayrApp content follows a hierarchical structure:

```
Course
├── Level (A1, A2, B1, etc.)
│   └── Section (Topics within a level)
│       └── Module (Learning units)
│           └── Lesson (Individual lessons)
│               └── Exercise (Practice activities)
```

### Content Relationships
- **Courses** contain multiple **Levels**
- **Levels** contain multiple **Sections** 
- **Sections** contain multiple **Modules**
- **Modules** contain multiple **Lessons**
- **Lessons** can have multiple **Exercises** (many-to-many relationship)
- **Exercises** are reusable across different lessons

## Offline Support

The API provides comprehensive offline support through:

### Packaged Content API
- **Complete course packages** with all nested content
- **Versioning support** with last-modified timestamps
- **Conditional requests** using If-Modified-Since headers
- **HTTP caching** with appropriate cache headers

### Progress Synchronization
- **Offline progress tracking** with local storage
- **Batch synchronization** of multiple completions
- **Conflict resolution** for duplicate entries
- **Timestamp-based** precedence for data conflicts

## Development Guidelines

### API Design Principles
- **RESTful conventions** for endpoint design
- **Consistent naming** across all endpoints
- **Comprehensive validation** for all inputs
- **Detailed error messages** for debugging
- **Extensive documentation** with examples

### Testing Requirements
- **Unit tests** for all service methods
- **Integration tests** for API endpoints
- **Authentication tests** for protected routes
- **Validation tests** for input schemas
- **Error handling tests** for edge cases

### Security Best Practices
- **Input sanitization** for all user data
- **SQL injection prevention** through Prisma ORM
- **XSS protection** with proper encoding
- **CSRF protection** for state-changing operations
- **Secure headers** for all responses