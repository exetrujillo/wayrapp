// src/shared/schemas/progress.schemas.ts

/**
 * Progress tracking validation schemas for WayrApp language learning platform
 * 
 * This module provides comprehensive Zod validation schemas for all progress tracking
 * and learning analytics operations in the WayrApp language learning platform. It serves
 * as the data validation foundation for lesson completion tracking, offline progress
 * synchronization, and progress analytics, ensuring data integrity and consistency
 * across all learning progress operations.
 * 
 * The schemas support the platform's learning analytics system by providing robust
 * validation for lesson completion events, batch progress synchronization for offline
 * learning scenarios, and comprehensive query parameters for progress analysis and
 * reporting. They ensure accurate tracking of learner achievements, time investment,
 * and performance metrics essential for educational effectiveness measurement.
 * 
 * Key architectural features include offline-first progress tracking that supports
 * mobile learning scenarios, comprehensive completion metadata including scores and
 * time tracking, flexible synchronization patterns for various client applications,
 * and robust query capabilities for progress analytics and reporting systems.
 * 
 * The module implements gamification support through experience point tracking,
 * performance analytics through score and time measurement, learning path optimization
 * through completion pattern analysis, and educational effectiveness measurement
 * through comprehensive progress data collection and validation.
 * 
 * Security considerations include input sanitization for all progress data, validation
 * of temporal data to prevent manipulation, score validation to ensure realistic
 * performance metrics, and comprehensive logging support for audit trails and
 * learning analytics while protecting user privacy and data integrity.
 * 
 * @module progress.schemas
 * @category Progress
 * @category Schemas
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with validation middleware
 * import { LessonCompletionSchema, ProgressSyncSchema } from '@/shared/schemas/progress.schemas';
 * import { validate } from '@/shared/middleware/validation';
 * 
 * router.post('/lessons/:id/complete', validate({ body: LessonCompletionSchema }), progressController.completeLesson);
 * router.post('/progress/sync', validate({ body: ProgressSyncSchema }), progressController.syncProgress);
 * 
 * @example
 * // Type inference for progress operations
 * import { LessonCompletionRequest, ProgressSyncRequest } from '@/shared/schemas/progress.schemas';
 * 
 * const trackCompletion = async (completionData: LessonCompletionRequest) => {
 *   // completionData is fully typed with validation constraints
 *   return await progressService.recordCompletion(completionData);
 * };
 * 
 * @example
 * // Progress analytics and querying
 * import { ProgressQuerySchema } from '@/shared/schemas/progress.schemas';
 * 
 * router.get('/progress/analytics', validate({ query: ProgressQuerySchema }), (req, res) => {
 *   const { page, limit, from_date, to_date, min_score, max_score } = req.query;
 *   // All query parameters are properly typed and validated
 * });
 */

import { z } from 'zod';
import {
  ExperiencePointsSchema,
  ScoreSchema,
  TimeSecondsSchema
} from './common';

/**
 * Lesson completion validation schema for individual learning progress tracking
 * 
 * Comprehensive validation schema for recording individual lesson completion events
 * in the language learning platform. This schema captures essential learning
 * analytics data including lesson identification, completion timestamps, performance
 * scores, and time investment, providing the foundation for progress tracking,
 * gamification, and educational effectiveness measurement.
 * 
 * The completion schema ensures accurate temporal tracking through ISO 8601 datetime
 * validation with timezone support, performance measurement through optional score
 * tracking, learning efficiency analysis through time spent recording, and proper
 * lesson identification for progress correlation and learning path optimization.
 * 
 * Educational analytics features include support for adaptive learning through
 * performance tracking, engagement measurement through time analysis, progress
 * visualization through completion timestamps, and learning effectiveness assessment
 * through score correlation with time investment and lesson difficulty.
 * 
 * The schema supports both real-time progress tracking for online learning and
 * batch synchronization for offline learning scenarios, ensuring comprehensive
 * learning analytics regardless of connectivity status or learning environment.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Individual lesson completion tracking
 * const completionData = {
 *   lesson_id: 'qu-basics-lesson-01',
 *   completed_at: '2024-01-20T10:30:00.000Z',
 *   score: 85,
 *   time_spent_seconds: 420
 * };
 * 
 * const result = LessonCompletionSchema.parse(completionData);
 * console.log('Valid completion:', result);
 * 
 * @example
 * // Lesson completion endpoint with validation
 * router.post('/lessons/:lessonId/complete', 
 *   validate({ body: LessonCompletionSchema }), 
 *   async (req, res) => {
 *     const completionData = req.body; // Validated completion data
 *     const userId = req.user.id;
 *     
 *     const completion = await progressService.recordCompletion(userId, completionData);
 *     
 *     // Award experience points based on performance
 *     if (completionData.score && completionData.score >= 70) {
 *       await gamificationService.awardExperience(userId, completion.lesson.experience_points);
 *     }
 *     
 *     res.status(201).json({ completion });
 *   }
 * );
 * 
 * @example
 * // Batch completion processing for analytics
 * const completions = [
 *   {
 *     lesson_id: 'lesson-001',
 *     completed_at: '2024-01-20T09:00:00Z',
 *     score: 92,
 *     time_spent_seconds: 300
 *   },
 *   {
 *     lesson_id: 'lesson-002',
 *     completed_at: '2024-01-20T09:30:00Z',
 *     score: 78,
 *     time_spent_seconds: 480
 *   }
 * ];
 * 
 * completions.forEach(completion => {
 *   const validation = LessonCompletionSchema.safeParse(completion);
 *   if (validation.success) {
 *     console.log(`Completion for ${completion.lesson_id} is valid`);
 *   }
 * });
 * 
 * @example
 * // Learning analytics with completion data
 * const analyzeCompletion = (completion: LessonCompletionRequest) => {
 *   const efficiency = completion.score && completion.time_spent_seconds 
 *     ? completion.score / (completion.time_spent_seconds / 60) // Score per minute
 *     : null;
 *     
 *   return {
 *     lessonId: completion.lesson_id,
 *     completedAt: new Date(completion.completed_at),
 *     performance: completion.score || 'Not scored',
 *     timeInvestment: completion.time_spent_seconds || 'Not tracked',
 *     efficiency: efficiency ? `${efficiency.toFixed(2)} points/min` : 'Cannot calculate'
 *   };
 * };
 * 
 * @example
 * // Mobile app offline completion tracking
 * const offlineCompletion = {
 *   lesson_id: 'mobile-lesson-03',
 *   completed_at: new Date().toISOString(), // Current timestamp
 *   score: 88,
 *   time_spent_seconds: 360
 * };
 * 
 * // Store locally for later sync
 * localStorage.setItem('pendingCompletion', JSON.stringify(offlineCompletion));
 */
export const LessonCompletionSchema = z.object({
  lesson_id: z.string().min(1, 'Lesson ID is required'),
  completed_at: z.string().datetime({ offset: true }),
  score: ScoreSchema.optional(),
  time_spent_seconds: TimeSecondsSchema.optional()
});

/**
 * Progress synchronization validation schema for offline learning support
 * 
 * Comprehensive validation schema for synchronizing learning progress from offline
 * or mobile learning sessions with the central learning platform. This schema
 * supports batch processing of lesson completions, experience point reconciliation,
 * and activity timestamp tracking, enabling seamless offline-to-online learning
 * transitions and comprehensive progress continuity.
 * 
 * The synchronization schema ensures data integrity during batch operations through
 * comprehensive completion validation, prevents data loss through required completion
 * arrays, supports gamification continuity through experience point tracking, and
 * maintains temporal consistency through activity timestamp validation.
 * 
 * Offline learning support includes mobile app synchronization for disconnected
 * learning, batch progress upload for intermittent connectivity scenarios, conflict
 * resolution support through timestamp validation, and comprehensive progress
 * reconciliation for multi-device learning environments.
 * 
 * The schema is designed to handle various synchronization scenarios including
 * initial sync after extended offline periods, incremental sync for regular
 * connectivity, conflict resolution for overlapping learning sessions, and
 * progress recovery for interrupted learning experiences.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Offline progress synchronization
 * const syncData = {
 *   completions: [
 *     {
 *       lesson_id: 'offline-lesson-01',
 *       completed_at: '2024-01-20T08:30:00Z',
 *       score: 92,
 *       time_spent_seconds: 300
 *     },
 *     {
 *       lesson_id: 'offline-lesson-02',
 *       completed_at: '2024-01-20T09:15:00Z',
 *       score: 78,
 *       time_spent_seconds: 420
 *     }
 *   ],
 *   experience_gained: 150,
 *   last_activity: '2024-01-20T09:45:00Z'
 * };
 * 
 * const result = ProgressSyncSchema.parse(syncData);
 * console.log('Valid sync data:', result);
 * 
 * @example
 * // Progress synchronization endpoint
 * router.post('/progress/sync', 
 *   validate({ body: ProgressSyncSchema }), 
 *   async (req, res) => {
 *     const syncData = req.body; // Validated sync data
 *     const userId = req.user.id;
 *     
 *     const syncResult = await progressService.syncOfflineProgress(userId, syncData);
 *     
 *     // Update user's total experience points
 *     if (syncData.experience_gained) {
 *       await gamificationService.addExperience(userId, syncData.experience_gained);
 *     }
 *     
 *     res.json({
 *       success: true,
 *       synced: syncResult.syncedCompletions,
 *       skipped: syncResult.skippedDuplicates,
 *       conflicts: syncResult.conflicts
 *     });
 *   }
 * );
 * 
 * @example
 * // Mobile app batch synchronization
 * const mobileAppSync = async (offlineCompletions: any[]) => {
 *   const syncPayload = {
 *     completions: offlineCompletions.map(completion => ({
 *       lesson_id: completion.lessonId,
 *       completed_at: completion.timestamp,
 *       score: completion.finalScore,
 *       time_spent_seconds: completion.duration
 *     })),
 *     experience_gained: offlineCompletions.reduce((total, c) => total + (c.experienceEarned || 0), 0),
 *     last_activity: new Date().toISOString()
 *   };
 *   
 *   const validation = ProgressSyncSchema.safeParse(syncPayload);
 *   if (!validation.success) {
 *     throw new Error('Invalid sync data: ' + validation.error.message);
 *   }
 *   
 *   return await fetch('/api/progress/sync', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(validation.data)
 *   });
 * };
 * 
 * @example
 * // Conflict resolution during synchronization
 * const handleSyncConflicts = async (syncData: ProgressSyncRequest) => {
 *   // Check for existing completions to prevent duplicates
 *   const existingCompletions = await progressService.getCompletions(
 *     userId,
 *     syncData.completions.map(c => c.lesson_id)
 *   );
 *   
 *   const newCompletions = syncData.completions.filter(completion => 
 *     !existingCompletions.some(existing => 
 *       existing.lesson_id === completion.lesson_id &&
 *       new Date(existing.completed_at) >= new Date(completion.completed_at)
 *     )
 *   );
 *   
 *   return {
 *     ...syncData,
 *     completions: newCompletions
 *   };
 * };
 * 
 * @example
 * // Progressive sync for large offline sessions
 * const progressiveSync = async (allCompletions: any[], batchSize = 10) => {
 *   const results = [];
 *   
 *   for (let i = 0; i < allCompletions.length; i += batchSize) {
 *     const batch = allCompletions.slice(i, i + batchSize);
 *     const syncData = {
 *       completions: batch,
 *       experience_gained: batch.reduce((sum, c) => sum + (c.experience || 0), 0),
 *       last_activity: batch[batch.length - 1].completed_at
 *     };
 *     
 *     const validation = ProgressSyncSchema.safeParse(syncData);
 *     if (validation.success) {
 *       const result = await syncBatch(validation.data);
 *       results.push(result);
 *     }
 *   }
 *   
 *   return results;
 * };
 */
export const ProgressSyncSchema = z.object({
  completions: z.array(LessonCompletionSchema)
    .min(1, 'At least one lesson completion is required'),
  experience_gained: ExperiencePointsSchema.optional(),
  last_activity: z.string().datetime({ offset: true }).optional()
});

/**
 * Progress query parameters validation schema for analytics and reporting
 * 
 * Comprehensive validation schema for query parameters used in progress analytics,
 * learning reports, and educational effectiveness analysis across the language
 * learning platform. This schema combines standard pagination functionality with
 * progress-specific filtering options including temporal ranges, performance
 * thresholds, and sorting capabilities for comprehensive learning analytics.
 * 
 * The query schema supports educational research through temporal filtering for
 * learning pattern analysis, performance-based filtering for achievement analytics,
 * flexible sorting for various reporting needs, and pagination for efficient
 * data processing in large-scale learning analytics operations.
 * 
 * Analytics capabilities include learning progress visualization through date-range
 * filtering, performance analysis through score-based queries, engagement measurement
 * through activity pattern analysis, and educational effectiveness assessment
 * through comprehensive progress data aggregation and filtering.
 * 
 * The schema ensures efficient database operations through proper pagination limits,
 * supports various reporting timeframes through flexible date filtering, enables
 * performance benchmarking through score range queries, and maintains query
 * performance through optimized parameter validation and transformation.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Comprehensive progress analytics query
 * const analyticsQuery = {
 *   page: '1',
 *   limit: '50',
 *   sortBy: 'completed_at',
 *   sortOrder: 'desc',
 *   from_date: '2024-01-01T00:00:00Z',
 *   to_date: '2024-01-31T23:59:59Z',
 *   min_score: '70',
 *   max_score: '100'
 * };
 * 
 * const validatedQuery = ProgressQuerySchema.parse(analyticsQuery);
 * // Result: { page: 1, limit: 50, sortBy: 'completed_at', sortOrder: 'desc', 
 * //          from_date: '2024-01-01T00:00:00Z', to_date: '2024-01-31T23:59:59Z',
 * //          min_score: 70, max_score: 100 }
 * 
 * @example
 * // Progress analytics endpoint with comprehensive filtering
 * router.get('/progress/analytics', 
 *   validate({ query: ProgressQuerySchema }), 
 *   async (req, res) => {
 *     const { 
 *       page, 
 *       limit, 
 *       sortBy, 
 *       sortOrder, 
 *       from_date, 
 *       to_date, 
 *       min_score, 
 *       max_score 
 *     } = req.query;
 *     
 *     const analyticsOptions = {
 *       skip: (page - 1) * limit,
 *       take: limit,
 *       where: {
 *         ...(from_date && { completed_at: { gte: new Date(from_date) } }),
 *         ...(to_date && { completed_at: { lte: new Date(to_date) } }),
 *         ...(min_score !== undefined && { score: { gte: min_score } }),
 *         ...(max_score !== undefined && { score: { lte: max_score } })
 *       },
 *       orderBy: sortBy ? { [sortBy]: sortOrder } : { completed_at: 'desc' }
 *     };
 *     
 *     const progressData = await progressService.getAnalytics(analyticsOptions);
 *     res.json({ data: progressData, pagination: { page, limit, sortBy, sortOrder } });
 *   }
 * );
 * 
 * @example
 * // Learning effectiveness analysis
 * const effectivenessQuery = {
 *   from_date: '2024-01-01T00:00:00Z',
 *   to_date: '2024-01-31T23:59:59Z',
 *   min_score: '80', // High-performing learners
 *   sortBy: 'score',
 *   sortOrder: 'desc',
 *   limit: '100'
 * };
 * 
 * @example
 * // Student progress dashboard queries
 * const studentDashboard = {
 *   page: '1',
 *   limit: '20',
 *   sortBy: 'completed_at',
 *   sortOrder: 'desc',
 *   from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
 * };
 * 
 * @example
 * // Performance benchmarking queries
 * const benchmarkingQueries = [
 *   {
 *     // Top performers
 *     min_score: '90',
 *     sortBy: 'score',
 *     sortOrder: 'desc',
 *     limit: '50'
 *   },
 *   {
 *     // Struggling learners
 *     max_score: '60',
 *     sortBy: 'completed_at',
 *     sortOrder: 'desc',
 *     limit: '100'
 *   }
 * ];
 * 
 * @example
 * // Mobile app progress history
 * const mobileProgressQuery = {
 *   page: '1',
 *   limit: '10', // Smaller batches for mobile
 *   sortBy: 'completed_at',
 *   sortOrder: 'desc',
 *   from_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last week
 * };
 * 
 * @example
 * // Learning analytics dashboard with real-time filtering
 * const buildAnalyticsQuery = (filters: any) => {
 *   const query: any = {
 *     page: filters.page || '1',
 *     limit: filters.limit || '25',
 *     sortBy: filters.sortBy || 'completed_at',
 *     sortOrder: filters.sortOrder || 'desc'
 *   };
 *   
 *   if (filters.dateRange) {
 *     query.from_date = filters.dateRange.start;
 *     query.to_date = filters.dateRange.end;
 *   }
 *   
 *   if (filters.performanceRange) {
 *     query.min_score = filters.performanceRange.min?.toString();
 *     query.max_score = filters.performanceRange.max?.toString();
 *   }
 *   
 *   const validation = ProgressQuerySchema.safeParse(query);
 *   return validation.success ? validation.data : null;
 * };
 */
export const ProgressQuerySchema = z.object({
  // Include base pagination fields
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  // Add progress-specific fields
  from_date: z.string().datetime({ offset: true }).optional(),
  to_date: z.string().datetime({ offset: true }).optional(),
  min_score: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  max_score: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined)
}).refine((data) => {
  return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
}, {
  message: 'Page must be >= 1 and limit must be between 1 and 100'
});

/**
 * TypeScript type definitions inferred from progress validation schemas
 * 
 * These type definitions provide compile-time type safety for progress tracking
 * and learning analytics operations throughout the application. They are automatically
 * inferred from the corresponding Zod schemas, ensuring that TypeScript types remain
 * synchronized with runtime validation rules and preventing type/validation mismatches
 * in progress tracking systems.
 * 
 * The types enable full type safety in progress tracking services, analytics
 * systems, gamification features, and client-side applications while maintaining
 * a single source of truth for validation rules. They support IDE autocompletion,
 * compile-time error detection, and refactoring safety across the entire learning
 * analytics and progress tracking infrastructure.
 * 
 * @example
 * // Using types in progress service methods
 * class ProgressService {
 *   async recordCompletion(userId: string, completion: LessonCompletionRequest): Promise<Completion> {
 *     // completion is fully typed with all validation constraints
 *     return await this.completionRepository.create({ userId, ...completion });
 *   }
 * 
 *   async syncOfflineProgress(userId: string, syncData: ProgressSyncRequest): Promise<SyncResult> {
 *     // syncData.completions is typed array, experience_gained is optional number
 *     return await this.batchSyncCompletions(userId, syncData);
 *   }
 * }
 * 
 * @example
 * // Using types in analytics request handlers
 * const getProgressAnalytics = async (req: Request<{}, {}, {}, ProgressQueryParams>) => {
 *   const { page, limit, from_date, to_date, min_score, max_score } = req.query; // Fully typed
 *   // Implementation here
 * };
 */

/**
 * Type definition for lesson completion tracking data
 * 
 * Represents the structure of validated lesson completion data including lesson
 * identification, completion timestamp, optional performance score, and optional
 * time investment tracking. This type ensures type safety for progress tracking
 * operations while supporting comprehensive learning analytics.
 * 
 * @type {Object}
 * @property {string} lesson_id - Lesson identifier for completion tracking (required)
 * @property {string} completed_at - ISO 8601 datetime with timezone offset for completion timestamp
 * @property {number} [score] - Optional performance score (0-100)
 * @property {number} [time_spent_seconds] - Optional time investment in seconds (non-negative)
 */
export type LessonCompletionRequest = z.infer<typeof LessonCompletionSchema>;

/**
 * Type definition for offline progress synchronization data
 * 
 * Represents the structure of validated progress synchronization data for batch
 * processing of offline learning sessions. This type ensures type safety for
 * synchronization operations while supporting comprehensive progress continuity
 * and conflict resolution.
 * 
 * @type {Object}
 * @property {LessonCompletionRequest[]} completions - Array of lesson completions for batch sync (minimum 1)
 * @property {number} [experience_gained] - Optional total experience points gained during offline session
 * @property {string} [last_activity] - Optional ISO 8601 datetime for last learning activity timestamp
 */
export type ProgressSyncRequest = z.infer<typeof ProgressSyncSchema>;

/**
 * Type definition for progress analytics query parameters
 * 
 * Represents the structure of validated query parameters for progress analytics,
 * learning reports, and educational effectiveness analysis. This type ensures
 * type safety for analytics operations while supporting comprehensive filtering
 * and pagination capabilities.
 * 
 * @type {Object}
 * @property {number} page - Page number for pagination (minimum 1, default: 1)
 * @property {number} limit - Results per page (1-100, default: 20)
 * @property {string} [sortBy] - Optional field name for sorting
 * @property {'asc' | 'desc'} sortOrder - Sort direction (default: 'asc')
 * @property {string} [from_date] - Optional ISO 8601 datetime for filtering start date
 * @property {string} [to_date] - Optional ISO 8601 datetime for filtering end date
 * @property {number} [min_score] - Optional minimum score threshold for filtering
 * @property {number} [max_score] - Optional maximum score threshold for filtering
 */
export type ProgressQueryParams = z.infer<typeof ProgressQuerySchema>;