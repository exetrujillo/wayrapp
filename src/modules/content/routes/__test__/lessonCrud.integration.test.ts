// src/modules/content/routes/__test__/lessonCrud.integration.test.ts

import request from 'supertest';
import app from '../../../../app';
import { TestFactory } from '../../../../shared/test/factories/testFactory';

const prisma = TestFactory.prisma;

describe('Lesson CRUD with Name and Description Fields', () => {

  // Limpia la base de datos ANTES de cada test.
  // Esto garantiza que cada 'it' se ejecute en un entorno limpio y aislado.
  beforeEach(async () => {
    await TestFactory.cleanupDatabase();
  });

  // Limpia y desconecta la base de datos DESPUÉS de que todos los tests de este archivo hayan terminado.
  afterAll(async () => {
    await TestFactory.cleanupDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/modules/:moduleId/lessons', () => {
    it('should create a new lesson with name and description', async () => {
      // SETUP: Crea la jerarquía específica para ESTE test.
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lessonData = {
        id: 'lesson-with-description',
        name: 'Intro to Greetings',
        description: 'Learn basic phrases',
        order: 1,
      };

      // EXECUTE & ASSERT
      await request(app)
        .post(`/api/v1/modules/${module.id}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(lessonData)
        .expect(201);
    });

    it('should create a lesson with name only (description optional)', async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lessonData = {
        id: 'lesson-name-only',
        name: 'Basic Vocabulary',
        order: 2,
      };

      // EXECUTE
      const response = await request(app)
        .post(`/api/v1/modules/${module.id}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(lessonData)
        .expect(201);

      // ASSERT
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'lesson-name-only',
        module_id: module.id,
        name: 'Basic Vocabulary',
        description: null,
        order: 2,
      });
    });

    it('should fail to create a lesson without a name', async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lessonData = { id: 'lesson-no-name', order: 1 };
      
      // EXECUTE & ASSERT
      await request(app)
        .post(`/api/v1/modules/${module.id}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(lessonData)
        .expect(400);
    });

    it('should fail to create a lesson with name exceeding max length', async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const longName = 'A'.repeat(151); // Exceeds 150 character limit
      const lessonData = {
        id: 'lesson-long-name',
        name: longName,
        order: 4,
      };

      // EXECUTE
      const response = await request(app)
        .post(`/api/v1/modules/${module.id}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(lessonData)
        .expect(400);

      // ASSERT
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toEqual('Validation failed');
    });
  });

  describe('GET /api/v1/modules/:moduleId/lessons/:id', () => {
    it('should retrieve a lesson with name and description', async () => {
      // SETUP
      const { module } = await TestFactory.createFullContentHierarchy();

      const lesson = await prisma.lesson.create({
        data: {
          id: 'lesson-for-get',
          moduleId: module.id,
          name: 'Test Lesson for GET',
          description: 'This is a test lesson for GET endpoint',
          order: 1,
        },
      });

      // EXECUTE
      const response = await request(app)
        .get(`/api/v1/modules/${module.id}/lessons/${lesson.id}`)
        .expect(200);

      // ASSERT
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test Lesson for GET',
        description: 'This is a test lesson for GET endpoint',
      });
    });
  });

  describe('PUT /api/v1/modules/:moduleId/lessons/:id', () => {
    it("should update a lesson's name and description", async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lesson = await prisma.lesson.create({
        data: { id: 'lesson-to-update', name: 'Original', order: 1, moduleId: module.id },
      });

      const updateData = { name: 'Updated Name' };

      // EXECUTE
      const response = await request(app)
        .put(`/api/v1/modules/${module.id}/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // ASSERT
      expect(response.body.data.name).toEqual('Updated Name');
    });

    it('should update only the name field', async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lesson = await prisma.lesson.create({
        data: {
          id: 'lesson-for-name-update',
          moduleId: module.id,
          name: 'Original Name',
          description: 'Original Description',
          order: 1,
        },
      });

      const updateData = { name: 'Only Name Updated' };

      // EXECUTE
      const response = await request(app)
        .put(`/api/v1/modules/${module.id}/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // ASSERT
      expect(response.body.data.name).toEqual('Only Name Updated');
      expect(response.body.data.description).toEqual('Original Description');
    });

    it('should update description to null', async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lesson = await prisma.lesson.create({
        data: {
          id: 'lesson-for-desc-null',
          moduleId: module.id,
          name: 'Original Name',
          description: 'Original Description',
          order: 1,
        },
      });

      const updateData = { description: null };

      // EXECUTE
      const response = await request(app)
        .put(`/api/v1/modules/${module.id}/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // ASSERT
      expect(response.body.data.description).toBeNull();
    });

    it('should fail to update with name exceeding max length', async () => {
      // SETUP
      const { authToken, module } = await TestFactory.createFullContentHierarchy();

      const lesson = await prisma.lesson.create({
        data: {
          id: 'lesson-for-long-name',
          moduleId: module.id,
          name: 'Original Name',
          description: 'Original Description',
          order: 1,
        },
      });

      const updateData = { name: 'B'.repeat(151) };

      // EXECUTE
      const response = await request(app)
        .put(`/api/v1/modules/${module.id}/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      // ASSERT
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toEqual('Validation failed');
    });
  });

  describe('GET /api/v1/modules/:moduleId/lessons', () => {
    it('should retrieve all lessons with name and description fields', async () => {
      // SETUP
      const { module } = await TestFactory.createFullContentHierarchy();

      // Crear ambas lecciones en una transacción para evitar interferencia
      await prisma.$transaction([
        prisma.lesson.create({
          data: {
            id: 'lesson-1-for-list',
            moduleId: module.id,
            name: 'First Lesson',
            description: 'Description for first lesson',
            order: 1,
          },
        }),
        prisma.lesson.create({
          data: {
            id: 'lesson-2-for-list',
            moduleId: module.id,
            name: 'Second Lesson',
            description: null,
            order: 2,
          },
        })
      ]);

      // EXECUTE
      const response = await request(app)
        .get(`/api/v1/modules/${module.id}/lessons`)
        .expect(200);

      // ASSERT
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toEqual('First Lesson');
    });
  });
});