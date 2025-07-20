/**
 * User Routes Integration Tests
 * Integration tests for user management endpoints
 */

import request from 'supertest';
import express from 'express';
import userRoutes from '../userRoutes';
import { errorHandler } from '../../../../shared/middleware/errorHandler';

// Mock the authentication middleware
jest.mock('../../../../shared/middleware/auth', () => ({
  // SECURITY_AUDIT_TODO: Mock JWT tokens with hardcoded values pose security risks in tests.
  // Risk: Using predictable/hardcoded JWT timestamps (iat: 1234567890, exp: 9999999999) could lead to 
  // security issues if these values are accidentally used in production or if tests don't properly validate 
  // token expiration logic. The exp value is set to year 2286 which bypasses expiration checks.
  // Remediation: Use dynamic timestamps and test token expiration scenarios explicitly.
  authenticateToken: jest.fn((req: any, _res: any, next: any) => {
    // Default mock user (student)
    req.user = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'student',
      iat: 1234567890,
      exp: 9999999999
    };
    next();
  }),
  requireRole: jest.fn((roles: any) => (req: any, res: any, next: any) => {
    const userRole = req.user?.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  })
}));

// Mock validation middleware
jest.mock('../../../../shared/middleware/validation', () => ({
  validate: jest.fn(() => (_req: any, _res: any, next: any) => next())
}));

// Mock UserRepository and UserService
jest.mock('../../repositories/userRepository');
jest.mock('../../services/userService');

describe('User Routes', () => {
  let app: express.Application;
  const { authenticateToken } = require('../../../../shared/middleware/auth');

  beforeAll(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset to default student user
    authenticateToken.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: 1234567890,
        exp: 9999999999
      };
      next();
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock the service method
      const { UserService } = require('../../services/userService');
      UserService.prototype.getUserProfile = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com'
      }));
    });

    it('should return 401 for unauthenticated request', async () => {
      // Mock authenticateToken to not set user
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'newusername',
        country_code: 'CA'
      };

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'newusername',
        country_code: 'CA',
        registration_date: new Date(),
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      const { UserService } = require('../../services/userService');
      UserService.prototype.updateUser = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('newusername');
      expect(response.body.data.country_code).toBe('CA');
    });

    it('should return 401 for unauthenticated request', async () => {
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app)
        .put('/api/users/profile')
        .send({ username: 'newusername' })
        .expect(401);
    });
  });

  describe('PUT /api/users/password', () => {
    it('should update password successfully', async () => {
      // SECURITY_AUDIT_TODO: Hardcoded passwords in test data pose security risks.
      // Risk: Using real-looking passwords in tests could lead to developers accidentally using 
      // similar patterns in production, or these passwords being committed to version control.
      // Remediation: Use clearly fake test passwords or generate random test data.
      const passwordData = {
        current_password: 'oldPassword123!',
        new_password: 'newPassword456!'
      };

      const { UserService } = require('../../services/userService');
      UserService.prototype.updatePassword = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .put('/api/users/password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Password updated successfully');
    });

    it('should return 401 for unauthenticated request', async () => {
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app)
        .put('/api/users/password')
        // SECURITY_AUDIT_TODO: Hardcoded passwords in test data pose security risks.
        // Risk: Using real-looking passwords in tests could lead to developers accidentally using 
        // similar patterns in production, or these passwords being committed to version control.
        // Remediation: Use clearly fake test passwords or generate random test data.
        .send({
          current_password: 'oldPassword123!',
          new_password: 'newPassword456!'
        })
        .expect(401);
    });
  });

  describe('GET /api/users', () => {
    it('should return users list for admin', async () => {
      // Mock admin user
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: 1234567890,
          exp: 9999999999
        };
        next();
      });

      const mockUsers = {
        data: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            username: 'user1',
            role: 'student',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      const { UserService } = require('../../services/userService');
      UserService.prototype.findAll = jest.fn().mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      // Keep default student user
      await request(app)
        .get('/api/users')
        .expect(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Authentication required' });
      });

      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should handle query parameters correctly', async () => {
      // Mock admin user
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: 1234567890,
          exp: 9999999999
        };
        next();
      });

      const mockUsers = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: true
        }
      };

      const { UserService } = require('../../services/userService');
      UserService.prototype.findAll = jest.fn().mockResolvedValue(mockUsers);

      await request(app)
        .get('/api/users')
        .query({
          page: '2',
          limit: '10',
          sortBy: 'email',
          sortOrder: 'asc',
          role: 'admin',
          is_active: 'true',
          search: 'test'
        })
        .expect(200);

      expect(UserService.prototype.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'asc',
        filters: {
          role: 'admin',
          is_active: true,
          search: 'test'
        }
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for admin', async () => {
      // Mock admin user
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: 1234567890,
          exp: 9999999999
        };
        next();
      });

      const mockUser = {
        id: 'user-456',
        email: 'user456@example.com',
        username: 'user456',
        role: 'student',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const { UserService } = require('../../services/userService');
      UserService.prototype.getUserProfile = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/user-456')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-456');
    });

    it('should return 403 for non-admin user', async () => {
      // Keep default student user
      await request(app)
        .get('/api/users/user-456')
        .expect(403);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role for admin', async () => {
      // Mock admin user
      authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: 1234567890,
          exp: 9999999999
        };
        next();
      });

      const updatedUser = {
        id: 'user-456',
        email: 'user456@example.com',
        username: 'user456',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const { UserService } = require('../../services/userService');
      UserService.prototype.userExists = jest.fn().mockResolvedValue(true);
      UserService.prototype.updateUser = jest.fn().mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/user-456/role')
        .send({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');
    });

    it('should return 403 for non-admin user', async () => {
      // Keep default student user
      await request(app)
        .put('/api/users/user-456/role')
        .send({ role: 'admin' })
        .expect(403);
    });
  });
});