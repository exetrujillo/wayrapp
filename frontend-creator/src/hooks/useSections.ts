import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionService } from '../services/sectionService';
import { queryKeys } from './queryKeys';
import { 
  Section, 
  CreateSectionRequest, 
  UpdateSectionRequest, 
  PaginationParams 
} from '../utils/types';

/**
 * Hook for fetching sections by level
 * @param levelId Level ID
 * @param params Pagination and filtering parameters
 * @param enabled Whether the query should be enabled
 * @returns Query result with sections data, loading, and error states
 */
export const useSectionsQuery = (levelId: string, params?: PaginationParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.sections.list(levelId, params),
    queryFn: () => sectionService.getSectionsByLevel(levelId, params),
    enabled: enabled && !!levelId,
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
 * Hook for fetching a single section by ID
 * @param id Section ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with section data, loading, and error states
 */
export const useSectionQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.sections.detail(id),
    queryFn: () => sectionService.getSection(id),
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
 * Hook for creating a new section
 * @returns Mutation object with mutate function and states
 */
export const useCreateSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ levelId, sectionData }: { levelId: string; sectionData: CreateSectionRequest }) => 
      sectionService.createSection(levelId, sectionData),
    onMutate: async ({ levelId, sectionData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.list(levelId) });

      // Snapshot the previous value
      const previousSections = queryClient.getQueryData(queryKeys.sections.list(levelId));

      // Optimistically update to the new value
      if (previousSections) {
        queryClient.setQueryData(queryKeys.sections.list(levelId), (old: any) => ({
          ...old,
          data: [
            ...old.data,
            {
              levelId,
              ...sectionData,
              id: sectionData.id || `temp-${Date.now()}`, // Use provided ID or temporary
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: old.total + 1,
        }));
      }

      return { previousSections, levelId };
    },
    onSuccess: (newSection: Section, { levelId }) => {
      // Invalidate and refetch sections list for the level
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.list(levelId) });
      
      // Add the new section to the cache
      queryClient.setQueryData(queryKeys.sections.detail(newSection.id), newSection);
      
      // Invalidate level detail if it includes section count
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.detail(levelId) });
    },
    onError: (error, { levelId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousSections) {
        queryClient.setQueryData(queryKeys.sections.list(levelId), context.previousSections);
      }
      console.error('Failed to create section:', error);
    },
    onSettled: (_, __, { levelId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.list(levelId) });
    },
  });
};

/**
 * Hook for updating an existing section
 * @returns Mutation object with mutate function and states
 */
export const useUpdateSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sectionData }: { id: string; sectionData: UpdateSectionRequest }) => 
      sectionService.updateSection(id, sectionData),
    onMutate: async ({ id, sectionData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.detail(id) });

      // Snapshot the previous value
      const previousSection = queryClient.getQueryData(queryKeys.sections.detail(id));

      // Optimistically update to the new value
      if (previousSection) {
        queryClient.setQueryData(queryKeys.sections.detail(id), (old: any) => ({
          ...old,
          ...sectionData,
          updatedAt: new Date().toISOString(),
        }));
      }

      return { previousSection, id };
    },
    onSuccess: (updatedSection: Section) => {
      // Update the specific section in cache
      queryClient.setQueryData(queryKeys.sections.detail(updatedSection.id), updatedSection);
      
      // Invalidate sections list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.list(updatedSection.levelId) });
      
      // Invalidate level detail if it includes section count
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.detail(updatedSection.levelId) });
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousSection) {
        queryClient.setQueryData(queryKeys.sections.detail(id), context.previousSection);
      }
      console.error('Failed to update section:', error);
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.detail(id) });
    },
  });
};

/**
 * Hook for deleting a section
 * @returns Mutation object with mutate function and states
 */
export const useDeleteSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ levelId, id }: { levelId: string; id: string }) => sectionService.deleteSection(levelId, id),
    onMutate: async ({ levelId, id: deletedId }) => {
      // Get the section data before removing it
      const sectionData = queryClient.getQueryData(queryKeys.sections.detail(deletedId)) as Section;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.list(levelId) });

      // Snapshot the previous value
      const previousSections = queryClient.getQueryData(queryKeys.sections.list(levelId));

      // Optimistically update by removing the section
      if (previousSections) {
        queryClient.setQueryData(queryKeys.sections.list(levelId), (old: any) => ({
          ...old,
          data: old.data.filter((section: Section) => section.id !== deletedId),
          total: old.total - 1,
        }));
      }

      return { previousSections, sectionData, levelId };
    },
    onSuccess: (_, { levelId, id: deletedId }) => {
      // Remove the section from cache
      queryClient.removeQueries({ queryKey: queryKeys.sections.detail(deletedId) });
      
      // Invalidate sections list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.list(levelId) });
      // Invalidate level detail if it includes section count
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.detail(levelId) });
    },
    onError: (error, { levelId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousSections) {
        queryClient.setQueryData(queryKeys.sections.list(levelId), context.previousSections);
      }
      console.error('Failed to delete section:', error);
    },
    onSettled: (_, __, { levelId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.list(levelId) });
    },
  });
};

/**
 * Hook for reordering sections within a level
 * @returns Mutation object with mutate function and states
 */
export const useReorderSectionsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ levelId, sectionIds }: { levelId: string; sectionIds: string[] }) => 
      sectionService.reorderSections(levelId, sectionIds),
    onMutate: async ({ levelId, sectionIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sections.list(levelId) });

      // Snapshot the previous value
      const previousSections = queryClient.getQueryData(queryKeys.sections.list(levelId));

      // Optimistically update the order
      if (previousSections) {
        queryClient.setQueryData(queryKeys.sections.list(levelId), (old: any) => {
          const reorderedSections = sectionIds.map((id, index) => {
            const section = old.data.find((s: Section) => s.id === id);
            return section ? { ...section, order: index + 1 } : null;
          }).filter(Boolean);

          return {
            ...old,
            data: reorderedSections,
          };
        });
      }

      return { previousSections, levelId };
    },
    onSuccess: (reorderedSections: Section[], { levelId }) => {
      // Update the sections list with the new order
      queryClient.setQueryData(queryKeys.sections.list(levelId), (old: any) => ({
        ...old,
        data: reorderedSections,
      }));

      // Update individual section caches with new order
      reorderedSections.forEach(section => {
        queryClient.setQueryData(queryKeys.sections.detail(section.id), section);
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.detail(levelId) });
    },
    onError: (error, { levelId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousSections) {
        queryClient.setQueryData(queryKeys.sections.list(levelId), context.previousSections);
      }
      console.error('Failed to reorder sections:', error);
    },
    onSettled: (_, __, { levelId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.list(levelId) });
    },
  });
};

// Export all hooks for easy importing
export default {
  useSectionsQuery,
  useSectionQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useReorderSectionsMutation,
};