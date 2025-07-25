import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { 
  Section, 
  CreateSectionRequest, 
  UpdateSectionRequest, 
  PaginatedResponse, 
  PaginationParams 
} from '../utils/types';

/**
 * Service class for managing Section entities
 * Handles CRUD operations for sections within levels
 */
class SectionService {
  /**
   * Get sections for a specific level
   * @param levelId Level ID
   * @param params Pagination parameters
   * @returns Paginated list of sections for the level
   */
  async getSectionsByLevel(levelId: string, params?: PaginationParams): Promise<PaginatedResponse<Section>> {
    if (!levelId || typeof levelId !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<PaginatedResponse<Section>>(
        API_ENDPOINTS.LEVELS.SECTIONS(levelId), 
        { params }
      );

      // Validate response structure
      if (!response || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from sections API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to fetch sections for level ${levelId}:`, error);
      
      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${levelId} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to access sections for this level');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch sections. Please try again later.');
    }
  }

  /**
   * Get a single section by ID
   * @param id Section ID
   * @returns Section details
   */
  async getSection(id: string): Promise<Section> {
    if (!id || typeof id !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<Section>(API_ENDPOINTS.SECTIONS.DETAIL(id));

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid section data received from API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to fetch section ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Section with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to access this section');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to fetch section details. Please try again later.');
    }
  }

  /**
   * Create a new section in a level
   * @param levelId Level ID
   * @param sectionData Section creation data
   * @returns Created section
   */
  async createSection(levelId: string, sectionData: CreateSectionRequest): Promise<Section> {
    if (!levelId || typeof levelId !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    // Validate required fields
    if (!sectionData.name) {
      throw new Error('Section name is required');
    }

    if (typeof sectionData.order !== 'number' || sectionData.order < 0) {
      throw new Error('Section order must be a non-negative number');
    }

    try {
      const response = await apiClient.post<Section>(
        API_ENDPOINTS.LEVELS.SECTIONS(levelId), 
        sectionData
      );

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid response from section creation API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to create section in level ${levelId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid section data provided');
      }

      if (error.status === 404) {
        throw new Error(`Level with ID ${levelId} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to create sections in this level');
      }

      if (error.status === 409) {
        throw new Error('A section with this order already exists in the level');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to create section. Please try again later.');
    }
  }

  /**
   * Update an existing section
   * @param id Section ID
   * @param sectionData Section update data
   * @returns Updated section
   */
  async updateSection(id: string, sectionData: UpdateSectionRequest): Promise<Section> {
    if (!id || typeof id !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }

    // Validate that at least one field is being updated
    if (!sectionData || Object.keys(sectionData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    try {
      const response = await apiClient.put<Section>(API_ENDPOINTS.SECTIONS.DETAIL(id), sectionData);

      // Validate response structure
      if (!response || !response.id) {
        throw new Error('Invalid response from section update API');
      }

      return response;
    } catch (error: any) {
      console.error(`Failed to update section ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Section with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to update this section');
      }

      if (error.status === 400) {
        throw new Error(error.message || 'Invalid section data provided');
      }

      if (error.status === 409) {
        throw new Error('A section with this order already exists in the level');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to update section. Please try again later.');
    }
  }

  /**
   * Delete a section
   * @param id Section ID
   */
  async deleteSection(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }

    try {
      await apiClient.delete(API_ENDPOINTS.SECTIONS.DETAIL(id));
    } catch (error: any) {
      console.error(`Failed to delete section ${id}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Section with ID ${id} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to delete this section');
      }

      if (error.status === 409) {
        throw new Error('Cannot delete section because it has associated content');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to delete section. Please try again later.');
    }
  }
}

// Create and export section service instance
export const sectionService = new SectionService();

export default sectionService;