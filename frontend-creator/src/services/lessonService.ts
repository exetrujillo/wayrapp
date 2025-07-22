import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { 
  Lesson, 
  CreateLessonRequest, 
  UpdateLessonRequest, 
  PaginatedResponse, 
  PaginationParams,
  ExerciseAssignment,
  CreateExerciseAssignmentRequest,
  UpdateExerciseAssignmentRequest
} from '../utils/types';

class LessonService {
  /**
   * Get paginated list of lessons
   * @param params Pagination parameters
   * @returns Paginated list of lessons
   */
  async getLessons(params?: PaginationParams): Promise<PaginatedResponse<Lesson>> {
    try {
      return await apiClient.get<PaginatedResponse<Lesson>>(API_ENDPOINTS.LESSONS.BASE, { params });
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      throw error;
    }
  }

  /**
   * Get lessons for a specific module
   * @param moduleId Module ID
   * @param params Pagination parameters
   * @returns Paginated list of lessons for the module
   */
  async getLessonsByModule(moduleId: string, params?: PaginationParams): Promise<PaginatedResponse<Lesson>> {
    try {
      return await apiClient.get<PaginatedResponse<Lesson>>(
        API_ENDPOINTS.MODULES.LESSONS(moduleId), 
        { params }
      );
    } catch (error) {
      console.error(`Failed to fetch lessons for module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single lesson by ID
   * @param id Lesson ID
   * @returns Lesson details
   */
  async getLesson(id: string): Promise<Lesson> {
    try {
      return await apiClient.get<Lesson>(API_ENDPOINTS.LESSONS.DETAIL(id));
    } catch (error) {
      console.error(`Failed to fetch lesson ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new lesson in a module
   * @param moduleId Module ID
   * @param lessonData Lesson creation data
   * @returns Created lesson
   */
  async createLesson(moduleId: string, lessonData: CreateLessonRequest): Promise<Lesson> {
    try {
      return await apiClient.post<Lesson>(API_ENDPOINTS.MODULES.LESSONS(moduleId), lessonData);
    } catch (error) {
      console.error(`Failed to create lesson in module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing lesson
   * @param id Lesson ID
   * @param lessonData Lesson update data
   * @returns Updated lesson
   */
  async updateLesson(id: string, lessonData: UpdateLessonRequest): Promise<Lesson> {
    try {
      return await apiClient.put<Lesson>(API_ENDPOINTS.LESSONS.DETAIL(id), lessonData);
    } catch (error) {
      console.error(`Failed to update lesson ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a lesson
   * @param id Lesson ID
   */
  async deleteLesson(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.LESSONS.DETAIL(id));
    } catch (error) {
      console.error(`Failed to delete lesson ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get exercises assigned to a lesson
   * @param lessonId Lesson ID
   * @returns List of exercises assigned to the lesson
   */
  async getLessonExercises(lessonId: string): Promise<ExerciseAssignment[]> {
    try {
      return await apiClient.get<ExerciseAssignment[]>(API_ENDPOINTS.LESSONS.EXERCISES(lessonId));
    } catch (error) {
      console.error(`Failed to fetch exercises for lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Assign an exercise to a lesson
   * @param lessonId Lesson ID
   * @param assignmentData Exercise assignment data
   * @returns Created exercise assignment
   */
  async assignExerciseToLesson(
    lessonId: string, 
    assignmentData: CreateExerciseAssignmentRequest
  ): Promise<ExerciseAssignment> {
    try {
      return await apiClient.post<ExerciseAssignment>(
        API_ENDPOINTS.LESSONS.EXERCISES(lessonId), 
        assignmentData
      );
    } catch (error) {
      console.error(`Failed to assign exercise to lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Remove an exercise assignment from a lesson
   * @param lessonId Lesson ID
   * @param assignmentId Assignment ID
   */
  async removeExerciseFromLesson(lessonId: string, assignmentId: string): Promise<void> {
    try {
      await apiClient.delete(`${API_ENDPOINTS.LESSONS.EXERCISES(lessonId)}/${assignmentId}`);
    } catch (error) {
      console.error(`Failed to remove exercise assignment ${assignmentId} from lesson ${lessonId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an exercise assignment order
   * @param lessonId Lesson ID
   * @param assignmentId Assignment ID
   * @param updateData Update data with new order
   * @returns Updated exercise assignment
   */
  async updateExerciseAssignment(
    lessonId: string,
    assignmentId: string,
    updateData: UpdateExerciseAssignmentRequest
  ): Promise<ExerciseAssignment> {
    try {
      return await apiClient.patch<ExerciseAssignment>(
        `${API_ENDPOINTS.LESSONS.EXERCISES(lessonId)}/${assignmentId}`,
        updateData
      );
    } catch (error) {
      console.error(`Failed to update exercise assignment ${assignmentId} in lesson ${lessonId}:`, error);
      throw error;
    }
  }
}

// Create and export lesson service instance
export const lessonService = new LessonService();

export default lessonService;