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
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    // Validate required fields
    if (typeof lessonData.experiencePoints !== 'number' || lessonData.experiencePoints <= 0) {
      throw new Error('Experience points must be a positive number');
    }

    if (typeof lessonData.order !== 'number' || lessonData.order < 0) {
      throw new Error('Lesson order must be a non-negative number');
    }

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

  /**
   * Reorder exercises in a lesson
   * @param lessonId Lesson ID
   * @param exerciseIds Array of exercise IDs in the new order
   * @returns Updated exercise assignments
   */
  async reorderLessonExercises(lessonId: string, exerciseIds: string[]): Promise<ExerciseAssignment[]> {
    try {
      return await apiClient.put<ExerciseAssignment[]>(
        API_ENDPOINTS.LESSONS.REORDER_EXERCISES(lessonId),
        { exerciseIds }
      );
    } catch (error) {
      console.error(`Failed to reorder exercises in lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Reorder lessons within a module
   * @param moduleId Module ID
   * @param lessonIds Array of lesson IDs in the new order
   * @returns Success response
   */
  async reorderLessons(moduleId: string, lessonIds: string[]): Promise<void> {
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new Error('Lesson IDs array is required and must not be empty');
    }

    try {
      await apiClient.put(API_ENDPOINTS.MODULES.REORDER_LESSONS(moduleId), {
        lesson_ids: lessonIds
      });
    } catch (error) {
      console.error(`Failed to reorder lessons in module ${moduleId}:`, error);
      throw error;
    }
  }
}

// Create and export lesson service instance
export const lessonService = new LessonService();

export default lessonService;