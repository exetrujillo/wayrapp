import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { 
  Module, 
  CreateModuleRequest, 
  UpdateModuleRequest, 
  PaginatedResponse, 
  PaginationParams 
} from '../utils/types';

class ModuleService {
  /**
   * Get paginated list of modules
   * @param params Pagination parameters
   * @returns Paginated list of modules
   */
  async getModules(params?: PaginationParams): Promise<PaginatedResponse<Module>> {
    try {
      return await apiClient.get<PaginatedResponse<Module>>(API_ENDPOINTS.MODULES.BASE, { params });
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      throw error;
    }
  }

  /**
   * Get modules for a specific section
   * @param sectionId Section ID
   * @param params Pagination parameters
   * @returns Paginated list of modules for the section
   */
  async getModulesBySection(sectionId: string, params?: PaginationParams): Promise<PaginatedResponse<Module>> {
    try {
      return await apiClient.get<PaginatedResponse<Module>>(
        API_ENDPOINTS.SECTIONS.MODULES(sectionId), 
        { params }
      );
    } catch (error) {
      console.error(`Failed to fetch modules for section ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single module by ID
   * @param id Module ID
   * @returns Module details
   */
  async getModule(id: string): Promise<Module> {
    try {
      return await apiClient.get<Module>(API_ENDPOINTS.MODULES.DETAIL(id));
    } catch (error) {
      console.error(`Failed to fetch module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new module in a section
   * @param sectionId Section ID
   * @param moduleData Module creation data
   * @returns Created module
   */
  async createModule(sectionId: string, moduleData: CreateModuleRequest): Promise<Module> {
    try {
      return await apiClient.post<Module>(API_ENDPOINTS.SECTIONS.MODULES(sectionId), moduleData);
    } catch (error) {
      console.error(`Failed to create module in section ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing module
   * @param id Module ID
   * @param moduleData Module update data
   * @returns Updated module
   */
  async updateModule(id: string, moduleData: UpdateModuleRequest): Promise<Module> {
    try {
      return await apiClient.put<Module>(API_ENDPOINTS.MODULES.DETAIL(id), moduleData);
    } catch (error) {
      console.error(`Failed to update module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a module
   * @param id Module ID
   */
  async deleteModule(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.MODULES.DETAIL(id));
    } catch (error) {
      console.error(`Failed to delete module ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reorder modules within a section
   * @param sectionId Section ID
   * @param moduleIds Array of module IDs in the desired order
   * @returns Success response
   */
  async reorderModules(sectionId: string, moduleIds: string[]): Promise<void> {
    try {
      if (!sectionId || typeof sectionId !== 'string') {
        throw new Error('Section ID is required and must be a string');
      }

      if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
        throw new Error('Module IDs array is required and cannot be empty');
      }

      // Validate that all module IDs are strings
      if (!moduleIds.every(id => typeof id === 'string' && id.length > 0)) {
        throw new Error('All module IDs must be non-empty strings');
      }

      await apiClient.put(API_ENDPOINTS.SECTIONS.REORDER_MODULES(sectionId), {
        module_ids: moduleIds
      });
    } catch (error) {
      console.error(`Failed to reorder modules in section ${sectionId}:`, error);
      throw error;
    }
  }
}

// Create and export module service instance
export const moduleService = new ModuleService();

export default moduleService;