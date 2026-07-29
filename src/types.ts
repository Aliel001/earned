export type Language = 'rn' | 'rw' | 'en' | 'fr';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type WithdrawStatus = 'pending' | 'approved' | 'rejected';

export interface CountryCode {
  code: string;
  name: string;
  country: string;
  flag: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phone_country_code: string;
  phone_number: string;
  language: Language;
  status: UserStatus;
  profile_picture?: string;
  country?: string;
  role?: 'user' | 'admin';
  created_at: string;
  updated_at?: string;
  wallet?: Wallet;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at?: string;
}

export interface ImageItem {
  id: string;
  image_url: string;
  title: string;
  category?: 'Cars' | 'Fashion' | 'Shoes' | 'Electronics' | 'Other';
  reward: number;
  active: boolean;
  created_at: string;
  likes_count?: number;
  user_liked?: boolean;
}

export interface ImageLike {
  id: string;
  user_id: string;
  image_id: string;
  created_at: string;
}

export interface WithdrawRequest {
  id: string;
  user_id: string;
  username?: string;
  phone_number?: string;
  amount: number;
  payment_account: string;
  status: WithdrawStatus;
  admin_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentSettings {
  account_number: string;
  whatsapp_number: string;
  ussd_code: string;
  payment_instructions: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AdminActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

export interface AdminStats {
  total_users: number;
  pending_users: number;
  approved_users: number;
  total_images: number;
  active_images: number;
  pending_withdraws: number;
  total_withdrawals_count: number;
  total_payouts: number;
  todays_withdrawals: number;
  total_wallet_balance: number;
  registration_bonus: number;
  app_status?: 'online' | 'maintenance';
  recent_activities?: AdminActivityItem[];
}

export interface GeneralSettings {
  registration_bonus: number;
  like_reward: number;
  min_withdraw_amount: number;
  enabled_languages: Language[];
  maintenance_mode: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  role: 'user' | 'admin';
}
