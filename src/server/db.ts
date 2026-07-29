import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
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

let prisma: PrismaClient | null = null;
if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
    console.log('[Database] PrismaClient initialized for PostgreSQL connection.');
  } catch (err) {
    console.error('[Database] PrismaClient initialization error:', err);
  }
}

async function seedDefaultAdmin() {
  if (prisma) {
    try {
      const adminCount = await prisma.admin.count();
      if (adminCount === 0) {
        await prisma.admin.create({
          data: {
            username: 'admin',
            password_hash: bcrypt.hashSync('admin123', 10),
          },
        });
        console.log('[Database] Default admin account seeded in PostgreSQL.');
      }
    } catch (err) {
      console.error('[Database] Error seeding default admin:', err);
    }
  }
}
seedDefaultAdmin();

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
      status: 'approved',
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
        }
        const merged = {
          ...INITIAL_STORE,
          ...parsed,
          paymentSettings: {
            ...INITIAL_STORE.paymentSettings,
            ...(parsed.paymentSettings || {}),
          },
          generalSettings: {
            ...INITIAL_STORE.generalSettings,
            ...(parsed.generalSettings || {}),
          },
        };
        if (!merged.admins || merged.admins.length === 0) {
          merged.admins = INITIAL_STORE.admins;
        }
        this.saveStore(merged);
        return merged;
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

  private async syncUserToPrismaIfNeeded(userId: string) {
    if (!prisma) return null;
    try {
      let dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!dbUser) {
        const memUser = this.store.users.find((u) => u.id === userId);
        if (memUser) {
          dbUser = await prisma.user.create({
            data: {
              id: memUser.id,
              username: memUser.username,
              phone_country_code: memUser.phone_country_code || '+257',
              phone_number: memUser.phone_number || '',
              password_hash: memUser.password_hash || '',
              language: memUser.language || 'rn',
              status: memUser.status || 'approved',
            },
          });
          await prisma.wallet.upsert({
            where: { user_id: memUser.id },
            create: { user_id: memUser.id, balance: 15000.0, currency: 'BIF' },
            update: {},
          }).catch(() => {});
        }
      }
      return dbUser;
    } catch (err) {
      console.warn('[Prisma] syncUserToPrismaIfNeeded warning:', err);
      return null;
    }
  }

  private async syncImageToPrismaIfNeeded(imageId: string) {
    if (!prisma) return null;
    try {
      let dbImage = await prisma.image.findUnique({ where: { id: imageId } });
      if (!dbImage) {
        const memImg = this.store.images.find((i) => i.id === imageId) || PRODUCT_LIBRARY.find((p) => p.id === imageId);
        if (memImg) {
          dbImage = await prisma.image.create({
            data: {
              id: memImg.id,
              title: memImg.title,
              image_url: memImg.image_url,
              reward: memImg.reward || 1000,
              active: memImg.active ?? true,
            },
          });
        }
      }
      return dbImage;
    } catch (err) {
      console.warn('[Prisma] syncImageToPrismaIfNeeded warning:', err);
      return null;
    }
  }

  // Users
  async findUserExactByUsername(username: string) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (prisma) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            username: {
              equals: clean,
              mode: 'insensitive',
            },
          },
        });
        if (dbUser) {
          return {
            id: dbUser.id,
            username: dbUser.username,
            phone_country_code: dbUser.phone_country_code,
            phone_number: dbUser.phone_number,
            password_hash: dbUser.password_hash,
            language: dbUser.language as any,
            status: dbUser.status as UserStatus,
            created_at: dbUser.created_at.toISOString(),
          };
        }
      } catch (err) {
        console.error('[Prisma] findUserExactByUsername error:', err);
      }
    }
    return this.store.users.find((u) => u.username.toLowerCase().replace(/^@/, '') === clean);
  }

  async findUserByUsername(username: string) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    const digitsOnly = username.replace(/\D/g, '');

    if (prisma) {
      try {
        let dbUser = await prisma.user.findFirst({
          where: {
            username: {
              equals: clean,
              mode: 'insensitive',
            },
          },
        });

        if (!dbUser && digitsOnly.length >= 6) {
          dbUser = await prisma.user.findFirst({
            where: {
              phone_number: {
                contains: digitsOnly,
              },
            },
          });
        }

        if (dbUser) {
          return {
            id: dbUser.id,
            username: dbUser.username,
            phone_country_code: dbUser.phone_country_code,
            phone_number: dbUser.phone_number,
            password_hash: dbUser.password_hash,
            language: dbUser.language as any,
            status: dbUser.status as UserStatus,
            created_at: dbUser.created_at.toISOString(),
          };
        }
      } catch (err) {
        console.error('[Prisma] findUserByUsername error:', err);
      }
    }

    return this.store.users.find((u) => {
      // Direct username match
      if (u.username.toLowerCase() === clean) return true;

      // Phone number match if user typed phone number into login username field
      if (digitsOnly.length >= 6) {
        const fullPhoneDigits = (u.phone_country_code + u.phone_number).replace(/\D/g, '');
        const phoneOnlyDigits = u.phone_number.replace(/\D/g, '');
        if (
          fullPhoneDigits === digitsOnly ||
          phoneOnlyDigits === digitsOnly ||
          (digitsOnly.length >= 8 && (digitsOnly.endsWith(phoneOnlyDigits) || phoneOnlyDigits.endsWith(digitsOnly)))
        ) {
          return true;
        }
      }

      return false;
    });
  }

  async findUserByPhone(phoneCountryCode: string, phoneNumber: string) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const cleanCode = phoneCountryCode.replace(/\D/g, '');

    if (prisma) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { phone_number: phoneNumber.trim() },
              ...(cleanNumber ? [{ phone_number: cleanNumber }] : []),
              ...(cleanNumber ? [{ phone_number: { contains: cleanNumber } }] : []),
            ],
          },
        });
        if (dbUser) {
          return {
            id: dbUser.id,
            username: dbUser.username,
            phone_country_code: dbUser.phone_country_code,
            phone_number: dbUser.phone_number,
            password_hash: dbUser.password_hash,
            language: dbUser.language as any,
            status: dbUser.status as UserStatus,
            created_at: dbUser.created_at.toISOString(),
          };
        }
      } catch (err) {
        console.error('[Prisma] findUserByPhone error:', err);
      }
    }

    return this.store.users.find((u) => {
      const dbPhone = u.phone_number.replace(/\D/g, '');
      const dbCode = u.phone_country_code.replace(/\D/g, '');
      return (dbCode === cleanCode && dbPhone === cleanNumber) || u.phone_number.trim() === phoneNumber.trim();
    });
  }

  async findUserById(id: string) {
    if (prisma) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id },
        });
        if (dbUser) {
          return {
            id: dbUser.id,
            username: dbUser.username,
            phone_country_code: dbUser.phone_country_code,
            phone_number: dbUser.phone_number,
            password_hash: dbUser.password_hash,
            language: dbUser.language as any,
            status: dbUser.status as UserStatus,
            created_at: dbUser.created_at.toISOString(),
          };
        }
      } catch (err) {
        console.error('[Prisma] findUserById error:', err);
      }
    }
    return this.store.users.find((u) => u.id === id);
  }

  async createUser(data: {
    username: string;
    phone_country_code: string;
    phone_number: string;
    password_hash: string;
    language: 'rn' | 'rw' | 'en' | 'fr';
  }) {
    if (prisma) {
      const createdUser = await prisma.user.create({
        data: {
          username: data.username,
          phone_country_code: data.phone_country_code,
          phone_number: data.phone_number,
          password_hash: data.password_hash,
          language: data.language || 'rn',
          status: 'approved',
          wallet: {
            create: {
              balance: 15000.0,
              currency: 'BIF',
            },
          },
          notifications: {
            create: {
              title: "Bonus y'Ikaze (Welcome Bonus)",
              message:
                'Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 BIF yongewe mu gapuri kawe. Konte yawe yemejwe neza.',
              read: false,
            },
          },
        },
        include: {
          wallet: true,
        },
      });

      const formattedUser = {
        id: createdUser.id,
        username: createdUser.username,
        phone_country_code: createdUser.phone_country_code,
        phone_number: createdUser.phone_number,
        password_hash: createdUser.password_hash,
        language: createdUser.language as any,
        status: createdUser.status as UserStatus,
        created_at: createdUser.created_at.toISOString(),
      };

      // Sync into store
      this.store.users.unshift(formattedUser);
      if (createdUser.wallet) {
        this.store.wallets.unshift({
          id: createdUser.wallet.id,
          user_id: createdUser.wallet.user_id,
          balance: createdUser.wallet.balance,
          currency: createdUser.wallet.currency,
          updated_at: createdUser.wallet.updated_at.toISOString(),
        });
      }
      this.saveStore();

      const { password_hash, ...userWithoutPassword } = formattedUser;
      return { ...userWithoutPassword, wallet: createdUser.wallet };
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const user = {
      id,
      username: data.username,
      phone_country_code: data.phone_country_code,
      phone_number: data.phone_number,
      password_hash: data.password_hash,
      language: data.language || 'rn',
      status: 'approved' as UserStatus,
      created_at: new Date().toISOString(),
    };

    this.store.users.unshift(user);

    // Create wallet with 15000 BIF welcome bonus
    const wallet: Wallet = {
      id: `w_${Date.now()}`,
      user_id: id,
      balance: 15000.0,
      currency: 'BIF',
      updated_at: new Date().toISOString(),
    };
    this.store.wallets.unshift(wallet);

    // Create notification
    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: id,
      title: 'Bonus y\'Ikaze (Welcome Bonus)',
      message: 'Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 BIF yongewe mu gapuri kawe. Konte yawe irarindiriye kwemerwa.',
      read: false,
      created_at: new Date().toISOString(),
    };
    this.store.notifications.unshift(notif);

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
    if (prisma) {
      try {
        const statusMsgs: Record<UserStatus, string> = {
          approved: 'Konte yawe yemewe n\'Ubuyobozi! Mutangure gukoresha TwigaMart ukunde amafoto n\'okugira inyungu.',
          pending: 'Konte yawe irarindiriye kwemerwa.',
          rejected: 'Ubusabe bwa konte yawe bwanzwe n\'ubuyobozi.',
          suspended: 'Konte yawe irahagaritswe by\'agateganyo.',
        };

        await prisma.user.update({
          where: { id },
          data: {
            status: status as any,
            notifications: {
              create: {
                title: `Hindura Inyifato: ${status.toUpperCase()}`,
                message: statusMsgs[status] || `Inyifato ya konte yawe yahindutse: ${status}`,
                read: false,
              },
            },
          },
        });
      } catch (err) {
        console.error('[Prisma] updateUserStatus error:', err);
      }
    }

    const user = this.store.users.find((u) => u.id === id);
    if (user) {
      user.status = status;
      user.updated_at = new Date().toISOString();

      const statusMsgs: Record<UserStatus, string> = {
        approved: 'Konte yawe yemewe n\'Ubuyobozi! Mutangure gukoresha TwigaMart ukunde amafoto n\'okugira inyungu.',
        pending: 'Konte yawe irarindiriye kwemerwa.',
        rejected: 'Ubusabe bwa konte yawe bwanzwe n\'ubuyobozi.',
        suspended: 'Konte yawe irahagaritswe by\'agateganyo.',
      };

      this.store.notifications.unshift({
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
    if (prisma) {
      try {
        await prisma.user.update({
          where: { id },
          data: {
            ...(updates.username ? { username: updates.username } : {}),
            ...(updates.phone_country_code ? { phone_country_code: updates.phone_country_code } : {}),
            ...(updates.phone_number ? { phone_number: updates.phone_number } : {}),
            ...(updates.status ? { status: updates.status as any } : {}),
          },
        });
      } catch (err) {
        console.error('[Prisma] updateUserAccount error:', err);
      }
    }

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
    if (prisma) {
      try {
        const dbUsers = await prisma.user.findMany({
          include: { wallet: true },
          orderBy: { created_at: 'desc' },
        });
        if (dbUsers) {
          return dbUsers.map((u) => {
            const { password_hash, ...rest } = u;
            return {
              ...rest,
              language: u.language as any,
              status: u.status as UserStatus,
              created_at: u.created_at.toISOString(),
              updated_at: u.updated_at.toISOString(),
              wallet: u.wallet
                ? {
                    id: u.wallet.id,
                    user_id: u.wallet.user_id,
                    balance: u.wallet.balance,
                    currency: u.wallet.currency,
                    updated_at: u.wallet.updated_at.toISOString(),
                  }
                : undefined,
            };
          });
        }
      } catch (err) {
        console.error('[Prisma] getAllUsers error:', err);
      }
    }

    return this.store.users.map((u) => {
      const { password_hash, ...rest } = u;
      const wallet = this.store.wallets.find((w) => w.user_id === u.id);
      return { ...rest, wallet };
    });
  }

  async deleteUser(userId: string) {
    if (prisma) {
      try {
        await prisma.withdrawRequest.deleteMany({ where: { user_id: userId } });
        await prisma.notification.deleteMany({ where: { user_id: userId } });
        await prisma.imageLike.deleteMany({ where: { user_id: userId } });
        await prisma.wallet.deleteMany({ where: { user_id: userId } });
        await prisma.user.delete({ where: { id: userId } });
      } catch (err: any) {
        console.warn('[Prisma] deleteUser warning:', err?.message || err);
      }
    }
    this.store.users = this.store.users.filter((u) => u.id !== userId);
    this.store.wallets = this.store.wallets.filter((w) => w.user_id !== userId);
    this.store.withdraws = this.store.withdraws.filter((w) => w.user_id !== userId);
    this.store.likes = this.store.likes.filter((l) => l.user_id !== userId);
    this.store.notifications = this.store.notifications.filter((n) => n.user_id !== userId);
    this.saveStore();
    return true;
  }

  async deleteWithdrawRequest(id: string) {
    if (prisma) {
      try {
        await prisma.withdrawRequest.delete({ where: { id } });
      } catch (err: any) {
        console.warn('[Prisma] deleteWithdrawRequest warning:', err?.message || err);
      }
    }
    this.store.withdraws = this.store.withdraws.filter((w) => w.id !== id);
    this.saveStore();
    return true;
  }

  async deleteAllUsers() {
    if (prisma) {
      try {
        await prisma.withdrawRequest.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.imageLike.deleteMany({});
        await prisma.wallet.deleteMany({});
        await prisma.user.deleteMany({});
      } catch (err: any) {
        console.warn('[Prisma] deleteAllUsers warning:', err?.message || err);
      }
    }
    this.store.users = [];
    this.store.wallets = [];
    this.store.withdraws = [];
    this.store.likes = [];
    this.store.notifications = [];
    this.saveStore();
    return true;
  }

  async deleteAllWithdraws() {
    if (prisma) {
      try {
        await prisma.withdrawRequest.deleteMany({});
      } catch (err: any) {
        console.warn('[Prisma] deleteAllWithdraws warning:', err?.message || err);
      }
    }
    this.store.withdraws = [];
    this.saveStore();
    return true;
  }

  async resetAllData() {
    if (prisma) {
      try {
        await prisma.withdrawRequest.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.imageLike.deleteMany({});
        await prisma.wallet.deleteMany({});
        await prisma.user.deleteMany({});
      } catch (err: any) {
        console.warn('[Prisma] resetAllData warning:', err?.message || err);
      }
    }
    this.store.users = this.store.users.filter(u => u.role === 'admin');
    this.store.wallets = this.store.wallets.filter(w => {
      const u = this.store.users.find(usr => usr.id === w.user_id);
      return u && u.role === 'admin';
    });
    this.store.withdraws = [];
    this.store.likes = [];
    this.store.notifications = [];
    this.saveStore();
    return true;
  }

  // Wallet
  async getWalletByUserId(userId: string) {
    if (prisma) {
      try {
        let wallet = await prisma.wallet.findUnique({ where: { user_id: userId } });
        if (!wallet) {
          const dbUser = await prisma.user.findUnique({ where: { id: userId } });
          if (dbUser) {
            wallet = await prisma.wallet.upsert({
              where: { user_id: userId },
              create: {
                user_id: userId,
                balance: 15000.0,
                currency: 'BIF',
              },
              update: {},
            });
          }
        }
        if (wallet) {
          return {
            id: wallet.id,
            user_id: wallet.user_id,
            balance: wallet.balance,
            currency: wallet.currency,
            updated_at: wallet.updated_at.toISOString(),
          };
        }
      } catch (err: any) {
        console.warn('[Prisma] getWalletByUserId warning:', err?.message || err);
      }
    }

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
    if (prisma) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (dbUser) {
          const current = await this.getWalletByUserId(userId);
          let newBal = current.balance;
          if (action === 'add') newBal += amount;
          else if (action === 'reduce') newBal = Math.max(0, newBal - amount);
          else if (action === 'set') newBal = Math.max(0, amount);

          const updated = await prisma.wallet.upsert({
            where: { user_id: userId },
            create: {
              user_id: userId,
              balance: newBal,
              currency: 'BIF',
            },
            update: { balance: newBal },
          });

          await prisma.notification.create({
            data: {
              user_id: userId,
              title: 'Igapuri Yawe Yahindutse (Wallet Balance Updated)',
              message: `Amafaranga ari mu gapuri kawe ubu ni: ${newBal.toLocaleString()} BIF.${
                note ? ` Ubumenyeshi bw'Admin: "${note}"` : ''
              }`,
            },
          }).catch((e) => console.warn('[Prisma] notification create error:', e?.message));

          return {
            id: updated.id,
            user_id: updated.user_id,
            balance: updated.balance,
            currency: updated.currency,
            updated_at: updated.updated_at.toISOString(),
          };
        }
      } catch (err: any) {
        console.warn('[Prisma] updateUserBalance warning:', err?.message || err);
      }
    }

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
    const clean = username.trim().toLowerCase().replace(/^@/, '');

    if (!this.store.admins || this.store.admins.length === 0) {
      this.store.admins = INITIAL_STORE.admins;
      this.saveStore();
    }

    if (prisma) {
      try {
        let dbAdmin = await prisma.admin.findFirst({
          where: { username: { equals: clean, mode: 'insensitive' } },
        });

        if (!dbAdmin) {
          const adminCount = await prisma.admin.count();
          if (adminCount === 0) {
            dbAdmin = await prisma.admin.create({
              data: {
                username: 'admin',
                password_hash: DEFAULT_ADMIN_HASH,
              },
            });
            console.log('[Database] Default admin account auto-seeded in PostgreSQL.');
          } else if (clean === 'admin' || clean === 'administrator') {
            dbAdmin = await prisma.admin.findFirst();
          }
        }

        if (dbAdmin) {
          return {
            id: dbAdmin.id,
            username: dbAdmin.username,
            password_hash: dbAdmin.password_hash,
          };
        }
      } catch (err) {
        console.error('[Prisma] getAdminByUsername error:', err);
      }
    }

    let found = this.store.admins.find((a) => a.username.toLowerCase().replace(/^@/, '') === clean);
    if (!found && (clean === 'admin' || clean === 'administrator')) {
      found = this.store.admins[0] || INITIAL_STORE.admins[0];
    }
    return found;
  }

  async getAdminById(id: string) {
    if (prisma) {
      try {
        const dbAdmin = await prisma.admin.findUnique({ where: { id } });
        if (dbAdmin) {
          return {
            id: dbAdmin.id,
            username: dbAdmin.username,
            password_hash: dbAdmin.password_hash,
          };
        }
      } catch (err) {
        console.error('[Prisma] getAdminById error:', err);
      }
    }

    if (!this.store.admins || this.store.admins.length === 0) {
      this.store.admins = INITIAL_STORE.admins;
      this.saveStore();
    }

    return this.store.admins.find((a) => a.id === id);
  }

  async updateAdminPassword(adminId: string, newPasswordHash: string, newUsername?: string) {
    if (prisma) {
      try {
        await prisma.admin.update({
          where: { id: adminId },
          data: {
            password_hash: newPasswordHash,
            ...(newUsername ? { username: newUsername } : {}),
          },
        });
      } catch (err) {
        console.error('[Prisma] updateAdminPassword error:', err);
      }
    }

    const admin = this.store.admins.find((a) => a.id === adminId) || this.store.admins[0];
    if (admin) {
      admin.password_hash = newPasswordHash;
      if (newUsername) admin.username = newUsername;
      this.saveStore();
      return true;
    }
    return false;
  }

  // Images & Likes
  async getAllImages(userId?: string) {
    if (prisma) {
      try {
        const count = await prisma.image.count();
        if (count === 0 && PRODUCT_LIBRARY && PRODUCT_LIBRARY.length > 0) {
          console.log('[Prisma] Seeding PRODUCT_LIBRARY into Neon PostgreSQL Image table...');
          for (const item of PRODUCT_LIBRARY) {
            await prisma.image.create({
              data: {
                id: item.id,
                title: item.title,
                image_url: item.image_url,
                reward: item.reward || 1000,
                active: item.active ?? true,
              },
            }).catch((err) => console.error('[Prisma] Seed image error:', err));
          }
        }

        const dbImages = await prisma.image.findMany({
          include: { likes: true },
          orderBy: { created_at: 'asc' },
        });

        if (dbImages && dbImages.length > 0) {
          return dbImages.map((img) => {
            const likes_count = img.likes.length;
            const user_liked = userId ? img.likes.some((l) => l.user_id === userId) : false;
            return {
              id: img.id,
              title: img.title,
              image_url: img.image_url,
              reward: img.reward,
              active: img.active,
              likes_count,
              user_liked,
              created_at: img.created_at.toISOString(),
            };
          });
        }
      } catch (err) {
        console.error('[Prisma] getAllImages error:', err);
      }
    }

    return this.store.images.map((img) => {
      const likes_count = this.store.likes.filter((l) => l.image_id === img.id).length;
      const user_liked = userId ? this.store.likes.some((l) => l.image_id === img.id && l.user_id === userId) : false;
      return { ...img, likes_count, user_liked };
    });
  }

  async createImage(data: { title: string; image_url: string; reward: number; active: boolean }) {
    if (prisma) {
      try {
        const img = await prisma.image.create({
          data: {
            title: data.title,
            image_url: data.image_url,
            reward: Number(data.reward) || 1000,
            active: data.active ?? true,
          },
        });
        return {
          id: img.id,
          title: img.title,
          image_url: img.image_url,
          reward: img.reward,
          active: img.active,
          created_at: img.created_at.toISOString(),
        };
      } catch (err) {
        console.error('[Prisma] createImage error:', err);
      }
    }

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
    if (prisma) {
      try {
        const updated = await prisma.image.update({
          where: { id },
          data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.image_url !== undefined && { image_url: data.image_url }),
            ...(data.reward !== undefined && { reward: Number(data.reward) }),
            ...(data.active !== undefined && { active: data.active }),
          },
        });
        return {
          id: updated.id,
          title: updated.title,
          image_url: updated.image_url,
          reward: updated.reward,
          active: updated.active,
          created_at: updated.created_at.toISOString(),
        };
      } catch (err) {
        console.error('[Prisma] updateImage error:', err);
      }
    }

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
    if (prisma) {
      try {
        await prisma.image.delete({ where: { id } });
      } catch (err) {
        console.error('[Prisma] deleteImage error:', err);
      }
    }

    this.store.images = this.store.images.filter((i) => i.id !== id);
    this.store.likes = this.store.likes.filter((l) => l.image_id !== id);
    this.saveStore();
    return true;
  }

  async likeImage(userId: string, imageId: string) {
    if (prisma) {
      try {
        const dbUser = await this.syncUserToPrismaIfNeeded(userId);
        const dbImage = await this.syncImageToPrismaIfNeeded(imageId);

        if (dbUser && dbImage) {
          if (dbUser.status !== 'approved') {
            throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi mbere yo gukunda amafoto (Account must be approved first).');
          }
          if (!dbImage.active) {
            throw new Error('Iyi foto ntiyakora mu gihe gihaye');
          }

          const existing = await prisma.imageLike.findUnique({
            where: {
              user_id_image_id: { user_id: userId, image_id: imageId },
            },
          });
          if (existing) {
            throw new Error('Wamaze gukunda iyi foto! (Already liked this image)');
          }

          await prisma.imageLike.create({
            data: {
              user_id: userId,
              image_id: imageId,
            },
          });

          const rewardAmount = dbImage.reward || 1000;
          const wallet = await prisma.wallet.upsert({
            where: { user_id: userId },
            create: { user_id: userId, balance: 15000.0 + rewardAmount, currency: 'BIF' },
            update: { balance: { increment: rewardAmount } },
          });

          await prisma.notification.create({
            data: {
              user_id: userId,
              title: `Wakoreye ${rewardAmount.toLocaleString()} BIF!`,
              message: `Urakoze gukunda: "${dbImage.title}". Agashimwe k'amafaranga ${rewardAmount.toLocaleString()} BIF kagiriwe mu gapuri kawe.`,
            },
          }).catch((e) => console.warn('[Prisma] notification warning:', e?.message));

          return {
            success: true,
            reward: rewardAmount,
            new_balance: wallet.balance,
          };
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('not found') || err.message.includes('Wamaze') || err.message.includes('Konte'))) {
          throw err;
        }
        console.warn('[Prisma] likeImage warning, falling back to memory:', err?.message || err);
      }
    }

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
    if (prisma) {
      try {
        const dbUser = await this.syncUserToPrismaIfNeeded(userId);
        if (dbUser) {
          if (dbUser.status !== 'approved') throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi (Account pending approval).');

          if (amount < 5000) {
            throw new Error('Ingano ya muke yo kwaka ni 5,000 BIF (Minimum withdrawal is 5,000 BIF).');
          }

          const wallet = await this.getWalletByUserId(userId);
          if (wallet.balance < amount) {
            throw new Error('Nta mafaranga ahagije ari mu gapuri kawe (Insufficient wallet balance).');
          }

          // Deduct pending balance from wallet
          await prisma.wallet.update({
            where: { user_id: userId },
            data: { balance: { decrement: amount } },
          });

          const request = await prisma.withdrawRequest.create({
            data: {
              user_id: userId,
              amount,
              payment_account: paymentAccount,
              status: 'pending',
            },
          });

          await prisma.notification.create({
            data: {
              user_id: userId,
              title: 'Ubusabe bwo kwaka amafaranga bwagize success',
              message: `Ubusabe bwawe bwa ${amount.toLocaleString()} BIF BIF kuri numero ${paymentAccount} bwagize success. Buririndiriye kuremurwa n'ubuyobozi.`,
            },
          }).catch(() => {});

          return {
            id: request.id,
            user_id: request.user_id,
            username: dbUser.username,
            phone_number: `${dbUser.phone_country_code}${dbUser.phone_number}`,
            amount: request.amount,
            payment_account: request.payment_account,
            status: request.status as any,
            created_at: request.created_at.toISOString(),
            updated_at: request.updated_at.toISOString(),
          };
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('not found') || err.message.includes('pending') || err.message.includes('Minimum') || err.message.includes('Insufficient'))) {
          throw err;
        }
        console.warn('[Prisma] createWithdrawRequest warning, falling back to memory:', err?.message || err);
      }
    }

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
    if (prisma) {
      try {
        const dbRequests = await prisma.withdrawRequest.findMany({
          where: { user_id: userId },
          include: { user: true },
          orderBy: { created_at: 'desc' },
        });
        if (dbRequests) {
          return dbRequests.map((w) => ({
            id: w.id,
            user_id: w.user_id,
            username: w.user?.username || '',
            phone_number: w.user ? `${w.user.phone_country_code}${w.user.phone_number}` : '',
            amount: w.amount,
            payment_account: w.payment_account,
            status: w.status as any,
            admin_message: w.admin_message || undefined,
            created_at: w.created_at.toISOString(),
            updated_at: w.updated_at.toISOString(),
          }));
        }
      } catch (err) {
        console.error('[Prisma] getUserWithdrawRequests error:', err);
      }
    }
    return this.store.withdraws.filter((w) => w.user_id === userId);
  }

  async getAllWithdrawRequests() {
    if (prisma) {
      try {
        const dbRequests = await prisma.withdrawRequest.findMany({
          include: { user: true },
          orderBy: { created_at: 'desc' },
        });
        if (dbRequests) {
          return dbRequests.map((w) => ({
            id: w.id,
            user_id: w.user_id,
            username: w.user?.username || '',
            phone_number: w.user ? `${w.user.phone_country_code}${w.user.phone_number}` : '',
            amount: w.amount,
            payment_account: w.payment_account,
            status: w.status as any,
            admin_message: w.admin_message || undefined,
            created_at: w.created_at.toISOString(),
            updated_at: w.updated_at.toISOString(),
          }));
        }
      } catch (err) {
        console.error('[Prisma] getAllWithdrawRequests error:', err);
      }
    }
    return this.store.withdraws;
  }

  async updateWithdrawRequestStatus(id: string, status: WithdrawStatus, adminMessage?: string) {
    if (prisma) {
      try {
        const req = await prisma.withdrawRequest.findUnique({ where: { id } });
        if (!req) throw new Error('Withdrawal request not found');

        const oldStatus = req.status;
        const updated = await prisma.withdrawRequest.update({
          where: { id },
          data: {
            status,
            admin_message: adminMessage,
          },
          include: { user: true },
        });

        // Refund if rejected from pending
        if (oldStatus === 'pending' && status === 'rejected') {
          await prisma.wallet.update({
            where: { user_id: req.user_id },
            data: { balance: { increment: req.amount } },
          });
        }

        await prisma.notification.create({
          data: {
            user_id: req.user_id,
            title: `Ubusabe bwa ${req.amount.toLocaleString()} BIF: ${status.toUpperCase()}`,
            message: `Ubusabe bwawe bwa ${req.amount.toLocaleString()} BIF BIF bwagize inyifato: ${status}.${
              adminMessage ? ` Ubumenyeshi bw'Admin: "${adminMessage}"` : ''
            }`,
          },
        });

        return {
          id: updated.id,
          user_id: updated.user_id,
          username: updated.user?.username || '',
          phone_number: updated.user ? `${updated.user.phone_country_code}${updated.user.phone_number}` : '',
          amount: updated.amount,
          payment_account: updated.payment_account,
          status: updated.status as any,
          admin_message: updated.admin_message || undefined,
          created_at: updated.created_at.toISOString(),
          updated_at: updated.updated_at.toISOString(),
        };
      } catch (err: any) {
        if (err.message && err.message.includes('not found')) throw err;
        console.error('[Prisma] updateWithdrawRequestStatus error:', err);
      }
    }

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
    if (prisma) {
      try {
        let ps = await prisma.paymentSettings.findUnique({ where: { id: 'default' } });
        if (!ps) {
          ps = await prisma.paymentSettings.create({
            data: {
              id: 'default',
              account_number: '+257 69 00 11 22',
              whatsapp_number: '+257 69 00 11 22',
              ussd_code: '*163#',
              payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga.',
            },
          });
        }
        return {
          account_number: ps.account_number,
          whatsapp_number: ps.whatsapp_number,
          ussd_code: ps.ussd_code,
          payment_instructions: ps.payment_instructions,
        };
      } catch (err) {
        console.error('[Prisma] getPaymentSettings error:', err);
      }
    }
    return this.store.paymentSettings;
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>) {
    this.store.paymentSettings = { ...this.store.paymentSettings, ...data };
    this.saveStore();

    if (prisma) {
      try {
        const ps = await prisma.paymentSettings.upsert({
          where: { id: 'default' },
          create: {
            id: 'default',
            account_number: data.account_number ?? '',
            whatsapp_number: data.whatsapp_number ?? '',
            ussd_code: data.ussd_code ?? '',
            payment_instructions: data.payment_instructions ?? '',
          },
          update: {
            ...(data.account_number !== undefined && { account_number: data.account_number }),
            ...(data.whatsapp_number !== undefined && { whatsapp_number: data.whatsapp_number }),
            ...(data.ussd_code !== undefined && { ussd_code: data.ussd_code }),
            ...(data.payment_instructions !== undefined && { payment_instructions: data.payment_instructions }),
          },
        });
        return {
          account_number: ps.account_number,
          whatsapp_number: ps.whatsapp_number,
          ussd_code: ps.ussd_code,
          payment_instructions: ps.payment_instructions,
        };
      } catch (err) {
        console.error('[Prisma] updatePaymentSettings error:', err);
      }
    }
    return this.store.paymentSettings;
  }

  // Notifications
  async getUserNotifications(userId: string) {
    if (prisma) {
      try {
        const dbNotifs = await prisma.notification.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
        });
        if (dbNotifs) {
          return dbNotifs.map((n) => ({
            id: n.id,
            user_id: n.user_id,
            title: n.title,
            message: n.message,
            read: n.read,
            created_at: n.created_at.toISOString(),
          }));
        }
      } catch (err) {
        console.error('[Prisma] getUserNotifications error:', err);
      }
    }
    return this.store.notifications.filter((n) => n.user_id === userId);
  }

  async markNotificationsRead(userId: string) {
    if (prisma) {
      try {
        await prisma.notification.updateMany({
          where: { user_id: userId, read: false },
          data: { read: true },
        });
      } catch (err) {
        console.error('[Prisma] markNotificationsRead error:', err);
      }
    }
    this.store.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.saveStore();
    return true;
  }

  // User Profile Updates
  async updateUserProfile(userId: string, data: Partial<User>) {
    if (prisma) {
      try {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            ...(data.username && { username: data.username }),
            ...(data.phone_number && { phone_number: data.phone_number }),
            ...(data.phone_country_code && { phone_country_code: data.phone_country_code }),
            ...(data.language && { language: data.language }),
          },
        });
        const { password_hash, ...rest } = updatedUser;
        const wallet = await this.getWalletByUserId(userId);
        return {
          ...rest,
          language: rest.language as any,
          status: rest.status as any,
          created_at: rest.created_at.toISOString(),
          updated_at: rest.updated_at.toISOString(),
          wallet,
        };
      } catch (err) {
        console.error('[Prisma] updateUserProfile error:', err);
      }
    }

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
    if (prisma) {
      try {
        const total_users = await prisma.user.count();
        const pending_users = await prisma.user.count({ where: { status: 'pending' } });
        const approved_users = await prisma.user.count({ where: { status: 'approved' } });
        const total_images = await prisma.image.count();
        const active_images = await prisma.image.count({ where: { active: true } });
        const total_withdrawals_count = await prisma.withdrawRequest.count();
        const pending_withdraws = await prisma.withdrawRequest.count({ where: { status: 'pending' } });
        
        const approvedWithdraws = await prisma.withdrawRequest.findMany({ where: { status: 'approved' } });
        const total_payouts = approvedWithdraws.reduce((sum, w) => sum + w.amount, 0);

        const walletAgg = await prisma.wallet.aggregate({ _sum: { balance: true } });
        const total_wallet_balance = walletAgg._sum.balance || 0;

        const gen = await this.getGeneralSettings();

        const recentUsers = await prisma.user.findMany({ take: 5, orderBy: { created_at: 'desc' } });
        const recentWithdraws = await prisma.withdrawRequest.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { user: true } });

        const userActs = recentUsers.map((u) => ({
          id: `act-u-${u.id}`,
          type: 'user',
          title: `New User: @${u.username}`,
          description: `Registered with status [${u.status.toUpperCase()}]`,
          time: u.created_at.toISOString(),
        }));

        const withdrawActs = recentWithdraws.map((w) => ({
          id: `act-w-${w.id}`,
          type: 'withdraw',
          title: `Withdrawal: ${w.amount.toLocaleString()} BIF`,
          description: `Requested by @${w.user?.username || 'User'} - Status: ${w.status.toUpperCase()}`,
          time: w.created_at.toISOString(),
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
          todays_withdrawals: recentWithdraws.length,
          total_wallet_balance,
          registration_bonus: gen.registration_bonus,
          app_status: gen.maintenance_mode ? 'maintenance' : 'online',
          recent_activities,
        };
      } catch (err) {
        console.error('[Prisma] getAdminStats error:', err);
      }
    }

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
