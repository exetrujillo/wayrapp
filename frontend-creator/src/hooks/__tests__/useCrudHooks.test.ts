/**
 * Tests for the generic CRUD hooks factory
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createCrudHooks, useCourseHooks, useLevelHooks } from '../useCrudHooks';
import { apiClient } from '../../services/apiClient';
import { Course, Level } from '../../utils/types';

// Mock the API client
jest.mock('../../services/apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('useCrudHooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCrudHooks', () => {
    it('should create hooks with correct interface', () => {
      const hooks = createCrudHooks<Course>({
        endpoint: 'courses',
        supportsReorder: false,
        supportsAssignment: false,
      });

      expect(hooks).toHaveProperty('useList');
      expect(hooks).toHaveProperty('useGet');
      expect(hooks).toHaveProperty('useCreate');
      expect(hooks).toHaveProperty('useUpdate');
      expect(hooks).toHaveProperty('useDelete');
      expect(hooks.useListByParent).toBeUndefined();
      expect(hooks.useReorder).toBeUndefined();
      expect(hooks.useAssign).toBeUndefined();
      expect(hooks.useUnassign).toBeUndefined();
    });

    it('should include hierarchical hooks when parentEndpoint is provided', () => {
      const hooks = createCrudHooks<Level>({
        endpoint: 'levels',
        parentEndpoint: 'courses',
        supportsReorder: true,
        supportsAssignment: false,
      });

      expect(hooks.useListByParent).toBeDefined();
      expect(hooks.useReorder).toBeDefined();
      expect(hooks.useAssign).toBeUndefined();
      expect(hooks.useUnassign).toBeUndefined();
    });

    it('should include assignment hooks when supportsAssignment is true', () => {
      const hooks = createCrudHooks<any>({
        endpoint: 'lessons',
        parentEndpoint: 'modules',
        childEndpoint: 'exercises',
        supportsReorder: true,
        supportsAssignment: true,
      });

      expect(hooks.useAssign).toBeDefined();
      expect(hooks.useUnassign).toBeDefined();
    });
  });

  describe('useList hook', () => {
    it('should call apiClient.list with correct parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Test Course' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
        success: true,
      };
      mockApiClient.list.mockResolvedValue(mockResponse);

      const hooks = createCrudHooks<Course>({
        endpoint: 'courses',
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => hooks.useList({ page: 1, limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.list).toHaveBeenCalledWith('courses', { page: 1, limit: 10 });
      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe('useCreate hook', () => {
    it('should call apiClient.create with correct parameters', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Test Course' },
      };
      mockApiClient.create.mockResolvedValue(mockResponse);

      const hooks = createCrudHooks<Course>({
        endpoint: 'courses',
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      const courseData = { name: 'Test Course' };
      result.current.mutate(courseData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.create).toHaveBeenCalledWith('courses', courseData);
    });
  });

  describe('predefined hooks', () => {
    it('should create course hooks with correct configuration', () => {
      const hooks = useCourseHooks();
      
      expect(hooks.useList).toBeDefined();
      expect(hooks.useGet).toBeDefined();
      expect(hooks.useCreate).toBeDefined();
      expect(hooks.useUpdate).toBeDefined();
      expect(hooks.useDelete).toBeDefined();
      expect(hooks.useListByParent).toBeUndefined();
      expect(hooks.useReorder).toBeUndefined();
    });

    it('should create level hooks with hierarchical support', () => {
      const hooks = useLevelHooks();
      
      expect(hooks.useList).toBeDefined();
      expect(hooks.useGet).toBeDefined();
      expect(hooks.useCreate).toBeDefined();
      expect(hooks.useUpdate).toBeDefined();
      expect(hooks.useDelete).toBeDefined();
      expect(hooks.useListByParent).toBeDefined();
      expect(hooks.useReorder).toBeDefined();
    });
  });
});