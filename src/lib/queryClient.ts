import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Data considered fresh for 30 seconds
      gcTime: 1000 * 60 * 10, // Keep unused cache for 10 minutes
      refetchOnWindowFocus: false, // Prevent unwanted flashing on tab switch
      refetchOnReconnect: true,
      retry: 1, // Only retry once on failure, don't spam the DB
    },
  },
});
