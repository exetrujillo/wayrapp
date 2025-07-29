import request from 'supertest';
import express from 'express';
import { 
  errorHandler, 
  requestLogger,
  corsOptions,
  helmetOptions,
  sanitizeInput,
  securityHeaders,
  requestSizeLimiter,
  validate
} from '../index';
import { z } from 'zod';
import helmet from 'helmet';
import cors from 'cors';

// Mock logger for tests
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    http: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Middleware Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    
    // Apply middleware in the same order as the main app
    app.use(helmet(helmetOptions));
    app.use(securityHeaders);
    app.use(cors(corsOptions));
    app.use(requestSizeLimiter);
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(sanitizeInput);
    app.use(requestLogger);

    // Test routes
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'OK' });
    });

    app.post('/test-validation', 
      validate({
        body: z.object({
          name: z.string().min(1),
          age: z.number().int().min(0)
        })
      }),
      (req, res) => {
        res.json({ message: 'Validation passed', data: req.body });
      }
    );

    app.get('/test-error', () => {
      throw new Error('Test error');
    });

    // Error handler must be last
    app.use(errorHandler);
  });

  describe('Security Headers', () => {
    it('should set security headers on responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['permissions-policy']).toBe('geolocation=(), microphone=(), camera=()');
    });

    it('should remove X-Powered-By header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize input data', async () => {
      const response = await request(app)
        .post('/test-validation')
        .send({
          name: 'John\x00Doe',
          age: 25
        })
        .expect(200);

      expect(response.body.data.name).toBe('JohnDoe');
      expect(response.body.data.age).toBe(25);
    });
  });

  describe('Validation Middleware', () => {
    it('should validate request body successfully', async () => {
      const response = await request(app)
        .post('/test-validation')
        .send({
          name: 'John Doe',
          age: 25
        })
        .expect(200);

      expect(response.body.message).toBe('Validation passed');
      expect(response.body.data).toEqual({
        name: 'John Doe',
        age: 25
      });
    });

    it('should return validation error for invalid data', async () => {
      const response = await request(app)
        .post('/test-validation')
        .send({
          name: '',
          age: 'invalid'
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const response = await request(app)
        .get('/test-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.message).toBe('Internal server error');
      expect(response.body.error.path).toBe('/test-error');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Request Size Limiting', () => {
    it('should accept requests within size limit', async () => {
      await request(app)
        .post('/test-validation')
        .send({
          name: 'John Doe',
          age: 25
        })
        .expect(200);
    });
  });
});