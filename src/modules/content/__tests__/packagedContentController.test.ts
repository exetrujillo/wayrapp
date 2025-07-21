import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ContentController } from '../controllers';
import { HttpStatus } from '../../../shared/types';

// Mock the logger to avoid console output during tests
jest.mock('../../../shared/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  }
}));

describe('Packaged Content Controller', () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let contentController: ContentController;

  beforeAll(() => {
    prisma = new PrismaClient();
    contentController = new ContentController(prisma);
    
    app = express();
    app.use(express.json());
    
    // Set up the route
    app.get('/api/courses/:id/package', contentController.getPackagedCourse);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/courses/:id/package', () => {
    const mockPackagedCourse = {
      course: {
        id: 'test-course-001',
        source_language: 'en',
        target_language: 'es',
        name: 'Test Course',
        description: 'Test Description',
        is_public: true,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z')
      },
      levels: [],
      package_version: '2024-01-02T00:00:00.000Z'
    };

    const expectedResponseData = {
      course: {
        id: 'test-course-001',
        source_language: 'en',
        target_language: 'es',
        name: 'Test Course',
        description: 'Test Description',
        is_public: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z'
      },
      levels: [],
      package_version: '2024-01-02T00:00:00.000Z'
    };

    beforeEach(() => {
      // Mock the service method
      jest.spyOn(contentController['contentService'], 'getPackagedCourse')
        .mockResolvedValue(mockPackagedCourse);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return packaged course with correct headers', async () => {
      const response = await request(app)
        .get('/api/courses/test-course-001/package')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResponseData);
      
      // Check caching headers
      expect(response.headers['last-modified']).toBeDefined();
      expect(response.headers['cache-control']).toBe('public, max-age=900');
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return 304 Not Modified when content hasnt changed', async () => {
      // Mock service to return null (indicating not modified)
      jest.spyOn(contentController['contentService'], 'getPackagedCourse')
        .mockResolvedValue(null);

      const response = await request(app)
        .get('/api/courses/test-course-001/package')
        .set('If-Modified-Since', 'Wed, 03 Jan 2024 00:00:00 GMT')
        .expect(HttpStatus.NOT_MODIFIED);

      expect(response.body).toEqual({});
    });

    it('should handle If-Modified-Since header correctly', async () => {
      const response = await request(app)
        .get('/api/courses/test-course-001/package')
        .set('If-Modified-Since', 'Mon, 01 Jan 2024 00:00:00 GMT')
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResponseData);
    });

    it('should return 404 for missing course ID', async () => {
      await request(app)
        .get('/api/courses//package')
        .expect(HttpStatus.NOT_FOUND); // Express returns 404 for empty params

      // This test verifies that the route pattern works correctly
    });

    it('should handle service errors gracefully', async () => {
      // Mock service to throw an error
      jest.spyOn(contentController['contentService'], 'getPackagedCourse')
        .mockRejectedValue(new Error('Course not found'));

      await request(app)
        .get('/api/courses/non-existent/package')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      // The error should be handled by the error middleware
      // In a real app, this would return a proper error response
    });
  });
});