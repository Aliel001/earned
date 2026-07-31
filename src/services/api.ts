import {
  AdminStats,
  AuthResponse,
  ImageItem,
  NotificationItem,
  PaymentSettings,
  User,
  UserStatus,
  Wallet,
  WithdrawRequest,
  WithdrawStatus,
} from '../types.js';

const TOKEN_KEY = 'twigamart_jwt_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: any = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let msg = typeof data.error === 'string' ? data.error : 'Request failed. Please try again.';
        msg = String(msg).replace(/^(Error|TypeError|400|500):\s*/i, '').trim();
        throw new Error(msg);
      }

      return data as T;
    } catch (err: any) {
      lastError = err;
      // If it's a domain/business error from server response (e.g. invalid password, 401, 403, 400), don't retry
      const isNetworkError =
        err instanceof TypeError ||
        !err.message ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('Network connection error') ||
        err.message.includes('server unreachable');

      if (!isNetworkError) {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = 800 * (attempt + 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  console.error(`Fetch to ${endpoint} failed after ${maxRetries} retries:`, lastError);
  throw new Error('Network connection error or server unreachable');
}

export const authApi = {
  register: (data: {
    username: string;
    email?: string;
    phone_country_code: string;
    phone_number: string;
    password: string;
    language: string;
  }) => request<{ success: boolean; message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  adminLogin: (data: { username: string; password: string }) =>
    request<AuthResponse>('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const userApi = {
  getMe: () => request<{ user: User; role: 'user' | 'admin' }>('/api/user/me'),
  updateProfile: (data: Partial<User>) =>
    request<{ user: User; message: string }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadImage: (image: string) =>
    request<{ success: boolean; url: string; image_url: string; message: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
};

export const generalSettingsApi = {
  getSettings: () => request<import('../types').GeneralSettings>('/api/general-settings'),
};

export const imagesApi = {
  getImages: () => request<ImageItem[]>('/api/images'),
  likeImage: (id: string) => request<{ success: boolean; reward: number; new_balance: number }>(`/api/images/${id}/like`, { method: 'POST' }),
  uploadImage: (image: string) =>
    request<{ success: boolean; url: string; image_url: string; message: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
};

export const walletApi = {
  getWallet: () => request<Wallet>('/api/wallet'),
};

export const withdrawApi = {
  submit: (amount: number, payment_account: string) =>
    request<{ message: string; withdraw: WithdrawRequest }>('/api/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_account }),
    }),

  getHistory: () => request<WithdrawRequest[]>('/api/withdraw'),
};

export const notificationsApi = {
  getNotifications: () => request<NotificationItem[]>('/api/notifications'),
  markAllRead: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'PUT' }),
};

export const paymentApi = {
  getSettings: () => request<PaymentSettings>('/api/payment-settings'),
};

export const adminApi = {
  getStats: () => request<AdminStats>('/api/admin/stats'),
  getUsers: () => request<User[]>('/api/admin/users'),
  getImages: () => request<ImageItem[]>('/api/images'),
  getSettings: () => request<PaymentSettings>('/api/payment-settings'),
  updateUserStatus: (id: string, status: UserStatus) =>
    request<{ success: boolean; user: User }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  updateUser: (
    id: string,
    data: { username?: string; phone_country_code?: string; phone_number?: string; status?: UserStatus }
  ) =>
    request<{ success: boolean; user: User }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateUserBalance: (id: string, action: 'add' | 'reduce' | 'set', amount: number, note?: string) =>
    request<{ success: boolean; wallet: Wallet }>(`/api/admin/users/${id}/balance`, {
      method: 'PUT',
      body: JSON.stringify({ action, amount, note }),
    }),
  createImage: (data: { title: string; image_url: string; reward: number; active: boolean }) =>
    request<ImageItem>('/api/admin/images', { method: 'POST', body: JSON.stringify(data) }),
  updateImage: (id: string, data: Partial<ImageItem>) =>
    request<ImageItem>(`/api/admin/images/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteImage: (id: string) =>
    request<{ success: boolean }>(`/api/admin/images/${id}`, { method: 'DELETE' }),
  getWithdraws: () => request<WithdrawRequest[]>('/api/admin/withdraws'),
  processWithdraw: (id: string, status: WithdrawStatus, admin_message?: string) =>
    request<WithdrawRequest>(`/api/admin/withdraws/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, admin_message }),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  deleteWithdraw: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/withdraws/${id}`, { method: 'DELETE' }),
  deleteAllUsers: () =>
    request<{ success: boolean; message: string }>('/api/admin/delete-all-users', { method: 'POST' }),
  deleteAllWithdraws: () =>
    request<{ success: boolean; message: string }>('/api/admin/delete-all-withdraws', { method: 'POST' }),
  resetAllData: () =>
    request<{ success: boolean; message: string }>('/api/admin/reset-all', { method: 'POST' }),
  updatePaymentSettings: (data: Partial<PaymentSettings>) =>
    request<PaymentSettings>('/api/admin/payment-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getGeneralSettings: () => request<import('../types').GeneralSettings>('/api/admin/general-settings'),
  updateGeneralSettings: (data: Partial<import('../types').GeneralSettings>) =>
    request<import('../types').GeneralSettings>('/api/admin/general-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changeAdminPassword: (data: { currentPassword: string; newPassword: string; newUsername?: string }) =>
    request<{ success: boolean; message: string; username?: string }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
