// src/modules/content/controllers/ExerciseController.ts

/**
 * HTTP controller for comprehensive exercise management within the WayrApp language learning platform.
 * 
 * This controller serves as the primary REST API interface for exercise operations, providing complete
 * CRUD functionality for all supported exercise types within the content management system. It handles
 * HTTP request processing, parameter validation, authentication integration, and response formatting
 * for all exercise-related endpoints in the WayrApp backend architecture.
 * 
 * The controller manages six distinct exercise types that form the core interactive elements of the
 * language learning experience: translation exercises for source-to-target language conversion,
 * fill-in-the-blank exercises for text completion with multiple blanks, VOF (Verification of Facts)
 * exercises for true/false statements, pairs exercises for matching left-right associations,
 * informative exercises for content display and learning material presentation, and ordering
 * exercises for sequence arrangement and logical ordering tasks.
 * 
 * Key architectural responsibilities include HTTP request processing for exercise CRUD operations,
 * parameter extraction and validation from URL paths and request bodies, authentication and
 * authorization enforcement through middleware integration, standardized API response formatting,
 * comprehensive error handling with proper HTTP status codes, exercise type conversion for internal
 * consistency (dash-to-underscore normalization), pagination support for exercise retrieval operations,
 * and type-specific filtering capabilities for targeted exercise queries.
 * 
 * The controller follows RESTful conventions and provides endpoints for creating exercises with
 * type-specific validation, retrieving individual exercises and paginated exercise lists,
 * filtering exercises by specific types with pagination support, updating exercise properties
 * with comprehensive validation, and deleting exercises with dependency management. All operations
 * integrate seamlessly with the service layer for business logic processing and maintain consistent
 * response formatting across all endpoints.
 * 
 * @module ExerciseController
 * @category Controllers
 * @category Content
 * @category Exercise
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize controller with Prisma client and integrate with Express routes
 * import { Router } from 'express';
 * import { PrismaClient } from '@prisma/client';
 * import { ExerciseController } from './ExerciseController';
 * 
 * const router = Router();
 * const prisma = new PrismaClient();
 * const exerciseController = new ExerciseController(prisma);
 * 
 * // Exercise CRUD endpoints
 * router.post('/exercises', exerciseController.createExercise);
 * router.get('/exercises/:id', exerciseController.getExercise);
 * router.get('/exercises', exerciseController.getExercises);
 * router.put('/exercises/:id', exerciseController.updateExercise);
 * router.delete('/exercises/:id', exerciseController.deleteExercise);
 * 
 * // Type-specific filtering endpoint
 * router.get('/exercises/type/:type', exerciseController.getExercisesByType);
 */

import { Request, Response, NextFunction } from "express";
import { ExerciseService } from "../services";
import { PrismaClient } from "@prisma/client";
import {
    CreateExerciseSchema,
    UpdateExerciseSchema,
    ExerciseQuery,
} from "../schemas";
import { CreateExerciseDto } from "../types";
import { ApiResponse, ErrorCodes, HttpStatus } from "../../../shared/types";
import { AppError } from "@/shared/middleware";

/**
 * HTTP controller class for comprehensive exercise management operations within the WayrApp content system.
 * 
 * Provides RESTful API endpoints for exercise CRUD operations across all supported exercise types,
 * maintains proper HTTP response formatting with comprehensive error handling, and integrates with
 * Express middleware for authentication, validation, and error propagation.
 */
export class ExerciseController {
    private exerciseService: ExerciseService;

    /**
     * Initializes the ExerciseController with required service dependencies.
     * 
     * @param {PrismaClient} prisma - Prisma database client for service layer initialization
     */
    constructor(prisma: PrismaClient) {
        this.exerciseService = new ExerciseService(prisma);
    }

    /**
     * Creates a new exercise with comprehensive validation and type-specific data verification.
     * 
     * Validates request body against CreateExerciseSchema, performs exercise type conversion for
     * internal consistency (dash-to-underscore normalization), delegates exercise creation to the
     * service layer, and returns a standardized API response with HTTP 201 status on successful creation.
     * 
     * @param {Request} req - Express request object containing exercise data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {Error} When request body validation fails against CreateExerciseSchema
     * @throws {Error} When service layer exercise creation fails or validation errors occur
     * 
     * @example
     * // POST /api/exercises
     * // Request body: { "id": "exercise-translate-hello", "exercise_type": "translation", "data": { "source_text": "Hello", "target_text": "Hola" } }
     * // Response: { "data": { exercise object }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    createExercise = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const validatedData = CreateExerciseSchema.parse(req.body);
            // Convert exercise type from frontend format (dashes) to Prisma enum format (underscores)
            const exerciseData = {
                ...validatedData,
                exercise_type: validatedData.exercise_type.replace(/-/g, '_') as any
            } as CreateExerciseDto;
            const exercise = await this.exerciseService.createExercise(exerciseData);

            // Convert exercise type back to frontend format (underscores to dashes)
            const formattedExercise = {
                ...exercise,
                exercise_type: exercise.exercise_type.replace(/_/g, '-') as any
            };

            const response: ApiResponse = {
                data: formattedExercise,
                success: true,
                message: 'Exercise created successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a single exercise by its unique identifier with comprehensive validation.
     * 
     * Extracts exercise ID from URL parameters, validates parameter presence, delegates exercise
     * retrieval to the service layer, and returns a standardized API response with HTTP 200
     * status containing the exercise data with type-specific information.
     * 
     * @param {Request} req - Express request object containing exercise ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When exercise ID is missing from URL parameters
     * @throws {Error} When service layer exercise retrieval fails or exercise not found
     * 
     * @example
     * // GET /api/exercises/exercise-translate-hello
     * // Response: { "data": { exercise object with type-specific data }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    getExercise = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Exercise ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const exercise = await this.exerciseService.getExercise(id);
            // Convert exercise type back to frontend format (underscores to dashes)
            const formattedExercise = {
                ...exercise,
                exercise_type: exercise.exercise_type.replace(/_/g, '-') as any
            };
            const response: ApiResponse = {
                data: formattedExercise,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves paginated exercises across all types with comprehensive query support.
     * 
     * Processes query parameters for pagination, sorting, and filtering options, delegates exercise
     * retrieval to the service layer, and returns a standardized API response with HTTP 200 status.
     * Includes pagination metadata in response headers for client consumption and supports filtering
     * by exercise type through query parameters.
     * 
     * @param {Request} req - Express request object containing query parameters for pagination and filtering
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {Error} When service layer exercise retrieval fails
     * 
     * @example
     * // GET /api/exercises?page=1&limit=10&sortBy=created_at&sortOrder=desc&exercise_type=translation
     * // Response headers: X-Total-Count, X-Total-Pages, X-Current-Page, X-Has-Next, X-Has-Prev
     * // Response: { "data": [exercise objects], "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    getExercises = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const query: ExerciseQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "desc",
                filters: {
                    ...(query.exercise_type && { exercise_type: query.exercise_type }),
                },
            };

            const result = await this.exerciseService.getExercises(options);

            // Convert exercise types back to frontend format (underscores to dashes)
            const formattedExercises = result.data.map(exercise => ({
                ...exercise,
                exercise_type: exercise.exercise_type.replace(/_/g, '-') as any
            }));

            const response: ApiResponse = {
                data: formattedExercises,
                meta: {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    totalPages: result.pagination.totalPages,
                },
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers for backward compatibility
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
     * Retrieves paginated exercises filtered by a specific exercise type with query support.
     * 
     * Extracts exercise type from URL parameters, validates parameter presence, processes query
     * parameters for pagination and sorting, delegates type-specific exercise retrieval to the
     * service layer, and returns a standardized API response with HTTP 200 status. Includes
     * pagination metadata in response headers for client consumption.
     * 
     * @param {Request} req - Express request object containing exercise type in params and query options
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When exercise type is missing from URL parameters
     * @throws {Error} When service layer exercise retrieval fails or invalid exercise type provided
     * 
     * @example
     * // GET /api/exercises/type/translation?page=1&limit=5&sortBy=created_at&sortOrder=asc
     * // Response headers: X-Total-Count, X-Total-Pages, X-Current-Page, X-Has-Next, X-Has-Prev
     * // Response: { "data": [translation exercise objects], "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    getExercisesByType = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { type } = req.params;
            if (!type) {
                throw new AppError(
                    "Exercise type is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const query: ExerciseQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "desc",
            };

            // Convert exercise type from frontend format (dashes) to Prisma enum format (underscores)
            const convertedType = type.replace(/-/g, '_');
            const result = await this.exerciseService.getExercisesByType(convertedType, options);

            // Convert exercise types back to frontend format (underscores to dashes)
            const formattedExercises = result.data.map(exercise => ({
                ...exercise,
                exercise_type: exercise.exercise_type.replace(/_/g, '-') as any
            }));

            const response: ApiResponse = {
                data: formattedExercises,
                meta: {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    totalPages: result.pagination.totalPages,
                },
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers for backward compatibility
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
     * Updates an existing exercise with partial data and comprehensive validation.
     * 
     * Extracts exercise ID from URL parameters, validates request body against UpdateExerciseSchema,
     * performs exercise type conversion for internal consistency when type is updated, delegates
     * exercise update to the service layer, and returns a standardized API response with HTTP 200
     * status containing updated exercise data.
     * 
     * @param {Request} req - Express request object containing exercise ID in params and update data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When exercise ID is missing from URL parameters
     * @throws {Error} When request body validation fails against UpdateExerciseSchema
     * @throws {Error} When service layer exercise update fails or exercise not found
     * 
     * @example
     * // PUT /api/exercises/exercise-translate-hello
     * // Request body: { "data": { "source_text": "Hello world", "target_text": "Hola mundo" } }
     * // Response: { "data": { updated exercise object }, "success": true, "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    updateExercise = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Exercise ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const validatedData = UpdateExerciseSchema.parse(req.body);
            // Convert exercise type from frontend format (dashes) to Prisma enum format (underscores) and filter undefined
            const processedData = {
                ...validatedData,
                ...(validatedData.exercise_type && {
                    exercise_type: validatedData.exercise_type.replace(/-/g, '_') as any
                })
            };
            const exerciseData = Object.fromEntries(
                Object.entries(processedData).filter(([_, value]) => value !== undefined)
            ) as Partial<CreateExerciseDto>;
            const exercise = await this.exerciseService.updateExercise(id, exerciseData);

            // Convert exercise type back to frontend format (underscores to dashes)
            const formattedExercise = {
                ...exercise,
                exercise_type: exercise.exercise_type.replace(/_/g, '-') as any
            };

            const response: ApiResponse = {
                data: formattedExercise,
                success: true,
                message: 'Exercise updated successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Permanently deletes an exercise and removes it from all lesson assignments.
     * 
     * Extracts exercise ID from URL parameters, validates parameter presence, delegates exercise
     * deletion to the service layer, and returns a standardized API response with HTTP 204
     * status indicating successful deletion without content. This operation may cascade to
     * remove exercise assignments from lessons.
     * 
     * @param {Request} req - Express request object containing exercise ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling middleware
     * @returns {Promise<void>} Resolves when response is sent or error is passed to middleware
     * @throws {AppError} When exercise ID is missing from URL parameters
     * @throws {Error} When service layer exercise deletion fails or exercise not found
     * 
     * @example
     * // DELETE /api/exercises/exercise-translate-hello
     * // Response: { "success": true, "message": "Exercise deleted successfully", "timestamp": "2024-01-01T00:00:00.000Z" }
     */
    deleteExercise = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Exercise ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            await this.exerciseService.deleteExercise(id);

            const response: ApiResponse = {
                success: true,
                message: "Exercise deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };
}