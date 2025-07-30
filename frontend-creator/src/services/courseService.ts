// frontend-creator/src/services/courseService.ts
import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  PaginatedResponse,
  PaginationParams
} from '../utils/types';

/**
 * Service class for managing course-related API operations in the language learning platform.
 * 
 * This service acts as the primary interface between the frontend application and the backend
 * course management API. It handles all CRUD operations for courses, including creation, retrieval,
 * updates, deletion, and packaging for offline use. The service is designed to work seamlessly
 * with React Query hooks and provides comprehensive error handling with user-friendly messages.
 * 
 * The CourseService is used throughout the application in components like CoursesPage for listing
 * courses, CourseForm for creating/editing courses, and various hooks (useCourses.ts) that provide
 * React Query integration. It supports pagination, filtering, and bulk operations for course management.
 * 
 * Key architectural patterns:
 * - Singleton pattern: Exported as a single instance for consistent state
 * - Data transformation layer: Handles conversion between frontend and API data formats
 * - Comprehensive error handling: Provides specific error messages based on HTTP status codes
 * - Type safety: Full TypeScript integration with proper type definitions
 * 
 * @example
 * // Basic usage in a React component
 * import { courseService } from '../services/courseService';
 * 
 * // Fetch paginated courses
 * const courses = await courseService.getCourses({ page: 1, limit: 10 });
 * 
 * // Create a new course
 * const newCourse = await courseService.createCourse({
 *   id: 'spanish-basics',
 *   name: 'Spanish Basics',
 *   source_language: 'en',
 *   target_language: 'es',
 *   is_public: true,
 *   description: 'Learn basic Spanish vocabulary and grammar'
 * });
 * 
 * // Get a specific course
 * const course = await courseService.getCourse('spanish-basics');
 * 
 * // Update course details
 * const updatedCourse = await courseService.updateCourse('spanish-basics', {
 *   name: 'Spanish Fundamentals',
 *   description: 'Updated description'
 * });
 */
class CourseService {
  /**
   * Transforms course data from API response format to frontend-compatible format.
   * 
   * This private method provides a centralized location for handling any data structure
   * differences between the backend API and frontend expectations. Currently, the types
   * are aligned, but this method serves as a future-proofing mechanism for handling
   * field name changes, data type conversions, or additional processing.
   * 
   * @private
   * @param {any} apiCourse - Raw course data received from the API
   * @returns {Course} Course object formatted for frontend consumption
   */
  private transformCourseFromApi(apiCourse: any): Course {
    // Transform snake_case API response to camelCase frontend format
    return {
      id: apiCourse.id,
      name: apiCourse.name,
      sourceLanguage: apiCourse.source_language || apiCourse.sourceLanguage,
      targetLanguage: apiCourse.target_language || apiCourse.targetLanguage,
      description: apiCourse.description,
      isPublic: apiCourse.is_public !== undefined ? apiCourse.is_public : apiCourse.isPublic,
      createdAt: apiCourse.created_at || apiCourse.createdAt,
      updatedAt: apiCourse.updated_at || apiCourse.updatedAt,
    } as Course;
  }

  /**
   * Transforms course data from frontend format to API-compatible format.
   * 
   * This private method handles the conversion of course data from the frontend
   * representation to the format expected by the backend API. It provides a
   * centralized location for handling field name transformations, data type
   * conversions, and any other formatting requirements.
   * 
   * @private
   * @param {CreateCourseRequest | UpdateCourseRequest} courseData - Course data from frontend forms
   * @returns {any} Course data formatted for API consumption
   */
  private transformCourseToApi(courseData: CreateCourseRequest | UpdateCourseRequest): any {
    // Currently, our types are aligned with the backend, so no transformation needed
    // This method is here for future use if data transformation becomes necessary
    return courseData;
  }
  /**
   * Retrieves a paginated list of courses with optional filtering and sorting.
   * 
   * This method is the primary way to fetch courses for display in lists, dashboards,
   * and course management interfaces. It supports pagination, search functionality,
   * and filtering by visibility (public/private). The response includes both the
   * course data and pagination metadata for building user interfaces.
   * 
   * @param {PaginationParams} [params] - Optional pagination and filtering parameters
   * @param {number} [params.page=1] - Page number to retrieve (1-based)
   * @param {number} [params.limit=20] - Number of courses per page
   * @param {string} [params.search] - Search query to filter courses by name
   * @param {string} [params.sort] - Field to sort by
   * @param {'asc'|'desc'} [params.order] - Sort order
   * @param {boolean} [params.is_public] - Filter by course visibility
   * @returns {Promise<PaginatedResponse<Course>>} Promise resolving to paginated course data
   * @throws {Error} When API request fails or returns invalid data
   * 
   * @example
   * // Get first page of courses
   * const firstPage = await courseService.getCourses();
   * 
   * // Get courses with search and pagination
   * const searchResults = await courseService.getCourses({
   *   page: 2,
   *   limit: 5,
   *   search: 'spanish',
   *   is_public: true
   * });
   */
  async getCourses(params?: PaginationParams): Promise<PaginatedResponse<Course>> {
    try {
      const response = await apiClient.get<{ data: Course[], success: boolean, timestamp: string }>(API_ENDPOINTS.COURSES.BASE, { params });

      // Validate response structure
      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from courses API');
      }

      // Transform course data if needed
      const transformedData = response.data.map(course => this.transformCourseFromApi(course));

      // For now, return a basic pagination structure
      // TODO: Extract pagination info from response headers
      return {
        data: transformedData,
        meta: {
          total: transformedData.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
    } catch (error: any) {
      console.error('Failed to fetch courses:', error);

      // Re-throw with enhanced error information
      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch courses. Please try again later.');
    }
  }

  /**
   * Retrieves detailed information for a specific course by its unique identifier.
   * 
   * This method is used throughout the application to fetch individual course details
   * for display in course detail pages, edit forms, and anywhere specific course
   * information is needed. It includes comprehensive error handling for common
   * scenarios like missing courses and permission issues.
   * 
   * @param {string} id - The unique identifier of the course to retrieve
   * @returns {Promise<Course>} Promise resolving to the complete course object
   * @throws {Error} When course ID is invalid, course not found, access denied, or API fails
   * 
   * @example
   * // Get course details for display
   * try {
   *   const course = await courseService.getCourse('spanish-basics');
   *   console.log(`Course: ${course.name} (${course.sourceLanguage} → ${course.targetLanguage})`);
   * } catch (error) {
   *   if (error.message.includes('not found')) {
   *     // Handle course not found
   *   } else if (error.message.includes('permission')) {
   *     // Handle access denied
   *   }
   * }
   */
  async getCourse(id: string): Promise<Course> {
    if (!id || typeof id !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.COURSES.DETAIL(id));

      // Debug: Log the actual response to understand the structure (can be removed in production)
      console.log('API Response for course:', response);

      // Handle both wrapped and unwrapped responses (same pattern as createCourse)
      const courseData = response.data || response;

      // Validate response structure
      if (!courseData || !courseData.id) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid course data received from API');
      }

      return this.transformCourseFromApi(courseData);
    } catch (error: any) {
      console.error(`Failed to fetch course ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Course with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to access this course');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch course details. Please try again later.');
    }
  }

  /**
   * Creates a new course with the provided course data.
   * 
   * This method is primarily used by the CourseForm component and course creation
   * workflows. It validates required fields, handles data transformation between
   * frontend and API formats, and provides detailed error messages for various
   * failure scenarios. The created course is immediately available for use.
   * 
   * @param {CreateCourseRequest} courseData - The course data for creation
   * @param {string} courseData.id - Unique course identifier (max 20 characters)
   * @param {string} courseData.name - Display name for the course (max 100 characters)
   * @param {string} courseData.source_language - BCP 47 language code for source language
   * @param {string} courseData.target_language - BCP 47 language code for target language
   * @param {boolean} courseData.is_public - Whether the course should be publicly visible
   * @param {string} [courseData.description] - Optional course description (max 255 characters)
   * @returns {Promise<Course>} Promise resolving to the newly created course object
   * @throws {Error} When required fields are missing, course ID already exists, or API fails
   * 
   * @example
   * // Create a new public Spanish course
   * const newCourse = await courseService.createCourse({
   *   id: 'spanish-intermediate',
   *   name: 'Intermediate Spanish',
   *   source_language: 'en',
   *   target_language: 'es',
   *   is_public: true,
   *   description: 'Build on your Spanish basics with intermediate grammar and vocabulary'
   * });
   */
  async createCourse(courseData: CreateCourseRequest): Promise<Course> {
    if (!courseData.name || !courseData.source_language || !courseData.target_language) {
      throw new Error('Course name, source language, and target language are required');
    }

    try {
      const transformedData = this.transformCourseToApi(courseData);
      console.log('Sending CREATE COURSE payload:', transformedData);
      const response = await apiClient.post<any>(API_ENDPOINTS.COURSES.BASE, transformedData);

      console.log('Raw API response on course creation:', response);

      // The API returns a wrapped response with the course data inside a 'data' property
      // Extract the actual course object from response.data
      const actualCourseData = response.data || response;

      // Validate that the course data has the expected structure
      if (actualCourseData && actualCourseData.id) {
        return this.transformCourseFromApi(actualCourseData);
      } else {
        // This is the case we were hitting before
        console.error('API response is missing expected data:', response);
        throw new Error('Invalid response structure from course creation API');
      }
    } catch (error: any) {
      console.error('Failed to create course:', error);

      // Provide specific error messages based on status
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid course data provided');
      }

      if (error.status === 409) {
        throw new Error('A course with this name already exists');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to create course. Please try again later.');
    }
  }

  /**
   * Updates an existing course with the provided data.
   * 
   * This method allows partial updates to course properties and is used in edit
   * forms and bulk operations. Only the provided fields will be updated, leaving
   * other course properties unchanged. It includes validation to ensure at least
   * one field is being updated and handles various error scenarios.
   * 
   * @param {string} id - The unique identifier of the course to update
   * @param {UpdateCourseRequest} courseData - Object containing fields to update
   * @param {string} [courseData.name] - New display name for the course
   * @param {string} [courseData.description] - New course description
   * @param {boolean} [courseData.isPublic] - New visibility setting
   * @returns {Promise<Course>} Promise resolving to the updated course object
   * @throws {Error} When course ID is invalid, course not found, no fields provided, or API fails
   * 
   * @example
   * // Update course visibility and description
   * const updatedCourse = await courseService.updateCourse('spanish-basics', {
   *   isPublic: false,
   *   description: 'Updated course description with new content'
   * });
   * 
   * // Bulk publish operation
   * const publishedCourse = await courseService.updateCourse('spanish-basics', {
   *   isPublic: true
   * });
   */
  async updateCourse(id: string, courseData: UpdateCourseRequest): Promise<Course> {
    if (!id || typeof id !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    // Validate that at least one field is being updated
    if (!courseData || Object.keys(courseData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      const transformedData = this.transformCourseToApi(courseData);
      const response = await apiClient.put<any>(API_ENDPOINTS.COURSES.DETAIL(id), transformedData);

      // Handle both wrapped and unwrapped responses (same pattern as createCourse)
      const updatedCourseData = response.data || response;

      // Validate response structure
      if (!updatedCourseData || !updatedCourseData.id) {
        throw new Error('Invalid response from course update API');
      }

      return this.transformCourseFromApi(updatedCourseData);
    } catch (error: any) {
      console.error(`Failed to update course ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Course with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to update this course');
      }

      if (error.status === 400) {
        throw new Error(error.message || 'Invalid course data provided');
      }

      if (error.status === 409) {
        throw new Error('A course with this name already exists');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to update course. Please try again later.');
    }
  }

  /**
   * Permanently deletes a course and all its associated data.
   * 
   * This method removes a course from the system entirely. It's used in course
   * management interfaces and bulk delete operations. The operation is irreversible
   * and will fail if the course has associated content that prevents deletion.
   * Proper error handling helps users understand why deletion might fail.
   * 
   * @param {string} id - The unique identifier of the course to delete
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   * @throws {Error} When course ID is invalid, course not found, permission denied, or course has dependencies
   * 
   * @example
   * // Delete a course with error handling
   * try {
   *   await courseService.deleteCourse('old-course-id');
   *   console.log('Course deleted successfully');
   * } catch (error) {
   *   if (error.message.includes('associated content')) {
   *     // Handle case where course has lessons/exercises
   *     alert('Cannot delete course with existing content');
   *   } else if (error.message.includes('permission')) {
   *     // Handle permission error
   *     alert('You do not have permission to delete this course');
   *   }
   * }
   */
  async deleteCourse(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    try {
      await apiClient.delete(API_ENDPOINTS.COURSES.DETAIL(id));
    } catch (error: any) {
      console.error(`Failed to delete course ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Course with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to delete this course');
      }

      if (error.status === 409) {
        throw new Error('Cannot delete course because it has associated content');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to delete course. Please try again later.');
    }
  }

  /**
   * Retrieves a complete course package containing all course content for offline use.
   * 
   * This method fetches a comprehensive package that includes the course metadata,
   * all levels, sections, lessons, exercises, and associated media files. It's designed
   * for offline functionality and content distribution. The package format allows
   * the application to function without network connectivity.
   * 
   * @param {string} id - The unique identifier of the course to package
   * @returns {Promise<any>} Promise resolving to the complete course package object
   * @throws {Error} When course ID is invalid, package not found, not ready, or API fails
   * 
   * @example
   * // Download course package for offline use
   * try {
   *   const coursePackage = await courseService.getCoursePackage('spanish-basics');
   *   // Package contains: course, levels, sections, lessons, exercises, media
   *   localStorage.setItem('offline-course', JSON.stringify(coursePackage));
   * } catch (error) {
   *   if (error.message.includes('not ready')) {
   *     // Package is still being generated
   *     setTimeout(() => retryPackageDownload(), 5000);
   *   }
   * }
   */
  async getCoursePackage(id: string): Promise<any> {
    if (!id || typeof id !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSES.PACKAGE(id));

      // Validate response structure
      if (!response) {
        throw new Error('Invalid course package data received from API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to fetch course package for ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Course package for ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to access this course package');
      }

      if (error.status === 422) {
        throw new Error('Course package is not ready yet. Please try again later.');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch course package. Please try again later.');
    }
  }
}

/**
 * Singleton instance of the CourseService for use throughout the application.
 * 
 * This exported instance ensures consistent state management and provides a
 * single point of access for all course-related API operations. Import this
 * instance in components, hooks, and other services that need course functionality.
 * 
 * @example
 * // Import and use in a React component
 * import { courseService } from '../services/courseService';
 * 
 * // Import and use in a custom hook
 * import courseService from '../services/courseService';
 */
export const courseService = new CourseService();

export default courseService;