import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  PaginatedResponse,
  PaginationParams
} from '../utils/types';

class CourseService {
  /**
   * Transform course data from API format to frontend format if needed
   * This method can be used to handle any data transformation between backend and frontend
   * @param apiCourse Course data from API
   * @returns Transformed course data
   */
  private transformCourseFromApi(apiCourse: any): Course {
    // Currently, our types are aligned with the backend, so no transformation needed
    // This method is here for future use if data transformation becomes necessary
    return apiCourse as Course;
  }

  /**
   * Transform course data from frontend format to API format if needed
   * @param courseData Course data from frontend
   * @returns Transformed course data for API
   */
  private transformCourseToApi(courseData: CreateCourseRequest | UpdateCourseRequest): any {
    // Currently, our types are aligned with the backend, so no transformation needed
    // This method is here for future use if data transformation becomes necessary
    return courseData;
  }
  /**
   * Get paginated list of courses
   * @param params Pagination parameters
   * @returns Paginated list of courses
   */
  async getCourses(params?: PaginationParams): Promise<PaginatedResponse<Course>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Course>>(API_ENDPOINTS.COURSES.BASE, { params });

      // Validate response structure
      if (!response || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from courses API');
      }

      // Transform course data if needed
      const transformedData = response.data.map(course => this.transformCourseFromApi(course));

      return {
        ...response,
        data: transformedData
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
   * Get a single course by ID
   * @param id Course ID
   * @returns Course details
   */
  async getCourse(id: string): Promise<Course> {
    if (!id || typeof id !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<Course>(API_ENDPOINTS.COURSES.DETAIL(id));

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid course data received from API');
      }

      return this.transformCourseFromApi(response);
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
   * Create a new course
   * @param courseData Course creation data
   * @returns Created course
   */
  async createCourse(courseData: CreateCourseRequest): Promise<Course> {
    // Validate required fields
    if (!courseData.name || !courseData.source_language || !courseData.target_language) {
      throw new Error('Course name, source language, and target language are required');
    }

    try {
      const transformedData = this.transformCourseToApi(courseData);
      const response = await apiClient.post<Course>(API_ENDPOINTS.COURSES.BASE, transformedData);

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid response from course creation API');
      }

      return this.transformCourseFromApi(response);
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
   * Update an existing course
   * @param id Course ID
   * @param courseData Course update data
   * @returns Updated course
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
      const response = await apiClient.put<Course>(API_ENDPOINTS.COURSES.DETAIL(id), transformedData);

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid response from course update API');
      }

      return this.transformCourseFromApi(response);
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
   * Delete a course
   * @param id Course ID
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
   * Get packaged course content for offline use
   * @param id Course ID
   * @returns Complete course package with all related content
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

// Create and export course service instance
export const courseService = new CourseService();

export default courseService;