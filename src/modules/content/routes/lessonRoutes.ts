import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { LessonController } from '../controllers';
import { validate } from '../../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import {
  CreateLessonSchema,
  UpdateLessonSchema,
  LessonQuerySchema,
  AssignExerciseToLessonSchema,
  ReorderExercisesSchema,
  ModuleParamSchema,
  LessonParamSchema,
  ExerciseParamSchema,
} from '../schemas';
import { IdParamSchema } from '../../../shared/schemas/common';

export function createLessonRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const lessonController = new LessonController(prisma);

  // Lesson routes (nested under modules)
  router.get('/modules/:moduleId/lessons', 
    validate({ 
      params: ModuleParamSchema, 
      query: LessonQuerySchema 
    }), 
    lessonController.getLessonsByModule
  );
  
  router.post('/modules/:moduleId/lessons', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: ModuleParamSchema, 
      body: CreateLessonSchema.omit({ module_id: true }) 
    }), 
    lessonController.createLesson
  );
  
  router.get('/modules/:moduleId/lessons/:id', 
    validate({ 
      params: ModuleParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    lessonController.getLesson
  );
  
  router.put('/modules/:moduleId/lessons/:id', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: ModuleParamSchema.extend({ id: IdParamSchema.shape.id }), 
      body: UpdateLessonSchema 
    }), 
    lessonController.updateLesson
  );
  
  router.delete('/modules/:moduleId/lessons/:id', 
    authenticateToken,
    requireRole(['admin']),
    validate({ 
      params: ModuleParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    lessonController.deleteLesson
  );

  // Lesson-Exercise assignment routes
  router.get('/lessons/:lessonId/exercises', 
    validate({ params: LessonParamSchema }), 
    lessonController.getLessonExercises
  );
  
  router.post('/lessons/:lessonId/exercises', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: LessonParamSchema, 
      body: AssignExerciseToLessonSchema 
    }), 
    lessonController.assignExerciseToLesson
  );
  
  router.delete('/lessons/:lessonId/exercises/:exerciseId', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: LessonParamSchema.extend({ 
        exerciseId: ExerciseParamSchema.shape.exerciseId 
      }) 
    }), 
    lessonController.unassignExerciseFromLesson
  );
  
  router.put('/lessons/:lessonId/exercises/reorder', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: LessonParamSchema, 
      body: ReorderExercisesSchema 
    }), 
    lessonController.reorderLessonExercises
  );

  return router;
}