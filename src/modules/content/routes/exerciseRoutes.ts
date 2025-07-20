import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExerciseController } from '../controllers';
import { validate } from '../../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import {
  CreateExerciseSchema,
  UpdateExerciseSchema,
  ExerciseQuerySchema,
} from '../schemas';
import { IdParamSchema } from '../../../shared/schemas/common';
import { z } from 'zod';

export function createExerciseRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const exerciseController = new ExerciseController(prisma);

  // Exercise routes
  router.get('/exercises', 
    validate({ query: ExerciseQuerySchema }), 
    exerciseController.getExercises
  );
  
  router.post('/exercises', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ body: CreateExerciseSchema }), 
    exerciseController.createExercise
  );
  
  router.get('/exercises/:id', 
    validate({ params: IdParamSchema }), 
    exerciseController.getExercise
  );
  
  router.put('/exercises/:id', 
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ 
      params: IdParamSchema, 
      body: UpdateExerciseSchema 
    }), 
    exerciseController.updateExercise
  );
  
  router.delete('/exercises/:id', 
    authenticateToken,
    requireRole(['admin']),
    validate({ params: IdParamSchema }), 
    exerciseController.deleteExercise
  );

  // Exercise by type routes
  router.get('/exercises/type/:type', 
    validate({ 
      params: z.object({ 
        type: z.enum(['translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering']) 
      }),
      query: ExerciseQuerySchema 
    }), 
    exerciseController.getExercisesByType
  );

  return router;
}