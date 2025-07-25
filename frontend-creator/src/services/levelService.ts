import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { 
  Level, 
  CreateLevelRequest, 
  UpdateLevelRequest, 
  PaginatedResponse, 
  PaginationParams 
} from '../utils/types';

/**
 * Service class for managing Level entities
 * Handles CRUD operations for levels within courses
 */
class LevelService {
  /**
   * Get levels for a specific course
   * @param courseId Course ID
   * @param params Pagination parameters
   * @returns Paginated list of levels for the course
   */
  async getLevelsByCourse(courseId: string, params?: PaginationParams): Promise<PaginatedResponse<Level>> {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<PaginatedResponse<Level>>(
        API_ENDPOINTS.COURSES.LEVELS(courseId), 
        { params }
      );

      // Validate response structure
      if (!response || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from levels API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to fetch levels for course ${courseId}:`, error);
      
      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Course with ID ${courseId} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to access levels for this course');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch levels. Please try again later.');
    }
  }

  /**
   * Get a single level by ID
   * @param id Level ID
   * @returns Level details
   */
  async getLevel(id: string): Promise<Level> {
    if (!id || typeof id !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<Level>(API_ENDPOINTS.LEVELS.DETAIL(id));

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid level data received from API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to fetch level ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to access this level');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch level details. Please try again later.');
    }
  }

  /**
   * Create a new level in a course
   * @param courseId Course ID
   * @param levelData Level creation data
   * @returns Created level
   */
  async createLevel(courseId: string, levelData: CreateLevelRequest): Promise<Level> {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    // Validate required fields
    if (!levelData.name || !levelData.code) {
      throw new Error('Level name and code are required');
    }

    if (typeof levelData.order !== 'number' || levelData.order < 0) {
      throw new Error('Level order must be a non-negative number');
    }

    try {
      const response = await apiClient.post<Level>(
        API_ENDPOINTS.COURSES.LEVELS(courseId), 
        levelData
      );

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid response from level creation API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to create level in course ${courseId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid level data provided');
      }

      if (error.status === 404) {
        throw new Error(`Course with ID ${courseId} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to create levels in this course');
      }

      if (error.status === 409) {
        throw new Error('A level with this code already exists in the course');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to create level. Please try again later.');
    }
  }

  /**
   * Update an existing level
   * @param id Level ID
   * @param levelData Level update data
   * @returns Updated level
   */
  async updateLevel(id: string, levelData: UpdateLevelRequest): Promise<Level> {
    if (!id || typeof id !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    // Validate that at least one field is being updated
    if (!levelData || Object.keys(levelData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      const response = await apiClient.put<Level>(API_ENDPOINTS.LEVELS.DETAIL(id), levelData);

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid response from level update API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to update level ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to update this level');
      }

      if (error.status === 400) {
        throw new Error(error.message || 'Invalid level data provided');
      }

      if (error.status === 409) {
        throw new Error('A level with this code already exists in the course');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to update level. Please try again later.');
    }
  }

  /**
   * Delete a level
   * @param id Level ID
   */
  async deleteLevel(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    try {
      await apiClient.delete(API_ENDPOINTS.LEVELS.DETAIL(id));
    } catch (error: any) {
      console.error(`Failed to delete level ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to delete this level');
      }

      if (error.status === 409) {
        throw new Error('Cannot delete level because it has associated content');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to delete level. Please try again later.');
    }
  }
}

// Create and export level service instance
export const levelService = new LevelService();

export default levelService;