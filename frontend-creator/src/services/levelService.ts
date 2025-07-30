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
   * Transform level data from API format to frontend format
   * @private
   */
  private transformLevelFromApi(apiLevel: any): Level {
    return {
      id: apiLevel.id,
      courseId: apiLevel.course_id || apiLevel.courseId,
      code: apiLevel.code,
      name: apiLevel.name,
      order: apiLevel.order,
      createdAt: apiLevel.created_at || apiLevel.createdAt,
      updatedAt: apiLevel.updated_at || apiLevel.updatedAt,
    } as Level;
  }

  /**
   * Transform level data from frontend format to API format
   * @private
   */
  private transformLevelToApi(levelData: CreateLevelRequest | UpdateLevelRequest): any {
    // The API might expect snake_case field names
    const result: any = {
      code: levelData.code,
      name: levelData.name,
      order: levelData.order,
    };

    // Include id for create requests
    if ('id' in levelData && levelData.id) {
      result.id = levelData.id;
    }

    return result;
  }
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
      const response = await apiClient.get<any>(
        API_ENDPOINTS.COURSES.LEVELS(courseId), 
        { params }
      );

      // Handle both wrapped and unwrapped responses
      let levelsArray: any[];
      let meta: any;

      if (Array.isArray(response)) {
        // Direct array response
        levelsArray = response;
        meta = {
          total: response.length,
          page: 1,
          limit: response.length,
          totalPages: 1,
        };
      } else if (response && response.data && Array.isArray(response.data)) {
        // Wrapped response with data array
        levelsArray = response.data;
        meta = response.meta || {
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
        };
      } else {
        throw new Error('Invalid response format from levels API');
      }

      // Transform the levels data
      const levels = levelsArray.map((level: any) => this.transformLevelFromApi(level));

      return {
        data: levels,
        meta,
      };
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
   * Get a single level by ID within a course
   * @param courseId Course ID
   * @param id Level ID
   * @returns Level details
   */
  async getLevel(courseId: string, id: string): Promise<Level> {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    try {
      // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability.
      // This endpoint allows access to any level within any course without verifying if the 
      // authenticated user has permission to access this specific course/level combination.
      // The frontend should validate course ownership/access permissions before making this call,
      // but the primary security control should be implemented on the backend API endpoint.
      // Recommendation: Ensure the backend API validates user permissions for the specific course.
      const response = await apiClient.get<any>(`/courses/${courseId}/levels/${id}`);

      // Handle both wrapped and unwrapped responses
      const levelData = response.data || response;

      // Validate response structure
      if (!levelData || !levelData.id) {
        throw new Error('Invalid level data received from API');
      }

      return this.transformLevelFromApi(levelData);
    } catch (error: any) {
      console.error(`Failed to fetch level ${id} in course ${courseId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${id} not found in course ${courseId}`);
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
      const transformedData = this.transformLevelToApi(levelData);
      console.log('Creating level with transformed data:', transformedData);
      console.log('API endpoint:', API_ENDPOINTS.COURSES.LEVELS(courseId));
      
      const response = await apiClient.post<any>(
        API_ENDPOINTS.COURSES.LEVELS(courseId), 
        transformedData
      );

      console.log('Level creation API response:', response);

      // Handle both wrapped and unwrapped responses
      const levelResponseData = response.data || response;

      // Validate response structure
      if (!levelResponseData || !levelResponseData.id) {
        throw new Error('Invalid response from level creation API');
      }

      return this.transformLevelFromApi(levelResponseData);
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
   * @param courseId Course ID
   * @param id Level ID
   * @param levelData Level update data
   * @returns Updated level
   */
  async updateLevel(courseId: string, id: string, levelData: UpdateLevelRequest): Promise<Level> {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    // Validate that at least one field is being updated
    if (!levelData || Object.keys(levelData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      const transformedData = this.transformLevelToApi(levelData);
      const response = await apiClient.put<any>(`/courses/${courseId}/levels/${id}`, transformedData);

      // Handle both wrapped and unwrapped responses
      const updatedLevelData = response.data || response;

      // Validate response structure
      if (!updatedLevelData || !updatedLevelData.id) {
        throw new Error('Invalid response from level update API');
      }

      return this.transformLevelFromApi(updatedLevelData);
    } catch (error: any) {
      console.error(`Failed to update level ${id} in course ${courseId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${id} not found in course ${courseId}`);
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
   * @param courseId Course ID
   * @param id Level ID
   */
  async deleteLevel(courseId: string, id: string): Promise<void> {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    try {
      await apiClient.delete(`/courses/${courseId}/levels/${id}`);
    } catch (error: any) {
      console.error(`Failed to delete level ${id} in course ${courseId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${id} not found in course ${courseId}`);
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

  /**
   * Reorder levels within a course
   * @param courseId Course ID
   * @param orderedIds Array of level IDs in the new order
   * @returns Updated levels with new order
   */
  async reorderLevels(courseId: string, orderedIds: string[]): Promise<Level[]> {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Course ID is required and must be a string');
    }

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new Error('Ordered IDs array is required and must not be empty');
    }

    try {
      const response = await apiClient.post<any>(
        API_ENDPOINTS.LEVELS.REORDER(courseId),
        { orderedIds }
      );

      // Handle both wrapped and unwrapped responses
      const levelsData = response.data || response;

      // Validate response structure
      if (!Array.isArray(levelsData)) {
        throw new Error('Invalid response from level reorder API');
      }

      return levelsData.map((level: any) => this.transformLevelFromApi(level));
    } catch (error: any) {
      console.error(`Failed to reorder levels in course ${courseId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Course with ID ${courseId} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to reorder levels in this course');
      }

      if (error.status === 400) {
        throw new Error(error.message || 'Invalid level order data provided');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to reorder levels. Please try again later.');
    }
  }
}

// Create and export level service instance
export const levelService = new LevelService();

export default levelService;