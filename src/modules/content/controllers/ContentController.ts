import { Request, Response, NextFunction } from "express";
import { ContentService } from "../services";
import { PrismaClient } from "@prisma/client";
import {
    CreateCourseSchema,
    CreateLevelDto,
    CreateSectionDto,
    CreateModuleDto,
    CourseQuery,
    LevelQuery,
    SectionQuery,
    ModuleQuery,
} from "../schemas";
import { ApiResponse, ErrorCodes, HttpStatus } from "../../../shared/types";
import { AppError } from "@/shared/middleware";

export class ContentController {
    private contentService: ContentService;

    constructor(prisma: PrismaClient) {
        this.contentService = new ContentService(prisma);
    }

    // Course endpoints
    createCourse = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const validatedData = CreateCourseSchema.parse(req.body);
            // Handle optional properties for exactOptionalPropertyTypes
            const courseData = {
                ...validatedData,
                ...(validatedData.description && {
                    description: validatedData.description,
                }),
            };
            const course = await this.contentService.createCourse(courseData);

            const response: ApiResponse = {
                data: course,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    getCourse = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const course = await this.contentService.getCourse(id);
            const response: ApiResponse = {
                data: course,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    getCourses = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const query: CourseQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "desc",
                filters: {
                    ...(query.source_language && {
                        source_language: query.source_language,
                    }),
                    ...(query.target_language && {
                        target_language: query.target_language,
                    }),
                    ...(query.is_public !== undefined && { is_public: query.is_public }),
                },
            };

            const result = await this.contentService.getCourses(options);

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

    updateCourse = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }

            const updateData = req.body;
            const course = await this.contentService.updateCourse(id, updateData);

            const response: ApiResponse = {
                data: course,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    deleteCourse = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            await this.contentService.deleteCourse(id);

            const response: ApiResponse = {
                success: true,
                message: "Course deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };

    getPackagedCourse = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const packagedCourse = await this.contentService.getPackagedCourse(id);

            const response: ApiResponse = {
                data: packagedCourse,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    // Level endpoints
    createLevel = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { courseId } = req.params;
            if (!courseId) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const levelData: CreateLevelDto = { ...req.body, course_id: courseId };
            const level = await this.contentService.createLevel(levelData);

            const response: ApiResponse = {
                data: level,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    getLevel = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const level = await this.contentService.getLevel(id);

            const response: ApiResponse = {
                data: level,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    getLevelsByCourse = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { courseId } = req.params;
            if (!courseId) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const query: LevelQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "asc",
            };

            const result = await this.contentService.getLevelsByCourse(
                courseId,
                options,
            );

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

    updateLevel = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const updateData = req.body;
            const level = await this.contentService.updateLevel(id, updateData);

            const response: ApiResponse = {
                data: level,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    deleteLevel = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            await this.contentService.deleteLevel(id);

            const response: ApiResponse = {
                success: true,
                message: "Level deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };

    // Section endpoints
    createSection = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { levelId } = req.params;
            if (!levelId) {
                throw new AppError(
                    "Level ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const sectionData: CreateSectionDto = { ...req.body, level_id: levelId };
            const section = await this.contentService.createSection(sectionData);

            const response: ApiResponse = {
                data: section,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    getSection = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const section = await this.contentService.getSection(id);

            const response: ApiResponse = {
                data: section,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    getSectionsByLevel = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { levelId } = req.params;
            if (!levelId) {
                throw new AppError(
                    "Level ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const query: SectionQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "asc",
            };

            const result = await this.contentService.getSectionsByLevel(
                levelId,
                options,
            );

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

    updateSection = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const updateData = req.body;
            const section = await this.contentService.updateSection(id, updateData);

            const response: ApiResponse = {
                data: section,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    deleteSection = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            await this.contentService.deleteSection(id);

            const response: ApiResponse = {
                success: true,
                message: "Section deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };

    // Module endpoints
    createModule = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { sectionId } = req.params;
            if (!sectionId) {
                throw new AppError(
                    "Section ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const moduleData: CreateModuleDto = {
                ...req.body,
                section_id: sectionId,
            };
            const module = await this.contentService.createModule(moduleData);

            const response: ApiResponse = {
                data: module,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    getModule = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const module = await this.contentService.getModule(id);

            const response: ApiResponse = {
                data: module,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    getModulesBySection = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { sectionId } = req.params;
            if (!sectionId) {
                throw new AppError(
                    "Section ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const query: ModuleQuery = req.query as any;
            const options = {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                ...(query.sortBy && { sortBy: query.sortBy }),
                sortOrder: query.sortOrder ?? "asc",
                filters: {
                    ...(query.module_type && { module_type: query.module_type }),
                },
            };

            const result = await this.contentService.getModulesBySection(
                sectionId,
                options,
            );

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

    updateModule = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            const updateData = req.body;
            const module = await this.contentService.updateModule(id, updateData);

            const response: ApiResponse = {
                data: module,
                success: true,
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    deleteModule = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new AppError(
                    "Course ID is required in URL parameters.",
                    HttpStatus.BAD_REQUEST,
                    ErrorCodes.VALIDATION_ERROR,
                );
            }
            await this.contentService.deleteModule(id);

            const response: ApiResponse = {
                success: true,
                message: "Module deleted successfully",
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.NO_CONTENT).json(response);
        } catch (error) {
            next(error);
        }
    };
}
