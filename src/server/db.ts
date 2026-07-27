import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { PRODUCT_LIBRARY } from '../data/productLibrary';
import {
  AdminStats,
  GeneralSettings,
  ImageItem,
  ImageLike,
  NotificationItem,
  PaymentSettings,
  User,
  UserStatus,
  Wallet,
  WithdrawRequest,
  WithdrawStatus,
} from '../types';

interface StoreData {
  users: (User & { password_hash: string })[];
  admins: { id: string; username: string; password_hash: string }[];
  wallets: Wallet[];
  images: ImageItem[];
  likes: ImageLike[];
  withdraws: WithdrawRequest[];
  paymentSettings: PaymentSettings;
  generalSettings: GeneralSettings;
  notifications: NotificationItem[];
}

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'twigamart_store.json')
  : path.join(process.cwd(), 'data', 'twigamart_store.json');

function ensureDataDirExists() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const DEFAULT_ADMIN_HASH = bcrypt.hashSync('admin123', 10);

const INITIAL_STORE: StoreData = {
  users: [
    {
      id: 'usr_demo_1',
      username: 'keza_bujumbura',
      phone_country_code: '+257',
      phone_number: '69112233',
      password_hash: bcrypt.hashSync('password123', 10),
      language: 'rn',
      status: 'approved',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'usr_demo_2',
      username: 'eric_gitega',
      phone_country_code: '+257',
      phone_number: '79887766',
      password_hash: bcrypt.hashSync('password123', 10),
      language: 'rn',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
  admins: [
    {
      id: 'admin_1',
      username: 'admin',
      password_hash: DEFAULT_ADMIN_HASH,
    },
  ],
  wallets: [
    {
      id: 'w_demo_1',
      user_id: 'usr_demo_1',
      balance: 18000.0,
      currency: 'BIF',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'w_demo_2',
      user_id: 'usr_demo_2',
      balance: 15000.0,
      currency: 'BIF',
      updated_at: new Date().toISOString(),
    },
  ],
  images: PRODUCT_LIBRARY,
  likes: [
    {
      id: 'like_1',
      user_id: 'usr_demo_1',
      image_id: 'img_car_1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'like_2',
      user_id: 'usr_demo_1',
      image_id: 'img_fsh_1',
      created_at: new Date().toISOString(),
    },
  ],
  withdraws: [
    {
      id: 'wdr_1',
      user_id: 'usr_demo_1',
      username: 'keza_bujumbura',
      phone_number: '+257 69112233',
      amount: 5000,
      payment_account: '+257 69112233',
      status: 'approved',
      admin_message: 'Yoherejwe kuri Lumicash #25769112233 TXN #88291.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ],
  paymentSettings: {
    account_number: '+257 69 00 11 22',
    whatsapp_number: '+257 69 00 11 22',
    ussd_code: '*163#',
    payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga. Ubusabe bwawe buzakorwa mu masaha 24.',
  },
  generalSettings: {
    registration_bonus: 15000,
    like_reward: 1000,
    min_withdraw_amount: 5000,
    enabled_languages: ['rn', 'rw', 'en', 'fr'],
    maintenance_mode: false,
  },
  notifications: [
    {
      id: 'notif_1',
      user_id: 'usr_demo_1',
      title: 'Bonus y\'Ikaze (Welcome Bonus)',
      message: 'Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 BIF yongewe mu gapuri kawe.',
      read: true,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'notif_2',
      user_id: 'usr_demo_1',
      title: 'Ubusabe bwo kwaka amafaranga bwemewe',
      message: 'Ubusabe bwawe bwa 5,000 BIF bwemewe. Admin response: Yoherejwe kuri Lumicash #25769112233 TXN #88291.',
      read: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'notif_3',
      user_id: 'usr_demo_2',
      title: 'Bonus y\'Ikaze (Welcome Bonus)',
      message: 'Urakoze kwirangisha! Bonus ya 15,000 BIF yongewe mu gapuri kawe. Konte yawe irarindiriye kwemerwa n\'ubuyobozi.',
      read: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

class LocalDatabase {
  private store: StoreData;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): StoreData {
    try {
      ensureDataDirExists();
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.images || parsed.images.length < 100) {
          parsed.images = PRODUCT_LIBRARY;
          this.saveStore({ ...INITIAL_STORE, ...parsed });
        }
        return { ...INITIAL_STORE, ...parsed };
      }
    } catch (err) {
      console.error('Failed to load store, using defaults:', err);
    }
    this.saveStore(INITIAL_STORE);
    return INITIAL_STORE;
  }

  private saveStore(data?: StoreData) {
    try {
      ensureDataDirExists();
      fs.writeFileSync(STORE_PATH, JSON.stringify(data || this.store, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store:', err);
    }
  }

  // Users
  async findUserByUsername(username: string) {
    return this.store.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  async findUserByPhone(phoneCountryCode: string, phoneNumber: string) {
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    return this.store.users.find(
      (u) => u.phone_country_code === phoneCountryCode && u.phone_number.replace(/\s+/g, '') === cleanNumber
    );
  }

  async findUserById(id: string) {
    return this.store.users.find((u) => u.id === id);
  }

  async createUser(data: {
    username: string;
    phone_country_code: string;
    phone_number: string;
    password_hash: string;
    language: 'rn' | 'rw' | 'en' | 'fr';
  }) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const user = {
      id,
      username: data.username,
      phone_country_code: data.phone_country_code,
      phone_number: data.phone_number,
      password_hash: data.password_hash,
      language: data.language || 'rn',
      status: 'pending' as UserStatus,
      created_at: new Date().toISOString(),
    };

    this.store.users.push(user);

    // Create wallet with 15000 BIF welcome bonus
    const wallet: Wallet = {
      id: `w_${Date.now()}`,
      user_id: id,
      balance: 15000.0,
      currency: 'BIF',
      updated_at: new Date().toISOString(),
    };
    this.store.wallets.push(wallet);

    // Create notification
    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: id,
      title: 'Bonus y\'Ikaze (Welcome Bonus)',
      message: 'Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 BIF yongewe mu gapuri kawe. Konte yawe irarindiriye kwemerwa.',
      read: false,
      created_at: new Date().toISOString(),
    };
    this.store.notifications.push(notif);

    this.saveStore();

    const { password_hash, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, wallet };
  }

  async updateUserPassword(id: string, password_hash: string) {
    const user = this.store.users.find((u) => u.id === id);
    if (user) {
      user.password_hash = password_hash;
      this.saveStore();
      return true;
    }
    return false;
  }

  async updateUserStatus(id: string, status: UserStatus) {
    const user = this.store.users.find((u) => u.id === id);
    if (user) {
      user.status = status;
      user.updated_at = new Date().toISOString();

      // Add status update notification
      const statusMsgs: Record<UserStatus, string> = {
        approved: 'Konte yawe yemewe n\'Ubuyobozi! Mutangure gukoresha TwigaMart ukunde amafoto n\'okugira inyungu.',
        pending: 'Konte yawe irarindiriye kwemerwa.',
        rejected: 'Ubusabe bwa konte yawe bwanzwe n\'ubuyobozi.',
        suspended: 'Konte yawe irahagaritswe by\'agateganyo.',
      };

      this.store.notifications.push({
        id: `notif_${Date.now()}`,
        user_id: id,
        title: `Hindura Inyifato: ${status.toUpperCase()}`,
        message: statusMsgs[status] || `Inyifato ya konte yawe yahindutse: ${status}`,
        read: false,
        created_at: new Date().toISOString(),
      });

      this.saveStore();
    }
    return user;
  }

  async updateUserAccount(
    id: string,
    updates: { username?: string; phone_country_code?: string; phone_number?: string; status?: UserStatus }
  ) {
    const user = this.store.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    if (updates.username && updates.username !== user.username) {
      const existing = this.store.users.find((u) => u.username === updates.username && u.id !== id);
      if (existing) throw new Error('Username already taken');
      user.username = updates.username;
    }

    if (updates.phone_number) {
      user.phone_number = updates.phone_number;
    }

    if (updates.phone_country_code) {
      user.phone_country_code = updates.phone_country_code;
    }

    if (updates.status) {
      user.status = updates.status;
    }

    user.updated_at = new Date().toISOString();
    this.saveStore();

    const { password_hash, ...rest } = user;
    const wallet = this.store.wallets.find((w) => w.user_id === user.id);
    return { ...rest, wallet };
  }

  async getAllUsers() {
    return this.store.users.map((u) => {
      const { password_hash, ...rest } = u;
      const wallet = this.store.wallets.find((w) => w.user_id === u.id);
      return { ...rest, wallet };
    });
  }

  async deleteUser(userId: string) {
    this.store.users = this.store.users.filter((u) => u.id !== userId);
    this.store.wallets = this.store.wallets.filter((w) => w.user_id !== userId);
    this.store.withdraws = this.store.withdraws.filter((w) => w.user_id !== userId);
    this.store.likes = this.store.likes.filter((l) => l.user_id !== userId);
    this.store.notifications = this.store.notifications.filter((n) => n.user_id !== userId);
    this.saveStore();
    return true;
  }

  async deleteWithdrawRequest(id: string) {
    this.store.withdraws = this.store.withdraws.filter((w) => w.id !== id);
    this.saveStore();
    return true;
  }

  async deleteAllUsers() {
    this.store.users = [];
    this.store.wallets = [];
    this.store.withdraws = [];
    this.store.likes = [];
    this.store.notifications = [];
    this.saveStore();
    return true;
  }

  async deleteAllWithdraws() {
    this.store.withdraws = [];
    this.saveStore();
    return true;
  }

  async resetAllData() {
    this.store.users = [];
    this.store.wallets = [];
    this.store.withdraws = [];
    this.store.likes = [];
    this.store.notifications = [];
    this.saveStore();
    return true;
  }

  // Wallet
  async getWalletByUserId(userId: string) {
    let wallet = this.store.wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      wallet = {
        id: `w_${Date.now()}`,
        user_id: userId,
        balance: 15000.0,
        currency: 'BIF',
        updated_at: new Date().toISOString(),
      };
      this.store.wallets.push(wallet);
      this.saveStore();
    }
    return wallet;
  }

  async updateUserBalance(userId: string, action: 'add' | 'reduce' | 'set', amount: number, note?: string) {
    const wallet = await this.getWalletByUserId(userId);
    if (action === 'add') {
      wallet.balance += amount;
    } else if (action === 'reduce') {
      wallet.balance = Math.max(0, wallet.balance - amount);
    } else if (action === 'set') {
      wallet.balance = Math.max(0, amount);
    }
    wallet.updated_at = new Date().toISOString();

    // Add notification
    this.store.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: userId,
      title: 'Igapuri Yawe Yahindutse (Wallet Balance Updated)',
      message: `Amafaranga ari mu gapuri kawe ubu ni: ${wallet.balance.toLocaleString()} BIF.${
        note ? ` Ubumenyeshi bw'Admin: "${note}"` : ''
      }`,
      read: false,
      created_at: new Date().toISOString(),
    });

    this.saveStore();
    return wallet;
  }

  // Admin
  async getAdminByUsername(username: string) {
    return this.store.admins.find((a) => a.username.toLowerCase() === username.toLowerCase());
  }

  // Images & Likes
  async getAllImages(userId?: string) {
    return this.store.images.map((img) => {
      const likes_count = this.store.likes.filter((l) => l.image_id === img.id).length;
      const user_liked = userId ? this.store.likes.some((l) => l.image_id === img.id && l.user_id === userId) : false;
      return { ...img, likes_count, user_liked };
    });
  }

  async createImage(data: { title: string; image_url: string; reward: number; active: boolean }) {
    const image: ImageItem = {
      id: `img_${Date.now()}`,
      title: data.title,
      image_url: data.image_url,
      reward: Number(data.reward) || 1000,
      active: data.active ?? true,
      created_at: new Date().toISOString(),
    };
    this.store.images.push(image);
    this.saveStore();
    return image;
  }

  async updateImage(id: string, data: Partial<ImageItem>) {
    const img = this.store.images.find((i) => i.id === id);
    if (img) {
      if (data.title !== undefined) img.title = data.title;
      if (data.image_url !== undefined) img.image_url = data.image_url;
      if (data.reward !== undefined) img.reward = Number(data.reward);
      if (data.active !== undefined) img.active = data.active;
      this.saveStore();
    }
    return img;
  }

  async deleteImage(id: string) {
    this.store.images = this.store.images.filter((i) => i.id !== id);
    this.store.likes = this.store.likes.filter((l) => l.image_id !== id);
    this.saveStore();
    return true;
  }

  async likeImage(userId: string, imageId: string) {
    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'approved') {
      throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi mbere yo gukunda amafoto (Account must be approved first).');
    }

    const image = this.store.images.find((i) => i.id === imageId);
    if (!image) throw new Error('Ifoto ntibonetse (Image not found)');
    if (!image.active) throw new Error('Iyi foto ntiyakora mu gihe gihaye');

    // Check duplicate like
    const existing = this.store.likes.find((l) => l.user_id === userId && l.image_id === imageId);
    if (existing) {
      throw new Error('Wamaze gukunda iyi foto! (Already liked this image)');
    }

    // Record like
    const like: ImageLike = {
      id: `like_${Date.now()}`,
      user_id: userId,
      image_id: imageId,
      created_at: new Date().toISOString(),
    };
    this.store.likes.push(like);

    // Add reward to wallet
    const wallet = await this.getWalletByUserId(userId);
    const rewardAmount = image.reward || 1000;
    wallet.balance += rewardAmount;
    wallet.updated_at = new Date().toISOString();

    // Create notification
    this.store.notifications.push({
      id: `notif_${Date.now()}`,
      user_id: userId,
      title: `Wakoreye ${rewardAmount.toLocaleString()} BIF!`,
      message: `Urakoze gukunda: "${image.title}". Agashimwe k'amafaranga ${rewardAmount.toLocaleString()} BIF kagiriwe mu gapuri kawe.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    this.saveStore();

    return {
      success: true,
      reward: rewardAmount,
      new_balance: wallet.balance,
    };
  }

  // Withdrawals
  async createWithdrawRequest(userId: string, amount: number, paymentAccount: string) {
    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'approved') throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi (Account pending approval).');

    const wallet = await this.getWalletByUserId(userId);
    if (amount < 5000) {
      throw new Error('Ingano ya muke yo kwaka ni 5,000 BIF (Minimum withdrawal is 5,000 BIF).');
    }
    if (wallet.balance < amount) {
      throw new Error('Nta mafaranga ahagije ari mu gapuri kawe (Insufficient wallet balance).');
    }

    // Deduct pending balance from wallet
    wallet.balance -= amount;
    wallet.updated_at = new Date().toISOString();

    const request: WithdrawRequest = {
      id: `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      user_id: userId,
      username: user.username,
      phone_number: `${user.phone_country_code}${user.phone_number}`,
      amount,
      payment_account: paymentAccount,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    this.store.withdraws.unshift(request);

    // Notification
    this.store.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: userId,
      title: 'Ubusabe bwo kwaka amafaranga bwagize success',
      message: `Ubusabe bwawe bwa ${amount.toLocaleString()} BIF BIF kuri numero ${paymentAccount} bwagize success. Buririndiriye kuremurwa n'ubuyobozi.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    this.saveStore();
    return request;
  }

  async getUserWithdrawRequests(userId: string) {
    return this.store.withdraws.filter((w) => w.user_id === userId);
  }

  async getAllWithdrawRequests() {
    return this.store.withdraws;
  }

  async updateWithdrawRequestStatus(id: string, status: WithdrawStatus, adminMessage?: string) {
    const req = this.store.withdraws.find((w) => w.id === id);
    if (!req) throw new Error('Withdrawal request not found');

    const oldStatus = req.status;
    req.status = status;
    if (adminMessage !== undefined) {
      req.admin_message = adminMessage;
    }
    req.updated_at = new Date().toISOString();

    // If rejected, refund balance to user
    if (oldStatus === 'pending' && status === 'rejected') {
      const wallet = await this.getWalletByUserId(req.user_id);
      wallet.balance += req.amount;
      wallet.updated_at = new Date().toISOString();
    }

    // Create user notification with admin message!
    this.store.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: req.user_id,
      title: `Ubusabe bwa ${req.amount.toLocaleString()} BIF: ${status.toUpperCase()}`,
      message: `Ubusabe bwawe bwa ${req.amount.toLocaleString()} BIF BIF bwagize inyifato: ${status}.${
        adminMessage ? ` Ubumenyeshi bw'Admin: "${adminMessage}"` : ''
      }`,
      read: false,
      created_at: new Date().toISOString(),
    });

    this.saveStore();
    return req;
  }

  // Payment Settings
  async getPaymentSettings(): Promise<PaymentSettings> {
    return this.store.paymentSettings;
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>) {
    this.store.paymentSettings = { ...this.store.paymentSettings, ...data };
    this.saveStore();
    return this.store.paymentSettings;
  }

  // Notifications
  async getUserNotifications(userId: string) {
    return this.store.notifications.filter((n) => n.user_id === userId);
  }

  async markNotificationsRead(userId: string) {
    this.store.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.saveStore();
    return true;
  }

  // User Profile Updates
  async updateUserProfile(userId: string, data: Partial<User>) {
    const user = this.store.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    if (data.username && data.username !== user.username) {
      const existing = this.store.users.find((u) => u.username === data.username && u.id !== userId);
      if (existing) throw new Error('Username already taken');
      user.username = data.username;
    }
    if (data.phone_number) user.phone_number = data.phone_number;
    if (data.phone_country_code) user.phone_country_code = data.phone_country_code;
    if (data.language) user.language = data.language;
    if (data.profile_picture !== undefined) user.profile_picture = data.profile_picture;
    if (data.country !== undefined) user.country = data.country;
    user.updated_at = new Date().toISOString();

    this.saveStore();
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // General Settings
  async getGeneralSettings(): Promise<GeneralSettings> {
    if (!this.store.generalSettings) {
      this.store.generalSettings = {
        registration_bonus: 15000,
        like_reward: 1000,
        min_withdraw_amount: 5000,
        enabled_languages: ['rn', 'rw', 'en', 'fr'],
        maintenance_mode: false,
      };
      this.saveStore();
    }
    return this.store.generalSettings;
  }

  async updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
    const current = await this.getGeneralSettings();
    this.store.generalSettings = { ...current, ...data };
    this.saveStore();
    return this.store.generalSettings;
  }

  // Admin stats
  async getAdminStats(): Promise<AdminStats> {
    const total_users = this.store.users.length;
    const pending_users = this.store.users.filter((u) => u.status === 'pending').length;
    const approved_users = this.store.users.filter((u) => u.status === 'approved').length;
    const total_images = this.store.images.length;
    const active_images = this.store.images.filter((i) => i.active !== false).length;
    const total_withdrawals_count = this.store.withdraws.length;
    const pending_withdraws = this.store.withdraws.filter((w) => w.status === 'pending').length;
    const total_payouts = this.store.withdraws
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todays_withdrawals = this.store.withdraws.filter(
      (w) => w.created_at && w.created_at.startsWith(todayStr)
    ).length;

    const total_wallet_balance = this.store.wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const gen = await this.getGeneralSettings();

    // Collect recent activities
    const userActs = this.store.users.slice(-5).reverse().map((u) => ({
      id: `act-u-${u.id}`,
      type: 'user',
      title: `New User: @${u.username}`,
      description: `Registered with status [${u.status.toUpperCase()}]`,
      time: u.created_at || new Date().toISOString(),
    }));

    const withdrawActs = this.store.withdraws.slice(-5).reverse().map((w) => ({
      id: `act-w-${w.id}`,
      type: 'withdraw',
      title: `Withdrawal: ${w.amount.toLocaleString()} BIF`,
      description: `Requested by @${w.username || 'User'} - Status: ${w.status.toUpperCase()}`,
      time: w.created_at || new Date().toISOString(),
    }));

    const recent_activities = [...userActs, ...withdrawActs]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    return {
      total_users,
      pending_users,
      approved_users,
      total_images,
      active_images,
      pending_withdraws,
      total_withdrawals_count,
      total_payouts,
      todays_withdrawals,
      total_wallet_balance,
      registration_bonus: gen.registration_bonus,
      app_status: gen.maintenance_mode ? 'maintenance' : 'online',
      recent_activities,
    };
  }
}

export const db = new LocalDatabase();
