// src/shared/schemas/content.schemas.ts

/**
 * Content validation schemas for WayrApp language learning platform
 * 
 * This module provides comprehensive Zod validation schemas for all content-related
 * operations in the WayrApp language learning platform. It serves as the data validation
 * foundation for educational content including courses, levels, sections, modules, lessons,
 * and exercises, ensuring data integrity, consistency, and security across all content
 * management operations.
 * 
 * The schemas implement the hierarchical structure of educational content in the platform:
 * courses contain levels, levels contain sections, sections contain modules, modules contain
 * lessons, and lessons contain exercises. Each schema enforces appropriate validation rules
 * for its level in the hierarchy while maintaining referential integrity and educational
 * workflow requirements.
 * 
 * Key architectural features include hierarchical content organization with proper ordering
 * and sequencing, multi-language support for international content delivery, flexible
 * exercise types supporting various learning modalities, comprehensive metadata validation
 * for content management, and robust query parameter validation for content discovery
 * and filtering operations.
 * 
 * Security considerations include input sanitization to prevent injection attacks, ID format
 * validation to ensure URL safety and database compatibility, length limits to prevent
 * buffer overflow and denial-of-service attacks, and comprehensive validation of user-generated
 * content to maintain platform quality and safety standards.
 * 
 * The module supports the platform's educational methodology by enforcing pedagogical
 * constraints such as language pair validation (preventing same-language courses), proper
 * content sequencing through order validation, experience point allocation for gamification,
 * and flexible exercise data structures that accommodate various learning activities.
 * 
 * @module content.schemas
 * @category Content
 * @category Schemas
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with validation middleware
 * import { CourseSchema, LessonSchema, ExerciseSchema } from '@/shared/schemas/content.schemas';
 * import { validate } from '@/shared/middleware/validation';
 * 
 * router.post('/courses', validate({ body: CourseSchema }), courseController.create);
 * router.post('/lessons', validate({ body: LessonSchema }), lessonController.create);
 * router.post('/exercises', validate({ body: ExerciseSchema }), exerciseController.create);
 * 
 * @example
 * // Type inference for content operations
 * import { CourseRequest, LessonRequest } from '@/shared/schemas/content.schemas';
 * 
 * const createCourse = async (courseData: CourseRequest) => {
 *   // courseData is fully typed with validation constraints
 *   return await courseService.create(courseData);
 * };
 * 
 * @example
 * // Content hierarchy validation
 * import { ContentQuerySchema } from '@/shared/schemas/content.schemas';
 * 
 * router.get('/content/search', validate({ query: ContentQuerySchema }), (req, res) => {
 *   const { page, limit, search, source_language, target_language } = req.query;
 *   // All query parameters are properly typed and validated
 * });
 */

import { z } from 'zod';
import {
  LanguageCodeSchema,
  OrderSchema,
  ModuleTypeSchema,
  ExperiencePointsSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  JsonSchema,
  BooleanStringSchema,
} from './common';

/**
 * Course validation schema for language learning course creation and management
 * 
 * Comprehensive validation schema for language learning courses that form the top level
 * of the content hierarchy in the WayrApp platform. This schema ensures courses have
 * proper identification, language pair configuration, descriptive content, and visibility
 * settings while enforcing educational constraints and security requirements.
 * 
 * The course schema implements several critical validations including URL-safe ID format
 * that supports clean URLs and database indexing, language pair validation that prevents
 * illogical same-language courses, content length limits that balance descriptiveness
 * with performance, and visibility controls that support both public and private course
 * offerings.
 * 
 * Educational constraints include the requirement that source and target languages must
 * be different to ensure meaningful language learning experiences, proper ID formatting
 * that supports hierarchical content organization, and flexible description fields that
 * accommodate various course marketing and educational needs.
 * 
 * Security features include ID format validation to prevent injection attacks and ensure
 * URL safety, input sanitization through text field validation, length limits to prevent
 * denial-of-service attacks, and comprehensive validation of language codes to ensure
 * proper internationalization support.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Valid course creation
 * const courseData = {
 *   id: 'qu-es-beginner',
 *   source_language: 'qu',
 *   target_language: 'es-ES',
 *   name: 'Quechua for Spanish Speakers',
 *   description: 'Learn basic Quechua vocabulary and grammar for Spanish speakers',
 *   is_public: true
 * };
 * 
 * const result = CourseSchema.parse(courseData);
 * console.log('Valid course:', result);
 * 
 * @example
 * // Course creation endpoint with validation
 * router.post('/courses', validate({ body: CourseSchema }), async (req, res) => {
 *   const courseData = req.body; // Fully validated course data
 *   const course = await courseService.create(courseData);
 *   res.status(201).json({ course });
 * });
 * 
 * @example
 * // Multi-language course catalog
 * const courseCatalog = [
 *   {
 *     id: 'qu-es-basic',
 *     source_language: 'qu',
 *     target_language: 'es',
 *     name: 'Basic Quechua',
 *     description: 'Introduction to Quechua language',
 *     is_public: true
 *   },
 *   {
 *     id: 'aym-es-intermediate',
 *     source_language: 'aym',
 *     target_language: 'es-419',
 *     name: 'Intermediate Aymara',
 *     description: 'Advanced Aymara for Latin American Spanish speakers',
 *     is_public: false
 *   }
 * ];
 * 
 * courseCatalog.forEach(course => {
 *   const validation = CourseSchema.safeParse(course);
 *   if (validation.success) {
 *     console.log(`Course ${course.id} is valid`);
 *   }
 * });
 * 
 * @example
 * // Error handling for invalid courses
 * try {
 *   CourseSchema.parse({
 *     id: 'qu-qu-invalid', // Same source and target language
 *     source_language: 'qu',
 *     target_language: 'qu',
 *     name: 'Invalid Course'
 *   });
 * } catch (error) {
 *   // Throws: "Source and target languages must be different"
 * }
 * 
 * @example
 * // Course update with partial validation
 * const updateCourseData = {
 *   name: 'Updated Course Name',
 *   description: 'Updated course description with more details',
 *   is_public: false
 * };
 * 
 * const UpdateCourseSchema = CourseSchema.partial().omit({ id: true });
 * const validatedUpdate = UpdateCourseSchema.parse(updateCourseData);
 */
export const CourseSchema = z
  .object({
    id: z
      .string()
      .max(20, 'Course ID cannot exceed 20 characters')
      .regex(
        /^[a-z0-9-]+$/,
        'Course ID can only contain lowercase letters, numbers, and hyphens'
      ),
    source_language: LanguageCodeSchema,
    target_language: LanguageCodeSchema,
    name: TextFieldSchema(1, 100),
    description: OptionalTextFieldSchema(1000),
    is_public: z.boolean().default(true),
  })
  .refine((data) => data.source_language !== data.target_language, {
    message: 'Source and target languages must be different',
    path: ['target_language'],
  });

/**
 * Level validation schema for course difficulty and progression levels
 * 
 * Validation schema for course levels that represent different difficulty stages
 * or proficiency levels within a language learning course. Levels provide structured
 * progression paths for learners, organizing content from beginner to advanced
 * stages while maintaining proper sequencing and identification within the course
 * hierarchy.
 * 
 * The level schema enforces proper identification through URL-safe ID formatting,
 * provides short codes for easy reference and display, includes descriptive names
 * for user interfaces, and maintains proper ordering for sequential progression
 * through the learning material.
 * 
 * Educational structure considerations include support for common proficiency
 * frameworks (A1, A2, B1, B2, C1, C2), flexible naming that accommodates various
 * pedagogical approaches, and ordering systems that support both linear and
 * branching learning paths.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Standard proficiency levels
 * const proficiencyLevels = [
 *   {
 *     id: 'beginner-a1',
 *     code: 'A1',
 *     name: 'Beginner Level 1',
 *     order: 1
 *   },
 *   {
 *     id: 'beginner-a2',
 *     code: 'A2',
 *     name: 'Beginner Level 2',
 *     order: 2
 *   },
 *   {
 *     id: 'intermediate-b1',
 *     code: 'B1',
 *     name: 'Intermediate Level 1',
 *     order: 3
 *   }
 * ];
 * 
 * @example
 * // Level creation in course structure
 * router.post('/courses/:courseId/levels', 
 *   validate({ body: LevelSchema }), 
 *   async (req, res) => {
 *     const levelData = req.body; // Validated level data
 *     const level = await levelService.create(req.params.courseId, levelData);
 *     res.status(201).json({ level });
 *   }
 * );
 */
export const LevelSchema = z.object({
  id: z
    .string()
    .max(30, 'Level ID cannot exceed 30 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Level ID can only contain lowercase letters, numbers, and hyphens'
    ),
  code: TextFieldSchema(1, 10),
  name: TextFieldSchema(1, 100),
  order: OrderSchema,
});

/**
 * Section validation schema for thematic content organization within levels
 * 
 * Validation schema for course sections that organize content into thematic units
 * within each proficiency level. Sections group related learning materials and
 * activities around specific topics, grammar concepts, or skill areas, providing
 * logical content organization that supports effective learning progression.
 * 
 * The section schema maintains the hierarchical content structure by providing
 * unique identification within the level context, descriptive naming for clear
 * topic identification, and proper ordering for sequential or thematic content
 * presentation.
 * 
 * Pedagogical considerations include support for topic-based learning organization,
 * flexible naming that accommodates various subject areas and themes, and ordering
 * systems that support both sequential learning and topic-based exploration.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Thematic sections within a level
 * const levelSections = [
 *   {
 *     id: 'greetings-introductions',
 *     name: 'Greetings and Introductions',
 *     order: 1
 *   },
 *   {
 *     id: 'family-relationships',
 *     name: 'Family and Relationships',
 *     order: 2
 *   },
 *   {
 *     id: 'daily-activities',
 *     name: 'Daily Activities and Routines',
 *     order: 3
 *   }
 * ];
 * 
 * @example
 * // Section management in level structure
 * router.post('/levels/:levelId/sections', 
 *   validate({ body: SectionSchema }), 
 *   async (req, res) => {
 *     const sectionData = req.body; // Validated section data
 *     const section = await sectionService.create(req.params.levelId, sectionData);
 *     res.status(201).json({ section });
 *   }
 * );
 */
export const SectionSchema = z.object({
  id: z
    .string()
    .max(40, 'Section ID cannot exceed 40 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Section ID can only contain lowercase letters, numbers, and hyphens'
    ),
  name: TextFieldSchema(1, 150),
  order: OrderSchema,
});

/**
 * Module validation schema for specific learning activities within sections
 * 
 * Validation schema for learning modules that represent specific educational
 * activities or content types within course sections. Modules define the actual
 * learning experiences including informative content, basic lessons, reading
 * exercises, dialogues, and assessments, providing the granular structure for
 * educational content delivery.
 * 
 * The module schema enforces proper categorization through module type validation,
 * ensures clear identification and naming for content management, and maintains
 * proper sequencing within the section context. Module types determine the
 * pedagogical approach and user interface presentation for each learning activity.
 * 
 * Educational methodology support includes various learning modalities through
 * module types, flexible content organization that accommodates different teaching
 * approaches, and proper sequencing that supports both linear progression and
 * adaptive learning paths.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Different module types in a section
 * const sectionModules = [
 *   {
 *     id: 'intro-vocabulary-informative',
 *     module_type: 'informative',
 *     name: 'Introduction to Family Vocabulary',
 *     order: 1
 *   },
 *   {
 *     id: 'family-basic-lesson',
 *     module_type: 'basic_lesson',
 *     name: 'Family Members and Relationships',
 *     order: 2
 *   },
 *   {
 *     id: 'family-dialogue-practice',
 *     module_type: 'dialogue',
 *     name: 'Family Conversation Practice',
 *     order: 3
 *   },
 *   {
 *     id: 'family-knowledge-exam',
 *     module_type: 'exam',
 *     name: 'Family Vocabulary Assessment',
 *     order: 4
 *   }
 * ];
 * 
 * @example
 * // Module creation with type-specific handling
 * router.post('/sections/:sectionId/modules', 
 *   validate({ body: ModuleSchema }), 
 *   async (req, res) => {
 *     const moduleData = req.body; // Validated module data
 *     const module = await moduleService.create(req.params.sectionId, moduleData);
 *     
 *     // Type-specific initialization based on module_type
 *     switch (moduleData.module_type) {
 *       case 'informative':
 *         await contentService.initializeInformativeContent(module.id);
 *         break;
 *       case 'exam':
 *         await assessmentService.initializeExamStructure(module.id);
 *         break;
 *     }
 *     
 *     res.status(201).json({ module });
 *   }
 * );
 */
export const ModuleSchema = z.object({
  id: z
    .string()
    .max(50, 'Module ID cannot exceed 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Module ID can only contain lowercase letters, numbers, and hyphens'
    ),
  module_type: ModuleTypeSchema,
  name: TextFieldSchema(1, 150),
  order: OrderSchema,
});

/**
 * Lesson validation schema for individual learning units within modules
 * 
 * Validation schema for individual lessons that represent discrete learning
 * units within educational modules. Lessons are the primary content delivery
 * mechanism in the platform, containing specific learning objectives, content,
 * and associated exercises while supporting gamification through experience
 * point allocation.
 * 
 * The lesson schema provides unique identification for content management and
 * tracking, experience point allocation for gamification and progress tracking,
 * and proper ordering for sequential learning progression within modules.
 * Default experience points encourage consistent reward structures while
 * allowing customization for different lesson complexities.
 * 
 * Gamification features include configurable experience point rewards that
 * motivate learner engagement, progress tracking support through unique
 * identification, and ordering systems that support both linear and adaptive
 * learning paths based on learner performance and preferences.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Lessons with varying experience points
 * const moduleLessons = [
 *   {
 *     id: 'basic-greetings-intro',
 *     experience_points: 5,  // Simple introduction lesson
 *     order: 1
 *   },
 *   {
 *     id: 'greeting-vocabulary-practice',
 *     experience_points: 10, // Standard practice lesson
 *     order: 2
 *   },
 *   {
 *     id: 'greeting-conversation-challenge',
 *     experience_points: 20, // Complex conversation lesson
 *     order: 3
 *   }
 * ];
 * 
 * @example
 * // Lesson creation with gamification
 * router.post('/modules/:moduleId/lessons', 
 *   validate({ body: LessonSchema }), 
 *   async (req, res) => {
 *     const lessonData = req.body; // Validated lesson data
 *     const lesson = await lessonService.create(req.params.moduleId, lessonData);
 *     
 *     // Initialize gamification tracking
 *     await gamificationService.registerLesson(lesson.id, lesson.experience_points);
 *     
 *     res.status(201).json({ lesson });
 *   }
 * );
 * 
 * @example
 * // Lesson completion tracking
 * const completeLessonSchema = z.object({
 *   lessonId: z.string(),
 *   completionTime: z.number().min(0),
 *   score: z.number().min(0).max(100).optional()
 * });
 * 
 * router.post('/lessons/:lessonId/complete', 
 *   validate({ body: completeLessonSchema }), 
 *   async (req, res) => {
 *     const { completionTime, score } = req.body;
 *     const lesson = await lessonService.findById(req.params.lessonId);
 *     
 *     // Award experience points based on lesson configuration
 *     const experienceAwarded = await gamificationService.awardExperience(
 *       req.user.id, 
 *       lesson.experience_points,
 *       score
 *     );
 *     
 *     res.json({ experienceAwarded, lesson });
 *   }
 * );
 */
export const LessonSchema = z.object({
  id: z
    .string()
    .max(60, 'Lesson ID cannot exceed 60 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Lesson ID can only contain lowercase letters, numbers, and hyphens'
    ),
  experience_points: ExperiencePointsSchema.default(10),
  order: OrderSchema,
});

/**
 * Exercise validation schema for interactive learning activities
 * 
 * Validation schema for interactive exercises that provide hands-on learning
 * experiences within lessons. Exercises represent the core interactive elements
 * of the learning platform, supporting various activity types from translation
 * and comprehension to matching and ordering activities, each with flexible
 * data structures to accommodate different learning modalities.
 * 
 * The exercise schema enforces proper categorization through exercise type
 * validation, provides compact identification suitable for frequent database
 * operations, and supports flexible data structures through JSON validation
 * that can accommodate the varying requirements of different exercise types.
 * 
 * Interactive learning support includes multiple exercise types that address
 * different learning styles and skills, flexible data structures that can
 * accommodate complex exercise configurations, and compact identification
 * that supports efficient exercise delivery and tracking in interactive
 * learning sessions.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Different exercise types with their data structures
 * const exerciseExamples = [
 *   {
 *     id: 'trans-001',
 *     exercise_type: 'translation',
 *     data: {
 *       source_text: 'Hello, how are you?',
 *       target_text: 'Hola, ¿cómo estás?',
 *       hints: ['greeting', 'question']
 *     }
 *   },
 *   {
 *     id: 'fill-002',
 *     exercise_type: 'fill-in-the-blank',
 *     data: {
 *       text: 'My name ___ Maria',
 *       blanks: [{ position: 8, answer: 'is', alternatives: ['are', 'am'] }]
 *     }
 *   },
 *   {
 *     id: 'pairs-003',
 *     exercise_type: 'pairs',
 *     data: {
 *       pairs: [
 *         { left: 'casa', right: 'house' },
 *         { left: 'agua', right: 'water' },
 *         { left: 'fuego', right: 'fire' }
 *       ]
 *     }
 *   }
 * ];
 * 
 * @example
 * // Exercise creation with type-specific validation
 * router.post('/exercises', 
 *   validate({ body: ExerciseSchema }), 
 *   async (req, res) => {
 *     const exerciseData = req.body; // Validated exercise data
 *     
 *     // Type-specific data validation
 *     switch (exerciseData.exercise_type) {
 *       case 'translation':
 *         if (!exerciseData.data.source_text || !exerciseData.data.target_text) {
 *           return res.status(400).json({ error: 'Translation exercises require source and target text' });
 *         }
 *         break;
 *       case 'pairs':
 *         if (!Array.isArray(exerciseData.data.pairs) || exerciseData.data.pairs.length < 2) {
 *           return res.status(400).json({ error: 'Pairs exercises require at least 2 pairs' });
 *         }
 *         break;
 *     }
 *     
 *     const exercise = await exerciseService.create(exerciseData);
 *     res.status(201).json({ exercise });
 *   }
 * );
 * 
 * @example
 * // Exercise completion and scoring
 * const exerciseResponseSchema = z.object({
 *   exerciseId: z.string(),
 *   userResponse: JsonSchema,
 *   timeSpent: z.number().min(0)
 * });
 * 
 * router.post('/exercises/:exerciseId/submit', 
 *   validate({ body: exerciseResponseSchema }), 
 *   async (req, res) => {
 *     const { userResponse, timeSpent } = req.body;
 *     const exercise = await exerciseService.findById(req.params.exerciseId);
 *     
 *     // Type-specific scoring logic
 *     const score = await scoringService.evaluateResponse(
 *       exercise.exercise_type,
 *       exercise.data,
 *       userResponse
 *     );
 *     
 *     res.json({ score, timeSpent, correct: score >= 70 });
 *   }
 * );
 */
export const ExerciseSchema = z.object({
  id: z
    .string()
    .max(15, 'Exercise ID cannot exceed 15 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Exercise ID can only contain lowercase letters, numbers, and hyphens'
    ),
  exercise_type: z.enum([
    'translation',
    'fill-in-the-blank',
    'vof',
    'pairs',
    'informative',
    'ordering',
  ]),
  data: JsonSchema,
});

/**
 * Lesson-Exercise assignment validation schema for content organization
 * 
 * Validation schema for assigning exercises to lessons with proper ordering
 * and sequencing. This schema manages the many-to-many relationship between
 * lessons and exercises, allowing exercises to be reused across multiple
 * lessons while maintaining proper sequencing within each lesson context.
 * 
 * The assignment schema ensures proper exercise identification and maintains
 * sequential ordering for optimal learning progression. This flexibility
 * supports content reuse and adaptive learning paths while maintaining
 * pedagogical structure and user experience consistency.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Assigning exercises to a lesson
 * const lessonExercises = [
 *   { exercise_id: 'vocab-001', order: 1 },
 *   { exercise_id: 'trans-002', order: 2 },
 *   { exercise_id: 'fill-003', order: 3 }
 * ];
 * 
 * @example
 * // Exercise assignment endpoint
 * router.post('/lessons/:lessonId/exercises', 
 *   validate({ body: LessonExerciseSchema }), 
 *   async (req, res) => {
 *     const { exercise_id, order } = req.body;
 *     const assignment = await lessonService.assignExercise(
 *       req.params.lessonId, 
 *       exercise_id, 
 *       order
 *     );
 *     res.status(201).json({ assignment });
 *   }
 * );
 */
export const LessonExerciseSchema = z.object({
  exercise_id: z.string().min(1, 'Exercise ID is required'),
  order: OrderSchema,
});

/**
 * Exercise reordering validation schema for content management
 * 
 * Validation schema for bulk reordering of exercises within lessons or
 * other content contexts. This schema supports content management operations
 * that require updating the sequence of multiple exercises simultaneously,
 * ensuring efficient content organization and user experience optimization.
 * 
 * The reordering schema validates that at least one exercise is included
 * in the reordering operation and ensures all exercise identifiers are
 * properly formatted. This supports batch operations that maintain content
 * integrity while allowing flexible content organization.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Reordering exercises in a lesson
 * const reorderData = {
 *   exercise_ids: ['vocab-003', 'trans-001', 'fill-002', 'pairs-004']
 * };
 * 
 * @example
 * // Exercise reordering endpoint
 * router.put('/lessons/:lessonId/exercises/reorder', 
 *   validate({ body: ExerciseReorderSchema }), 
 *   async (req, res) => {
 *     const { exercise_ids } = req.body;
 *     const reorderedExercises = await lessonService.reorderExercises(
 *       req.params.lessonId, 
 *       exercise_ids
 *     );
 *     res.json({ exercises: reorderedExercises });
 *   }
 * );
 * 
 * @example
 * // Batch exercise management
 * const batchUpdateSchema = z.object({
 *   operations: z.array(z.union([
 *     z.object({ type: z.literal('reorder'), data: ExerciseReorderSchema }),
 *     z.object({ type: z.literal('assign'), data: LessonExerciseSchema })
 *   ]))
 * });
 */
export const ExerciseReorderSchema = z.object({
  exercise_ids: z
    .array(z.string().min(1, 'Exercise ID is required'))
    .min(1, 'At least one exercise ID is required'),
});

/**
 * Content query parameters validation schema for content discovery and filtering
 * 
 * Comprehensive validation schema for query parameters used in content discovery,
 * search, and filtering operations across the learning platform. This schema
 * combines standard pagination functionality with content-specific filtering
 * options, supporting efficient content browsing and discovery while maintaining
 * performance and security constraints.
 * 
 * The query schema includes pagination controls for efficient data loading,
 * content-specific filters for targeted discovery, search functionality for
 * text-based content finding, and language-based filtering for multilingual
 * content organization. All parameters are optional to support flexible
 * querying patterns.
 * 
 * Performance considerations include pagination limits to prevent excessive
 * resource consumption, optional parameters to reduce query complexity,
 * and efficient filtering options that support database indexing and
 * optimization strategies.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Content discovery with multiple filters
 * const contentQuery = {
 *   page: '1',
 *   limit: '20',
 *   sortBy: 'name',
 *   sortOrder: 'asc',
 *   is_public: 'true',
 *   search: 'beginner spanish',
 *   source_language: 'en',
 *   target_language: 'es'
 * };
 * 
 * const validatedQuery = ContentQuerySchema.parse(contentQuery);
 * // Result: { page: 1, limit: 20, sortBy: 'name', sortOrder: 'asc', is_public: true, ... }
 * 
 * @example
 * // Content search endpoint with comprehensive filtering
 * router.get('/content/search', 
 *   validate({ query: ContentQuerySchema }), 
 *   async (req, res) => {
 *     const { 
 *       page, 
 *       limit, 
 *       sortBy, 
 *       sortOrder, 
 *       is_public, 
 *       search, 
 *       source_language, 
 *       target_language 
 *     } = req.query;
 *     
 *     const searchOptions = {
 *       skip: (page - 1) * limit,
 *       take: limit,
 *       where: {
 *         ...(is_public !== undefined && { is_public }),
 *         ...(source_language && { source_language }),
 *         ...(target_language && { target_language }),
 *         ...(search && {
 *           OR: [
 *             { name: { contains: search, mode: 'insensitive' } },
 *             { description: { contains: search, mode: 'insensitive' } }
 *           ]
 *         })
 *       },
 *       orderBy: sortBy ? { [sortBy]: sortOrder } : { created_at: 'desc' }
 *     };
 *     
 *     const content = await contentService.findMany(searchOptions);
 *     res.json({ content, pagination: { page, limit, sortBy, sortOrder } });
 *   }
 * );
 * 
 * @example
 * // Language-specific content filtering
 * const languageQuery = {
 *   source_language: 'qu',  // Quechua content
 *   target_language: 'es-PE', // For Peruvian Spanish speakers
 *   is_public: 'true',
 *   limit: '50'
 * };
 * 
 * @example
 * // Content management dashboard queries
 * const adminQuery = {
 *   page: '1',
 *   limit: '100',
 *   sortBy: 'updated_at',
 *   sortOrder: 'desc',
 *   is_public: 'false', // Private content only
 *   search: 'draft'
 * };
 * 
 * @example
 * // Mobile app content loading with pagination
 * const mobileQuery = {
 *   page: '1',
 *   limit: '10', // Smaller batches for mobile
 *   is_public: 'true',
 *   source_language: userPreferences.nativeLanguage,
 *   target_language: userPreferences.learningLanguage
 * };
 */
export const ContentQuerySchema = z
  .object({
    // Include base pagination fields
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    // Add content-specific fields
    is_public: BooleanStringSchema,
    search: z.string().optional(),
    source_language: z.string().optional(),
    target_language: z.string().optional(),
  })
  .refine(
    (data) => {
      return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
    },
    {
      message: 'Page must be >= 1 and limit must be between 1 and 100',
    }
  );

/**
 * TypeScript type definitions inferred from content validation schemas
 * 
 * These type definitions provide compile-time type safety for content-related
 * operations throughout the application. They are automatically inferred from
 * the corresponding Zod schemas, ensuring that TypeScript types remain
 * synchronized with runtime validation rules and preventing type/validation
 * mismatches in content management operations.
 * 
 * The types enable full type safety in content management systems, API
 * endpoints, service methods, and client-side code while maintaining a
 * single source of truth for validation rules. They support IDE autocompletion,
 * compile-time error detection, and refactoring safety across the entire
 * content management system.
 * 
 * @example
 * // Using types in content service methods
 * class ContentService {
 *   async createCourse(data: CourseRequest): Promise<Course> {
 *     // data is fully typed with all validation constraints
 *     return await this.courseRepository.create(data);
 *   }
 * 
 *   async createLesson(data: LessonRequest): Promise<Lesson> {
 *     // experience_points has default value, order is validated
 *     return await this.lessonRepository.create(data);
 *   }
 * }
 * 
 * @example
 * // Using types in API request handlers
 * const createExerciseHandler = async (req: Request<{}, {}, ExerciseRequest>) => {
 *   const { id, exercise_type, data } = req.body; // Fully typed
 *   // Implementation here
 * };
 */

/**
 * Type definition for course creation and management data
 * 
 * Represents the structure of validated course data including identification,
 * language configuration, descriptive content, and visibility settings.
 * This type ensures type safety for course operations while enforcing
 * educational constraints and security requirements.
 * 
 * @type {Object}
 * @property {string} id - URL-safe course identifier (max 20 chars, lowercase, numbers, hyphens)
 * @property {string} source_language - BCP 47 language code for source language
 * @property {string} target_language - BCP 47 language code for target language (must differ from source)
 * @property {string} name - Course name (1-100 characters)
 * @property {string} [description] - Optional course description (max 1000 characters)
 * @property {boolean} is_public - Course visibility (default: true)
 */
export type CourseRequest = z.infer<typeof CourseSchema>;

/**
 * Type definition for level creation and management data
 * 
 * Represents the structure of validated level data for organizing course
 * content into difficulty or proficiency stages with proper identification
 * and sequencing.
 * 
 * @type {Object}
 * @property {string} id - URL-safe level identifier (max 30 chars)
 * @property {string} code - Short level code for display (1-10 chars)
 * @property {string} name - Level name (1-100 characters)
 * @property {number} order - Positive integer for level sequencing
 */
export type LevelRequest = z.infer<typeof LevelSchema>;

/**
 * Type definition for section creation and management data
 * 
 * Represents the structure of validated section data for organizing
 * content into thematic units within levels.
 * 
 * @type {Object}
 * @property {string} id - URL-safe section identifier (max 40 chars)
 * @property {string} name - Section name (1-150 characters)
 * @property {number} order - Positive integer for section sequencing
 */
export type SectionRequest = z.infer<typeof SectionSchema>;

/**
 * Type definition for module creation and management data
 * 
 * Represents the structure of validated module data for specific learning
 * activities with type categorization and proper sequencing.
 * 
 * @type {Object}
 * @property {string} id - URL-safe module identifier (max 50 chars)
 * @property {'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam'} module_type - Module type for pedagogical categorization
 * @property {string} name - Module name (1-150 characters)
 * @property {number} order - Positive integer for module sequencing
 */
export type ModuleRequest = z.infer<typeof ModuleSchema>;

/**
 * Type definition for lesson creation and management data
 * 
 * Represents the structure of validated lesson data for individual learning
 * units with gamification support and proper sequencing.
 * 
 * @type {Object}
 * @property {string} id - URL-safe lesson identifier (max 60 chars)
 * @property {number} experience_points - Non-negative experience points for gamification (default: 10)
 * @property {number} order - Positive integer for lesson sequencing
 */
export type LessonRequest = z.infer<typeof LessonSchema>;

/**
 * Type definition for exercise creation and management data
 * 
 * Represents the structure of validated exercise data for interactive
 * learning activities with flexible data structures.
 * 
 * @type {Object}
 * @property {string} id - URL-safe exercise identifier (max 15 chars)
 * @property {'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering'} exercise_type - Exercise type for activity categorization
 * @property {Object | Array} data - Flexible JSON data structure for exercise content
 */
export type ExerciseRequest = z.infer<typeof ExerciseSchema>;

/**
 * Type definition for lesson-exercise assignment data
 * 
 * Represents the structure of validated data for assigning exercises
 * to lessons with proper ordering.
 * 
 * @type {Object}
 * @property {string} exercise_id - Exercise identifier for assignment
 * @property {number} order - Positive integer for exercise sequencing within lesson
 */
export type LessonExerciseRequest = z.infer<typeof LessonExerciseSchema>;

/**
 * Type definition for exercise reordering operations
 * 
 * Represents the structure of validated data for bulk reordering
 * of exercises within content contexts.
 * 
 * @type {Object}
 * @property {string[]} exercise_ids - Array of exercise identifiers in desired order (minimum 1)
 */
export type ExerciseReorderRequest = z.infer<typeof ExerciseReorderSchema>;

/**
 * Type definition for content query and filtering parameters
 * 
 * Represents the structure of validated query parameters for content
 * discovery, search, and filtering operations with pagination support.
 * 
 * @type {Object}
 * @property {number} page - Page number for pagination (minimum 1, default: 1)
 * @property {number} limit - Results per page (1-100, default: 20)
 * @property {string} [sortBy] - Optional field name for sorting
 * @property {'asc' | 'desc'} sortOrder - Sort direction (default: 'asc')
 * @property {boolean} [is_public] - Optional visibility filter
 * @property {string} [search] - Optional text search query
 * @property {string} [source_language] - Optional source language filter
 * @property {string} [target_language] - Optional target language filter
 */
export type ContentQueryParams = z.infer<typeof ContentQuerySchema>;