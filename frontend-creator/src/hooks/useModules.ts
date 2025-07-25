import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleService } from '../services/moduleService';
import { queryKeys } from './queryKeys';
import { 
  Module, 
  CreateModuleRequest, 
  UpdateModuleRequest, 
  PaginationParams 
} from '../utils/types';

/**
 * Hook for fetching modules by section
 * @param sectionId Section ID
 * @param params Pagination and filtering parameters
 * @param enabled Whether the query should be enabled
 * @returns Query result with modules data, loading, and error states
 */
export const useModulesQuery = (sectionId: string, params?: PaginationParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.modules.list(sectionId, params),
    queryFn: () => moduleService.getModulesBySection(sectionId, params),
    enabled: enabled && !!sectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching a single module by ID
 * @param id Module ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with module data, loading, and error states
 */
export const useModuleQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => moduleService.getModule(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for creating a new module
 * @returns Mutation object with mutate function and states
 */
export const useCreateModuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, moduleData }: { sectionId: string; moduleData: CreateModuleRequest }) => 
      moduleService.createModule(sectionId, moduleData),
    onMutate: async ({ sectionId, moduleData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.modules.list(sectionId) });

      // Snapshot the previous value
      const previousModules = queryClient.getQueryData(queryKeys.modules.list(sectionId));

      // Optimistically update to the new value
      if (previousModules) {
        queryClient.setQueryData(queryKeys.modules.list(sectionId), (old: any) => ({
          ...old,
          data: [
            ...old.data,
            {
              id: `temp-${Date.now()}`, // Temporary ID
              ...moduleData,
              sectionId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: old.total + 1,
        }));
      }

      return { previousModules, sectionId };
    },
    onSuccess: (newModule: Module, { sectionId }) => {
      // Invalidate and refetch modules list for the section
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
      
      // Add the new module to the cache
      queryClient.setQueryData(queryKeys.modules.detail(newModule.id), newModule);
      
      // Invalidate section detail if it includes module count
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(sectionId) });
    },
    onError: (error, { sectionId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousModules) {
        queryClient.setQueryData(queryKeys.modules.list(sectionId), context.previousModules);
      }
      console.error('Failed to create module:', error);
    },
    onSettled: (_, __, { sectionId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
    },
  });
};

/**
 * Hook for updating an existing module
 * @returns Mutation object with mutate function and states
 */
export const useUpdateModuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, moduleData }: { id: string; moduleData: UpdateModuleRequest }) => 
      moduleService.updateModule(id, moduleData),
    onMutate: async ({ id, moduleData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.modules.detail(id) });

      // Snapshot the previous value
      const previousModule = queryClient.getQueryData(queryKeys.modules.detail(id));

      // Optimistically update to the new value
      if (previousModule) {
        queryClient.setQueryData(queryKeys.modules.detail(id), (old: any) => ({
          ...old,
          ...moduleData,
          updatedAt: new Date().toISOString(),
        }));
      }

      return { previousModule, id };
    },
    onSuccess: (updatedModule: Module) => {
      // Update the specific module in cache
      queryClient.setQueryData(queryKeys.modules.detail(updatedModule.id), updatedModule);
      
      // Invalidate modules list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(updatedModule.sectionId) });
      
      // Invalidate section detail if it includes module count
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(updatedModule.sectionId) });
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousModule) {
        queryClient.setQueryData(queryKeys.modules.detail(id), context.previousModule);
      }
      console.error('Failed to update module:', error);
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(id) });
    },
  });
};

/**
 * Hook for deleting a module
 * @returns Mutation object with mutate function and states
 */
export const useDeleteModuleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => moduleService.deleteModule(id),
    onMutate: async (deletedId) => {
      // Get the module data before removing it to access sectionId
      const moduleData = queryClient.getQueryData(queryKeys.modules.detail(deletedId)) as Module;
      
      if (moduleData?.sectionId) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: queryKeys.modules.list(moduleData.sectionId) });

        // Snapshot the previous value
        const previousModules = queryClient.getQueryData(queryKeys.modules.list(moduleData.sectionId));

        // Optimistically update by removing the module
        if (previousModules) {
          queryClient.setQueryData(queryKeys.modules.list(moduleData.sectionId), (old: any) => ({
            ...old,
            data: old.data.filter((module: Module) => module.id !== deletedId),
            total: old.total - 1,
          }));
        }

        return { previousModules, moduleData };
      }

      return { moduleData };
    },
    onSuccess: (_, deletedId: string) => {
      // Get the module data before removing it to access sectionId
      const moduleData = queryClient.getQueryData(queryKeys.modules.detail(deletedId)) as Module;
      
      // Remove the module from cache
      queryClient.removeQueries({ queryKey: queryKeys.modules.detail(deletedId) });
      
      // Invalidate modules list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.lists() });
      if (moduleData?.sectionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(moduleData.sectionId) });
        // Invalidate section detail if it includes module count
        queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(moduleData.sectionId) });
      }
    },
    onError: (error, _deletedId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousModules && context?.moduleData?.sectionId) {
        queryClient.setQueryData(queryKeys.modules.list(context.moduleData.sectionId), context.previousModules);
      }
      console.error('Failed to delete module:', error);
    },
    onSettled: (_, __, deletedId) => {
      // Always refetch after error or success
      const moduleData = queryClient.getQueryData(queryKeys.modules.detail(deletedId)) as Module;
      if (moduleData?.sectionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(moduleData.sectionId) });
      }
    },
  });
};

// Export all hooks for easy importing
export default {
  useModulesQuery,
  useModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useDeleteModuleMutation,
};