---
layout: default
title: Security
---

# Security Implementation Guide

This document outlines the security measures implemented in the WayrApp backend API to protect against common vulnerabilities and ensure data integrity.

## 1. Input Validation and Sanitization

### Zod Schema Validation

All API endpoints are protected with comprehensive Zod validation schemas to ensure data integrity and prevent malicious input. The validation schemas are organized by module:

- **Auth Schemas**: `src/shared/schemas/auth.schemas.ts`
- **User Schemas**: `src/shared/schemas/user.schemas.ts`
- **Content Schemas**: `src/shared/schemas/content.schemas.ts`
- **Progress Schemas**: `src/shared/schemas/progress.schemas.ts`

Example usage:

```typescript
// Route implementation with validation
router.post('/register', 
  validate({ body: RegisterSchema }), 
  asyncHandler(async (req, res) => {
    // Request body is already validated and typed
    const userData: RegisterRequest = req.body;
    // Implementation...
  })
);
```

### Password Security

Password requirements enforced through validation:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Passwords are never stored in plain text, only securely hashed using bcrypt with appropriate salt rounds.

### Input Sanitization

Two layers of protection against malicious input:

1. **Basic Sanitization**: Removes null bytes and control characters from all request data
   ```typescript
   // src/shared/middleware/security.ts
   export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
     // Sanitize request body, query, and params
   };
   ```

2. **XSS Protection**: Sanitizes HTML and script tags
   ```typescript
   // src/shared/middleware/xssProtection.ts
   export const xssProtection = (req: Request, _res: Response, next: NextFunction): void => {
     // Sanitize request body, query, and params using xss library
   };
   ```

## 2. Rate Limiting

Multiple rate limiters are configured to prevent abuse:

- **Default Rate Limiter**: 100 requests per 15 minutes for general API endpoints
- **Auth Rate Limiter**: 5 requests per 15 minutes for authentication endpoints
- **Custom Rate Limiters**: Can be applied to specific routes as needed

```typescript
// src/shared/middleware/security.ts
export const defaultRateLimiter = createRateLimiter(
  parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100')
);

export const authRateLimiter = createRateLimiter(
  parseInt(process.env['AUTH_RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  parseInt(process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] || '5')
);
```

Rate limits are configurable through environment variables:
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)
- `AUTH_RATE_LIMIT_WINDOW_MS`: Time window for auth endpoints (default: 15 minutes)
- `AUTH_RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window for auth endpoints (default: 5)

## 3. Request Size Limiting

Request size limits are enforced to prevent denial of service attacks:

- JSON body size limit: 10MB
- URL-encoded form data limit: 10MB
- Custom size limit middleware that checks content-length header

```typescript
// src/shared/middleware/security.ts
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const maxSize = parseInt(process.env['MAX_REQUEST_SIZE'] || '10485760'); // 10MB default
  
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    if (contentLength > maxSize) {
      // Reject request if too large
    }
  }
  
  next();
};
```

Configure with environment variable:
- `MAX_REQUEST_SIZE`: Maximum request size in bytes (default: 10MB)

## 4. Security Headers

Security headers are set using Helmet and custom middleware:

```typescript
// src/app.ts
app.use(helmet(helmetOptions));
app.use(securityHeaders);
```

- **Content-Security-Policy**: Restricts sources of executable scripts
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables browser XSS filtering
- **Referrer-Policy**: Controls information in the referer header
- **Permissions-Policy**: Restricts browser features

## 5. SQL Injection Protection

SQL injection is prevented through:

- **Prisma ORM**: All database queries use parameterized queries
- **No Raw SQL**: Direct SQL queries are avoided
- **Input Validation**: All user input is validated before database operations

## 6. CORS Protection

Cross-Origin Resource Sharing (CORS) is configured to restrict access to trusted origins:

```typescript
// src/shared/middleware/security.ts
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Additional CORS options
};
```

- Configurable through `CORS_ORIGIN` environment variable
- Supports multiple origins (comma-separated)
- Supports wildcard (*) for development environments
- Credentials mode enabled for authenticated requests

## 7. Error Handling

Secure error handling prevents information leakage:

```typescript
// src/shared/middleware/errorHandler.ts
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle different error types and return appropriate responses
};
```

- **Production vs Development**: Different error detail levels based on environment
- **Sanitized Error Messages**: User-facing error messages don't expose system details
- **Structured Error Responses**: Consistent error format with appropriate HTTP status codes
- **Detailed Logging**: Full error details logged server-side for debugging

## 8. JWT Authentication

Secure JWT implementation:

- Short-lived access tokens (15 minutes)
- Refresh token rotation
- Token blacklisting for logout
- Proper signature verification

## 9. Security Audit Tools

### Security Audit Script

A security audit script is provided to check for common security issues in the codebase:

```bash
npm run security:audit
```

The script checks for:
- Missing validation on routes
- Hardcoded secrets
- Potential XSS vulnerabilities
- Missing authentication on routes
- SQL injection vulnerabilities

### Dependency Vulnerability Scanning

Regular scanning of dependencies for known vulnerabilities:

```bash
npm run security:deps
```

## 10. Environment Variables

Security-related environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed origins for CORS (comma-separated) | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Time window for rate limiting | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window | `100` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Time window for auth endpoints | `900000` (15 minutes) |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window for auth endpoints | `5` |
| `MAX_REQUEST_SIZE` | Maximum request size in bytes | `10485760` (10MB) |

## 11. Best Practices Implementation

- **Environment Variables**: Secrets stored in environment variables, not code
- **HTTPS Only**: API designed to run behind HTTPS (enforced in production)
- **No Sensitive Data in URLs**: Sensitive data passed in request body, not URL
- **Principle of Least Privilege**: Role-based access control for all endpoints
- **Regular Security Audits**: Automated and manual security reviews
- **Secure Password Storage**: Passwords hashed with bcrypt and appropriate salt rounds
- **Input Validation**: All user input validated before processing
- **Output Encoding**: Data properly encoded when returned to clients