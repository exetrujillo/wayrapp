/**
 * @module __tests__/integration/lesson-composite-key.integration.test
 * 
 * Lesson Composite Key Security Integration Tests
 * Tests that lesson endpoints properly enforce composite key lookups to prevent horizontal access
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../shared/database/connection';
import { UserFactory } from '../../shared/test/factories/userFactory';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Lesson Composite Key Security Integration Tests', () => {
    const API_BASE = '/api/v1';
    let adminUser: any;
    let adminToken: string;
    let testCourse: any;
    let testLevel: any;
    let testSection: any;
    let testModule1: any;
    let testModule2: any;
    let testLesson1: any;
    let testLesson2: any;

    beforeAll(async () => {
        // Create admin user
        adminUser = await prisma.user.create({
            data: {
                ...UserFactory.buildAdmin({
                    email: 'lesson-admin@example.com',
                    passwordHash: await bcrypt.hash('AdminPass123!', 10)
                })
            }
        });

        // Generate JWT token
        const jwtSecret = process.env['JWT_SECRET'] || 'test-secret';
        adminToken = jwt.sign(
            { sub: adminUser.id, email: adminUser.email, role: adminUser.role },
            jwtSecret,
            { expiresIn: '1h' }
        );

        // Create test hierarchy
        testCourse = await prisma.course.create({
            data: {
                id: 'test-comp-course',
                sourceLanguage: 'qu',
                targetLanguage: 'es',
                name: 'Test Course',
                description: 'A test course',
                isPublic: true
            }
        });

        testLevel = await prisma.level.create({
            data: {
                id: 'test-comp-level',
                courseId: testCourse.id,
                code: 'A1',
                name: 'Test Level',
                order: 1
            }
        });

        testSection = await prisma.section.create({
            data: {
                id: 'test-comp-section',
                levelId: testLevel.id,
                name: 'Test Section',
                order: 1
            }
        });

        // Create two modules
        testModule1 = await prisma.module.create({
            data: {
                id: 'test-comp-mod-1',
                sectionId: testSection.id,
                moduleType: 'basic_lesson',
                name: 'Module 1',
                order: 1
            }
        });

        testModule2 = await prisma.module.create({
            data: {
                id: 'test-comp-mod-2',
                sectionId: testSection.id,
                moduleType: 'basic_lesson',
                name: 'Module 2',
                order: 2
            }
        });

        // Create lessons in different modules
        testLesson1 = await prisma.lesson.create({
            data: {
                id: 'test-comp-lesson-1',
                moduleId: testModule1.id,
                name: 'Test Composite Lesson 1',
                experiencePoints: 10,
                order: 1
            }
        });

        testLesson2 = await prisma.lesson.create({
            data: {
                id: 'test-comp-lesson-2',
                moduleId: testModule2.id,
                name: 'Test Composite Lesson 2',
                experiencePoints: 15,
                order: 1
            }
        });
    });

    afterAll(async () => {
        // Clean up in reverse order
        await prisma.lesson.deleteMany();
        await prisma.module.deleteMany();
        await prisma.section.deleteMany();
        await prisma.level.deleteMany();
        await prisma.course.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });

    describe('GET /modules/:moduleId/lessons/:id - Composite Key Validation', () => {
        it('should return lesson when correct moduleId and lessonId are provided', async () => {
            const response = await request(app)
                .get(`${API_BASE}/modules/${testModule1.id}/lessons/${testLesson1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                id: testLesson1.id,
                module_id: testModule1.id,
                experience_points: 10,
                order: 1
            });
        });

        it('should return 404 when correct lessonId but incorrect moduleId are provided', async () => {
            // Try to access lesson1 through module2's endpoint (should fail)
            const response = await request(app)
                .get(`${API_BASE}/modules/${testModule2.id}/lessons/${testLesson1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.error.code).toBe('NOT_FOUND');
            expect(response.body.error.message).toContain(`Lesson with ID '${testLesson1.id}' not found`);
        });

        it('should return 404 when both moduleId and lessonId are incorrect', async () => {
            const response = await request(app)
                .get(`${API_BASE}/modules/non-existent-module/lessons/non-existent-lesson`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /modules/:moduleId/lessons/:id - Composite Key Validation', () => {
        it('should update lesson when correct moduleId and lessonId are provided', async () => {
            const updateData = {
                experience_points: 25,
                order: 2
            };

            const response = await request(app)
                .put(`${API_BASE}/modules/${testModule1.id}/lessons/${testLesson1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                id: testLesson1.id,
                module_id: testModule1.id,
                experience_points: 25,
                order: 2
            });
        });

        it('should return 404 when trying to update lesson with correct lessonId but incorrect moduleId', async () => {
            const updateData = {
                experience_points: 30
            };

            // Try to update lesson1 through module2's endpoint (should fail)
            const response = await request(app)
                .put(`${API_BASE}/modules/${testModule2.id}/lessons/${testLesson1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.error.code).toBe('NOT_FOUND');
            expect(response.body.error.message).toContain(`Lesson with ID '${testLesson1.id}' not found`);
        });
    });

    describe('DELETE /modules/:moduleId/lessons/:id - Composite Key Validation', () => {
        it('should return 404 when trying to delete lesson with correct lessonId but incorrect moduleId', async () => {
            // Try to delete lesson2 through module1's endpoint (should fail)
            const response = await request(app)
                .delete(`${API_BASE}/modules/${testModule1.id}/lessons/${testLesson2.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.error.code).toBe('NOT_FOUND');
            expect(response.body.error.message).toContain(`Lesson with ID '${testLesson2.id}' not found`);
        });

        it('should successfully delete lesson when correct moduleId and lessonId are provided', async () => {
            // Create a new lesson specifically for deletion test
            const lessonToDelete = await prisma.lesson.create({
                data: {
                    id: 'test-delete-lesson',
                    moduleId: testModule2.id,
                    name: 'Test Delete Lesson',
                    experiencePoints: 20,
                    order: 2
                }
            });

            await request(app)
                .delete(`${API_BASE}/modules/${testModule2.id}/lessons/${lessonToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            
            // Verify lesson is actually deleted
            const deletedLesson = await prisma.lesson.findUnique({
                where: { id: lessonToDelete.id }
            });
            expect(deletedLesson).toBeNull();
        });
    });

    describe('Cross-Module Access Prevention', () => {
        it('should prevent accessing lessons across different modules in the same section', async () => {
            // Verify that lessons exist in their respective modules
            const lesson1Response = await request(app)
                .get(`${API_BASE}/modules/${testModule1.id}/lessons/${testLesson1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const lesson2Response = await request(app)
                .get(`${API_BASE}/modules/${testModule2.id}/lessons/${testLesson2.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(lesson1Response.body.data.id).toBe(testLesson1.id);
            expect(lesson2Response.body.data.id).toBe(testLesson2.id);

            // Try cross-module access (should fail)
            await request(app)
                .get(`${API_BASE}/modules/${testModule1.id}/lessons/${testLesson2.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            await request(app)
                .get(`${API_BASE}/modules/${testModule2.id}/lessons/${testLesson1.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('should enforce composite key validation in lesson listing by module', async () => {
            // Get lessons for module1
            const module1LessonsResponse = await request(app)
                .get(`${API_BASE}/modules/${testModule1.id}/lessons`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Get lessons for module2
            const module2LessonsResponse = await request(app)
                .get(`${API_BASE}/modules/${testModule2.id}/lessons`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Verify each module only returns its own lessons
            const module1Lessons = module1LessonsResponse.body.data;
            const module2Lessons = module2LessonsResponse.body.data;

            expect(module1Lessons.every((lesson: any) => lesson.module_id === testModule1.id)).toBe(true);
            expect(module2Lessons.every((lesson: any) => lesson.module_id === testModule2.id)).toBe(true);

            // Verify no cross-contamination
            const module1LessonIds = module1Lessons.map((lesson: any) => lesson.id);
            const module2LessonIds = module2Lessons.map((lesson: any) => lesson.id);

            expect(module1LessonIds).toContain(testLesson1.id);
            expect(module1LessonIds).not.toContain(testLesson2.id);
            expect(module2LessonIds).toContain(testLesson2.id);
            expect(module2LessonIds).not.toContain(testLesson1.id);
        });
    });
});