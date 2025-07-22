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
   * Get paginated list of courses
   * @param params Pagination parameters
   * @returns Paginated list of courses
   */
  async getCourses(params?: PaginationParams): Promise<PaginatedResponse<Course>> {
    try {
      return await apiClient.get<PaginatedResponse<Course>>(API_ENDPOINTS.COURSES.BASE, { params });
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  }

  /**
   * Get a single course by ID
   * @param id Course ID
   * @returns Course details
   */
  async getCourse(id: string): Promise<Course> {
    try {
      return await apiClient.get<Course>(API_ENDPOINTS.COURSES.DETAIL(id));
    } catch (error) {
      console.error(`Failed to fetch course ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new course
   * @param courseData Course creation data
   * @returns Created course
   */
  async createCourse(courseData: CreateCourseRequest): Promise<Course> {
    try {
      return await apiClient.post<Course>(API_ENDPOINTS.COURSES.BASE, courseData);
    } catch (error) {
      console.error('Failed to create course:', error);
      throw error;
    }
  }

  /**
   * Update an existing course
   * @param id Course ID
   * @param courseData Course update data
   * @returns Updated course
   */
  async updateCourse(id: string, courseData: UpdateCourseRequest): Promise<Course> {
    try {
      return await apiClient.put<Course>(API_ENDPOINTS.COURSES.DETAIL(id), courseData);
    } catch (error) {
      console.error(`Failed to update course ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a course
   * @param id Course ID
   */
  async deleteCourse(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.COURSES.DETAIL(id));
    } catch (error) {
      console.error(`Failed to delete course ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get packaged course content for offline use
   * @param id Course ID
   * @returns Complete course package with all related content
   */
  async getCoursePackage(id: string): Promise<any> {
    try {
      return await apiClient.get(API_ENDPOINTS.COURSES.PACKAGE(id));
    } catch (error) {
      console.error(`Failed to fetch course package for ${id}:`, error);
      throw error;
    }
  }
}

// Create and export course service instance
export const courseService = new CourseService();

export default courseService;