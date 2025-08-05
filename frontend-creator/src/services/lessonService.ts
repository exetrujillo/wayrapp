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
   * Transform lesson data from API format to frontend format
   * @param apiLesson API lesson data
   * @returns Lesson object formatted for frontend consumption
   * @private
   */
  private transformLessonFromApi(apiLesson: any): Lesson {
    return {
      id: apiLesson.id,
      name: apiLesson.name,
      description: apiLesson.description,
      moduleId: apiLesson.module_id, // Transform snake_case to camelCase
      experiencePoints: apiLesson.experience_points,
      order: apiLesson.order,
      createdAt: apiLesson.created_at,
      updatedAt: apiLesson.updated_at,
    };
  }

  /**
   * Transform lesson data from frontend format to API format
   * @param lessonData Frontend lesson data
   * @returns Lesson data formatted for API consumption
   * @private
   */
  private transformLessonToApi(lessonData: CreateLessonRequest | UpdateLessonRequest): any {
    const result: any = {};

    // Add common fields
    if (lessonData.name !== undefined) {
      result.name = lessonData.name;
    }
    if (lessonData.description !== undefined) {
      result.description = lessonData.description;
    }
    if (lessonData.experiencePoints !== undefined) {
      result.experience_points = lessonData.experiencePoints;
    }
    if (lessonData.order !== undefined) {
      result.order = lessonData.order;
    }

    // Add fields for create requests
    if ('id' in lessonData && lessonData.id !== undefined) {
      result.id = lessonData.id;
    }

    return result;
  }

  /**
   * Get paginated list of lessons
   * @param params Pagination parameters
   * @returns Paginated list of lessons
   */
  async getLessons(params?: PaginationParams): Promise<PaginatedResponse<Lesson>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.LESSONS.BASE, { params });

      // Extract data from API response format { data: lessons, success: true, timestamp: ... }
      const lessonsData = response.data || response;

      // Transform the lessons data
      const transformedLessons = Array.isArray(lessonsData) ? lessonsData.map((lesson: any) => this.transformLessonFromApi(lesson)) : [];

      return {
        ...response,
        data: transformedLessons,
      };
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
      const response = await apiClient.get<any>(
        API_ENDPOINTS.MODULES.LESSONS(moduleId),
        { params }
      );

      // Extract data from API response format { data: lessons, success: true, timestamp: ... }
      const lessonsData = response.data || response;

      // Transform the lessons data
      const transformedLessons = Array.isArray(lessonsData) ? lessonsData.map((lesson: any) => this.transformLessonFromApi(lesson)) : [];

      return {
        ...response,
        data: transformedLessons,
      };
    } catch (error) {
      console.error(`Failed to fetch lessons for module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single lesson by ID within a module
   * @param moduleId Module ID
   * @param id Lesson ID
   * @returns Lesson details
   */
  async getLesson(moduleId: string, id: string): Promise<Lesson> {
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    if (!id || typeof id !== 'string') {
      throw new Error('Lesson ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<any>(`/modules/${moduleId}/lessons/${id}`);
      const lessonData = response.data || response;
      return this.transformLessonFromApi(lessonData);
    } catch (error) {
      console.error(`Failed to fetch lesson ${id} in module ${moduleId}:`, error);
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
      const transformedData = this.transformLessonToApi(lessonData);
      const response = await apiClient.post<any>(API_ENDPOINTS.MODULES.LESSONS(moduleId), transformedData);
      const responseData = response.data || response;
      return this.transformLessonFromApi(responseData);
    } catch (error) {
      console.error(`Failed to create lesson in module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing lesson
   * @param moduleId Module ID
   * @param id Lesson ID
   * @param lessonData Lesson update data
   * @returns Updated lesson
   */
  async updateLesson(moduleId: string, id: string, lessonData: UpdateLessonRequest): Promise<Lesson> {
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    if (!id || typeof id !== 'string') {
      throw new Error('Lesson ID is required and must be a string');
    }

    try {
      const transformedData = this.transformLessonToApi(lessonData);
      const response = await apiClient.put<any>(`/modules/${moduleId}/lessons/${id}`, transformedData);
      const responseData = response.data || response;
      return this.transformLessonFromApi(responseData);
    } catch (error) {
      console.error(`Failed to update lesson ${id} in module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a lesson
   * @param moduleId Module ID
   * @param id Lesson ID
   */
  async deleteLesson(moduleId: string, id: string): Promise<void> {
    if (!moduleId || typeof moduleId !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    if (!id || typeof id !== 'string') {
      throw new Error('Lesson ID is required and must be a string');
    }

    try {
      await apiClient.delete(`/modules/${moduleId}/lessons/${id}`);
    } catch (error) {
      console.error(`Failed to delete lesson ${id} in module ${moduleId}:`, error);
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
      const response = await apiClient.get<any>(API_ENDPOINTS.LESSONS.EXERCISES(lessonId));
      // Extract data from API response format { data: exercises, success: true, timestamp: ... }
      return response.data || response;
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
   * @param exerciseId Exercise ID
   */
  async removeExerciseFromLesson(lessonId: string, exerciseId: string): Promise<void> {
    try {
      await apiClient.delete(`${API_ENDPOINTS.LESSONS.EXERCISES(lessonId)}/${exerciseId}`);
    } catch (error) {
      console.error(`Failed to remove exercise ${exerciseId} from lesson ${lessonId}:`, error);
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
      const response: any = await apiClient.put<ExerciseAssignment[]>(
        API_ENDPOINTS.LESSONS.REORDER_EXERCISES(lessonId),
        { exercise_ids: exerciseIds } // Backend expects snake_case
      );
      // Handle wrapped API response format
      return response.data || response;
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