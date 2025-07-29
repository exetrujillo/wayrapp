/**
 * User Routes Integration Tests
 */

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import userRoutes from '../userRoutes';
import { errorHandler } from '../../../../shared/middleware/errorHandler';

const mockGetUserProfile = jest.fn();
const mockUpdateUser = jest.fn();
const mockFindAll = jest.fn();
const mockUpdatePassword = jest.fn();
const mockUserExists = jest.fn();

jest.mock('../../services/userService', () => {
  return {
    UserService: jest.fn().mockImplementation(() => {
      return {
        getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
        updateUser: (...args: any[]) => mockUpdateUser(...args),
        findAll: (...args: any[]) => mockFindAll(...args),
        updatePassword: (...args: any[]) => mockUpdatePassword(...args),
        userExists: (...args: any[]) => mockUserExists(...args),
      };
    }),
  };
});

jest.mock('../../../../shared/middleware/auth', () => ({
  authenticateToken: jest.fn((req: Request, _res: Response, next: NextFunction) => {
    req.user = { sub: 'user-123', email: 'test@example.com', role: 'student', iat: 1, exp: 9999999999 };
    next();
  }),
  requireRole: jest.fn((roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (userRole && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  }),
}));

jest.mock('../../../../shared/middleware/validation', () => ({
  validate: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

jest.mock('../../../../shared/middleware/security', () => ({
  authRateLimiter: jest.fn((_req: Request, _res: Response, next: NextFunction) => next()),
}));


describe('User Routes', () => {
  let app: express.Application;
  const { authenticateToken } = require('../../../../shared/middleware/auth');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockGetUserProfile.mockResolvedValue(mockUser as any);

      const response = await request(app).get('/api/users/profile').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({ id: 'user-123' }));
      expect(mockGetUserProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { username: 'newusername' };
      const updatedUser = { id: 'user-123', username: 'newusername' };
      mockUpdateUser.mockResolvedValue(updatedUser as any);

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toEqual('Profile updated successfully');
      expect(response.body.data.username).toBe('newusername');
    });
  });
  
  describe('PUT /api/users/password', () => {
    it('should update password successfully', async () => {
      const passwordData = { current_password: 'oldPassword123!', new_password: 'newPassword456!' };
      mockUpdatePassword.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/users/password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');
      expect(response.body.data.message).toBe('Password updated successfully');
    });

    it('should apply rate limiting to password update endpoint', async () => {
      // Mock the authRateLimiter to simulate rate limit exceeded
      const { authRateLimiter } = require('../../../../shared/middleware/security');
      authRateLimiter.mockImplementation((_req: Request, res: Response, _next: NextFunction) => {
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: 'Too many requests from this IP, please try again later.',
            timestamp: new Date().toISOString(),
            path: '/api/users/password'
          }
        });
      });

      const passwordData = { current_password: 'oldPassword123!', new_password: 'newPassword456!' };

      const response = await request(app)
        .put('/api/users/password')
        .send(passwordData)
        .expect(429);

      expect(response.body.error.code).toBe('RATE_LIMIT_ERROR');
      expect(response.body.error.message).toBe('Too many requests from this IP, please try again later.');
      
      // Verify that the rate limiter was called
      expect(authRateLimiter).toHaveBeenCalled();
    });
  });

  describe('GET /api/users', () => {
    it('should return users list for admin', async () => {
      authenticateToken.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
        req.user = { sub: 'admin-123', email: 'admin@test.com', role: 'admin', iat: 1, exp: 1 };
        next();
      });

      const mockUsers = { data: [{ id: 'user-1' }], pagination: {} };
      mockFindAll.mockResolvedValue(mockUsers as any);

      const response = await request(app).get('/api/users').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
    });

     it('should return 403 for non-admin user', async () => {
      authenticateToken.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
        req.user = { sub: 'user-123', email: 'test@example.com', role: 'student', iat: 1, exp: 1 };
        next();
      });
      await request(app).get('/api/users').expect(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for admin', async () => {
      authenticateToken.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
        req.user = { sub: 'admin-123', email: 'admin@test.com', role: 'admin', iat: 1, exp: 1 };
        next();
      });

      const mockUser = { id: 'user-456' };
      mockGetUserProfile.mockResolvedValue(mockUser as any);

      const response = await request(app).get('/api/users/user-456').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-456');
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role for admin', async () => {
      authenticateToken.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
        req.user = { sub: 'admin-123', email: 'admin@test.com', role: 'admin', iat: 1, exp: 1 };
        next();
      });

      const updatedUser = { id: 'user-456', role: 'admin' };
      mockUpdateUser.mockResolvedValue(updatedUser as any);

      const response = await request(app)
        .put('/api/users/user-456/role')
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toEqual('User role updated successfully');
      expect(response.body.data.role).toBe('admin');
    });
  });
});