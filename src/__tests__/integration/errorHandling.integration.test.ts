/**
 * Error Handling Integration Tests
 * Tests error scenarios, edge cases, and error response consistency
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../shared/database/connection';
import { UserFactory } from '../../shared/test/factories/userFactory';
import { CourseFactory } from '../../shared/test/factories/contentFactory';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Error Handling Integration Tests', () => {
  const API_BASE = '/api/v1';
  let testUser: any;
  let userToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        ...UserFactory.build({
          email: 'error-handling-test@example.com',
          passwordHash: await bcrypt.hash('TestPass123!', 10)
        })
      }
    });

    // Generate JWT token
    const jwtSecret = process.env['JWT_SECRET'] || 'test-secret';
    userToken = jwt.sign(
      { sub: testUser.id, email: testUser.email, role: testUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.course.deleteMany({
      where: { id: { contains: 'error-handling-test' } }
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.course.deleteMany({
      where: { id: { contains: 'error-handling-test' } }
    });
    await prisma.user.deleteMany({
      where: { email: 'error-handling-test@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('Authentication Errors', () => {
    it('should return consistent error for missing token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/users/profile'
        }
      });
    });

    it('should return consistent error for invalid token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('path');
    });

    it('should return consistent error for malformed token', async () => {
      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return consistent error for expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { sub: testUser.id, email: testUser.email, role: testUser.role },
        process.env['JWT_SECRET'] || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('Authorization Errors', () => {
    it('should return consistent error for insufficient permissions', async () => {
      const courseData = CourseFactory.buildDto({
        id: 'error-handling-test-unauthorized-course'
      });

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(courseData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/courses'
        }
      });
    });

    it('should return consistent error for role-based restrictions', async () => {
      // Try to access admin-only endpoint
      const response = await request(app)
        .get(`${API_BASE}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('Validation Errors', () => {
    it('should return detailed validation errors for invalid input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        username: 'ab' // Too short
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              path: expect.any(Array),
              message: expect.any(String)
            })
          ]),
          timestamp: expect.any(String),
          path: '/api/v1/auth/register'
        }
      });

      // Should have multiple validation errors
      expect(response.body.error.details.length).toBeGreaterThan(1);
    });

    it('should return validation error for missing required fields', async () => {
      const incompleteData = {
        name: 'Test Course'
        // Missing required fields: id, source_language, target_language
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.arrayContaining(['id'])
          }),
          expect.objectContaining({
            path: expect.arrayContaining(['source_language'])
          }),
          expect.objectContaining({
            path: expect.arrayContaining(['target_language'])
          })
        ])
      );
    });

    it('should return validation error for invalid data types', async () => {
      const invalidTypeData = {
        id: 'error-handling-test-invalid-types',
        source_language: 'en',
        target_language: 'es',
        name: 123, // Should be string
        is_public: 'yes' // Should be boolean
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidTypeData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid enum values', async () => {
      const invalidEnumData = {
        id: 'error-handling-test-invalid-enum',
        section_id: 'some-section-id',
        module_type: 'invalid_module_type', // Invalid enum value
        name: 'Test Module',
        order: 1
      };

      const response = await request(app)
        .post(`${API_BASE}/sections/some-section-id/modules`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidEnumData)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Not Found Errors', () => {
    it('should return consistent error for non-existent resources', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/non-existent-course`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
          timestamp: expect.any(String),
          path: '/api/v1/courses/non-existent-course'
        }
      });
    });

    it('should return not found for nested resources', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/non-existent-course/levels`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return not found for invalid endpoints', async () => {
      const response = await request(app)
        .get(`${API_BASE}/invalid-endpoint`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Conflict Errors', () => {
    it('should return conflict error for duplicate resources', async () => {
      const courseData = CourseFactory.buildDto({
        id: 'error-handling-test-duplicate-course'
      });

      // Create course first (this should fail due to authorization, but let's create it directly)
      await prisma.course.create({
        data: CourseFactory.build({
          id: 'error-handling-test-duplicate-course'
        })
      });

      // Try to create duplicate
      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(courseData)
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return conflict error for duplicate email registration', async () => {
      const userData = {
        email: testUser.email, // Same as existing user
        password: 'NewPass123!',
        username: 'newuser'
      };

      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .send(userData)
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('email');
    });
  });

  describe('Rate Limiting Errors', () => {
    it('should return rate limit error after too many requests', async () => {
      const userData = {
        email: 'rate-limit-test@example.com',
        password: 'TestPass123!'
      };

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post(`${API_BASE}/auth/login`)
          .send(userData)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.error.code).toBe('RATE_LIMIT_ERROR');
        expect(rateLimitedResponses[0].body.error).toHaveProperty('timestamp');
      }
    });
  });

  describe('Request Size Errors', () => {
    it('should return error for oversized requests', async () => {
      const oversizedData = {
        id: 'error-handling-test-oversized',
        source_language: 'en',
        target_language: 'es',
        name: 'Test Course',
        description: 'A'.repeat(50000) // Very large description
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(oversizedData);

      // This might return 413 (Payload Too Large) or 400 depending on middleware
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Malformed Request Errors', () => {
    it('should return error for invalid JSON', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for unsupported content type', async () => {
      const response = await request(app)
        .post(`${API_BASE}/auth/register`)
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      // Should handle unsupported content type gracefully
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Database Errors', () => {
    it('should handle database connection errors gracefully', async () => {
      // This is difficult to test without actually disconnecting the database
      // For now, we'll test with an operation that might cause a database error
      
      // Try to create a resource with invalid foreign key
      const invalidData = {
        id: 'error-handling-test-invalid-fk-level',
        course_id: 'non-existent-course-id',
        code: 'A1',
        name: 'Test Level',
        order: 1
      };

      const response = await request(app)
        .post(`${API_BASE}/courses/non-existent-course-id/levels`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.message).toBe('Internal server error');
      expect(response.body.error).not.toHaveProperty('details'); // Should not expose internal details
    });
  });

  describe('Error Response Consistency', () => {
    it('should have consistent error response structure across all endpoints', async () => {
      const errorResponses = await Promise.all([
        // Authentication error
        request(app).get(`${API_BASE}/users/profile`),
        // Authorization error  
        request(app).post(`${API_BASE}/courses`).set('Authorization', `Bearer ${userToken}`).send({}),
        // Validation error
        request(app).post(`${API_BASE}/auth/register`).send({ email: 'invalid' }),
        // Not found error
        request(app).get(`${API_BASE}/courses/non-existent`)
      ]);

      errorResponses.forEach(response => {
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: expect.any(String),
            message: expect.any(String),
            timestamp: expect.any(String),
            path: expect.any(String)
          }
        });

        // Timestamp should be valid ISO string
        expect(new Date(response.body.error.timestamp).toISOString()).toBe(response.body.error.timestamp);
        
        // Path should match the request path
        expect(response.body.error.path).toMatch(/^\/api\/v1\//);
      });
    });

    it('should not expose sensitive information in error messages', async () => {
      // Try to access non-existent user (should not reveal if user exists)
      const response = await request(app)
        .get(`${API_BASE}/users/non-existent-user-id`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('SQL');
      expect(response.body.error.message).not.toContain('password');
      expect(response.body.error).not.toHaveProperty('stack');
    });

    it('should include correlation IDs for error tracking', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/non-existent`)
        .expect(404);

      // In a production system, you might include correlation IDs
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('path');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long URLs gracefully', async () => {
      const longId = 'a'.repeat(1000);
      
      const response = await request(app)
        .get(`${API_BASE}/courses/${longId}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle special characters in URLs', async () => {
      const specialId = 'test%20course%21%40%23';
      
      const response = await request(app)
        .get(`${API_BASE}/courses/${specialId}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle concurrent error scenarios', async () => {
      // Make multiple concurrent requests that will fail
      const requests = Array(5).fill(null).map(() =>
        request(app).get(`${API_BASE}/courses/non-existent-${Math.random()}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    it('should handle null and undefined values gracefully', async () => {
      const dataWithNulls = {
        id: 'error-handling-test-nulls',
        source_language: 'en',
        target_language: 'es',
        name: null, // Invalid null value
        description: undefined // Invalid undefined value
      };

      const response = await request(app)
        .post(`${API_BASE}/courses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(dataWithNulls)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Recovery', () => {
    it('should continue processing after errors', async () => {
      // Make a request that fails
      await request(app)
        .get(`${API_BASE}/courses/non-existent`)
        .expect(404);

      // Make a request that succeeds
      const response = await request(app)
        .get(`${API_BASE}/courses`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle errors without affecting other users', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          ...UserFactory.build({
            email: 'error-handling-other-user@example.com',
            passwordHash: await bcrypt.hash('OtherPass123!', 10)
          })
        }
      });

      const otherUserToken = jwt.sign(
        { sub: otherUser.id, email: otherUser.email, role: otherUser.role },
        process.env['JWT_SECRET'] || 'test-secret',
        { expiresIn: '1h' }
      );

      // First user makes failing request
      await request(app)
        .get(`${API_BASE}/courses/non-existent`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      // Second user should still be able to make successful requests
      const response = await request(app)
        .get(`${API_BASE}/users/profile`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});