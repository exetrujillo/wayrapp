import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { 
  Exercise, 
  CreateExerciseRequest, 
  UpdateExerciseRequest, 
  PaginatedResponse, 
  PaginationParams,
  ExerciseUsage,
  ExerciseDeleteImpact,
  ExerciseDuplicationOptions,
  ExerciseAnalytics
} from '../utils/types';

class ExerciseService {
  /**
   * Transform exercise data from API format to frontend format
   * @param apiExercise API exercise data
   * @returns Exercise object formatted for frontend consumption
   * @private
   */
  private transformExerciseFromApi(apiExercise: any): Exercise {
    return {
      id: apiExercise.id,
      exerciseType: apiExercise.exercise_type, // Transform snake_case to camelCase
      data: apiExercise.data,
      createdAt: apiExercise.created_at || apiExercise.createdAt,
      updatedAt: apiExercise.updated_at || apiExercise.updatedAt,
    };
  }

  /**
   * Get paginated list of exercises
   * @param params Pagination parameters
   * @returns Paginated list of exercises
   */
  async getExercises(params?: PaginationParams): Promise<PaginatedResponse<Exercise>> {
    try {
      const response: any = await apiClient.get<any>(API_ENDPOINTS.EXERCISES.BASE, { params });
      // Handle wrapped API response format
      const exerciseList: any[] = response.data || response;
      return {
        ...response,
        data: exerciseList.map((exercise: any) => this.transformExerciseFromApi(exercise))
      };
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
      const response: any = await apiClient.get<any>(API_ENDPOINTS.EXERCISES.DETAIL(id));
      // Handle wrapped API response format
      const exerciseResponse: any = response.data || response;
      return this.transformExerciseFromApi(exerciseResponse);
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
      const response: any = await apiClient.post<any>(API_ENDPOINTS.EXERCISES.BASE, exerciseData);
      // Handle wrapped API response format
      const exerciseResponse: any = response.data || response;
      return this.transformExerciseFromApi(exerciseResponse);
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
      const response: any = await apiClient.put<any>(API_ENDPOINTS.EXERCISES.DETAIL(id), exerciseData);
      // Handle wrapped API response format
      const exerciseResponse: any = response.data || response;
      return this.transformExerciseFromApi(exerciseResponse);
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

  /**
   * Get exercise usage statistics
   * @param id Exercise ID
   * @returns Exercise usage statistics
   */
  async getExerciseUsage(id: string): Promise<ExerciseUsage> {
    try {
      return await apiClient.get<ExerciseUsage>(`${API_ENDPOINTS.EXERCISES.DETAIL(id)}/usage`);
    } catch (error) {
      console.error(`Failed to fetch exercise usage for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get exercise deletion impact analysis
   * @param id Exercise ID
   * @returns Deletion impact analysis
   */
  async getExerciseDeleteImpact(id: string): Promise<ExerciseDeleteImpact> {
    try {
      return await apiClient.get<ExerciseDeleteImpact>(`${API_ENDPOINTS.EXERCISES.DETAIL(id)}/delete-impact`);
    } catch (error) {
      console.error(`Failed to fetch delete impact for exercise ${id}:`, error);
      throw error;
    }
  }

  /**
   * Duplicate an exercise
   * @param id Source exercise ID
   * @param options Duplication options
   * @returns Duplicated exercise
   */
  async duplicateExercise(id: string, options: ExerciseDuplicationOptions): Promise<Exercise> {
    try {
      return await apiClient.post<Exercise>(`${API_ENDPOINTS.EXERCISES.DETAIL(id)}/duplicate`, options);
    } catch (error) {
      console.error(`Failed to duplicate exercise ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get exercise analytics
   * @param id Exercise ID
   * @returns Exercise analytics
   */
  async getExerciseAnalytics(id: string): Promise<ExerciseAnalytics> {
    try {
      return await apiClient.get<ExerciseAnalytics>(`${API_ENDPOINTS.EXERCISES.DETAIL(id)}/analytics`);
    } catch (error) {
      console.error(`Failed to fetch analytics for exercise ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get batch exercise usage statistics
   * @param exerciseIds Array of exercise IDs
   * @returns Array of exercise usage statistics
   */
  async getBatchExerciseUsage(exerciseIds: string[]): Promise<ExerciseUsage[]> {
    try {
      return await apiClient.post<ExerciseUsage[]>(`${API_ENDPOINTS.EXERCISES.BASE}/usage/batch`, {
        exerciseIds
      });
    } catch (error) {
      console.error('Failed to fetch batch exercise usage:', error);
      throw error;
    }
  }
}

// Create and export exercise service instance
export const exerciseService = new ExerciseService();

export default exerciseService;