import { QueryClient } from '@tanstack/react-query';

// Optimized Query Client Configuration
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry only once for other errors to fail faster and avoid stuck loading states
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Reduced max delay from 30s to 5s

        // Refetch configuration
        refetchOnWindowFocus: false, // Disable to reduce unnecessary requests
        refetchOnReconnect: 'always',
        refetchOnMount: true,

        // Stale time configuration (how long data is considered fresh)
        staleTime: (query) => {
          const queryKey = query.queryKey[0] as string;

          // Different stale times for different data types
          if (queryKey?.includes('vehicle')) {
            return 10 * 60 * 1000; // 10 minutes for vehicle data
          }
          // Admin queries should always fetch fresh data to avoid stuck loading states
          if (queryKey?.includes('salesUsers') || queryKey?.includes('admin') || queryKey?.includes('applications') || queryKey?.includes('leads')) {
            return 0; // Always fetch fresh data for admin pages
          }
          if (queryKey?.includes('user') || queryKey?.includes('profile')) {
            return 5 * 60 * 1000; // 5 minutes for user data
          }
          if (queryKey?.includes('config') || queryKey?.includes('settings')) {
            return 30 * 60 * 1000; // 30 minutes for config data
          }
          if (queryKey?.includes('static')) {
            return 60 * 60 * 1000; // 1 hour for static data
          }

          return 5 * 60 * 1000; // Default 5 minutes
        },

        // Garbage collection time (how long to keep unused data in cache)
        gcTime: (query) => {
          const queryKey = query.queryKey[0] as string;

          // Longer cache for rarely changing data
          if (queryKey?.includes('config') || queryKey?.includes('static')) {
            return 60 * 60 * 1000; // 1 hour
          }

          return 10 * 60 * 1000; // Default 10 minutes
        },

        // Network mode
        networkMode: 'online', // Changed from 'offlineFirst' to avoid stuck loading states

        // Structural sharing for better performance
        structuralSharing: true,

        // Background refetch interval (for frequently changing data)
        refetchInterval: (query) => {
          const queryKey = query.queryKey[0] as string;

          // Refetch active vehicle listings every 5 minutes
          if (queryKey?.includes('active-vehicles')) {
            return 5 * 60 * 1000;
          }

          return false; // No interval refetch by default
        },
      },

      mutations: {
        // Retry configuration for mutations
        retry: 1, // Retry once for mutations
        retryDelay: 1000,

        // Network mode for mutations
        networkMode: 'online', // Only attempt when online
      },
    },
  });
};

// Prefetch commonly used queries
export const prefetchCommonQueries = async (queryClient: QueryClient) => {
  // You can add prefetch logic here for commonly accessed data
  // Example:
  // await queryClient.prefetchQuery({
  //   queryKey: ['config'],
  //   queryFn: fetchConfig,
  //   staleTime: 30 * 60 * 1000,
  // });
};

// Invalidate queries smartly
export const smartInvalidate = (queryClient: QueryClient, keys: string[]) => {
  keys.forEach(key => {
    queryClient.invalidateQueries({
      queryKey: [key],
      refetchType: 'active', // Only refetch if the query is currently being used
    });
  });
};

// Clear old cache entries
export const clearOldCache = (queryClient: QueryClient) => {
  // Get all queries
  const queries = queryClient.getQueryCache().getAll();

  queries.forEach(query => {
    // Remove queries that haven't been used in the last hour
    const lastAccessTime = query.state.dataUpdatedAt;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    if (lastAccessTime < oneHourAgo) {
      queryClient.removeQueries({
        queryKey: query.queryKey,
        exact: true,
      });
    }
  });
};

// Batch query updates for better performance
export const batchQueryUpdates = (queryClient: QueryClient, updates: Array<{ key: any[], data: any }>) => {
  queryClient.setQueriesData(
    {},
    (oldData) => {
      // Find matching update
      const update = updates.find(u =>
        JSON.stringify(u.key) === JSON.stringify(queryClient.getQueryCache().find(u.key)?.queryKey)
      );

      return update ? update.data : oldData;
    }
  );
};

// Optimistic updates helper
export const optimisticUpdate = async <TData, TVariables>(
  queryClient: QueryClient,
  {
    mutationFn,
    queryKey,
    optimisticData,
    rollbackData,
  }: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    queryKey: any[];
    optimisticData: TData;
    rollbackData?: TData;
  },
  variables: TVariables
) => {
  // Cancel in-flight queries
  await queryClient.cancelQueries({ queryKey });

  // Save current data for rollback
  const previousData = rollbackData || queryClient.getQueryData(queryKey);

  // Optimistically update
  queryClient.setQueryData(queryKey, optimisticData);

  try {
    // Perform mutation
    const result = await mutationFn(variables);

    // Update with real data
    queryClient.setQueryData(queryKey, result);

    return result;
  } catch (error) {
    // Rollback on error
    queryClient.setQueryData(queryKey, previousData);
    throw error;
  }
};

// Export configured query client
export const queryClient = createOptimizedQueryClient();