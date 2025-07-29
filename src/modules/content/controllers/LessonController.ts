// src/modules/content/controllers/LessonController.ts

/**
 * HTTP controller for comprehensive lesson management within the WayrApp language learning platform.
 * 
 * This controller serves as the primary REST API interface for lesson operations, providing complete
 * CRUD functionality and exercise assignment management within the content management system. It handles
 * HTTP request processing, parameter validation, authentication integration, and response formatting
 * for all lesson-related endpoints in the WayrApp backend architecture.
 * 
 * The controller manages lessons as part of the hierarchical content structure: Course → Level → Section → Module → Lesson → Exercise.
 * Each lesson belongs to a specific module and can contain multiple exercises in a defined order.
 * The controller integrates seamlessly with Express middleware for authentication, authorization,
 * validation, and error handling while delegating business logic to the service layer.
 * 
 * Key architectural responsibilities include HTTP request processing for lesson CRUD operations,
 * parameter extraction and validation from URL paths and request bodies, authentication and
 * authorization enforcement through middleware integration, standardized API response formatting,
 * comprehensive error handling with proper HTTP status codes, exercise-to-lesson assignment management,
 * and pagination support for lesson retrieval operations.
 * 
 * The controller follows RESTful conventions and provides endpoints for creating lessons within modules,
 * retrieving individual lessons and paginated lesson lists, updating lesson properties with validation,
 * deleting lessons with dependency management, assigning exercises to lessons with order management,
 * retrieving lesson exercises in their defined sequence, unassigning exercises from lessons,
 * and reordering exercises within lessons.
 * 
 * @module LessonController
 * @category Controllers
 * @category Content
 * @category Lesson
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize controller with Prisma client and integrate with Express routes
 * import { Router } from 'express';
 * import { PrismaClient } from '@prisma/client';
 * import { LessonController } from './LessonController';
 * 
 * const router = Router();
 * const prisma = new PrismaClient();
 * const lessonController = new LessonController(prisma);
 * 
 * // Lesson CRUD endpoints
 * router.post('/modules/:moduleId/lessons', lessonController.createLesson);
 * router.get('/modules/:moduleId/lessons/:id', lessonController.getLesson);
 * router.get('/modules/:moduleId/lessons', lessonController.getLessonsByModule);
 * router.put('/modules/:moduleId/lessons/:id', lessonController.updateLesson);
 * router.delete('/modules/:moduleId/lessons/:id', lessonController.deleteLesson);
 * 
 * // Exercise assignment endpoints
 * router.get('/lessons/:lessonId/exercises', lessonController.getLessonExercises);
 * router.post('/lessons/:lessonId/exercises', lessonController.assignExerciseToLesson);
 * router.delete('/lessons/:lessonId/exercises/:exerciseId', lessonController.unassignExerciseFromLesson);
 * router.put('/lessons/:lessonId/exercises/reorder', lessonController.reorderLessonExercises);
 */

import { Request, Response, NextFunction } from "express";
import { LessonService } from "../services";
import { PrismaClient } from "@prisma/client";
import {
    CreateLessonSchema,
    UpdateLessonSchema,
    LessonQuery,
    AssignExerciseToLessonSchema,
    ReorderExercisesSchema,
    CreateLessonDto,
} from "../schemas";
import { ApiResponse, ErrorCodes, HttpStatus } from "../../../shared/types";
import { AppError } from "@/shared/middleware";

/**
 * HTTP controller class for comprehensive lesson management operations within the WayrApp content system.
 * 
 * Provides RESTful API endpoints for lesson CRUD operations, exercise assignment management, and
 * maintains proper HTTP response formatting with comprehensive error handling. Integrates with
 * Express middleware for authentication, validation, and error propagation.
 */
export class LessonController {
    private lessonService: LessonService;

    /**
     * Initializes the LessonController with required service dependencies.
     * 
     * @param {PrismaClient} prisma - Prisma database client for service layer initialization
     */
    constructor(prisma: PrismaClient) {
        this.lessonService = new LessonService(prisma);
    }

    /**
     * Creates a new lesson within a specified module with comprehensive validation.
     * 
     * Extracts module ID from URL parameters, validates request body against CreateLessonSchema,
     * delegates lesson creation to the service layer, and returns a standardized API response
     * with HTTP 201 status on successful creation.
     * 
     * @param {Request} req - Express request object containing moduleId in params and lesson data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When module ID is missing from URL parameters
     * @throws {Error} When request body validation fails against CreateLessonSchema
     * @throws {Error} When service layer lesson creation fails
     * 
     * @example
     * // POST /api/modules/module-greetings/lessons
     * // Request body: { "id": "lesson-basic-intro", "experience_points": 50, "order": 1 }
     * // Response: { "data": { lesson object }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    createLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { moduleId } = req.params;
            if (!moduleId) {
                throw new AppError(
                    "Module ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const validatedData = CreateLessonSchema.omit({ module_id: true }).parse(req.body);
            const lessonData = { ...validatedData, module_id: moduleId } as CreateLessonDto;
            const lesson = await this.lessonService.createLesson(lessonData);

            const response: ApiResponse = {
                data: lesson,
                success: true,
                message: 'Lesson created successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a single lesson by its unique identifier with comprehensive validation.
     * Uses composite key lookup to prevent horizontal access vulnerabilities.
     * 
     * Extracts lesson ID and module ID from URL parameters, validates parameter presence, delegates lesson
     * retrieval to the service layer, and returns a standardized API response with HTTP 200
     * status containing the lesson data.
     * 
     * @param {Request} req - Express request object containing lesson ID and module ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID or module ID is missing from URL parameters
     * @throws {Error} When service layer lesson retrieval fails or lesson not found
     * 
     * @example
     * // GET /api/modules/module-greetings/lessons/lesson-basic-intro
     * // Response: { "data": { lesson object }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    getLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id: lessonId, moduleId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            if (!moduleId) {
                throw new AppError(
                    "Module ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const lesson = await this.lessonService.getLesson(lessonId, moduleId);
            const response: ApiResponse = {
                data: lesson,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves paginated lessons belonging to a specific module with query support.
     * 
     * Extracts module ID from URL parameters, processes query parameters for pagination and sorting,
     * delegates lesson retrieval to the service layer, and returns a standardized API response with
     * HTTP 200 status. Includes pagination metadata in response headers for client consumption.
     * 
     * @param {Request} req - Express request object containing moduleId in params and query options
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When module ID is missing from URL parameters
     * @throws {Error} When service layer lesson retrieval fails or module not found
     * 
     * @example
     * // GET /api/modules/module-greetings/lessons?page=1&limit=10&sortBy=order&sortOrder=asc
     * // Response headers: X-Total-Count, X-Total-Pages, X-Current-Page, X-Has-Next, X-Has-Prev
     * // Response: { "data": [lesson objects], "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    getLessonsByModule = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { moduleId } = req.params;
            if (!moduleId) {
                throw new AppError(
                    "Module ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const query: LessonQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "asc",
            };

            const result = await this.lessonService.getLessonsByModule(moduleId, options);

            const response: ApiResponse = {
                data: result.data,
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers
            res.set({
                "X-Total-Count": result.pagination.total.toString(),
                "X-Total-Pages": result.pagination.totalPages.toString(),
                "X-Current-Page": result.pagination.page.toString(),
                "X-Has-Next": result.pagination.hasNext.toString(),
                "X-Has-Prev": result.pagination.hasPrev.toString(),
            });

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Updates an existing lesson with partial data and comprehensive validation.
     * Uses composite key lookup to prevent horizontal access vulnerabilities.
     * 
     * Extracts lesson ID and module ID from URL parameters, validates request body against UpdateLessonSchema,
     * filters out undefined values from update data, delegates lesson update to the service layer,
     * and returns a standardized API response with HTTP 200 status containing updated lesson data.
     * 
     * @param {Request} req - Express request object containing lesson ID and module ID in params and update data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID or module ID is missing from URL parameters
     * @throws {Error} When request body validation fails against UpdateLessonSchema
     * @throws {Error} When service layer lesson update fails or lesson not found
     * 
     * @example
     * // PUT /api/modules/module-greetings/lessons/lesson-basic-intro
     * // Request body: { "experience_points": 75, "order": 2 }
     * // Response: { "data": { updated lesson object }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    updateLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id: lessonId, moduleId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            if (!moduleId) {
                throw new AppError(
                    "Module ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const validatedData = UpdateLessonSchema.parse(req.body);

            const cleanUpdateData: { [key: string]: any } = {};
            for (const key in validatedData) {
                if (validatedData[key as keyof typeof validatedData] !== undefined) {
                    cleanUpdateData[key] = validatedData[key as keyof typeof validatedData];
                }
            }
    
            const lesson = await this.lessonService.updateLesson(lessonId, moduleId, cleanUpdateData);

            const response: ApiResponse = {
                data: lesson,
                success: true,
                message: 'Lesson updated successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Permanently deletes a lesson and all its associated exercise assignments.
     * Uses composite key lookup to prevent horizontal access vulnerabilities.
     * 
     * Extracts lesson ID and module ID from URL parameters, validates parameter presence, delegates lesson
     * deletion to the service layer, and returns a standardized API response with HTTP 204
     * status indicating successful deletion without content.
     * 
     * @param {Request} req - Express request object containing lesson ID and module ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID or module ID is missing from URL parameters
     * @throws {Error} When service layer lesson deletion fails or lesson not found
     * 
     * @example
     * // DELETE /api/modules/module-greetings/lessons/lesson-basic-intro
     * // Response: { "success": true, "message": "Lesson deleted successfully", "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    deleteLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id: lessonId, moduleId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            if (!moduleId) {
                throw new AppError(
                    "Module ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            await this.lessonService.deleteLesson(lessonId, moduleId);

            const response: ApiResponse = {
                success: true,
                message: "Lesson deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Assigns an exercise to a lesson at a specific order position with comprehensive validation.
     * 
     * Extracts lesson ID from URL parameters, validates request body against AssignExerciseToLessonSchema,
     * delegates exercise assignment to the service layer, and returns a standardized API response
     * with HTTP 201 status containing the created lesson-exercise assignment relationship.
     * 
     * @param {Request} req - Express request object containing lessonId in params and assignment data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID is missing from URL parameters
     * @throws {Error} When request body validation fails against AssignExerciseToLessonSchema
     * @throws {Error} When service layer exercise assignment fails
     * 
     * @example
     * // POST /api/lessons/lesson-basic-intro/exercises
     * // Request body: { "exercise_id": "exercise-translate-hello", "order": 1 }
     * // Response: { "data": { lesson-exercise assignment }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    assignExerciseToLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { lessonId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const validatedData = AssignExerciseToLessonSchema.parse(req.body);
            const lessonExercise = await this.lessonService.assignExerciseToLesson(
                lessonId,
                validatedData
            );

            const response: ApiResponse = {
                data: lessonExercise,
                success: true,
                message: 'Exercise assigned to lesson successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Removes an exercise assignment from a lesson with comprehensive validation.
     * 
     * Extracts lesson ID and exercise ID from URL parameters, validates parameter presence,
     * delegates exercise unassignment to the service layer, and returns a standardized API
     * response with HTTP 204 status indicating successful removal without content.
     * 
     * @param {Request} req - Express request object containing lessonId and exerciseId in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID is missing from URL parameters
     * @throws {AppError} When exercise ID is missing from URL parameters
     * @throws {Error} When service layer exercise unassignment fails
     * 
     * @example
     * // DELETE /api/lessons/lesson-basic-intro/exercises/exercise-translate-hello
     * // Response: { "success": true, "message": "Exercise unassigned from lesson successfully", "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    unassignExerciseFromLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { lessonId, exerciseId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            if (!exerciseId) {
                throw new AppError(
                    "Exercise ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            await this.lessonService.unassignExerciseFromLesson(lessonId, exerciseId);

            const response: ApiResponse = {
                success: true,
                message: "Exercise unassigned from lesson successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves all exercises assigned to a specific lesson in their defined order.
     * 
     * Extracts lesson ID from URL parameters, validates parameter presence, delegates exercise
     * retrieval to the service layer, and returns a standardized API response with HTTP 200
     * status containing the ordered list of lesson-exercise assignments.
     * 
     * @param {Request} req - Express request object containing lessonId in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID is missing from URL parameters
     * @throws {Error} When service layer exercise retrieval fails or lesson not found
     * 
     * @example
     * // GET /api/lessons/lesson-basic-intro/exercises
     * // Response: { "data": [lesson-exercise assignments], "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    getLessonExercises = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { lessonId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const exercises = await this.lessonService.getLessonExercises(lessonId);

            const response: ApiResponse = {
                data: exercises,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Reorders exercises within a lesson by updating their position sequence.
     * 
     * Extracts lesson ID from URL parameters, validates request body against ReorderExercisesSchema,
     * delegates exercise reordering to the service layer, and returns a standardized API response
     * with HTTP 200 status indicating successful reordering operation.
     * 
     * @param {Request} req - Express request object containing lessonId in params and exercise_ids array in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When lesson ID is missing from URL parameters
     * @throws {Error} When request body validation fails against ReorderExercisesSchema
     * @throws {Error} When service layer exercise reordering fails
     * 
     * @example
     * // PUT /api/lessons/lesson-basic-intro/exercises/reorder
     * // Request body: { "exercise_ids": ["exercise-translate-hello", "exercise-fill-blank", "exercise-match"] }
     * // Response: { "success": true, "message": "Lesson exercises reordered successfully", "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    reorderLessonExercises = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { lessonId } = req.params;
            if (!lessonId) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const validatedData = ReorderExercisesSchema.parse(req.body);
            await this.lessonService.reorderLessonExercises(
                lessonId,
                validatedData.exercise_ids
            );

            const response: ApiResponse = {
                success: true,
                message: "Lesson exercises reordered successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };
}