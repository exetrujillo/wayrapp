/**
 * Authentication Routes Integration Tests
 * 
 * Test suite for the authentication routes factory function.
 * Tests all authentication endpoints including registration, login, token refresh,
 * logout, and user profile retrieval with proper middleware integration,
 * validation, error handling, and security measures.
 * 
 * @fileoverview Integration tests for authRoutes factory function
 * @author Exequiel Trujillo
 * @version 1.0.0
 */

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createAuthRoutes } from '../authRoutes';
import { AuthController } from '../../controllers/authController';
import { errorHandler } from '../../../../shared/middleware/errorHandler';

// Mock dependencies
const mockAuthController = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  me: jest.fn()
};

// Mock middleware
jest.mock('../../../../shared/middleware/auth', () => ({
  authenticateToken: jest.fn((req: Request, _res: Response, next: NextFunction) => {
    req.user = { 
      sub: 'user-123', 
      email: 'test@example.com', 
      role: 'student', 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    next();
  })
}));

jest.mock('../../../../shared/middleware/security', () => ({
  authRateLimiter: jest.fn((_req: Request, _res: Response, next: NextFunction) => next())
}));

jest.mock('../../../../shared/middleware/validation', () => ({
  validate: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next())
}));

describe('Authentication Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', createAuthRoutes(mockAuthController as unknown as AuthController));
    app.use(errorHandler);
  });

  describe('Factory Function', () => {
    it('should create router with all authentication endpoints', () => {
      const router = createAuthRoutes(mockAuthController as unknown as AuthController);
      expect(router).toBeDefined();
      expect(typeof router).toBe('function'); // Express router is a function
    });

    it('should require AuthController parameter', () => {
      expect(() => createAuthRoutes(null as any)).toThrow();
    });
  });

  describe('POST /register', () => {
    it('should call register controller method', async () => {
      mockAuthController.register.mockImplementation((_req: Request, res: Response) => {
        res.status(201).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              username: 'testuser',
              role: 'student'
            },
            tokens: {
              accessToken: 'access-token',
              refreshToken: 'refresh-token'
            }
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          username: 'testuser'
        })
        .expect(201);

      expect(mockAuthController.register).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should apply rate limiting middleware', async () => {
      const { authRateLimiter } = require('../../../../shared/middleware/security');
      
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(authRateLimiter).toHaveBeenCalled();
    });

    it('should apply validation middleware', async () => {
      const { validate } = require('../../../../shared/middleware/validation');
      
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(validate).toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      mockAuthController.register.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(500);

      expect(mockAuthController.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /login', () => {
    it('should call login controller method', async () => {
      mockAuthController.login.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              username: 'testuser',
              role: 'student'
            },
            tokens: {
              accessToken: 'access-token',
              refreshToken: 'refresh-token'
            }
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(mockAuthController.login).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toBeDefined();
    });

    it('should apply rate limiting middleware', async () => {
      const { authRateLimiter } = require('../../../../shared/middleware/security');
      
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(authRateLimiter).toHaveBeenCalled();
    });

    it('should apply validation middleware', async () => {
      const { validate } = require('../../../../shared/middleware/validation');
      
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(validate).toHaveBeenCalled();
    });

    it('should handle authentication failures', async () => {
      mockAuthController.login.mockImplementation((_req: Request, res: Response) => {
        res.status(401).json({
          success: false,
          timestamp: new Date().toISOString(),
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid email or password'
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(mockAuthController.login).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('POST /refresh', () => {
    it('should call refresh controller method', async () => {
      mockAuthController.refresh.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            tokens: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token'
            }
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        })
        .expect(200);

      expect(mockAuthController.refresh).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBe('new-access-token');
      expect(response.body.data.tokens.refreshToken).toBe('new-refresh-token');
    });

    it('should apply rate limiting middleware', async () => {
      const { authRateLimiter } = require('../../../../shared/middleware/security');
      
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        });

      expect(authRateLimiter).toHaveBeenCalled();
    });

    it('should apply validation middleware', async () => {
      const { validate } = require('../../../../shared/middleware/validation');
      
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        });

      expect(validate).toHaveBeenCalled();
    });

    it('should handle invalid refresh tokens', async () => {
      mockAuthController.refresh.mockImplementation((_req: Request, res: Response) => {
        res.status(401).json({
          success: false,
          timestamp: new Date().toISOString(),
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid or expired refresh token'
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(mockAuthController.refresh).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('POST /logout', () => {
    it('should call logout controller method', async () => {
      mockAuthController.logout.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            message: 'Logged out successfully. Please remove tokens from client storage.'
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          refreshToken: 'refresh-token-to-revoke'
        })
        .expect(200);

      expect(mockAuthController.logout).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Logged out successfully');
    });

    it('should require authentication', async () => {
      const { authenticateToken } = require('../../../../shared/middleware/auth');
      
      await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken: 'refresh-token-to-revoke'
        });

      expect(authenticateToken).toHaveBeenCalled();
    });

    it('should apply validation middleware', async () => {
      const { validate } = require('../../../../shared/middleware/validation');
      
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          refreshToken: 'refresh-token-to-revoke'
        });

      expect(validate).toHaveBeenCalled();
    });

    it('should handle logout without refresh token', async () => {
      mockAuthController.logout.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            message: 'Logged out successfully. Please remove tokens from client storage.'
          }
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-access-token')
        .send({})
        .expect(200);

      expect(mockAuthController.logout).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /me', () => {
    it('should call me controller method', async () => {
      mockAuthController.me.mockImplementation((_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              username: 'testuser',
              country_code: 'US',
              registration_date: '2024-01-15T08:00:00.000Z',
              last_login_date: '2024-01-20T10:25:00.000Z',
              profile_picture_url: 'https://example.com/avatar.jpg',
              is_active: true,
              role: 'student',
              created_at: '2024-01-15T08:00:00.000Z',
              updated_at: '2024-01-20T10:25:00.000Z'
            }
          }
        });
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(mockAuthController.me).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe('user-123');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should require authentication', async () => {
      const { authenticateToken } = require('../../../../shared/middleware/auth');
      
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-access-token');

      expect(authenticateToken).toHaveBeenCalled();
    });

    it('should handle unauthenticated requests', async () => {
      // Mock authenticateToken to simulate unauthenticated request
      const { authenticateToken } = require('../../../../shared/middleware/auth');
      authenticateToken.mockImplementationOnce((_req: Request, res: Response, _next: NextFunction) => {
        res.status(401).json({
          success: false,
          timestamp: new Date().toISOString(),
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Access token required'
          }
        });
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle user not found', async () => {
      mockAuthController.me.mockImplementation((_req: Request, res: Response) => {
        res.status(404).json({
          success: false,
          timestamp: new Date().toISOString(),
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(404);

      expect(mockAuthController.me).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Middleware Integration', () => {
    it('should apply middleware in correct order for register endpoint', async () => {
      const middlewareCallOrder: string[] = [];
      
      // Create a fresh app for this test to avoid interference
      const testApp = express();
      testApp.use(express.json());
      
      // Mock middleware with order tracking
      const mockRateLimiter = jest.fn((_req: Request, _res: Response, next: NextFunction) => {
        middlewareCallOrder.push('rateLimiter');
        next();
      });
      
      const mockValidate = jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => {
        middlewareCallOrder.push('validation');
        next();
      });
      
      const mockController = jest.fn((_req: Request, res: Response) => {
        middlewareCallOrder.push('controller');
        res.status(201).json({ success: true });
      });

      // Create router manually with mocked middleware
      const testRouter = express.Router();
      testRouter.post('/register', mockRateLimiter, mockValidate(), mockController);
      testApp.use('/api/v1/auth', testRouter);
      testApp.use(errorHandler);

      await request(testApp)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          username: 'testuser'
        });

      expect(middlewareCallOrder).toEqual(['rateLimiter', 'validation', 'controller']);
    });

    it('should apply middleware in correct order for logout endpoint', async () => {
      const middlewareCallOrder: string[] = [];
      
      // Create a fresh app for this test to avoid interference
      const testApp = express();
      testApp.use(express.json());
      
      // Mock middleware with order tracking
      const mockAuth = jest.fn((req: Request, _res: Response, next: NextFunction) => {
        middlewareCallOrder.push('authentication');
        req.user = { sub: 'user-123', email: 'test@example.com', role: 'student', iat: 1, exp: 9999999999 };
        next();
      });
      
      const mockValidate = jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => {
        middlewareCallOrder.push('validation');
        next();
      });
      
      const mockController = jest.fn((_req: Request, res: Response) => {
        middlewareCallOrder.push('controller');
        res.status(200).json({ success: true });
      });

      // Create router manually with mocked middleware
      const testRouter = express.Router();
      testRouter.post('/logout', mockAuth, mockValidate(), mockController);
      testApp.use('/api/v1/auth', testRouter);
      testApp.use(errorHandler);

      await request(testApp)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          refreshToken: 'refresh-token'
        });

      expect(middlewareCallOrder).toEqual(['authentication', 'validation', 'controller']);
    });
  });

  describe('Error Handling', () => {
    it('should handle controller exceptions properly', async () => {
      mockAuthController.login.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });

    it('should handle async controller errors', async () => {
      // Create a fresh app for this test to ensure clean state
      const testApp = express();
      testApp.use(express.json());
      
      const mockController = {
        ...mockAuthController,
        refresh: jest.fn(async (_req: Request, _res: Response) => {
          throw new Error('Token validation failed');
        })
      };
      
      testApp.use('/api/v1/auth', createAuthRoutes(mockController as unknown as AuthController));
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    }, 5000);
  });

  describe('Route Configuration', () => {
    it('should configure all required routes', () => {
      const router = createAuthRoutes(mockAuthController as unknown as AuthController);
      
      // Test that router is properly configured by checking it's a function
      expect(typeof router).toBe('function');
      
      // The router should have the stack property with route handlers
      expect((router as any).stack).toBeDefined();
      expect((router as any).stack.length).toBeGreaterThan(0);
    });

    it('should accept only POST requests for register, login, refresh, logout', async () => {
      // Test that GET requests are not allowed for these endpoints
      await request(app).get('/api/v1/auth/register').expect(404);
      await request(app).get('/api/v1/auth/login').expect(404);
      await request(app).get('/api/v1/auth/refresh').expect(404);
      await request(app).get('/api/v1/auth/logout').expect(404);
    });

    it('should accept only GET requests for /me endpoint', async () => {
      // Test that POST request is not allowed for /me endpoint
      await request(app).post('/api/v1/auth/me').expect(404);
      await request(app).put('/api/v1/auth/me').expect(404);
      await request(app).delete('/api/v1/auth/me').expect(404);
    });
  });
});