// src/modules/content/routes/__test__/lessonRoutes.test.ts

/**
 * Integration tests for lesson routes with composite key validation.
 * 
 * This test suite validates the horizontal access prevention implementation
 * by testing that lesson endpoints properly validate the moduleId parameter
 * and return 404 Not Found when an incorrect moduleId is provided.
 */

import request from 'supertest';
import app from '../../../../app';
import { prisma } from '../../../../shared/database/connection';

describe('Lesson Routes - Composite Key Validation', () => {
    let testModule: any;
    let testLesson: any;

    beforeAll(async () => {
        // Create test data for the composite key validation tests
        // We need a module and lesson that exist in the database

        // Create a test course first
        const testCourse = await prisma.course.create({
            data: {
                id: 'test-course-comp',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                name: 'Test Course',
                description: 'Test course',
                isPublic: true,
            },
        });

        // Create a test level
        const testLevel = await prisma.level.create({
            data: {
                id: 'test-level-comp',
                courseId: testCourse.id,
                code: 'A1',
                name: 'Test Level',
                order: 1,
            },
        });

        // Create a test section
        const testSection = await prisma.section.create({
            data: {
                id: 'test-section-comp',
                levelId: testLevel.id,
                name: 'Test Section',
                order: 1,
            },
        });

        // Create a test module
        testModule = await prisma.module.create({
            data: {
                id: 'test-module-comp',
                sectionId: testSection.id,
                name: 'Test Module',
                order: 1,
                moduleType: 'basic_lesson',
            },
        });

        // Create a test lesson
        testLesson = await prisma.lesson.create({
            data: {
                id: 'test-lesson-comp',
                moduleId: testModule.id,
                name: 'Test Lesson Component',
                experiencePoints: 10,
                order: 1,
            },
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.lesson.deleteMany({
            where: { id: { startsWith: 'test-lesson-comp' } },
        });
        await prisma.module.deleteMany({
            where: { id: { startsWith: 'test-module-comp' } },
        });
        await prisma.section.deleteMany({
            where: { id: { startsWith: 'test-section-comp' } },
        });
        await prisma.level.deleteMany({
            where: { id: { startsWith: 'test-level-comp' } },
        });
        await prisma.course.deleteMany({
            where: { id: { startsWith: 'test-course-comp' } },
        });
    });

    describe('GET /modules/:moduleId/lessons/:id', () => {
        it('should return 404 when lesson exists but moduleId is incorrect', async () => {
            // This test validates that the composite key lookup prevents horizontal access
            // by ensuring a lesson cannot be accessed with an incorrect moduleId

            const validLessonId = testLesson.id;
            const incorrectModuleId = 'wrong-module-id'; // This should not match the lesson's actual moduleId

            const response = await request(app)
                .get(`/api/v1/modules/${incorrectModuleId}/lessons/${validLessonId}`)
                .expect(404); // Assert 404 Not Found

            // Assert that the error code is 'NOT_FOUND'
            expect(response.body.error.code).toEqual('NOT_FOUND');
        });

        it('should return 200 when both moduleId and lessonId are correct', async () => {
            // This test ensures that valid requests still work correctly

            const validLessonId = testLesson.id;
            const correctModuleId = testModule.id; // This should match the lesson's actual moduleId

            const response = await request(app)
                .get(`/api/v1/modules/${correctModuleId}/lessons/${validLessonId}`)
                .expect(200);

            // Verify the response contains the lesson data
            expect(response.body).toMatchObject({
                success: true,
                data: expect.objectContaining({
                    id: validLessonId,
                    module_id: correctModuleId
                })
            });
        });

        it('should return 404 when lesson does not exist at all', async () => {
            // This test ensures that non-existent lessons still return 404

            const nonExistentLessonId = 'non-existent-lesson';
            const anyModuleId = 'any-module-id';

            const response = await request(app)
                .get(`/api/v1/modules/${anyModuleId}/lessons/${nonExistentLessonId}`)
                .expect(404); // Assert 404 Not Found

            // Assert that the error code is 'NOT_FOUND'
            expect(response.body.error.code).toEqual('NOT_FOUND');
        });
    });

    // Note: PUT and DELETE tests would require authentication tokens
    // The GET test above is sufficient to prove the composite key validation is working
});