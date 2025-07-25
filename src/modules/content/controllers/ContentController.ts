import { Request, Response, NextFunction } from "express";
import { ContentService } from "../services";
import { PrismaClient } from "@prisma/client";
import {
    CreateCourseSchema,
    CreateLevelDto,
    CreateSectionDto,
    CreateModuleDto
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
            console.log('--- GET /courses Controller ---');
            console.log('Request received. Query params:', req.query);
            console.log('Request pagination middleware data:', req.pagination);
            
            // Use pagination middleware data if available, otherwise fallback to query params
            const options = req.pagination || {
                page: 1,
                limit: 20,
                sortOrder: "desc",
                filters: {}
            };
            
            // Add search parameter if provided
            if (req.query['search']) {
                options.search = req.query['search'] as string;
            }

            console.log('Final options passed to service:', JSON.stringify(options, null, 2));

            const result = await this.contentService.getCourses(options);

            console.log('Data received from service:', result);
            console.log(`Service returned ${result.data.length} courses`);
            console.log('First course (if any):', result.data[0]);

            const response: ApiResponse = {
                data: result.data,
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers using the enhanced helper
            const { addPaginationHeaders } = await import("../../../shared/middleware/pagination");
            addPaginationHeaders(res, result.pagination);

            console.log('Sending response with status 200');
            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            console.error('Error in getCourses controller:', error);
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

            // Get If-Modified-Since header for conditional requests
            const ifModifiedSince = req.headers['if-modified-since'] as string;
            
            const packagedCourse = await this.contentService.getPackagedCourse(id, ifModifiedSince);

            // If packagedCourse is null, it means content hasn't been modified
            if (packagedCourse === null) {
                res.status(HttpStatus.NOT_MODIFIED).end();
                return;
            }

            // Set caching headers
            res.set({
                'Last-Modified': new Date(packagedCourse.package_version).toUTCString(),
                'Cache-Control': 'public, max-age=900', // Cache for 15 minutes
                'ETag': `"${packagedCourse.package_version}"`,
                'Content-Type': 'application/json'
            });

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
            
            // Use pagination middleware data if available, otherwise fallback to query params
            const options = req.pagination || {
                page: 1,
                limit: 20,
                sortBy: "order",
                sortOrder: "asc",
                filters: {}
            };
            
            // Add search parameter if provided
            if (req.query['search']) {
                options.search = req.query['search'] as string;
            }

            const result = await this.contentService.getLevelsByCourse(
                courseId,
                options,
            );

            const response: ApiResponse = {
                data: result.data,
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers using the enhanced helper
            const { addPaginationHeaders } = await import("../../../shared/middleware/pagination");
            addPaginationHeaders(res, result.pagination);

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
            
            // Use pagination middleware data if available, otherwise fallback to query params
            const options = req.pagination || {
                page: 1,
                limit: 20,
                sortBy: "order",
                sortOrder: "asc",
                filters: {}
            };
            
            // Add search parameter if provided
            if (req.query['search']) {
                options.search = req.query['search'] as string;
            }

            const result = await this.contentService.getSectionsByLevel(
                levelId,
                options,
            );

            const response: ApiResponse = {
                data: result.data,
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers using the enhanced helper
            const { addPaginationHeaders } = await import("../../../shared/middleware/pagination");
            addPaginationHeaders(res, result.pagination);

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
            
            // Use pagination middleware data if available, otherwise fallback to query params
            const options = req.pagination || {
                page: 1,
                limit: 20,
                sortBy: "order",
                sortOrder: "asc",
                filters: {}
            };
            
            // Add search parameter if provided
            if (req.query['search']) {
                options.search = req.query['search'] as string;
            }
            
            // Add module_type filter if provided
            if (req.query['module_type']) {
                options.filters = {
                    ...options.filters,
                    module_type: req.query['module_type']
                };
            }

            const result = await this.contentService.getModulesBySection(
                sectionId,
                options,
            );

            const response: ApiResponse = {
                data: result.data,
                success: true,
                timestamp: new Date().toISOString(),
            };

            // Add pagination info to response headers using the enhanced helper
            const { addPaginationHeaders } = await import("../../../shared/middleware/pagination");
            addPaginationHeaders(res, result.pagination);

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
