import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/api.js';
import { AdminStats, ImageItem, PaymentSettings, User, WithdrawRequest, UserStatus, WithdrawStatus } from '../types.js';

export const ADMIN_QUERY_KEYS = {
  stats: ['admin', 'stats'] as const,
  users: ['admin', 'users'] as const,
  withdrawals: ['admin', 'withdrawals'] as const,
  paymentSettings: ['admin', 'paymentSettings'] as const,
  images: ['admin', 'images'] as const,
  generalSettings: ['admin', 'generalSettings'] as const,
  dbHealth: ['admin', 'dbHealth'] as const,
};

// Hook for fetching Admin Dashboard Stats - NO aggressive polling
export function useAdminStats(options?: { refetchInterval?: number | false }) {
  return useQuery<AdminStats>({
    queryKey: ADMIN_QUERY_KEYS.stats,
    queryFn: () => adminApi.getStats(),
    staleTime: 30000, // Fresh for 30s
    refetchInterval: options?.refetchInterval ?? false, // Polling disabled by default
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

// Hook for fetching Admin Users List - NO aggressive polling
export function useAdminUsers(options?: { refetchInterval?: number | false }) {
  return useQuery<User[]>({
    queryKey: ADMIN_QUERY_KEYS.users,
    queryFn: () => adminApi.getUsers(),
    staleTime: 30000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

// Hook for fetching Admin Withdrawals - NO aggressive polling
export function useAdminWithdrawals(options?: { refetchInterval?: number | false }) {
  return useQuery<WithdrawRequest[]>({
    queryKey: ADMIN_QUERY_KEYS.withdrawals,
    queryFn: () => adminApi.getWithdraws(),
    staleTime: 30000,
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

// Hook for fetching Payment Settings
export function useAdminPaymentSettings() {
  return useQuery<PaymentSettings>({
    queryKey: ADMIN_QUERY_KEYS.paymentSettings,
    queryFn: () => adminApi.getSettings(),
    staleTime: 60000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

// Hook for fetching Admin Images
export function useAdminImages() {
  return useQuery<ImageItem[]>({
    queryKey: ADMIN_QUERY_KEYS.images,
    queryFn: () => adminApi.getImages(),
    staleTime: 60000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

// Hook providing easy invalidation and mutation helpers
export function useAdminMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats }),
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users }),
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.withdrawals }),
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.paymentSettings }),
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.images }),
    ]);
  };

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
    },
  });

  const processWithdrawMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminMessage,
    }: {
      id: string;
      status: WithdrawStatus;
      adminMessage?: string;
    }) => adminApi.processWithdraw(id, status, adminMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.withdrawals });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
    },
  });

  const deleteWithdrawMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteWithdraw(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.withdrawals });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
    },
  });

  return {
    invalidateAll,
    updateUserStatus: updateUserStatusMutation.mutateAsync,
    processWithdraw: processWithdrawMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    deleteWithdraw: deleteWithdrawMutation.mutateAsync,
  };
}
