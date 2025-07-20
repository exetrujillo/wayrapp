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

export class LessonController {
    private lessonService: LessonService;

    constructor(prisma: PrismaClient) {
        this.lessonService = new LessonService(prisma);
    }

    // Lesson CRUD endpoints
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

            const validatedData = CreateLessonSchema.parse(req.body);
            const lessonData: CreateLessonDto = { ...validatedData, module_id: moduleId };
            const lesson = await this.lessonService.createLesson(lessonData);

            const response: ApiResponse = {
                data: lesson,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    getLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const lesson = await this.lessonService.getLesson(id);
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

    updateLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
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
    
            const lesson = await this.lessonService.updateLesson(id, cleanUpdateData);

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

    deleteLesson = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Lesson ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            await this.lessonService.deleteLesson(id);

            const response: ApiResponse = {
                success: true,
                message: "Lesson deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };

    // Lesson-Exercise assignment endpoints
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
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

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

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };

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