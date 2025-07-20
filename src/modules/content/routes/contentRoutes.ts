import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContentController } from '../controllers';
import { validate } from '../../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CourseQuerySchema,
  CreateLevelSchema,
  UpdateLevelSchema,
  LevelQuerySchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  SectionQuerySchema,
  CreateModuleSchema,
  UpdateModuleSchema,
  ModuleQuerySchema,
  CourseParamSchema,
  LevelParamSchema,
  SectionParamSchema,
  // ModuleParamSchema
} from '../schemas';
import { IdParamSchema } from '../../../shared/schemas/common';

export function createContentRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const contentController = new ContentController(prisma);

  // Course routes
  router.get('/courses', 
    validate({ query: CourseQuerySchema }), 
    contentController.getCourses
  );
  
  router.post('/courses', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ body: CreateCourseSchema }), 
    contentController.createCourse
  );
  
  router.get('/courses/:id', 
    validate({ params: IdParamSchema }), 
    contentController.getCourse
  );
  
  router.put('/courses/:id', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: IdParamSchema, 
      body: UpdateCourseSchema 
    }), 
    contentController.updateCourse
  );
  
  router.delete('/courses/:id', 
    authenticateToken,
    requireRole(['admin']),
    validate({ params: IdParamSchema }), 
    contentController.deleteCourse
  );
  
  router.get('/courses/:id/package', 
    validate({ params: IdParamSchema }), 
    contentController.getPackagedCourse
  );

  // Level routes (nested under courses)
  router.get('/courses/:courseId/levels', 
    validate({ 
      params: CourseParamSchema, 
      query: LevelQuerySchema 
    }), 
    contentController.getLevelsByCourse
  );
  
  router.post('/courses/:courseId/levels', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: CourseParamSchema, 
      body: CreateLevelSchema.omit({ course_id: true }) 
    }), 
    contentController.createLevel
  );
  
  router.get('/courses/:courseId/levels/:id', 
    validate({ 
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    contentController.getLevel
  );
  
  router.put('/courses/:courseId/levels/:id', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id }), 
      body: UpdateLevelSchema 
    }), 
    contentController.updateLevel
  );
  
  router.delete('/courses/:courseId/levels/:id', 
    authenticateToken,
    requireRole(['admin']),
    validate({ 
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    contentController.deleteLevel
  );

  // Section routes (nested under levels)
  router.get('/levels/:levelId/sections', 
    validate({ 
      params: LevelParamSchema, 
      query: SectionQuerySchema 
    }), 
    contentController.getSectionsByLevel
  );
  
  router.post('/levels/:levelId/sections', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: LevelParamSchema, 
      body: CreateSectionSchema.omit({ level_id: true }) 
    }), 
    contentController.createSection
  );
  
  router.get('/levels/:levelId/sections/:id', 
    validate({ 
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    contentController.getSection
  );
  
  router.put('/levels/:levelId/sections/:id', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id }), 
      body: UpdateSectionSchema 
    }), 
    contentController.updateSection
  );
  
  router.delete('/levels/:levelId/sections/:id', 
    authenticateToken,
    requireRole(['admin']),
    validate({ 
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    contentController.deleteSection
  );

  // Module routes (nested under sections)
  router.get('/sections/:sectionId/modules', 
    validate({ 
      params: SectionParamSchema, 
      query: ModuleQuerySchema 
    }), 
    contentController.getModulesBySection
  );
  
  router.post('/sections/:sectionId/modules', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: SectionParamSchema, 
      body: CreateModuleSchema.omit({ section_id: true }) 
    }), 
    contentController.createModule
  );
  
  router.get('/sections/:sectionId/modules/:id', 
    validate({ 
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    contentController.getModule
  );
  
  router.put('/sections/:sectionId/modules/:id', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id }), 
      body: UpdateModuleSchema 
    }), 
    contentController.updateModule
  );
  
  router.delete('/sections/:sectionId/modules/:id', 
    authenticateToken,
    requireRole(['admin']),
    validate({ 
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id }) 
    }), 
    contentController.deleteModule
  );

  return router;
}