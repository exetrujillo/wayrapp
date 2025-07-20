/**
 * Progress Routes
 * Route definitions for progress tracking endpoints
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProgressController } from '../controllers/progressController';
import { ProgressService } from '../services/progressService';
import { ProgressRepository } from '../repositories/progressRepository';
import { authenticateToken, requireRole } from '@/shared/middleware/auth';
// import { validate as validateRequest } from '@/shared/middleware/validation';

export function createProgressRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Initialize dependencies
  const progressRepository = new ProgressRepository(prisma);
  const progressService = new ProgressService(progressRepository, prisma);
  const progressController = new ProgressController(progressService);

  // All progress routes require authentication
  router.use(authenticateToken);

  // User progress endpoints
  router.get('/progress', progressController.getUserProgress);
  router.get('/progress/summary', progressController.getProgressSummary);
  router.put('/progress', progressController.updateUserProgress);

  // Lesson completion endpoints
  router.post('/progress/lesson/:id', progressController.completeLesson);
  router.get('/progress/lesson/:id/completed', progressController.checkLessonCompletion);
  router.get('/progress/completions', progressController.getUserLessonCompletions);

  // Offline synchronization
  router.put('/progress/sync', progressController.syncOfflineProgress);

  // Gamification features
  router.put('/progress/lives', progressController.updateUserLives);

  // Admin-only endpoints
  router.post('/progress/bonus', requireRole(['admin']), progressController.awardBonusExperience);
  router.post('/progress/reset', requireRole(['admin']), progressController.resetUserProgress);

  // Analytics endpoints (admin and content creators)
  router.get(
    '/progress/lesson/:id/stats',
    requireRole(['admin', 'content_creator']),
    progressController.getLessonCompletionStats
  );

  return router;
}

export default createProgressRoutes;