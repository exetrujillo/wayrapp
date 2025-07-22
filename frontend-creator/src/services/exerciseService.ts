import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { 
  Exercise, 
  CreateExerciseRequest, 
  UpdateExerciseRequest, 
  PaginatedResponse, 
  PaginationParams 
} from '../utils/types';

class ExerciseService {
  /**
   * Get paginated list of exercises
   * @param params Pagination parameters
   * @returns Paginated list of exercises
   */
  async getExercises(params?: PaginationParams): Promise<PaginatedResponse<Exercise>> {
    try {
      return await apiClient.get<PaginatedResponse<Exercise>>(API_ENDPOINTS.EXERCISES.BASE, { params });
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      throw error;
    }
  }

  /**
   * Get a single exercise by ID
   * @param id Exercise ID
   * @returns Exercise details
   */
  async getExercise(id: string): Promise<Exercise> {
    try {
      return await apiClient.get<Exercise>(API_ENDPOINTS.EXERCISES.DETAIL(id));
    } catch (error) {
      console.error(`Failed to fetch exercise ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new exercise
   * @param exerciseData Exercise creation data
   * @returns Created exercise
   */
  async createExercise(exerciseData: CreateExerciseRequest): Promise<Exercise> {
    try {
      return await apiClient.post<Exercise>(API_ENDPOINTS.EXERCISES.BASE, exerciseData);
    } catch (error) {
      console.error('Failed to create exercise:', error);
      throw error;
    }
  }

  /**
   * Update an existing exercise
   * @param id Exercise ID
   * @param exerciseData Exercise update data
   * @returns Updated exercise
   */
  async updateExercise(id: string, exerciseData: UpdateExerciseRequest): Promise<Exercise> {
    try {
      return await apiClient.put<Exercise>(API_ENDPOINTS.EXERCISES.DETAIL(id), exerciseData);
    } catch (error) {
      console.error(`Failed to update exercise ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an exercise
   * @param id Exercise ID
   */
  async deleteExercise(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.EXERCISES.DETAIL(id));
    } catch (error) {
      console.error(`Failed to delete exercise ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search exercises by type or content
   * @param query Search query
   * @param type Optional exercise type filter
   * @returns Paginated list of matching exercises
   */
  async searchExercises(query: string, type?: string): Promise<PaginatedResponse<Exercise>> {
    try {
      return await apiClient.get<PaginatedResponse<Exercise>>(API_ENDPOINTS.EXERCISES.BASE, {
        params: {
          search: query,
          type,
        },
      });
    } catch (error) {
      console.error('Failed to search exercises:', error);
      throw error;
    }
  }
}

// Create and export exercise service instance
export const exerciseService = new ExerciseService();

export default exerciseService;