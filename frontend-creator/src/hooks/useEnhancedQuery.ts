import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useErrorHandling } from './useErrorHandling';
import { useState, useCallback } from 'react';

interface EnhancedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  queryFn: () => Promise<TData>;
  maxRetries?: number;
  onError?: (error: TError) => void;
  onSuccess?: (data: TData) => void;
}

/**
 * Enhanced query hook with built-in error handling and retry logic
 */
export const useEnhancedQuery = <TData, TError = any>(
  options: EnhancedQueryOptions<TData, TError>
) => {
  const {
    queryFn,
    maxRetries = 3,
    onError,
    onSuccess,
    ...queryOptions
  } = options;

  const errorHandling = useErrorHandling({
    maxRetries,
    ...(onError && { onError }),
  });

  const query = useQuery({
    ...queryOptions,
    queryFn: async () => {
      try {
        errorHandling.clearError();
        const result = await queryFn();
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (error) {
        errorHandling.setError(error);
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
        return false;
      }
      return failureCount < maxRetries;
    },
  });

  const retryQuery = useCallback(() => {
    errorHandling.retry(() => {
      query.refetch();
    });
  }, [errorHandling, query]);

  return {
    ...query,
    retryCount: errorHandling.retryCount,
    canRetry: errorHandling.canRetry,
    retryQuery,
    clearError: errorHandling.clearError,
  };
};

interface EnhancedMutationOptions<TData, TError, TVariables> 
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  maxRetries?: number;
  onError?: (error: TError, variables: TVariables) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
}

/**
 * Enhanced mutation hook with built-in error handling and retry logic
 */
export const useEnhancedMutation = <TData, TError = any, TVariables = void>(
  options: EnhancedMutationOptions<TData, TError, TVariables>
) => {
  const {
    mutationFn,
    maxRetries = 3,
    onError,
    onSuccess,
    ...mutationOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [lastVariables, setLastVariables] = useState<TVariables | null>(null);

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      setLastVariables(variables);
      
      try {
        const result = await mutationFn(variables);
        
        // Reset retry count on success
        setRetryCount(0);
        
        if (onSuccess) {
          onSuccess(result, variables);
        }
        
        return result;
      } catch (error) {
        if (onError) {
          onError(error as TError, variables);
        }
        throw error;
      }
    },
  });

  const retryMutation = useCallback(() => {
    if (retryCount >= maxRetries || !lastVariables) {
      return;
    }

    setRetryCount(prev => prev + 1);
    mutation.mutate(lastVariables);
  }, [retryCount, maxRetries, lastVariables, mutation]);

  const canRetry = retryCount < maxRetries && lastVariables !== null && !mutation.isPending;

  return {
    ...mutation,
    retryCount,
    canRetry,
    retryMutation,
  };
};

export default {
  useEnhancedQuery,
  useEnhancedMutation,
};