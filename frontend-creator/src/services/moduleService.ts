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
   * Transform module data from API format to frontend format
   * @param apiModule API module data
   * @returns Module object formatted for frontend consumption
   * @private
   */
  private transformModuleFromApi(apiModule: any): Module {
    return {
      id: apiModule.id,
      sectionId: apiModule.section_id, // Transform snake_case to camelCase
      moduleType: apiModule.module_type,
      name: apiModule.name,
      order: apiModule.order,
      createdAt: apiModule.created_at,
      updatedAt: apiModule.updated_at,
    };
  }

  /**
   * Transform module data from frontend format to API format
   * @param moduleData Frontend module data
   * @returns Module data formatted for API consumption
   * @private
   */
  private transformModuleToApi(moduleData: CreateModuleRequest | UpdateModuleRequest): any {
    const result: any = {};

    // Add common fields
    if (moduleData.name !== undefined) {
      result.name = moduleData.name;
    }
    if (moduleData.order !== undefined) {
      result.order = moduleData.order;
    }
    if (moduleData.moduleType !== undefined) {
      result.module_type = moduleData.moduleType;
    }

    // Add fields for create requests
    if ('id' in moduleData) {
      result.id = moduleData.id;
    }

    return result;
  }

  /**
   * Get paginated list of modules
   * @param params Pagination parameters
   * @returns Paginated list of modules
   */
  async getModules(params?: PaginationParams): Promise<PaginatedResponse<Module>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.MODULES.BASE, { params });
      
      // Extract data from API response format { data: modules, success: true, timestamp: ... }
      const modulesData = response.data || response;
      
      // Transform the modules data
      const transformedModules = Array.isArray(modulesData) ? modulesData.map((module: any) => this.transformModuleFromApi(module)) : [];
      
      return {
        ...response,
        data: transformedModules,
      };
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
      const response = await apiClient.get<any>(
        API_ENDPOINTS.SECTIONS.MODULES(sectionId), 
        { params }
      );
      
      // Extract data from API response format { data: modules, success: true, timestamp: ... }
      const modulesData = response.data || response;
      
      // Transform the modules data
      const transformedModules = Array.isArray(modulesData) ? modulesData.map((module: any) => this.transformModuleFromApi(module)) : [];
      
      return {
        ...response,
        data: transformedModules,
      };
    } catch (error) {
      console.error(`Failed to fetch modules for section ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single module by ID within a section
   * @param sectionId Section ID
   * @param id Module ID
   * @returns Module details
   */
  async getModule(sectionId: string, id: string): Promise<Module> {
    if (!sectionId || typeof sectionId !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    try {
      const response = await apiClient.get<any>(`/sections/${sectionId}/modules/${id}`);
      const moduleData = response.data || response;
      return this.transformModuleFromApi(moduleData);
    } catch (error) {
      console.error(`Failed to fetch module ${id} in section ${sectionId}:`, error);
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
      const transformedData = this.transformModuleToApi(moduleData);
      const response = await apiClient.post<any>(API_ENDPOINTS.SECTIONS.MODULES(sectionId), transformedData);
      const responseData = response.data || response;
      return this.transformModuleFromApi(responseData);
    } catch (error) {
      console.error(`Failed to create module in section ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing module
   * @param sectionId Section ID
   * @param id Module ID
   * @param moduleData Module update data
   * @returns Updated module
   */
  async updateModule(sectionId: string, id: string, moduleData: UpdateModuleRequest): Promise<Module> {
    if (!sectionId || typeof sectionId !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    try {
      const transformedData = this.transformModuleToApi(moduleData);
      const response = await apiClient.put<any>(`/sections/${sectionId}/modules/${id}`, transformedData);
      const responseData = response.data || response;
      return this.transformModuleFromApi(responseData);
    } catch (error) {
      console.error(`Failed to update module ${id} in section ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a module
   * @param sectionId Section ID
   * @param id Module ID
   */
  async deleteModule(sectionId: string, id: string): Promise<void> {
    if (!sectionId || typeof sectionId !== 'string') {
      throw new Error('Section ID is required and must be a string');
    }
    
    if (!id || typeof id !== 'string') {
      throw new Error('Module ID is required and must be a string');
    }

    try {
      await apiClient.delete(`/sections/${sectionId}/modules/${id}`);
    } catch (error) {
      console.error(`Failed to delete module ${id} in section ${sectionId}:`, error);
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