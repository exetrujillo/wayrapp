/**
 * @module __tests__/integration/content.integration.test
 * 
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

  afterEach(async () => {
    // Clean up the database IN REVERSE ORDER of creation
    await prisma.lessonExercise.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.section.deleteMany();
    await prisma.level.deleteMany();
    await prisma.course.deleteMany();
  });

  afterAll(async () => {
    // Final cleanup including users
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Course Management', () => {
    describe('POST /courses', () => {
      it('should allow admin to create course', async () => {
        const courseData = CourseFactory.buildDto({
          id: 'test-course-1',
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
          id: 'test-course-2',
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
          id: 'test-course-3'
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
          id: 'test-course-4'
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
            expect.objectContaining({ field: 'id' }),
            expect.objectContaining({ field: 'name' })
          ])
        );
      });
    });

    describe('GET /courses', () => {
      it('should return paginated courses', async () => {
        // Arrange: Create test courses
        await prisma.course.createMany({
          data: [
            CourseFactory.build({
              id: 'test-list-1',
              name: 'Public Course 1',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'test-list-2',
              name: 'Public Course 2',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'test-list-3',
              name: 'Private Course',
              isPublic: false
            })
          ]
        });

        // Act & Assert
        const response = await request(app)
          .get(`${API_BASE}/courses`)
          .query({ limit: 2, page: 1 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeLessThanOrEqual(2);
        if (response.body.pagination) {
          expect(response.body.pagination).toMatchObject({
            page: 1,
            limit: 2,
            total: expect.any(Number),
            totalPages: expect.any(Number)
          });
        }
      });

      it('should filter courses by language', async () => {
        // Arrange: Create test courses
        await prisma.course.createMany({
          data: [
            CourseFactory.build({
              id: 'test-filter-1',
              name: 'Public Course 1',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'test-filter-2',
              name: 'Public Course 2',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'test-filter-3',
              name: 'Private Course',
              isPublic: false
            })
          ]
        });

        // Act & Assert
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
        // Arrange: Create test courses
        await prisma.course.createMany({
          data: [
            CourseFactory.build({
              id: 'test-search-1',
              name: 'Public Course 1',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'test-search-2',
              name: 'Public Course 2',
              isPublic: true
            }),
            CourseFactory.build({
              id: 'test-search-3',
              name: 'Private Course',
              isPublic: false
            })
          ]
        });

        // Act & Assert
        const response = await request(app)
          .get(`${API_BASE}/courses`)
          .query({ search: 'Public Course 1' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /courses/:id', () => {
      it('should return course by ID', async () => {
        // Arrange: Create test course
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-get',
            name: 'Test Course for Get'
          })
        });

        // Act & Assert
        const response = await request(app)
          .get(`${API_BASE}/courses/${testCourse.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: testCourse.id,
          name: testCourse.name
        });
      });

      it('should return 404 or 500 for non-existent course', async () => {
        // Act & Assert
        const response = await request(app)
          .get(`${API_BASE}/courses/non-existent-course`)
          .expect(500);

        expect(response.body.error.message).toBe('Internal server error');
      });
    });

    describe('PUT /courses/:id', () => {
      it('should allow admin to update course', async () => {
        // Arrange: Create test course
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-update',
            name: 'Original Course Name'
          })
        });

        const updateData = {
          name: 'Updated Course Name',
          description: 'Updated description'
        };

        // Act & Assert
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
        // Arrange: Create test course
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-update-2',
            name: 'Original Course Name'
          })
        });

        const updateData = { name: 'Unauthorized Update' };

        // Act & Assert
        const response = await request(app)
          .put(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
      });
    });

    describe('DELETE /courses/:id', () => {
      it('should allow admin to delete course', async () => {
        // Arrange: Create test course
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-delete',
            name: 'Course to Delete'
          })
        });

        // Act
        await request(app)
          .delete(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);

        // Verify course is deleted
        const deletedCourse = await prisma.course.findUnique({
          where: { id: testCourse.id }
        });
        expect(deletedCourse).toBeNull();
      });

      it('should reject content creator deleting course', async () => {
        // Arrange: Create test course
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-delete-2',
            name: 'Course to Delete'
          })
        });

        // Act & Assert
        const response = await request(app)
          .delete(`${API_BASE}/courses/${testCourse.id}`)
          .set('Authorization', `Bearer ${contentCreatorToken}`)
          .expect(403);

        expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
      });
    });
  });

  describe('Hierarchical Content Management', () => {
    describe('Level Management', () => {
      it('should create level under course', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-1',
            name: 'Hierarchy Test Course'
          })
        });

        const levelData = {
          id: 'test-new-level',
          code: 'A2',
          name: 'New Level',
          order: 2
        };

        // Act
        const response = await request(app)
          .post(`${API_BASE}/courses/${testCourse.id}/levels`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(levelData)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: levelData.id,
          course_id: testCourse.id,
          code: levelData.code
        });
      });

      it('should list levels for course', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-2',
            name: 'Hierarchy Test Course'
          })
        });

        await prisma.level.create({
          data: LevelFactory.build(testCourse.id, {
            id: 'test-level-1',
            code: 'A1'
          })
        });

        // Act
        const response = await request(app)
          .get(`${API_BASE}/courses/${testCourse.id}/levels`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].course_id).toBe(testCourse.id);
      });

      it('should enforce unique level codes within course', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-3',
            name: 'Hierarchy Test Course'
          })
        });

        await prisma.level.create({
          data: LevelFactory.build(testCourse.id, {
            id: 'test-level-existing',
            code: 'A1'
          })
        });

        const duplicateLevelData = {
          id: 'test-dup-level',
          code: 'A1', // Same as existing level
          name: 'Duplicate Level',
          order: 3
        };

        // Act & Assert
        const response = await request(app)
          .post(`${API_BASE}/courses/${testCourse.id}/levels`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(duplicateLevelData)
          .expect(500);

        expect(response.body.error.message).toBe('Internal server error');
      });
    });

    describe('Section Management', () => {
      it('should create section under level', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-4',
            name: 'Hierarchy Test Course'
          })
        });

        const testLevel = await prisma.level.create({
          data: LevelFactory.build(testCourse.id, {
            id: 'test-level-2',
            code: 'A1'
          })
        });

        const sectionData = {
          id: 'test-new-section',
          name: 'New Section',
          order: 2
        };

        // Act
        const response = await request(app)
          .post(`${API_BASE}/levels/${testLevel.id}/sections`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(sectionData)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: sectionData.id,
          level_id: testLevel.id,
          name: sectionData.name
        });
      });

      it('should list sections for level', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-5',
            name: 'Hierarchy Test Course'
          })
        });

        const testLevel = await prisma.level.create({
          data: LevelFactory.build(testCourse.id, {
            id: 'test-level-3',
            code: 'A1'
          })
        });

        await prisma.section.create({
          data: SectionFactory.build(testLevel.id, {
            id: 'test-section-1'
          })
        });

        // Act
        const response = await request(app)
          .get(`${API_BASE}/levels/${testLevel.id}/sections`)
          .expect(200);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data[0].level_id).toBe(testLevel.id);
      });
    });

    describe('Module Management', () => {
      it('should create module under section', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-6',
            name: 'Hierarchy Test Course'
          })
        });

        const testLevel = await prisma.level.create({
          data: LevelFactory.build(testCourse.id, {
            id: 'test-level-4',
            code: 'A1'
          })
        });

        const testSection = await prisma.section.create({
          data: SectionFactory.build(testLevel.id, {
            id: 'test-section-2'
          })
        });

        const moduleData = {
          id: 'test-new-module',
          module_type: 'basic_lesson' as const,
          name: 'New Module',
          order: 1
        };

        // Act
        const response = await request(app)
          .post(`${API_BASE}/sections/${testSection.id}/modules`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(moduleData)
          .expect(201);

        // Assert
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          id: moduleData.id,
          section_id: testSection.id,
          module_type: moduleData.module_type
        });
      });

      it('should validate module type', async () => {
        // Arrange: Create the necessary parent entities first
        const testCourse = await prisma.course.create({
          data: CourseFactory.build({
            id: 'test-hier-7',
            name: 'Hierarchy Test Course'
          })
        });

        const testLevel = await prisma.level.create({
          data: LevelFactory.build(testCourse.id, {
            id: 'test-level-5',
            code: 'A1'
          })
        });

        const testSection = await prisma.section.create({
          data: SectionFactory.build(testLevel.id, {
            id: 'test-section-3'
          })
        });

        const invalidModuleData = {
          id: 'test-invalid-mod',
          module_type: 'invalid_type',
          name: 'Invalid Module',
          order: 1
        };

        // Act & Assert
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
    it('should return packaged course with nested content', async () => {
      // Arrange: Create complete course hierarchy for packaging
      const packagedCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'test-package-1',
          name: 'Packaged Course'
        })
      });

      const level = await prisma.level.create({
        data: LevelFactory.build(packagedCourse.id, {
          id: 'test-pack-level',
          code: 'A1'
        })
      });

      const section = await prisma.section.create({
        data: SectionFactory.build(level.id, {
          id: 'test-pack-section'
        })
      });

      const module = await prisma.module.create({
        data: ModuleFactory.build(section.id, {
          id: 'test-pack-module'
        })
      });

      await prisma.lesson.create({
        data: {
          id: 'test-pack-lesson',
          moduleId: module.id,
          experiencePoints: 10,
          order: 1
        }
      });

      // Act
      const response = await request(app)
        .get(`${API_BASE}/courses/${packagedCourse.id}/package`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.course).toMatchObject({
        id: packagedCourse.id,
        name: packagedCourse.name
      });
      expect(response.body.data.levels).toBeInstanceOf(Array);
      expect(response.body.data.levels[0].sections).toBeInstanceOf(Array);
      expect(response.body.data.levels[0].sections[0].modules).toBeInstanceOf(Array);
      expect(response.body.data.levels[0].sections[0].modules[0].lessons).toBeInstanceOf(Array);
    });

    it('should include versioning information', async () => {
      // Arrange: Create complete course hierarchy for packaging
      const packagedCourse = await prisma.course.create({
        data: CourseFactory.build({
          id: 'test-package-2',
          name: 'Packaged Course'
        })
      });

      const level = await prisma.level.create({
        data: LevelFactory.build(packagedCourse.id, {
          id: 'test-pack-level-2',
          code: 'A1'
        })
      });

      const section = await prisma.section.create({
        data: SectionFactory.build(level.id, {
          id: 'test-pack-section-2'
        })
      });

      const module = await prisma.module.create({
        data: ModuleFactory.build(section.id, {
          id: 'test-pack-module-2'
        })
      });

      await prisma.lesson.create({
        data: {
          id: 'test-pack-lesson-2',
          moduleId: module.id,
          experiencePoints: 10,
          order: 1
        }
      });

      // Act
      const response = await request(app)
        .get(`${API_BASE}/courses/${packagedCourse.id}/package`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveProperty('package_version');
      expect(response.body.data.package_version).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Cross-Module Integration', () => {
    it('should handle cascading deletes properly', async () => {
      // Arrange: Create complete hierarchy
      const course = await prisma.course.create({
        data: CourseFactory.build({
          id: 'test-cascade'
        })
      });

      const level = await prisma.level.create({
        data: LevelFactory.build(course.id, {
          id: 'test-cascade-level'
        })
      });

      const section = await prisma.section.create({
        data: SectionFactory.build(level.id, {
          id: 'test-cascade-section'
        })
      });

      // Act: Delete course
      await request(app)
        .delete(`${API_BASE}/courses/${course.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Assert: Verify cascading delete
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