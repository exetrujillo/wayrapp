import { Request, Response, NextFunction } from "express";
import { ExerciseService } from "../services";
import { PrismaClient } from "@prisma/client";
import {
    CreateExerciseSchema,
    UpdateExerciseSchema,
    ExerciseQuery,
} from "../schemas";
import { ApiResponse, ErrorCodes, HttpStatus } from "../../../shared/types";
import { AppError } from "@/shared/middleware";

export class ExerciseController {
    private exerciseService: ExerciseService;

    constructor(prisma: PrismaClient) {
        this.exerciseService = new ExerciseService(prisma);
    }

    // Exercise CRUD endpoints
    createExercise = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const validatedData = CreateExerciseSchema.parse(req.body);
            // Convert exercise type for internal consistency
            const exerciseData = {
                ...validatedData,
                exercise_type: validatedData.exercise_type.replace('-', '_') as any
            };
            const exercise = await this.exerciseService.createExercise(exerciseData);

            const response: ApiResponse = {
                data: exercise,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

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
            const response: ApiResponse = {
                data: exercise,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

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

            const result = await this.exerciseService.getExercisesByType(type, options);

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
            // Convert exercise type for internal consistency if provided
            const exerciseData = {
                ...validatedData,
                ...(validatedData.exercise_type && {
                    exercise_type: validatedData.exercise_type.replace('-', '_') as any
                })
            };
            const exercise = await this.exerciseService.updateExercise(id, exerciseData);

            const response: ApiResponse = {
                data: exercise,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

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

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };
}