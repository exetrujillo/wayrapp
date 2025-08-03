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
 * Hook for fetching a single module by ID within a section
 * @param sectionId Section ID
 * @param id Module ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with module data, loading, and error states
 */
export const useModuleQuery = (sectionId: string, id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => moduleService.getModule(sectionId, id),
    enabled: enabled && !!id && !!sectionId,
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
              ...moduleData,
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
    mutationFn: ({ sectionId, id, moduleData }: { sectionId: string; id: string; moduleData: UpdateModuleRequest }) => 
      moduleService.updateModule(sectionId, id, moduleData),
    onMutate: async ({ sectionId, id, moduleData }) => {
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

      return { previousModule, sectionId, id };
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
    onSettled: (_, __, { sectionId, id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(id) });
      // Also invalidate the section's modules list
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
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
    mutationFn: ({ sectionId, id }: { sectionId: string; id: string }) => moduleService.deleteModule(sectionId, id),
    onMutate: async ({ sectionId, id: deletedId }) => {
      // Get the module data before removing it
      const moduleData = queryClient.getQueryData(queryKeys.modules.detail(deletedId)) as Module;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.modules.list(sectionId) });

      // Snapshot the previous value
      const previousModules = queryClient.getQueryData(queryKeys.modules.list(sectionId));

      // Optimistically update by removing the module
      if (previousModules) {
        queryClient.setQueryData(queryKeys.modules.list(sectionId), (old: any) => ({
          ...old,
          data: old.data.filter((module: Module) => module.id !== deletedId),
          total: old.total - 1,
        }));
      }

      return { previousModules, moduleData, sectionId };
    },
    onSuccess: (_, { sectionId, id: deletedId }) => {
      // Remove the module from cache
      queryClient.removeQueries({ queryKey: queryKeys.modules.detail(deletedId) });
      
      // Invalidate modules list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
      // Invalidate section detail if it includes module count
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(sectionId) });
    },
    onError: (error, { sectionId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousModules) {
        queryClient.setQueryData(queryKeys.modules.list(sectionId), context.previousModules);
      }
      console.error('Failed to delete module:', error);
    },
    onSettled: (_, __, { sectionId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
    },
  });
};

/**
 * Hook for reordering modules within a section
 * @returns Mutation object with mutate function and states
 */
export const useReorderModulesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, moduleIds }: { sectionId: string; moduleIds: string[] }) => 
      moduleService.reorderModules(sectionId, moduleIds),
    onMutate: async ({ sectionId, moduleIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.modules.list(sectionId) });

      // Snapshot the previous value
      const previousModules = queryClient.getQueryData(queryKeys.modules.list(sectionId));

      // Optimistically update to the new order
      if (previousModules) {
        queryClient.setQueryData(queryKeys.modules.list(sectionId), (old: any) => {
          const moduleMap = new Map(old.data.map((module: Module) => [module.id, module]));
          const reorderedModules = moduleIds.map((id, index) => {
            const module = moduleMap.get(id);
            if (!module) return null;
            return {
              ...module,
              order: index + 1,
            };
          }).filter(Boolean);

          return {
            ...old,
            data: reorderedModules,
          };
        });
      }

      return { previousModules, sectionId };
    },
    onSuccess: (_, { sectionId }) => {
      // Invalidate and refetch modules list for the section
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
      
      // Invalidate section detail if it includes module count
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(sectionId) });
    },
    onError: (error, { sectionId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousModules) {
        queryClient.setQueryData(queryKeys.modules.list(sectionId), context.previousModules);
      }
      console.error('Failed to reorder modules:', error);
    },
    onSettled: (_, __, { sectionId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.list(sectionId) });
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
  useReorderModulesMutation,
};