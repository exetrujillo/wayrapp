// src/modules/content/controllers/ContentController.ts

/**
 * Content management API controller providing comprehensive REST endpoints for hierarchical content
 * operations in the WayrApp language learning platform. This controller serves as the primary HTTP
 * interface for managing the complete content hierarchy including courses, levels, sections, and modules
 * with full CRUD operations, advanced filtering, pagination, and caching capabilities.
 *
 * The controller implements a RESTful API design following industry standards with proper HTTP status
 * codes, standardized response formats, comprehensive error handling, and security middleware integration.
 * It provides endpoints for both individual resource operations and hierarchical queries, supporting
 * complex content management workflows and efficient content delivery for learning applications.
 *
 * Key architectural features include hierarchical resource management with parent-child relationships,
 * comprehensive pagination support with configurable sorting and filtering, advanced caching strategies
 * for packaged content delivery, role-based access control integration, and standardized API response
 * formatting. The controller integrates seamlessly with Express.js middleware patterns and provides
 * robust error handling with detailed error responses.
 *
 * Content hierarchy management includes course creation and management, level organization within courses,
 * section structuring within levels, and module management within sections. Each endpoint supports
 * appropriate HTTP methods (GET, POST, PUT, DELETE) with proper authentication and authorization
 * requirements based on user roles and permissions.
 *
 * Advanced features include packaged content delivery with conditional requests and caching headers,
 * search functionality across content hierarchies, bulk operations for content management, and
 * comprehensive validation using Zod schemas. The controller maintains data consistency across
 * the content hierarchy while providing flexible querying options for various client applications.
 *
 * @module ContentController
 * @category Controllers
 * @category Content
 * @author Exequiel Trujillo
 * @since 1.0.0
 *
 * @example
 * // Initialize controller with Prisma client
 * const contentController = new ContentController(prisma);
 * 
 * // Set up course management routes
 * router.post('/courses', 
 *   authenticateToken,
 *   requireRole(['admin', 'content_creator']),
 *   validate({ body: CreateCourseSchema }),
 *   contentController.createCourse
 * );
 * 
 * router.get('/courses', 
 *   paginationMiddleware({
 *     allowedSortFields: ['name', 'created_at'],
 *     searchFields: ['name', 'description']
 *   }),
 *   contentController.getCourses
 * );
 * 
 * // Set up hierarchical content routes
 * router.get('/courses/:courseId/levels', 
 *   paginationMiddleware({ defaultSortField: 'order' }),
 *   contentController.getLevelsByCourse
 * );
 */

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

/**
 * Content controller class providing comprehensive REST API endpoints for hierarchical content management.
 * Implements full CRUD operations for courses, levels, sections, and modules with advanced querying,
 * pagination, caching, and security features.
 */
export class ContentController {
    private contentService: ContentService;

    /**
     * Creates a new ContentController instance with initialized content service
     * 
     * @param {PrismaClient} prisma - Initialized Prisma client for database operations
     */
    constructor(prisma: PrismaClient) {
        this.contentService = new ContentService(prisma);
    }

    // Course endpoints
    
    /**
     * Creates a new course with comprehensive validation and proper response formatting.
     * Validates request data using Zod schema, handles optional properties correctly,
     * and returns standardized API response with created course data.
     * 
     * @param {Request} req - Express request object with course data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When validation fails or course creation encounters errors
     * @throws {AppError} When course with same ID already exists (handled by service layer)
     * 
     * @example
     * // POST /api/courses
     * // Request body: { id: 'spanish-101', source_language: 'en', target_language: 'es', name: 'Spanish Basics' }
     * // Response: { data: Course, success: true, timestamp: '2024-01-01T00:00:00.000Z' }
     */
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
                message: 'Course created successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a single course by its unique identifier with complete course information.
     * Validates course ID parameter and returns standardized API response with course data.
     * 
     * @param {Request} req - Express request object with course ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When course ID parameter is missing or invalid
     * @throws {AppError} When course with specified ID is not found (handled by service layer)
     * 
     * @example
     * // GET /api/courses/spanish-101
     * // Response: { data: Course, success: true, timestamp: '2024-01-01T00:00:00.000Z' }
     */
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

    /**
     * Retrieves a paginated list of courses with advanced filtering, searching, and sorting capabilities.
     * Supports pagination middleware integration, search functionality, and comprehensive response headers
     * for client-side pagination handling.
     * 
     * @param {Request} req - Express request object with pagination options from middleware or query params
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @example
     * // GET /api/courses?page=1&limit=10&search=spanish&sortBy=name&sortOrder=asc
     * // Response: { data: Course[], success: true, timestamp: '2024-01-01T00:00:00.000Z' }
     * // Headers: X-Total-Count, X-Page, X-Per-Page, X-Total-Pages, Link
     */
    getCourses = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
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

            const result = await this.contentService.getCourses(options);

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

    /**
     * Updates an existing course with partial data and comprehensive validation.
     * Validates course ID parameter and update data, then returns updated course information.
     * 
     * @param {Request} req - Express request object with course ID in params and update data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When course ID parameter is missing or invalid
     * @throws {AppError} When course with specified ID is not found (handled by service layer)
     * @throws {AppError} When update data validation fails
     * 
     * @example
     * // PUT /api/courses/spanish-101
     * // Request body: { name: 'Advanced Spanish', description: 'Updated description' }
     * // Response: { data: Course, success: true, timestamp: '2024-01-01T00:00:00.000Z' }
     */
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
                message: 'Course updated successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Deletes a course and all associated content with cascade deletion handling.
     * Validates course ID parameter and performs secure deletion with proper response formatting.
     * 
     * @param {Request} req - Express request object with course ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When course ID parameter is missing or invalid
     * @throws {AppError} When course with specified ID is not found (handled by service layer)
     * @throws {AppError} When deletion fails due to database constraints
     * 
     * @example
     * // DELETE /api/courses/spanish-101
     * // Response: { success: true, message: 'Course deleted successfully', timestamp: '2024-01-01T00:00:00.000Z' }
     */
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

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a complete packaged course with all hierarchical content and advanced caching support.
     * Implements conditional requests using If-Modified-Since headers and comprehensive caching strategies
     * for optimal content delivery performance.
     * 
     * @param {Request} req - Express request object with course ID in params and optional If-Modified-Since header
     * @param {Response} res - Express response object for sending HTTP response with caching headers
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When course ID parameter is missing or invalid
     * @throws {AppError} When course with specified ID is not found (handled by service layer)
     * 
     * @example
     * // GET /api/courses/spanish-101/package
     * // Headers: If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
     * // Response: { data: PackagedCourse, success: true, timestamp: '2024-01-01T00:00:00.000Z' }
     * // Response Headers: Last-Modified, Cache-Control, ETag
     */
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
    
    /**
     * Creates a new level within a specified course with hierarchical relationship management.
     * Validates course ID parameter, merges it with level data, and creates the level with
     * proper parent-child relationship establishment.
     * 
     * @param {Request} req - Express request object with course ID in params and level data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When course ID parameter is missing or invalid
     * @throws {AppError} When parent course is not found (handled by service layer)
     * @throws {AppError} When level data validation fails
     * 
     * @example
     * // POST /api/courses/spanish-101/levels
     * // Request body: { id: 'level-beginner', code: 'A1', name: 'Beginner Level', order: 1 }
     * // Response: { data: Level, success: true, timestamp: '2024-01-01T00:00:00.000Z' }
     */
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
                message: 'Level created successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a single level by its unique identifier with complete level information.
     * Validates level ID parameter and returns standardized API response with level data.
     * 
     * @param {Request} req - Express request object with level ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When level ID parameter is missing or invalid
     * @throws {AppError} When level with specified ID is not found (handled by service layer)
     */
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

    /**
     * Retrieves a paginated list of levels within a specific course with hierarchical ordering.
     * Supports pagination middleware integration, search functionality, and proper ordering
     * by level sequence within the course structure.
     * 
     * @param {Request} req - Express request object with course ID in params and pagination options
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When course ID parameter is missing or invalid
     * @throws {AppError} When parent course is not found (handled by service layer)
     */
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

    /**
     * Updates an existing level with partial data and comprehensive validation.
     * Validates level ID parameter and update data, then returns updated level information.
     * 
     * @param {Request} req - Express request object with level ID in params and update data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When level ID parameter is missing or invalid
     * @throws {AppError} When level with specified ID is not found (handled by service layer)
     */
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
                message: 'Level updated successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Deletes a level and all associated content with cascade deletion handling.
     * Validates level ID parameter and performs secure deletion with proper response formatting.
     * 
     * @param {Request} req - Express request object with level ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When level ID parameter is missing or invalid
     * @throws {AppError} When level with specified ID is not found (handled by service layer)
     */
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

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    // Section endpoints
    
    /**
     * Creates a new section within a specified level with hierarchical relationship management.
     * Validates level ID parameter, merges it with section data, and creates the section with
     * proper parent-child relationship establishment.
     * 
     * @param {Request} req - Express request object with level ID in params and section data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When level ID parameter is missing or invalid
     * @throws {AppError} When parent level is not found (handled by service layer)
     */
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
                message: 'Section created successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a single section by its unique identifier with complete section information.
     * Validates section ID parameter and returns standardized API response with section data.
     * 
     * @param {Request} req - Express request object with section ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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

    /**
     * Retrieves a paginated list of sections within a specific level with hierarchical ordering.
     * Supports pagination middleware integration, search functionality, and proper ordering
     * by section sequence within the level structure.
     * 
     * @param {Request} req - Express request object with level ID in params and pagination options
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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

    /**
     * Updates an existing section with partial data and comprehensive validation.
     * Validates section ID parameter and update data, then returns updated section information.
     * 
     * @param {Request} req - Express request object with section ID in params and update data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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
                message: 'Section updated successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Deletes a section and all associated content with cascade deletion handling.
     * Validates section ID parameter and performs secure deletion with proper response formatting.
     * 
     * @param {Request} req - Express request object with section ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    // Module endpoints
    
    /**
     * Creates a new module within a specified section with hierarchical relationship management.
     * Validates section ID parameter, merges it with module data, and creates the module with
     * proper parent-child relationship establishment and module type validation.
     * 
     * @param {Request} req - Express request object with section ID in params and module data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     * 
     * @throws {AppError} When section ID parameter is missing or invalid
     * @throws {AppError} When parent section is not found (handled by service layer)
     */
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
                message: 'Module created successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.CREATED).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves a single module by its unique identifier with complete module information.
     * Validates module ID parameter and returns standardized API response with module data
     * including module type and hierarchical context.
     * 
     * @param {Request} req - Express request object with module ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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

    /**
     * Retrieves a paginated list of modules within a specific section with type filtering support.
     * Supports pagination middleware integration, search functionality, module type filtering,
     * and proper ordering by module sequence within the section structure.
     * 
     * @param {Request} req - Express request object with section ID in params and pagination options
     * @param {Response} res - Express response object for sending HTTP response with pagination headers
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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

    /**
     * Updates an existing module with partial data and comprehensive validation.
     * Validates module ID parameter and update data, supports module type changes,
     * and returns updated module information with proper type validation.
     * 
     * @param {Request} req - Express request object with module ID in params and update data in body
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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
                message: 'Module updated successfully',
                timestamp: new Date().toISOString(),
            };

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Deletes a module and all associated content with cascade deletion handling.
     * Validates module ID parameter and performs secure deletion with proper response formatting.
     * Handles deletion of associated lessons and exercises through cascade operations.
     * 
     * @param {Request} req - Express request object with module ID in params
     * @param {Response} res - Express response object for sending HTTP response
     * @param {NextFunction} next - Express next function for error handling
     * @returns {Promise<void>} Promise that resolves when response is sent
     */
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

            res.status(HttpStatus.OK).json(response);
        } catch (error) {
            next(error);
        }
    };
}
