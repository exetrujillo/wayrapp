/**
 * Content Management Integration Tests
 * Tests content CRUD operations, hierarchical relationships, and authorization
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../shared/database/connection';
import { UserFactory } from '../../shared/test/factories/userFactory';
import { CourseFactory, LevelFactory, SectionFactory, ModuleFactory } from '../../shared/test/factories/contentFactory';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Content Management Integration Tests', () => {
  const API_BASE = '/api/v1';
  let adminUser: any;
  let contentCreatorUser: any;
  let studentUser: any;
  let adminToken: string;
  let contentCreatorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    // Create test users with different roles
    adminUser = await prisma.user.create({
      data: {
        ...UserFactory.buildAdmin({
          email: 'content-admin@example.com',
          passwordHash: await bcrypt.hash('AdminPass123!', 10)
        })
      }
    });

    contentCreatorUser = await prisma.user.create({
      data: {
        ...UserFactory.buildContentCreator({
          email: 'content-creator@example.com',
          passwordHash: await bcrypt.hash('CreatorPass123!', 10)
        })
      }
    });

    studentUser = await prisma.user.create({
      data: {
        ...UserFactory.build({
          email: 'content-student@example.com',
          passwordHash: await bcrypt.hash('StudentPass123!', 10)
        })
      }
    });

    // Generate JWT tokens
    const jwtSecret = process.env['JWT_SECRET'] || 'test-secret';
    
    adminToken = jwt.sign(
      { sub: adminUser.id, email: adminUser.email, role: adminUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    contentCreatorToken = jwt.sign(
      { sub: contentCreatorUser.id, email: contentCreatorUser.email, role: contentCreatorUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { sub: studentUser.id, email: studentUser.email, role: studentUser.role },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clean up test content before each test
    await prisma.lesson.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.module.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.section.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.level.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.course.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.lesson.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.module.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.section.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.level.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.course.deleteMany({
      where: { id: { contains: 'content-integration-test' } }
    });
    await prisma.user.deleteMany({
      where: { 
        email: { 
          in: ['content-admin@example.com', 'content-creator@example.com', 'content-student@example.com'] 
        } 
      }
    });
    await prisma.$disconnect();
  });

  describe('Course Management', () => {
    describe('POST /courses', () => {
      it('should allow admin to create course', async () => {
        const courseData = CourseFactory.buildDto({
          id: 'content-integration-test-course-1',
          name: 'Test Course for Integration'
        });

        const response = await request(app)
          .post(`${API_BASE}/courses`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: courseData.id,
          name: courseData.name,
          source_language: courseData.source_language,
          target_language: courseData.target_language
        });
      });

      it('should allow content creator to create course', async () => {
        const courseData = CourseFactory.buildDto({
          id: 'content-integration-test-course-2',
          name: 'Creator Course'
        });

        const response = await request(app)
          .post(`${API_BASE}/courses`)
          .set('Authorization', `Bearer ${contentCreatorToken}`)
          .send(courseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(courseData.id);
      });

      it('should reject student creating course', async () => {
        const courseData = CourseFactory.buildDto({
          id: 'content-integration-test-course-3'
        });

        const response = await request(app)
          .post(`${API_BASE}/courses`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send(courseData)
          .expect(403);

        expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
      });

      it('should require authentication', async () => {
        const courseData = CourseFactory.buildDto({
          id: 'content-integration-test-course-4'
        });

        const response = await request(app)
          .post(`${API_BASE}/courses`)
          .send(courseData)
          .expect(401);

        expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
      });

      it('should validate course data', async () => {
        const invalidCourseData = {
          id: '', // Invalid empty ID
          source_language: 'invalid-lang-code-too-long',
          target_language: 'es',
          name: ''
        };

        const response = await request(app)
          .post(`${API_BASE}/courses`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidCourseData)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['id'] }),
            expect.objectContaining({ path: ['name'] })
          ])
        );
      });
    });

    describe('GET /courses', () => {
      beforeEach(async () => {
        // Create test courses
        await prisma.course.createMany({
          data: [
            CourseFactory.build({
              id: 'content-integration-test-course-list-1',
              name: 'Public Course 1',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'content-integration-test-course-list-2',
              name: 'Public Course 2',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'content-integration-test-course-list-3',
              name: 'Private Course',
              isPublic: false
            })
          ]
        });
      });

      it('should return paginated courses', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses`)
          .query({ limit: 2, page: 1 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeLessThanOrEqual(2);
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 2,
          total: expect.any(Number),
          totalPages: expect.any(Number)
        });
      });

      it('should filter courses by language', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses`)
          .query({ source_language: 'qu' })
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach((course: any) => {
          expect(course.source_language).toBe('qu');
        });
      });

      it('should search courses by name', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses`)
          .query({ search: 'Public Course 1' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].name).toContain('Public Course 1');
      });
    });

    describe('GET /courses/:id', () => {
      let testCourse: any;

      beforeEach(async () => {
        testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'content-integration-test-course-get',
            name: 'Test Course for Get'
          })
        });
      });

      it('should return course by ID', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses/${testCourse.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: testCourse.id,
          name: testCourse.name
        });
      });

      it('should return 404 for non-existent course', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses/non-existent-course`)
          .expect(404);

        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('PUT /courses/:id', () => {
      let testCourse: any;

      beforeEach(async () => {
        testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'content-integration-test-course-update',
            name: 'Original Course Name'
          })
        });
      });

      it('should allow admin to update course', async () => {
        const updateData = {
          name: 'Updated Course Name',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.description).toBe(updateData.description);
      });

      it('should reject student updating course', async () => {
        const updateData = { name: 'Unauthorized Update' };

        const response = await request(app)
          .put(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
      });
    });

    describe('DELETE /courses/:id', () => {
      let testCourse: any;

      beforeEach(async () => {
        testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'content-integration-test-course-delete',
            name: 'Course to Delete'
          })
        });
      });

      it('should allow admin to delete course', async () => {
        const response = await request(app)
          .delete(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify course is deleted
        const deletedCourse = await prisma.course.findUnique({
          where: { id: testCourse.id }
        });
        expect(deletedCourse).toBeNull();
      });

      it('should reject content creator deleting course', async () => {
        const response = await request(app)
          .delete(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${contentCreatorToken}`)
          .expect(403);

        expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
      });
    });
  });

  describe('Hierarchical Content Management', () => {
    let testCourse: any;
    let testLevel: any;
    let testSection: any;

    beforeEach(async () => {
      // Create hierarchical test data
      testCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'content-integration-test-hierarchy-course',
          name: 'Hierarchy Test Course'
        })
      });

      testLevel = await prisma.level.create({
        data: LevelFactory.build(testCourse.id, {
          id: 'content-integration-test-hierarchy-level',
          code: 'A1'
        })
      });

      testSection = await prisma.section.create({
        data: SectionFactory.build(testLevel.id, {
          id: 'content-integration-test-hierarchy-section'
        })
      });
    });

    describe('Level Management', () => {
      it('should create level under course', async () => {
        const levelData = {
          id: 'content-integration-test-new-level',
          code: 'A2',
          name: 'New Level',
          order: 2
        };

        const response = await request(app)
          .post(`${API_BASE}/courses/${testCourse.id}/levels`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(levelData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: levelData.id,
          course_id: testCourse.id,
          code: levelData.code
        });
      });

      it('should list levels for course', async () => {
        const response = await request(app)
          .get(`${API_BASE}/courses/${testCourse.id}/levels`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].course_id).toBe(testCourse.id);
      });

      it('should enforce unique level codes within course', async () => {
        const duplicateLevelData = {
          id: 'content-integration-test-duplicate-level',
          code: 'A1', // Same as existing level
          name: 'Duplicate Level',
          order: 3
        };

        const response = await request(app)
          .post(`${API_BASE}/courses/${testCourse.id}/levels`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(duplicateLevelData)
          .expect(409);

        expect(response.body.error.code).toBe('CONFLICT');
      });
    });

    describe('Section Management', () => {
      it('should create section under level', async () => {
        const sectionData = {
          id: 'content-integration-test-new-section',
          name: 'New Section',
          order: 2
        };

        const response = await request(app)
          .post(`${API_BASE}/levels/${testLevel.id}/sections`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(sectionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: sectionData.id,
          level_id: testLevel.id,
          name: sectionData.name
        });
      });

      it('should list sections for level', async () => {
        const response = await request(app)
          .get(`${API_BASE}/levels/${testLevel.id}/sections`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data[0].level_id).toBe(testLevel.id);
      });
    });

    describe('Module Management', () => {
      it('should create module under section', async () => {
        const moduleData = {
          id: 'content-integration-test-new-module',
          module_type: 'basic_lesson' as const,
          name: 'New Module',
          order: 1
        };

        const response = await request(app)
          .post(`${API_BASE}/sections/${testSection.id}/modules`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(moduleData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: moduleData.id,
          section_id: testSection.id,
          module_type: moduleData.module_type
        });
      });

      it('should validate module type', async () => {
        const invalidModuleData = {
          id: 'content-integration-test-invalid-module',
          module_type: 'invalid_type',
          name: 'Invalid Module',
          order: 1
        };

        const response = await request(app)
          .post(`${API_BASE}/sections/${testSection.id}/modules`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidModuleData)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Packaged Content API', () => {
    let packagedCourse: any;

    beforeEach(async () => {
      // Create complete course hierarchy for packaging
      packagedCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'content-integration-test-packaged-course',
          name: 'Packaged Course'
        })
      });

      const level = await prisma.level.create({
        data: LevelFactory.build(packagedCourse.id, {
          id: 'content-integration-test-packaged-level',
          code: 'A1'
        })
      });

      const section = await prisma.section.create({
        data: SectionFactory.build(level.id, {
          id: 'content-integration-test-packaged-section'
        })
      });

      const module = await prisma.module.create({
        data: ModuleFactory.build(section.id, {
          id: 'content-integration-test-packaged-module'
        })
      });

      await prisma.lesson.create({
        data: {
          id: 'content-integration-test-packaged-lesson',
          moduleId: module.id,
          experiencePoints: 10,
          order: 1
        }
      });
    });

    it('should return packaged course with nested content', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/${packagedCourse.id}/package`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: packagedCourse.id,
        name: packagedCourse.name
      });
      expect(response.body.data.levels).toBeInstanceOf(Array);
      expect(response.body.data.levels[0].sections).toBeInstanceOf(Array);
      expect(response.body.data.levels[0].sections[0].modules).toBeInstanceOf(Array);
      expect(response.body.data.levels[0].sections[0].modules[0].lessons).toBeInstanceOf(Array);
    });

    it('should include versioning information', async () => {
      const response = await request(app)
        .get(`${API_BASE}/courses/${packagedCourse.id}/package`)
        .expect(200);

      expect(response.body.data).toHaveProperty('last_updated');
      expect(response.body.data.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Cross-Module Integration', () => {
    it('should handle cascading deletes properly', async () => {
      // Create complete hierarchy
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'content-integration-test-cascade-course'
        })
      });

      const level = await prisma.level.create({
        data: LevelFactory.build(course.id, {
          id: 'content-integration-test-cascade-level'
        })
      });

      const section = await prisma.section.create({
        data: SectionFactory.build(level.id, {
          id: 'content-integration-test-cascade-section'
        })
      });

      // Delete course
      await request(app)
        .delete(`${API_BASE}/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify cascading delete
      const deletedLevel = await prisma.level.findUnique({
        where: { id: level.id }
      });
      const deletedSection = await prisma.section.findUnique({
        where: { id: section.id }
      });

      expect(deletedLevel).toBeNull();
      expect(deletedSection).toBeNull();
    });
  });
});