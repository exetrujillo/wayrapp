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
 * 
 * SECURITY_AUDIT_TODO: Consider implementing a centralized authorization service
 * This service currently relies entirely on backend authorization checks. While this is secure,
 * implementing client-side authorization checks using the AuthContext (user role, permissions)
 * would improve user experience by preventing unauthorized API calls and providing immediate
 * feedback. Consider creating an authorization utility that checks user permissions before
 * making API calls, especially for create, update, and delete operations.
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

    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The levelId parameter is passed directly to the API without client-side authorization checks.
    // While the backend should handle authorization, consider adding client-side validation to check
    // if the current user has permission to access this specific level before making the API call.
    // This would provide better UX and reduce unnecessary API calls for unauthorized access attempts.

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

    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The section ID is passed directly to the API without client-side authorization checks.
    // Consider implementing client-side validation to verify the user has permission to access
    // this specific section before making the API call. This helps prevent unauthorized access
    // attempts and improves user experience by providing immediate feedback.

    try {
      const response = await apiClient.get<Section>(API_ENDPOINTS.SECTIONS.DETAIL(id));

      // Handle both wrapped and unwrapped responses
      const sectionData = response;

      // Validate response structure
      if (!sectionData || !sectionData.id) {
        throw new Error('Invalid section data received from API');
      }

      return sectionData;
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

    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The levelId parameter is used directly without verifying the user has permission to create
    // sections in this specific level. Consider adding client-side authorization checks to verify
    // the user owns or has edit permissions for the level before attempting section creation.

    // Validate required fields
    if (!sectionData.id) {
      throw new Error('Section ID is required');
    }

    if (!sectionData.name) {
      throw new Error('Section name is required');
    }

    // SECURITY_AUDIT_TODO: Input validation could be strengthened
    // Consider adding more comprehensive validation for sectionData.name to prevent potential
    // XSS attacks or injection attempts. Validate length limits, character restrictions, and
    // sanitize input before sending to the API. Also validate the order field more thoroughly.
    if (typeof sectionData.order !== 'number' || sectionData.order < 1) {
      throw new Error('Section order must be at least 1');
    }

    try {
      const response = await apiClient.post<Section>(
        API_ENDPOINTS.LEVELS.SECTIONS(levelId),
        sectionData
      );

      // SECURITY_AUDIT_TODO: Response structure validation could be more robust
      // The current response handling accepts both wrapped (response.data) and unwrapped responses,
      // which could potentially allow malicious responses to bypass validation. Consider implementing
      // strict response schema validation using Zod or similar to ensure the response structure
      // matches expected format and contains only expected fields.

      // Handle both wrapped and unwrapped responses
      const sectionResponseData = response;

      // Validate response structure
      if (!sectionResponseData || !sectionResponseData.id) {
        throw new Error('Invalid response from section creation API');
      }

      return sectionResponseData;
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

    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The section ID is used directly without verifying the user has permission to update this
    // specific section. Consider adding client-side authorization checks to verify the user owns
    // or has edit permissions for the section before attempting updates.

    // Validate that at least one field is being updated
    if (!sectionData || Object.keys(sectionData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // SECURITY_AUDIT_TODO: Input validation could be strengthened
    // Consider adding comprehensive validation for all updatable fields (name, order) to prevent
    // potential XSS attacks or injection attempts. Validate data types, length limits, and
    // sanitize input before sending to the API.

    try {
      const response = await apiClient.put<Section>(API_ENDPOINTS.SECTIONS.DETAIL(id), sectionData);

      // Handle both wrapped and unwrapped responses
      const sectionResponseData = response;

      // Validate response structure
      if (!sectionResponseData || !sectionResponseData.id) {
        throw new Error('Invalid response from section update API');
      }

      return sectionResponseData;
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
   * @param levelId Level ID
   * @param id Section ID
   */
  async deleteSection(levelId: string, id: string): Promise<void> {
    if (!levelId || typeof levelId !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }

    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The section ID is used directly without verifying the user has permission to delete this
    // specific section. Consider adding client-side authorization checks to verify the user owns
    // or has delete permissions for the section before attempting deletion. This is especially
    // critical for delete operations as they are irreversible.

    try {
      await apiClient.delete(`/levels/${levelId}/sections/${id}`);
    } catch (error: any) {
      console.error(`Failed to delete section ${id} in level ${levelId}:`, error);

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

  /**
   * Reorder sections within a level
   * @param levelId Level ID
   * @param sectionIds Array of section IDs in the new order
   * @returns Updated sections with new order
   */
  async reorderSections(levelId: string, sectionIds: string[]): Promise<Section[]> {
    if (!levelId || typeof levelId !== 'string') {
      throw new Error('Level ID is required and must be a string');
    }

    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      throw new Error('Section IDs array is required and must not be empty');
    }

    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The levelId and sectionIds are used directly without verifying the user has permission
    // to reorder sections in this specific level. Consider adding client-side authorization
    // checks to verify the user owns or has edit permissions for the level and all sections
    // before attempting reorder operations.

    try {
      const response = await apiClient.put<Section[]>(
        `/levels/${levelId}/sections/reorder`,
        { section_ids: sectionIds }
      );

      // Handle both wrapped and unwrapped responses
      const sectionsData = response;

      // Validate response structure
      if (!Array.isArray(sectionsData)) {
        throw new Error('Invalid response from section reorder API');
      }

      return sectionsData;
    } catch (error: any) {
      console.error(`Failed to reorder sections in level ${levelId}:`, error);

      // Provide specific error messages based on status
      if (error.status === 404) {
        throw new Error(`Level with ID ${levelId} not found`);
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to reorder sections in this level');
      }

      if (error.status === 400) {
        throw new Error(error.message || 'Invalid section order data provided');
      }

      if (error.message) {
        throw error;
      }

      throw new Error('Failed to reorder sections. Please try again later.');
    }
  }
}

// Create and export section service instance
export const sectionService = new SectionService();

export default sectionService;