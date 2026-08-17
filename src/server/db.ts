import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PRODUCT_LIBRARY } from '../data/productLibrary.js';
import {
  AdminStats,
  GeneralSettings,
  ImageItem,
  NotificationItem,
  PaymentSettings,
  User,
  UserStatus,
  Wallet,
  WithdrawRequest,
  WithdrawStatus,
} from '../types.js';

const DEFAULT_ADMIN_HASH = bcrypt.hashSync('admin123', 10);

// Global PrismaClient singleton for Node.js / Serverless to prevent connection exhaustion
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DIRECT_URL ||
    null
  );
}

function getSafeDbDiagnostics(rawUrl?: string | null) {
  if (!rawUrl) return { configured: false, host: 'none', db: 'none', isNeon: false };
  try {
    const parsed = new URL(rawUrl);
    const isNeon = parsed.hostname.includes('neon.tech');
    return {
      configured: true,
      host: parsed.hostname,
      db: parsed.pathname.replace(/^\//, '') || 'default',
      isNeon,
      port: parsed.port || '5432',
    };
  } catch {
    return { configured: true, host: 'custom-url', db: 'unknown', isNeon: false };
  }
}

const rawDbUrl = resolveDatabaseUrl();
export const dbDiagnostics = getSafeDbDiagnostics(rawDbUrl);

export const isPostgresConfigured = Boolean(rawDbUrl);

let prismaInstance: PrismaClient | null = null;

if (isPostgresConfigured && rawDbUrl) {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = rawDbUrl;
  }

  if (!globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma = new PrismaClient({
        datasources: {
          db: {
            url: rawDbUrl,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
      console.log(
        `[PostgreSQL] Initialized PrismaClient singleton (Host: ${dbDiagnostics.host}, DB: ${dbDiagnostics.db}, Neon: ${dbDiagnostics.isNeon})`
      );
    } catch (err: any) {
      console.error('[PostgreSQL] Critical: Failed to instantiate PrismaClient:', err?.message || err);
    }
  }
  prismaInstance = globalForPrisma.prisma || null;
} else {
  console.log('[Database] No PostgreSQL connection string found. Operating in local filesystem development mode.');
}

export function getPrismaClient(): PrismaClient | null {
  return prismaInstance;
}

// Ensure default admin exists in PostgreSQL
async function seedPostgresAdmin() {
  if (!prismaInstance) return;
  try {
    const adminCount = await prismaInstance.admin.count();
    if (adminCount === 0) {
      await prismaInstance.admin.create({
        data: {
          username: 'admin',
          password_hash: DEFAULT_ADMIN_HASH,
        },
      });
      console.log('[PostgreSQL] Seeded default admin account (username: admin)');
    }
  } catch (err: any) {
    console.warn('[PostgreSQL] Admin seed check warning:', err?.message || err);
  }
}

if (prismaInstance) {
  seedPostgresAdmin().catch((err) => console.warn('[PostgreSQL] Admin seed error:', err));
}

// Local store definition used ONLY when NO PostgreSQL connection string exists (e.g. offline local testing)
interface StoreData {
  users: (User & { password_hash: string })[];
  admins: { id: string; username: string; password_hash: string }[];
  wallets: Wallet[];
  images: ImageItem[];
  likes: { id: string; user_id: string; image_id: string; created_at: string }[];
  withdraws: WithdrawRequest[];
  paymentSettings: PaymentSettings;
  generalSettings: GeneralSettings;
  notifications: NotificationItem[];
}

const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'twigamart_store.json');

const INITIAL_STORE: StoreData = {
  users: [],
  admins: [
    {
      id: 'admin_1',
      username: 'admin',
      password_hash: DEFAULT_ADMIN_HASH,
    },
  ],
  wallets: [],
  images: PRODUCT_LIBRARY,
  likes: [],
  withdraws: [],
  paymentSettings: {
    account_number: '+257 69 00 11 22',
    whatsapp_number: '+257 69 00 11 22',
    ussd_code: '*163#',
    payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga.',
  },
  generalSettings: {
    registration_bonus: 15000,
    like_reward: 1000,
    min_withdraw_amount: 5000,
    enabled_languages: ['rn', 'rw', 'en', 'fr'],
    maintenance_mode: false,
  },
  notifications: [],
};

class DatabaseService {
  private localStore: StoreData;

  constructor() {
    this.localStore = this.loadLocalStore();
  }

  private loadLocalStore(): StoreData {
    try {
      if (fs.existsSync(LOCAL_STORE_PATH)) {
        const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
        return { ...INITIAL_STORE, ...JSON.parse(raw) };
      }
    } catch {
      // fallback
    }
    return INITIAL_STORE;
  }

  private saveLocalStore() {
    if (isPostgresConfigured) return; // Never write local file when PostgreSQL is configured
    try {
      const dir = path.dirname(LOCAL_STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(this.localStore, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[LocalDatabase] Could not save local store:', e);
    }
  }

  private resolveCurrencyAndCountry(country?: string, phoneCode?: string): { country: string; currency: string } {
    let resolvedCountry = country || '';
    if (!resolvedCountry && phoneCode) {
      const p = phoneCode.trim().replace(/\D/g, '');
      if (p === '250') resolvedCountry = 'Rwanda';
      else if (p === '257') resolvedCountry = 'Burundi';
      else if (p === '256') resolvedCountry = 'Uganda';
      else if (p === '254') resolvedCountry = 'Kenya';
      else if (p === '255') resolvedCountry = 'Tanzania';
      else if (p === '243') resolvedCountry = 'DR Congo';
      else resolvedCountry = 'Rwanda';
    } else if (!resolvedCountry) {
      resolvedCountry = 'Rwanda';
    }

    const c = resolvedCountry.toLowerCase();
    let currency = 'RWF';
    if (c.includes('rwanda') || c === 'rw') currency = 'RWF';
    else if (c.includes('burundi') || c === 'bi' || c === 'rn') currency = '';
    else if (c.includes('uganda') || c === 'ug') currency = 'UGX';
    else if (c.includes('kenya') || c === 'ke') currency = 'KES';
    else if (c.includes('tanzania') || c.includes('tanzanie') || c === 'tz') currency = 'TZS';
    else if (c.includes('congo') || c.includes('drc') || c === 'cd') currency = 'CDF';

    return { country: resolvedCountry, currency };
  }

  // --- USERS ---

  async findUserExactByUsername(username: string) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (isPostgresConfigured && prismaInstance) {
      const dbUser = await prismaInstance.user.findFirst({
        where: {
          username: {
            equals: clean,
            mode: 'insensitive',
          },
        },
      });
      if (!dbUser) return null;
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
    return this.localStore.users.find((u) => u.username.toLowerCase().replace(/^@/, '') === clean) || null;
  }

  async findUserByUsername(username: string) {
    const rawClean = username.trim();
    const clean = rawClean.toLowerCase().replace(/^@/, '');
    const digitsOnly = username.replace(/\D/g, '');
    const cleanDigitsWithoutZero = digitsOnly.replace(/^0/, '');

    if (isPostgresConfigured && prismaInstance) {
      const dbUser = await prismaInstance.user.findFirst({
        where: {
          OR: [
            { username: { equals: clean, mode: 'insensitive' } },
            { username: { equals: `@${clean}`, mode: 'insensitive' } },
            { username: { equals: rawClean, mode: 'insensitive' } },
            { phone_number: { equals: rawClean } },
            { phone_number: { equals: digitsOnly } },
            { phone_number: { equals: cleanDigitsWithoutZero } },
            ...(cleanDigitsWithoutZero.length >= 4 ? [{ phone_number: { contains: cleanDigitsWithoutZero } }] : []),
            ...(digitsOnly.length >= 4 ? [{ phone_number: { contains: digitsOnly } }] : []),
          ],
        },
      });
      if (!dbUser) return null;
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

    return (
      this.localStore.users.find((u) => {
        const uClean = u.username.trim().toLowerCase().replace(/^@/, '');
        if (uClean === clean || u.username.trim() === rawClean) return true;
        if (digitsOnly.length >= 4) {
          const fullPhoneDigits = (u.phone_country_code + u.phone_number).replace(/\D/g, '');
          const phoneOnlyDigits = u.phone_number.replace(/\D/g, '');
          return fullPhoneDigits.includes(digitsOnly) || phoneOnlyDigits.includes(digitsOnly);
        }
        return false;
      }) || null
    );
  }

  async findUserByPhone(phoneCountryCode: string, phoneNumber: string) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (isPostgresConfigured && prismaInstance) {
      const dbUser = await prismaInstance.user.findFirst({
        where: {
          OR: [
            { phone_number: phoneNumber.trim() },
            ...(cleanNumber ? [{ phone_number: cleanNumber }] : []),
            ...(cleanNumber ? [{ phone_number: { contains: cleanNumber } }] : []),
          ],
        },
      });
      if (!dbUser) return null;
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

    return (
      this.localStore.users.find((u) => {
        const dbPhone = u.phone_number.replace(/\D/g, '');
        return dbPhone === cleanNumber || u.phone_number.trim() === phoneNumber.trim();
      }) || null
    );
  }

  async findUserById(id: string) {
    if (isPostgresConfigured && prismaInstance) {
      const dbUser = await prismaInstance.user.findUnique({
        where: { id },
      });
      if (!dbUser) return null;
      return {
        id: dbUser.id,
        username: dbUser.username,
        phone_country_code: dbUser.phone_country_code,
        phone_number: dbUser.phone_number,
        password_hash: dbUser.password_hash,
        country: dbUser.country || undefined,
        language: dbUser.language as any,
        status: dbUser.status as UserStatus,
        created_at: dbUser.created_at.toISOString(),
      };
    }
    return this.localStore.users.find((u) => u.id === id) || null;
  }

  async createUser(data: {
    username: string;
    phone_country_code: string;
    phone_number: string;
    password_hash: string;
    language: 'rn' | 'rw' | 'en' | 'fr';
    country?: string;
    status?: UserStatus;
  }) {
    const userStatus: UserStatus = data.status || 'pending';
    const { country: resolvedCountry, currency: resolvedCurrency } = this.resolveCurrencyAndCountry(
      data.country,
      data.phone_country_code
    );

    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Creating User @${data.username} in Neon database...`);
      const createdUser = await prismaInstance.user.create({
        data: {
          username: data.username,
          phone_country_code: data.phone_country_code,
          phone_number: data.phone_number,
          password_hash: data.password_hash,
          country: resolvedCountry,
          language: data.language || 'rn',
          status: userStatus as any,
          wallet: {
            create: {
              balance: 15000.0,
              currency: resolvedCurrency,
            },
          },
          notifications: {
            create: {
              title: "Bonus y'Ikaze (Welcome Bonus)",
              message: `Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 ${resolvedCurrency} yongewe mu gapuri kawe. Konte yawe irindiriye kwemerwa n'ubuyobozi.`,
              read: false,
            },
          },
        },
        include: {
          wallet: true,
        },
      });

      console.log(`[PostgreSQL Write Success] User created permanently with ID: ${createdUser.id}`);
      return {
        id: createdUser.id,
        username: createdUser.username,
        phone_country_code: createdUser.phone_country_code,
        phone_number: createdUser.phone_number,
        password_hash: createdUser.password_hash,
        country: createdUser.country || resolvedCountry,
        language: createdUser.language as any,
        status: createdUser.status as UserStatus,
        created_at: createdUser.created_at.toISOString(),
      };
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const user = {
      id,
      username: data.username,
      phone_country_code: data.phone_country_code,
      phone_number: data.phone_number,
      password_hash: data.password_hash,
      country: resolvedCountry,
      language: data.language || 'rn',
      status: userStatus,
      created_at: new Date().toISOString(),
    };
    this.localStore.users.unshift(user);
    this.localStore.wallets.unshift({
      id: `w_${Date.now()}`,
      user_id: id,
      balance: 15000.0,
      currency: resolvedCurrency,
      updated_at: new Date().toISOString(),
    });
    this.saveLocalStore();
    return user;
  }

  async updateUserPassword(id: string, password_hash: string) {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.user.update({
        where: { id },
        data: { password_hash },
      });
      return true;
    }
    const u = this.localStore.users.find((user) => user.id === id);
    if (u) {
      u.password_hash = password_hash;
      this.saveLocalStore();
      return true;
    }
    return false;
  }

  async updateUserStatus(id: string, status: UserStatus) {
    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Updating user ${id} status to ${status}...`);
      const statusMsgs: Record<UserStatus, string> = {
        approved: 'Konte yawe yemewe n\'Ubuyobozi! Mutangure gukoresha TwigaMart ukunde amafoto n\'okugira inyungu.',
        pending: 'Konte yawe irarindiriye kwemerwa.',
        rejected: 'Ubusabe bwa konte yawe bwanzwe n\'ubuyobozi.',
        suspended: 'Konte yawe irahagaritswe by\'agateganyo.',
      };

      const updated = await prismaInstance.user.update({
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
      return {
        id: updated.id,
        username: updated.username,
        phone_country_code: updated.phone_country_code,
        phone_number: updated.phone_number,
        status: updated.status as UserStatus,
        language: updated.language as any,
        created_at: updated.created_at.toISOString(),
      };
    }

    const u = this.localStore.users.find((user) => user.id === id);
    if (u) {
      u.status = status;
      this.saveLocalStore();
      return u;
    }
    throw new Error('User not found');
  }

  async updateUserAccount(
    id: string,
    updates: { username?: string; phone_country_code?: string; phone_number?: string; status?: UserStatus }
  ) {
    if (isPostgresConfigured && prismaInstance) {
      const updated = await prismaInstance.user.update({
        where: { id },
        data: {
          ...(updates.username ? { username: updates.username } : {}),
          ...(updates.phone_country_code ? { phone_country_code: updates.phone_country_code } : {}),
          ...(updates.phone_number ? { phone_number: updates.phone_number } : {}),
          ...(updates.status ? { status: updates.status as any } : {}),
        },
        include: { wallet: true },
      });
      const { password_hash, ...rest } = updated;
      return {
        ...rest,
        status: rest.status as UserStatus,
        language: rest.language as any,
        created_at: rest.created_at.toISOString(),
        updated_at: rest.updated_at.toISOString(),
        wallet: updated.wallet
          ? {
              id: updated.wallet.id,
              user_id: updated.wallet.user_id,
              balance: updated.wallet.balance,
              currency: updated.wallet.currency,
              updated_at: updated.wallet.updated_at.toISOString(),
            }
          : undefined,
      };
    }

    const user = this.localStore.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    if (updates.username) user.username = updates.username;
    if (updates.phone_number) user.phone_number = updates.phone_number;
    if (updates.phone_country_code) user.phone_country_code = updates.phone_country_code;
    if (updates.status) user.status = updates.status;
    this.saveLocalStore();
    const wallet = this.localStore.wallets.find((w) => w.user_id === user.id);
    const { password_hash, ...rest } = user;
    return { ...rest, wallet };
  }

  async getAllUsers() {
    if (isPostgresConfigured && prismaInstance) {
      const dbUsers = await prismaInstance.user.findMany({
        include: { wallet: true },
        orderBy: { created_at: 'desc' },
      });
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

    return this.localStore.users.map((u) => {
      const { password_hash, ...rest } = u;
      const wallet = this.localStore.wallets.find((w) => w.user_id === u.id);
      return { ...rest, wallet };
    });
  }

  async deleteUser(userId: string) {
    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Deleting user ID: ${userId}...`);
      await prismaInstance.withdrawRequest.deleteMany({ where: { user_id: userId } });
      await prismaInstance.notification.deleteMany({ where: { user_id: userId } });
      await prismaInstance.imageLike.deleteMany({ where: { user_id: userId } });
      await prismaInstance.wallet.deleteMany({ where: { user_id: userId } });
      await prismaInstance.user.deleteMany({ where: { id: userId } });
      return true;
    }

    this.localStore.users = this.localStore.users.filter((u) => u.id !== userId);
    this.localStore.wallets = this.localStore.wallets.filter((w) => w.user_id !== userId);
    this.localStore.withdraws = this.localStore.withdraws.filter((w) => w.user_id !== userId);
    this.localStore.likes = this.localStore.likes.filter((l) => l.user_id !== userId);
    this.localStore.notifications = this.localStore.notifications.filter((n) => n.user_id !== userId);
    this.saveLocalStore();
    return true;
  }

  async deleteWithdrawRequest(id: string) {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.withdrawRequest.deleteMany({ where: { id } });
      return true;
    }
    this.localStore.withdraws = this.localStore.withdraws.filter((w) => w.id !== id);
    this.saveLocalStore();
    return true;
  }

  async deleteAllUsers() {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.withdrawRequest.deleteMany({});
      await prismaInstance.notification.deleteMany({});
      await prismaInstance.imageLike.deleteMany({});
      await prismaInstance.wallet.deleteMany({});
      await prismaInstance.user.deleteMany({});
      return true;
    }
    this.localStore.users = [];
    this.localStore.wallets = [];
    this.localStore.withdraws = [];
    this.localStore.likes = [];
    this.localStore.notifications = [];
    this.saveLocalStore();
    return true;
  }

  async deleteAllWithdraws() {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.withdrawRequest.deleteMany({});
      return true;
    }
    this.localStore.withdraws = [];
    this.saveLocalStore();
    return true;
  }

  async resetAllData() {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.withdrawRequest.deleteMany({});
      await prismaInstance.notification.deleteMany({});
      await prismaInstance.imageLike.deleteMany({});
      await prismaInstance.wallet.deleteMany({});
      await prismaInstance.user.deleteMany({});
      return true;
    }
    this.localStore.users = [];
    this.localStore.wallets = [];
    this.localStore.withdraws = [];
    this.localStore.likes = [];
    this.localStore.notifications = [];
    this.saveLocalStore();
    return true;
  }

  // --- WALLET ---

  async getWalletByUserId(userId: string) {
    if (isPostgresConfigured && prismaInstance) {
      let wallet = await prismaInstance.wallet.findUnique({ where: { user_id: userId } });
      if (!wallet) {
        const dbUser = await prismaInstance.user.findUnique({ where: { id: userId } });
        const userCurrency = dbUser
          ? this.resolveCurrencyAndCountry(dbUser.country || undefined, dbUser.phone_country_code).currency
          : 'RWF';
        wallet = await prismaInstance.wallet.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            balance: 15000.0,
            currency: userCurrency,
          },
          update: {},
        });
      }
      return {
        id: wallet.id,
        user_id: wallet.user_id,
        balance: wallet.balance,
        currency: wallet.currency,
        updated_at: wallet.updated_at.toISOString(),
      };
    }

    let wallet = this.localStore.wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      wallet = {
        id: `w_${Date.now()}`,
        user_id: userId,
        balance: 15000.0,
        currency: 'RWF',
        updated_at: new Date().toISOString(),
      };
      this.localStore.wallets.push(wallet);
      this.saveLocalStore();
    }
    return wallet;
  }

  async updateUserBalance(userId: string, action: 'add' | 'reduce' | 'set', amount: number, note?: string) {
    if (isPostgresConfigured && prismaInstance) {
      const current = await this.getWalletByUserId(userId);
      let newBal = current.balance;
      if (action === 'add') newBal += amount;
      else if (action === 'reduce') newBal = Math.max(0, newBal - amount);
      else if (action === 'set') newBal = Math.max(0, amount);

      const updated = await prismaInstance.wallet.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          balance: newBal,
          currency: current.currency || 'RWF',
        },
        update: {
          balance: newBal,
        },
      });

      await prismaInstance.notification
        .create({
          data: {
            user_id: userId,
            title: action === 'add' ? 'Balance Topup' : action === 'reduce' ? 'Balance Deducted' : 'Balance Updated',
            message: `Amafaranga ari mu gapuri kawe ubu ni: ${newBal.toLocaleString()} ${current.currency || 'RWF'}.${
              note ? ` (${note})` : ''
            }`,
            read: false,
          },
        })
        .catch(() => {});

      return {
        id: updated.id,
        user_id: updated.user_id,
        balance: updated.balance,
        currency: updated.currency,
        updated_at: updated.updated_at.toISOString(),
      };
    }

    const wallet = await this.getWalletByUserId(userId);
    if (action === 'add') wallet.balance += amount;
    else if (action === 'reduce') wallet.balance = Math.max(0, wallet.balance - amount);
    else if (action === 'set') wallet.balance = Math.max(0, amount);
    wallet.updated_at = new Date().toISOString();
    this.saveLocalStore();
    return wallet;
  }

  // --- ADMIN ---

  async getAdminByUsername(username: string) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (isPostgresConfigured && prismaInstance) {
      let dbAdmin = await prismaInstance.admin.findFirst({
        where: { username: { equals: clean, mode: 'insensitive' } },
      });
      if (!dbAdmin && (clean === 'admin' || clean === 'administrator')) {
        const count = await prismaInstance.admin.count();
        if (count === 0) {
          dbAdmin = await prismaInstance.admin.create({
            data: { username: 'admin', password_hash: DEFAULT_ADMIN_HASH },
          });
        } else {
          dbAdmin = await prismaInstance.admin.findFirst();
        }
      }
      if (!dbAdmin) return null;
      return {
        id: dbAdmin.id,
        username: dbAdmin.username,
        password_hash: dbAdmin.password_hash,
      };
    }

    let found = this.localStore.admins.find((a) => a.username.toLowerCase().replace(/^@/, '') === clean);
    if (!found && (clean === 'admin' || clean === 'administrator')) {
      found = this.localStore.admins[0] || INITIAL_STORE.admins[0];
    }
    return found || null;
  }

  async getAdminById(id: string) {
    if (isPostgresConfigured && prismaInstance) {
      const dbAdmin = await prismaInstance.admin.findUnique({ where: { id } });
      if (!dbAdmin) return null;
      return {
        id: dbAdmin.id,
        username: dbAdmin.username,
        password_hash: dbAdmin.password_hash,
      };
    }
    return this.localStore.admins.find((a) => a.id === id) || null;
  }

  async updateAdminPassword(adminId: string, newPasswordHash: string, newUsername?: string) {
    if (isPostgresConfigured && prismaInstance) {
      const updateData: any = { password_hash: newPasswordHash };
      if (newUsername) updateData.username = newUsername;

      const dbAdmin = await prismaInstance.admin.findUnique({ where: { id: adminId } });
      if (dbAdmin) {
        await prismaInstance.admin.update({
          where: { id: adminId },
          data: updateData,
        });
      } else {
        await prismaInstance.admin.updateMany({
          data: updateData,
        });
      }
      return true;
    }

    const admin = this.localStore.admins.find((a) => a.id === adminId) || this.localStore.admins[0];
    if (admin) {
      admin.password_hash = newPasswordHash;
      if (newUsername) admin.username = newUsername;
      this.saveLocalStore();
    }
    return true;
  }

  // --- IMAGES & LIKES ---

  async getAllImages(userId?: string) {
    if (isPostgresConfigured && prismaInstance) {
      try {
        const count = await prismaInstance.image.count();
        if (count === 0 && PRODUCT_LIBRARY && PRODUCT_LIBRARY.length > 0) {
          console.log('[PostgreSQL] Seeding initial product catalog into image table...');
          await prismaInstance.image.createMany({
            data: PRODUCT_LIBRARY.map((item) => ({
              id: item.id,
              title: item.title,
              image_url: item.image_url,
              reward: item.reward || 1000,
              active: item.active ?? true,
            })),
            skipDuplicates: true,
          });
        }

        const dbImages = await prismaInstance.image.findMany({
          include: { likes: true },
          orderBy: { created_at: 'asc' },
        });

        if (dbImages && dbImages.length > 0) {
          return dbImages.map((img) => {
            const likes_count = img.likes ? img.likes.length : 0;
            const user_liked = userId && img.likes ? img.likes.some((l) => l.user_id === userId) : false;
            return {
              id: img.id,
              title: img.title,
              image_url: img.image_url,
              reward: img.reward,
              active: img.active,
              likes_count,
              user_liked,
              created_at: img.created_at ? img.created_at.toISOString() : new Date().toISOString(),
            };
          });
        }
      } catch (err: any) {
        console.error('[PostgreSQL Image Error] Falling back to local catalog:', err?.message || err);
      }
    }

    const list = this.localStore.images && this.localStore.images.length > 0 ? this.localStore.images : PRODUCT_LIBRARY;
    const likes = this.localStore.likes || [];
    return list.map((img) => {
      const likes_count = likes.filter((l) => l.image_id === img.id).length;
      const user_liked = userId ? likes.some((l) => l.image_id === img.id && l.user_id === userId) : false;
      return { ...img, likes_count, user_liked };
    });
  }

  async createImage(data: { title: string; image_url: string; reward: number; active: boolean }) {
    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Creating image: ${data.title}...`);
      const img = await prismaInstance.image.create({
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
    }

    const image: ImageItem = {
      id: `img_${Date.now()}`,
      title: data.title,
      image_url: data.image_url,
      reward: Number(data.reward) || 1000,
      active: data.active ?? true,
      created_at: new Date().toISOString(),
    };
    this.localStore.images.push(image);
    this.saveLocalStore();
    return image;
  }

  async updateImage(id: string, data: Partial<ImageItem>) {
    if (isPostgresConfigured && prismaInstance) {
      const updated = await prismaInstance.image.update({
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
    }

    const img = this.localStore.images.find((i) => i.id === id);
    if (img) {
      if (data.title !== undefined) img.title = data.title;
      if (data.image_url !== undefined) img.image_url = data.image_url;
      if (data.reward !== undefined) img.reward = Number(data.reward);
      if (data.active !== undefined) img.active = data.active;
      this.saveLocalStore();
    }
    return img;
  }

  async deleteImage(id: string) {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.imageLike.deleteMany({ where: { image_id: id } });
      await prismaInstance.image.deleteMany({ where: { id } });
      return true;
    }
    this.localStore.images = this.localStore.images.filter((i) => i.id !== id);
    this.localStore.likes = this.localStore.likes.filter((l) => l.image_id !== id);
    this.saveLocalStore();
    return true;
  }

  async likeImage(userId: string, imageId: string) {
    if (isPostgresConfigured && prismaInstance) {
      const dbUser = await prismaInstance.user.findUnique({ where: { id: userId } });
      if (!dbUser) throw new Error('User not found');
      if (dbUser.status !== 'approved') {
        throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi mbere yo gukunda amafoto (Account must be approved first).');
      }

      let dbImage = await prismaInstance.image.findUnique({ where: { id: imageId } });
      if (!dbImage) {
        // Find from product library and insert
        const mem = PRODUCT_LIBRARY.find((p) => p.id === imageId);
        if (mem) {
          dbImage = await prismaInstance.image.create({
            data: {
              id: mem.id,
              title: mem.title,
              image_url: mem.image_url,
              reward: mem.reward || 1000,
              active: mem.active ?? true,
            },
          });
        } else {
          throw new Error('Ifoto ntibonetse (Image not found)');
        }
      }

      if (!dbImage.active) {
        throw new Error('Iyi foto ntiyakora mu gihe gihaye');
      }

      const existing = await prismaInstance.imageLike.findUnique({
        where: {
          user_id_image_id: { user_id: userId, image_id: imageId },
        },
      });
      if (existing) {
        throw new Error('Wamaze gukunda iyi foto! (Already liked this image)');
      }

      await prismaInstance.imageLike.create({
        data: {
          user_id: userId,
          image_id: imageId,
        },
      });

      const rewardAmount = dbImage.reward || 1000;
      const wallet = await prismaInstance.wallet.upsert({
        where: { user_id: userId },
        create: { user_id: userId, balance: 15000.0 + rewardAmount, currency: 'RWF' },
        update: { balance: { increment: rewardAmount } },
      });

      await prismaInstance.notification
        .create({
          data: {
            user_id: userId,
            title: `Wakoreye ${rewardAmount.toLocaleString()}!`,
            message: `Urakoze gukunda: "${dbImage.title}". Agashimwe k'amafaranga ${rewardAmount.toLocaleString()} kagiriwe mu gapuri kawe.`,
          },
        })
        .catch(() => {});

      return {
        success: true,
        reward: rewardAmount,
        new_balance: wallet.balance,
      };
    }

    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'approved') throw new Error('Konte yawe igomba kwemerwa mbere yo gukunda amafoto');
    const image = this.localStore.images.find((i) => i.id === imageId);
    if (!image) throw new Error('Image not found');

    const existing = this.localStore.likes.find((l) => l.user_id === userId && l.image_id === imageId);
    if (existing) throw new Error('Wamaze gukunda iyi foto! (Already liked this image)');

    this.localStore.likes.push({
      id: `like_${Date.now()}`,
      user_id: userId,
      image_id: imageId,
      created_at: new Date().toISOString(),
    });
    const wallet = await this.getWalletByUserId(userId);
    const rewardAmount = image.reward || 1000;
    wallet.balance += rewardAmount;
    this.saveLocalStore();
    return {
      success: true,
      reward: rewardAmount,
      new_balance: wallet.balance,
    };
  }

  // --- WITHDRAWALS ---

  async createWithdrawRequest(userId: string, amount: number, paymentAccount: string) {
    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Creating withdrawal request for user ${userId}, amount: ${amount}...`);
      const dbUser = await prismaInstance.user.findUnique({ where: { id: userId } });
      if (!dbUser) throw new Error('User not found');
      if (dbUser.status !== 'approved') {
        throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi mbere yo kwaka amafaranga (Account pending approval).');
      }

      if (amount < 5000) {
        throw new Error('Ingano ya muke yo kwaka ni 5,000 (Minimum withdrawal is 5,000).');
      }

      const wallet = await this.getWalletByUserId(userId);
      if (wallet.balance < amount) {
        throw new Error('Nta mafaranga ahagije ari mu gapuri kawe (Insufficient wallet balance).');
      }

      // Deduct balance and create request in PostgreSQL
      await prismaInstance.wallet.update({
        where: { user_id: userId },
        data: { balance: { decrement: amount } },
      });

      const request = await prismaInstance.withdrawRequest.create({
        data: {
          user_id: userId,
          amount,
          payment_account: paymentAccount,
          status: 'pending',
        },
      });

      await prismaInstance.notification
        .create({
          data: {
            user_id: userId,
            title: 'Ubusabe bwo kwaka amafaranga bwagize success',
            message: `Ubusabe bwawe bwa ${amount.toLocaleString()} kuri numero ${paymentAccount} bwagize success. Buririndiriye kwemerwa n'ubuyobozi.`,
          },
        })
        .catch(() => {});

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

    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'approved') throw new Error('Konte igomba kwemerwa');
    if (amount < 5000) throw new Error('Minimum withdrawal is 5,000');
    const wallet = await this.getWalletByUserId(userId);
    if (wallet.balance < amount) throw new Error('Insufficient balance');

    wallet.balance -= amount;
    const req: WithdrawRequest = {
      id: `wdr_${Date.now()}`,
      user_id: userId,
      username: user.username,
      phone_number: `${user.phone_country_code}${user.phone_number}`,
      amount,
      payment_account: paymentAccount,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.localStore.withdraws.unshift(req);
    this.saveLocalStore();
    return req;
  }

  async getUserWithdrawRequests(userId: string) {
    if (isPostgresConfigured && prismaInstance) {
      const dbRequests = await prismaInstance.withdrawRequest.findMany({
        where: { user_id: userId },
        include: { user: true },
        orderBy: { created_at: 'desc' },
      });
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
    return this.localStore.withdraws.filter((w) => w.user_id === userId);
  }

  async getAllWithdrawRequests() {
    if (isPostgresConfigured && prismaInstance) {
      const dbRequests = await prismaInstance.withdrawRequest.findMany({
        include: { user: true },
        orderBy: { created_at: 'desc' },
      });
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
    return this.localStore.withdraws;
  }

  async updateWithdrawRequestStatus(id: string, status: WithdrawStatus, adminMessage?: string) {
    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Updating withdrawal request ${id} to ${status}...`);
      const req = await prismaInstance.withdrawRequest.findUnique({ where: { id } });
      if (!req) throw new Error('Withdrawal request not found');

      const oldStatus = req.status;
      const updated = await prismaInstance.withdrawRequest.update({
        where: { id },
        data: {
          status,
          admin_message: adminMessage,
        },
        include: { user: true },
      });

      // If rejected from pending, refund wallet balance
      if (oldStatus === 'pending' && status === 'rejected') {
        await prismaInstance.wallet.update({
          where: { user_id: req.user_id },
          data: { balance: { increment: req.amount } },
        });
      }

      await prismaInstance.notification
        .create({
          data: {
            user_id: req.user_id,
            title: `Ubusabe bwa ${req.amount.toLocaleString()}: ${status.toUpperCase()}`,
            message: `Ubusabe bwawe bwa ${req.amount.toLocaleString()} bwagize inyifato: ${status}.${
              adminMessage ? ` Ubumenyeshi bw'Admin: "${adminMessage}"` : ''
            }`,
          },
        })
        .catch(() => {});

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
    }

    const req = this.localStore.withdraws.find((w) => w.id === id);
    if (!req) throw new Error('Withdrawal request not found');
    const old = req.status;
    req.status = status;
    if (adminMessage !== undefined) req.admin_message = adminMessage;
    if (old === 'pending' && status === 'rejected') {
      const wallet = await this.getWalletByUserId(req.user_id);
      wallet.balance += req.amount;
    }
    this.saveLocalStore();
    return req;
  }

  // --- PAYMENT SETTINGS ---

  async getPaymentSettings(): Promise<PaymentSettings> {
    if (isPostgresConfigured && prismaInstance) {
      let ps = await prismaInstance.paymentSettings.findUnique({ where: { id: 'default' } });
      if (!ps) {
        ps = await prismaInstance.paymentSettings.create({
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
    }
    return this.localStore.paymentSettings || INITIAL_STORE.paymentSettings;
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>) {
    if (isPostgresConfigured && prismaInstance) {
      console.log('[PostgreSQL Write] Updating Payment Settings in Neon...');
      const ps = await prismaInstance.paymentSettings.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          account_number: data.account_number ?? '+257 69 00 11 22',
          whatsapp_number: data.whatsapp_number ?? '+257 69 00 11 22',
          ussd_code: data.ussd_code ?? '*163#',
          payment_instructions: data.payment_instructions ?? 'Payment instructions',
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
    }

    this.localStore.paymentSettings = { ...this.localStore.paymentSettings, ...data };
    this.saveLocalStore();
    return this.localStore.paymentSettings;
  }

  // --- GENERAL SETTINGS ---

  async getGeneralSettings(): Promise<GeneralSettings> {
    if (isPostgresConfigured && prismaInstance) {
      let gs = await prismaInstance.generalSettings.findUnique({ where: { id: 'default' } });
      if (!gs) {
        gs = await prismaInstance.generalSettings.create({
          data: {
            id: 'default',
            registration_bonus: 15000,
            like_reward: 1000,
            min_withdraw_amount: 5000,
            enabled_languages: ['rn', 'rw', 'en', 'fr'],
            maintenance_mode: false,
          },
        });
      }
      return {
        registration_bonus: gs.registration_bonus,
        like_reward: gs.like_reward,
        min_withdraw_amount: gs.min_withdraw_amount,
        enabled_languages: gs.enabled_languages as any,
        maintenance_mode: gs.maintenance_mode,
      };
    }
    return this.localStore.generalSettings || INITIAL_STORE.generalSettings;
  }

  async updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
    if (isPostgresConfigured && prismaInstance) {
      console.log('[PostgreSQL Write] Updating General Settings in Neon...');
      const gs = await prismaInstance.generalSettings.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          registration_bonus: data.registration_bonus ?? 15000,
          like_reward: data.like_reward ?? 1000,
          min_withdraw_amount: data.min_withdraw_amount ?? 5000,
          enabled_languages: data.enabled_languages ?? ['rn', 'rw', 'en', 'fr'],
          maintenance_mode: data.maintenance_mode ?? false,
        },
        update: {
          ...(data.registration_bonus !== undefined && { registration_bonus: data.registration_bonus }),
          ...(data.like_reward !== undefined && { like_reward: data.like_reward }),
          ...(data.min_withdraw_amount !== undefined && { min_withdraw_amount: data.min_withdraw_amount }),
          ...(data.enabled_languages !== undefined && { enabled_languages: data.enabled_languages }),
          ...(data.maintenance_mode !== undefined && { maintenance_mode: data.maintenance_mode }),
        },
      });
      return {
        registration_bonus: gs.registration_bonus,
        like_reward: gs.like_reward,
        min_withdraw_amount: gs.min_withdraw_amount,
        enabled_languages: gs.enabled_languages as any,
        maintenance_mode: gs.maintenance_mode,
      };
    }

    this.localStore.generalSettings = { ...this.localStore.generalSettings, ...data };
    this.saveLocalStore();
    return this.localStore.generalSettings;
  }

  // --- NOTIFICATIONS ---

  async getUserNotifications(userId: string) {
    if (isPostgresConfigured && prismaInstance) {
      const dbNotifs = await prismaInstance.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
      return dbNotifs.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        read: n.read,
        created_at: n.created_at.toISOString(),
      }));
    }
    return this.localStore.notifications.filter((n) => n.user_id === userId);
  }

  async markNotificationsRead(userId: string) {
    if (isPostgresConfigured && prismaInstance) {
      await prismaInstance.notification.updateMany({
        where: { user_id: userId, read: false },
        data: { read: true },
      });
      return true;
    }
    this.localStore.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.saveLocalStore();
    return true;
  }

  // --- USER PROFILE ---

  async updateUserProfile(userId: string, data: Partial<User>) {
    const { country: resolvedCountry, currency: resolvedCurrency } = this.resolveCurrencyAndCountry(
      data.country,
      data.phone_country_code
    );

    if (isPostgresConfigured && prismaInstance) {
      console.log(`[PostgreSQL Write] Updating user profile: ${userId}...`);
      const updatedUser = await prismaInstance.user.update({
        where: { id: userId },
        data: {
          ...(data.username && { username: data.username }),
          ...(data.phone_number && { phone_number: data.phone_number }),
          ...(data.phone_country_code && { phone_country_code: data.phone_country_code }),
          ...(data.country && { country: data.country }),
          ...(data.language && { language: data.language }),
          ...(data.profile_picture !== undefined && { profile_picture: data.profile_picture }),
        },
      });

      if (data.country || data.phone_country_code) {
        await prismaInstance.wallet
          .updateMany({
            where: { user_id: userId },
            data: { currency: resolvedCurrency },
          })
          .catch(() => {});
      }

      const wallet = await this.getWalletByUserId(userId);
      const { password_hash, ...rest } = updatedUser;
      return {
        ...rest,
        language: rest.language as any,
        status: rest.status as any,
        created_at: rest.created_at.toISOString(),
        updated_at: rest.updated_at.toISOString(),
        wallet,
      };
    }

    const user = this.localStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (data.username) user.username = data.username;
    if (data.phone_number) user.phone_number = data.phone_number;
    if (data.phone_country_code) user.phone_country_code = data.phone_country_code;
    if (data.country) user.country = data.country;
    if (data.language) user.language = data.language;
    if (data.profile_picture !== undefined) user.profile_picture = data.profile_picture;
    this.saveLocalStore();
    const wallet = await this.getWalletByUserId(userId);
    const { password_hash, ...rest } = user;
    return { ...rest, wallet };
  }

  // --- ADMIN STATS ---

  async getAdminStats(): Promise<AdminStats> {
    if (isPostgresConfigured && prismaInstance) {
      const [
        total_users,
        pending_users,
        approved_users,
        total_images,
        active_images,
        total_withdrawals_count,
        pending_withdraws,
        approvedWithdraws,
        walletAgg,
        recentUsers,
        recentWithdraws,
      ] = await Promise.all([
        prismaInstance.user.count(),
        prismaInstance.user.count({ where: { status: 'pending' } }),
        prismaInstance.user.count({ where: { status: 'approved' } }),
        prismaInstance.image.count(),
        prismaInstance.image.count({ where: { active: true } }),
        prismaInstance.withdrawRequest.count(),
        prismaInstance.withdrawRequest.count({ where: { status: 'pending' } }),
        prismaInstance.withdrawRequest.findMany({ where: { status: 'approved' } }),
        prismaInstance.wallet.aggregate({ _sum: { balance: true } }),
        prismaInstance.user.findMany({ take: 5, orderBy: { created_at: 'desc' } }),
        prismaInstance.withdrawRequest.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { user: true } }),
      ]);

      const total_payouts = approvedWithdraws.reduce((sum, w) => sum + w.amount, 0);
      const total_wallet_balance = walletAgg._sum.balance || 0;
      const gen = await this.getGeneralSettings();

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
        title: `Withdrawal: ${w.amount.toLocaleString()}`,
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
    }

    const total_users = this.localStore.users.length;
    const pending_users = this.localStore.users.filter((u) => u.status === 'pending').length;
    const approved_users = this.localStore.users.filter((u) => u.status === 'approved').length;
    const total_images = this.localStore.images.length;
    const active_images = this.localStore.images.filter((i) => i.active !== false).length;
    const total_withdrawals_count = this.localStore.withdraws.length;
    const pending_withdraws = this.localStore.withdraws.filter((w) => w.status === 'pending').length;
    const total_payouts = this.localStore.withdraws
      .filter((w) => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todays_withdrawals = this.localStore.withdraws.filter(
      (w) => w.created_at && w.created_at.startsWith(todayStr)
    ).length;

    const total_wallet_balance = this.localStore.wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const gen = await this.getGeneralSettings();

    const userActs = this.localStore.users.slice(-5).reverse().map((u) => ({
      id: `act-u-${u.id}`,
      type: 'user',
      title: `New User: @${u.username}`,
      description: `Registered with status [${u.status.toUpperCase()}]`,
      time: u.created_at || new Date().toISOString(),
    }));

    const withdrawActs = this.localStore.withdraws.slice(-5).reverse().map((w) => ({
      id: `act-w-${w.id}`,
      type: 'withdraw',
      title: `Withdrawal: ${w.amount.toLocaleString()}`,
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

export const db = new DatabaseService();
