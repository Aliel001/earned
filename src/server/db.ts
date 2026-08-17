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
  ImageLike,
  NotificationItem,
  PaymentSettings,
  User,
  UserStatus,
  Wallet,
  WithdrawRequest,
  WithdrawStatus,
} from '../types.js';

const DEFAULT_ADMIN_HASH = bcrypt.hashSync('admin123', 10);

let prisma: PrismaClient | null = null;
let isPostgresInitialized = false;

export function handlePrismaError(err: any, context: string) {
  console.warn(`[Prisma] ${context} warning:`, err?.message || err);
}

export async function withPrismaTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Prisma operation timed out (${timeoutMs}ms)`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function ensurePostgresSchema(client: PrismaClient) {
  try {
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "UserStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "WithdrawStatus" AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT UNIQUE NOT NULL,
        "phone_country_code" TEXT NOT NULL,
        "phone_number" TEXT UNIQUE NOT NULL,
        "password_hash" TEXT NOT NULL,
        "country" TEXT,
        "email" TEXT,
        "profile_picture" TEXT,
        "language" TEXT NOT NULL DEFAULT 'rn',
        "status" "UserStatus" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile_picture" TEXT;

      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT UNIQUE NOT NULL,
        "password_hash" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Wallet" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "balance" DOUBLE PRECISION NOT NULL DEFAULT 15000.0,
        "currency" TEXT NOT NULL DEFAULT '',
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Image" (
        "id" TEXT PRIMARY KEY,
        "image_url" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "category" TEXT,
        "reward" INTEGER NOT NULL DEFAULT 1000,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "category" TEXT;

      CREATE TABLE IF NOT EXISTS "ImageLike" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "image_id" TEXT NOT NULL REFERENCES "Image"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ImageLike_user_id_image_id_key" UNIQUE ("user_id", "image_id")
      );

      CREATE TABLE IF NOT EXISTS "WithdrawRequest" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "amount" DOUBLE PRECISION NOT NULL,
        "payment_account" TEXT NOT NULL,
        "status" "WithdrawStatus" NOT NULL DEFAULT 'pending',
        "admin_message" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "PaymentSettings" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "account_number" TEXT NOT NULL DEFAULT '+257 69 00 11 22',
        "whatsapp_number" TEXT NOT NULL DEFAULT '+257 69 00 11 22',
        "ussd_code" TEXT NOT NULL DEFAULT '*163#',
        "payment_instructions" TEXT NOT NULL DEFAULT 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga.',
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "GeneralSettings" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "registration_bonus" INTEGER NOT NULL DEFAULT 15000,
        "like_reward" INTEGER NOT NULL DEFAULT 1000,
        "min_withdraw_amount" INTEGER NOT NULL DEFAULT 5000,
        "enabled_languages" TEXT[] NOT NULL DEFAULT ARRAY['rn', 'rw', 'en', 'fr'],
        "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Database] PostgreSQL schema verified/created successfully.');
  } catch (err: any) {
    console.warn('[Database] PostgreSQL schema check warning:', err?.message || err);
  }
}

async function initPostgres(client: PrismaClient) {
  if (isPostgresInitialized) return;
  try {
    await withPrismaTimeout(client.$connect(), 8000);
    console.log('[Database] PrismaClient connected successfully.');
    await ensurePostgresSchema(client);
    isPostgresInitialized = true;
    await seedDefaultAdmin(client);
  } catch (err) {
    handlePrismaError(err, 'initPostgres');
  }
}

export function getPrismaClient(): PrismaClient | null {
  if (prisma) return prisma;

  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DIRECT_URL;

  if (dbUrl) {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = dbUrl;
    }
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });

      initPostgres(prisma).catch((err) => {
        console.warn('[Database] initPostgres background error:', err);
      });

      return prisma;
    } catch (err: any) {
      handlePrismaError(err, 'PrismaInit');
    }
  }
  return null;
}

// Auto-initialize if URL exists
getPrismaClient();

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

const BUNDLED_STORE_PATH = path.join(process.cwd(), 'data', 'twigamart_store.json');

let STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'twigamart_store.json')
  : BUNDLED_STORE_PATH;

function ensureDataDirExists() {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn('[Database] Could not create directory for store, switching STORE_PATH to /tmp:', err);
    try {
      STORE_PATH = path.join('/tmp', 'twigamart_store.json');
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error('[Database] Critical: Failed to create fallback /tmp store directory:', e);
    }
  }
}

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
    payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga. Ubusabe bwawe buzakorwa mu masaha 24.',
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

async function seedDefaultAdmin(client?: PrismaClient) {
  const p = client || getPrismaClient();
  if (p) {
    try {
      const adminCount = await withPrismaTimeout(p.admin.count(), 8000);
      if (adminCount === 0) {
        await withPrismaTimeout(
          p.admin.create({
            data: {
              username: 'admin',
              password_hash: DEFAULT_ADMIN_HASH,
            },
          }), 8000);
        console.log('[Database] Default admin account seeded in PostgreSQL.');
      }

      // Purge demo users if present in PostgreSQL
      await withPrismaTimeout(
        p.user.deleteMany({
          where: {
            OR: [
              { id: 'usr_demo_1' },
              { id: 'usr_demo_2' },
              { username: 'keza_bujumbura' },
              { username: 'eric_gitega' },
            ],
          },
        }), 8000).catch(() => {});
    } catch (err) {
      handlePrismaError(err, 'seedDefaultAdmin');
    }
  }
}

seedDefaultAdmin().catch((err) => console.error('[Database] Error seeding admin:', err));

class LocalDatabase {
  private store: StoreData;
  private lastCheckTime = 0;
  private lastMtime = 0;
  private saveTimeout: any = null;

  constructor() {
    this.store = this.sanitizeDemoUsers(this.loadStore());
    this.saveStore();
  }

  private sanitizeDemoUsers(store: StoreData): StoreData {
    const isDemoUser = (u: any) =>
      u.id === 'usr_demo_1' ||
      u.id === 'usr_demo_2' ||
      u.username === 'keza_bujumbura' ||
      u.username === 'eric_gitega';

    const demoUserIds = new Set(
      (store.users || [])
        .filter(isDemoUser)
        .map((u: any) => u.id)
        .concat(['usr_demo_1', 'usr_demo_2'])
    );

    return {
      ...store,
      users: (store.users || []).filter((u: any) => !isDemoUser(u)),
      wallets: (store.wallets || []).filter((w: any) => !demoUserIds.has(w.user_id)),
      withdraws: (store.withdraws || []).filter(
        (w: any) => !demoUserIds.has(w.user_id) && w.username !== 'keza_bujumbura' && w.username !== 'eric_gitega'
      ),
      likes: (store.likes || []).filter((l: any) => !demoUserIds.has(l.user_id)),
      notifications: (store.notifications || []).filter((n: any) => !demoUserIds.has(n.user_id)),
    };
  }

  private refreshStore(): StoreData {
    const now = Date.now();
    if (now - this.lastCheckTime < 2000 && this.store) {
      return this.store;
    }
    this.lastCheckTime = now;
    try {
      ensureDataDirExists();
      if (fs.existsSync(STORE_PATH)) {
        const stat = fs.statSync(STORE_PATH);
        if (stat.mtimeMs === this.lastMtime && this.store) {
          return this.store;
        }
        this.lastMtime = stat.mtimeMs;
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.images || parsed.images.length < 100) {
          parsed.images = PRODUCT_LIBRARY;
        }
        this.store = this.sanitizeDemoUsers({
          ...INITIAL_STORE,
          ...parsed,
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_STORE.users,
          admins: Array.isArray(parsed.admins) && parsed.admins.length > 0 ? parsed.admins : INITIAL_STORE.admins,
          wallets: Array.isArray(parsed.wallets) ? parsed.wallets : INITIAL_STORE.wallets,
          withdraws: Array.isArray(parsed.withdraws) ? parsed.withdraws : INITIAL_STORE.withdraws,
          likes: Array.isArray(parsed.likes) ? parsed.likes : INITIAL_STORE.likes,
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : INITIAL_STORE.notifications,
          paymentSettings: {
            ...INITIAL_STORE.paymentSettings,
            ...(parsed.paymentSettings || {}),
          },
          generalSettings: {
            ...INITIAL_STORE.generalSettings,
            ...(parsed.generalSettings || {}),
          },
        });
      }
    } catch (err) {
      console.error('Failed to load store, using cached in-memory store:', err);
    }
    return this.store || INITIAL_STORE;
  }

  private loadStore(): StoreData {
    try {
      ensureDataDirExists();
      let targetPath = STORE_PATH;
      if (!fs.existsSync(targetPath) && fs.existsSync(BUNDLED_STORE_PATH)) {
        targetPath = BUNDLED_STORE_PATH;
      }

      if (fs.existsSync(targetPath)) {
        const stat = fs.statSync(targetPath);
        this.lastMtime = stat.mtimeMs;
        this.lastCheckTime = Date.now();
        const raw = fs.readFileSync(targetPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.images || parsed.images.length < 100) {
          parsed.images = PRODUCT_LIBRARY;
        }
        const merged: StoreData = {
          ...INITIAL_STORE,
          ...parsed,
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_STORE.users,
          admins: Array.isArray(parsed.admins) && parsed.admins.length > 0 ? parsed.admins : INITIAL_STORE.admins,
          wallets: Array.isArray(parsed.wallets) ? parsed.wallets : INITIAL_STORE.wallets,
          withdraws: Array.isArray(parsed.withdraws) ? parsed.withdraws : INITIAL_STORE.withdraws,
          likes: Array.isArray(parsed.likes) ? parsed.likes : INITIAL_STORE.likes,
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : INITIAL_STORE.notifications,
          paymentSettings: {
            ...INITIAL_STORE.paymentSettings,
            ...(parsed.paymentSettings || {}),
          },
          generalSettings: {
            ...INITIAL_STORE.generalSettings,
            ...(parsed.generalSettings || {}),
          },
        };
        const sanitized = this.sanitizeDemoUsers(merged);
        if (targetPath !== STORE_PATH) {
          this.store = sanitized;
          this.flushSaveToDiskSync();
        }
        return sanitized;
      }
    } catch (err) {
      console.error('Failed to load store, using defaults:', err);
    }
    this.saveStore(INITIAL_STORE);
    return INITIAL_STORE;
  }

  private saveStore(data?: StoreData) {
    if (data) {
      this.store = data;
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.flushSaveToDiskSync();
  }

  private flushSaveToDiskSync() {
    try {
      ensureDataDirExists();
      const content = JSON.stringify(this.store, null, 2);
      fs.writeFileSync(STORE_PATH, content, 'utf-8');
      const stat = fs.statSync(STORE_PATH);
      this.lastMtime = stat.mtimeMs;
      this.lastCheckTime = Date.now();
    } catch (err) {
      console.error('Failed to save store synchronously:', err);
    }
  }

  private async syncUserToPrismaIfNeeded(userId: string) {
    if (!prisma) return null;
    try {
      let dbUser = await withPrismaTimeout(prisma.user.findUnique({ where: { id: userId } }), 8000);
      if (!dbUser) {
        const memUser = this.store.users.find((u) => u.id === userId);
        if (memUser) {
          dbUser = await withPrismaTimeout(
            prisma.user.create({
              data: {
                id: memUser.id,
                username: memUser.username,
                phone_country_code: memUser.phone_country_code || '+257',
                phone_number: memUser.phone_number || '',
                password_hash: memUser.password_hash || '',
                language: memUser.language || 'rn',
                status: memUser.status || 'approved',
              },
            }), 8000);
          const userCurrency = this.resolveCurrencyAndCountry(memUser.country, memUser.phone_country_code).currency;
          await withPrismaTimeout(
            prisma.wallet.upsert({
              where: { user_id: memUser.id },
              create: { user_id: memUser.id, balance: 15000.0, currency: userCurrency },
              update: {},
            }), 8000).catch(() => {});
        }
      }
      return dbUser;
    } catch (err) {
      handlePrismaError(err, 'syncUserToPrismaIfNeeded');
      return null;
    }
  }

  private async syncImageToPrismaIfNeeded(imageId: string) {
    if (!prisma) return null;
    try {
      let dbImage = await withPrismaTimeout(prisma.image.findUnique({ where: { id: imageId } }), 8000);
      if (!dbImage) {
        const memImg = this.store.images.find((i) => i.id === imageId) || PRODUCT_LIBRARY.find((p) => p.id === imageId);
        if (memImg) {
          dbImage = await withPrismaTimeout(
            prisma.image.create({
              data: {
                id: memImg.id,
                title: memImg.title,
                image_url: memImg.image_url,
                reward: memImg.reward || 1000,
                active: memImg.active ?? true,
              },
            }), 8000);
        }
      }
      return dbImage;
    } catch (err) {
      handlePrismaError(err, 'syncImageToPrismaIfNeeded');
      return null;
    }
  }

  // Users
  async findUserExactByUsername(username: string) {
    this.refreshStore();
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (prisma) {
      try {
        const dbUser = await withPrismaTimeout(
          prisma.user.findFirst({
            where: {
              username: {
                equals: clean,
                mode: 'insensitive',
              },
            },
          }), 8000);
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
        handlePrismaError(err, 'findUserExactByUsername');
      }
    }
    return this.store.users.find((u) => u.username.toLowerCase().replace(/^@/, '') === clean);
  }

  async findUserByUsername(username: string) {
    this.refreshStore();
    const rawClean = username.trim();
    const clean = rawClean.toLowerCase().replace(/^@/, '');
    const digitsOnly = username.replace(/\D/g, '');
    const cleanDigitsWithoutZero = digitsOnly.replace(/^0/, '');

    if (prisma) {
      try {
        let dbUser = await withPrismaTimeout(
          prisma.user.findFirst({
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
          }), 8000);

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
        handlePrismaError(err, 'findUserByUsername');
      }
    }

    return this.store.users.find((u) => {
      const uClean = u.username.trim().toLowerCase().replace(/^@/, '');
      if (uClean === clean || u.username.trim() === rawClean) return true;

      if (digitsOnly.length >= 4) {
        const fullPhoneDigits = (u.phone_country_code + u.phone_number).replace(/\D/g, '');
        const phoneOnlyDigits = u.phone_number.replace(/\D/g, '');
        if (
          fullPhoneDigits === digitsOnly ||
          phoneOnlyDigits === digitsOnly ||
          fullPhoneDigits.includes(digitsOnly) ||
          phoneOnlyDigits.includes(digitsOnly) ||
          digitsOnly.includes(phoneOnlyDigits) ||
          (cleanDigitsWithoutZero.length >= 4 &&
            (fullPhoneDigits.endsWith(cleanDigitsWithoutZero) ||
              phoneOnlyDigits.endsWith(cleanDigitsWithoutZero) ||
              cleanDigitsWithoutZero.endsWith(phoneOnlyDigits)))
        ) {
          return true;
        }
      }

      return false;
    });
  }

  async findUserByPhone(phoneCountryCode: string, phoneNumber: string) {
    this.refreshStore();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const cleanCode = phoneCountryCode.replace(/\D/g, '');

    if (prisma) {
      try {
        const dbUser = await withPrismaTimeout(
          prisma.user.findFirst({
            where: {
              OR: [
                { phone_number: phoneNumber.trim() },
                ...(cleanNumber ? [{ phone_number: cleanNumber }] : []),
                ...(cleanNumber ? [{ phone_number: { contains: cleanNumber } }] : []),
              ],
            },
          }), 8000);
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
        handlePrismaError(err, 'findUserByPhone');
      }
    }

    return this.store.users.find((u) => {
      const dbPhone = u.phone_number.replace(/\D/g, '');
      const dbCode = u.phone_country_code.replace(/\D/g, '');
      return (dbCode === cleanCode && dbPhone === cleanNumber) || u.phone_number.trim() === phoneNumber.trim();
    });
  }

  async findUserById(id: string) {
    this.refreshStore();
    if (prisma) {
      try {
        const dbUser = await withPrismaTimeout(
          prisma.user.findUnique({
            where: { id },
          }), 8000);
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
        handlePrismaError(err, 'findUserById');
      }
    }
    return this.store.users.find((u) => u.id === id);
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

  async createUser(data: {
    username: string;
    phone_country_code: string;
    phone_number: string;
    password_hash: string;
    language: 'rn' | 'rw' | 'en' | 'fr';
    country?: string;
    status?: UserStatus;
  }) {
    this.refreshStore();
    const userStatus: UserStatus = data.status || 'pending';
    const { country: resolvedCountry, currency: resolvedCurrency } = this.resolveCurrencyAndCountry(
      data.country,
      data.phone_country_code
    );

    if (prisma) {
      try {
        const createdUser: any = await withPrismaTimeout(
          prisma.user.create({
            data: {
              username: data.username,
              phone_country_code: data.phone_country_code,
              phone_number: data.phone_number,
              password_hash: data.password_hash,
              ...(resolvedCountry ? { country: resolvedCountry } : {}),
              language: data.language || 'rn',
              status: userStatus,
              wallet: {
                create: {
                  balance: 15000.0,
                  currency: resolvedCurrency,
                },
              },
              notifications: {
                create: {
                  title: "Bonus y'Ikaze (Welcome Bonus)",
                  message:
                    `Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 ${resolvedCurrency} yongewe mu gapuri kawe. Konte yawe irindiriye kwemerwa n'ubuyobozi (Pending Admin Approval).`,
                  read: false,
                },
              },
            } as any,
            include: {
              wallet: true,
            },
          }), 8000);

        const formattedUser = {
          id: createdUser.id,
          username: createdUser.username,
          phone_country_code: createdUser.phone_country_code,
          phone_number: createdUser.phone_number,
          password_hash: createdUser.password_hash,
          country: createdUser.country || resolvedCountry,
          language: createdUser.language as any,
          status: createdUser.status as UserStatus,
          created_at: createdUser.created_at ? new Date(createdUser.created_at).toISOString() : new Date().toISOString(),
        };

        // Sync into store
        this.store.users.unshift(formattedUser);
        if (createdUser.wallet) {
          this.store.wallets.unshift({
            id: createdUser.wallet.id,
            user_id: createdUser.wallet.user_id,
            balance: createdUser.wallet.balance,
            currency: createdUser.wallet.currency || resolvedCurrency,
            updated_at: createdUser.wallet.updated_at ? new Date(createdUser.wallet.updated_at).toISOString() : new Date().toISOString(),
          });
        }
        this.saveStore();

        return formattedUser;
      } catch (prismaErr) {
        handlePrismaError(prismaErr, 'createUser');
      }
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

    this.store.users.unshift(user);

    // Create wallet with 15000 welcome bonus in user's country currency
    const wallet: Wallet = {
      id: `w_${Date.now()}`,
      user_id: id,
      balance: 15000.0,
      currency: resolvedCurrency,
      updated_at: new Date().toISOString(),
    };
    this.store.wallets.unshift(wallet);

    // Create notification
    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      user_id: id,
      title: 'Bonus y\'Ikaze (Welcome Bonus)',
      message: `Urakoze kwirangisha kuri TwigaMart! Bonus ya 15,000 ${resolvedCurrency} yongewe mu gapuri kawe.`,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.store.notifications.unshift(notif);

    this.saveStore();

    return user;
  }

  async updateUserPassword(id: string, password_hash: string) {
    this.refreshStore();
    if (prisma) {
      try {
        await withPrismaTimeout(
          prisma.user.update({
            where: { id },
            data: { password_hash },
          }), 8000);
      } catch (err) {
        handlePrismaError(err, 'updateUserPassword');
      }
    }

    const user = this.store.users.find((u) => u.id === id);
    if (user) {
      user.password_hash = password_hash;
      user.updated_at = new Date().toISOString();
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

        await withPrismaTimeout(
          prisma.user.update({
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
          }), 8000);
      } catch (err) {
        handlePrismaError(err, 'updateUserStatus');
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
        await withPrismaTimeout(
          prisma.user.update({
            where: { id },
            data: {
              ...(updates.username ? { username: updates.username } : {}),
              ...(updates.phone_country_code ? { phone_country_code: updates.phone_country_code } : {}),
              ...(updates.phone_number ? { phone_number: updates.phone_number } : {}),
              ...(updates.status ? { status: updates.status as any } : {}),
            },
          }), 8000);
      } catch (err) {
        handlePrismaError(err, 'updateUserAccount');
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
    this.refreshStore();
    let dbUsersList: any[] = [];
    if (prisma) {
      try {
        const dbUsers = await withPrismaTimeout(
          prisma.user.findMany({
            include: { wallet: true },
            orderBy: { created_at: 'desc' },
          }), 8000);
        if (dbUsers && dbUsers.length > 0) {
          dbUsersList = dbUsers.map((u) => {
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
        handlePrismaError(err, 'getAllUsers');
      }
    }

    const memUsers = this.store.users.map((u) => {
      const { password_hash, ...rest } = u;
      const wallet = this.store.wallets.find((w) => w.user_id === u.id);
      return { ...rest, wallet };
    });

    const userMap = new Map<string, any>();
    for (const u of memUsers) userMap.set(u.id, u);
    for (const u of dbUsersList) userMap.set(u.id, u);

    return Array.from(userMap.values());
  }

  async deleteUser(userId: string) {
    const memUser = this.store.users.find((u) => u.id === userId || u.username === userId || u.username === `@${userId}` || `@${u.username}` === userId);
    const targetId = memUser ? memUser.id : userId;
    const targetUsername = memUser ? memUser.username : userId;

    if (prisma) {
      try {
        const dbUsers = await withPrismaTimeout(
          prisma.user.findMany({
            where: {
              OR: [
                { id: targetId },
                { id: userId },
                { username: targetUsername },
                { username: userId },
                { username: `@${userId}` },
              ],
            },
          }), 8000);
        const dbUserIds = dbUsers.map((u) => u.id);
        const allIds = Array.from(new Set([targetId, userId, ...dbUserIds]));

        await withPrismaTimeout(prisma.withdrawRequest.deleteMany({ where: { user_id: { in: allIds } } }), 8000);
        await withPrismaTimeout(prisma.notification.deleteMany({ where: { user_id: { in: allIds } } }), 8000);
        await withPrismaTimeout(prisma.imageLike.deleteMany({ where: { user_id: { in: allIds } } }), 8000);
        await withPrismaTimeout(prisma.wallet.deleteMany({ where: { user_id: { in: allIds } } }), 8000);
        await withPrismaTimeout(prisma.user.deleteMany({ where: { id: { in: allIds } } }), 8000);
      } catch (err: any) {
        handlePrismaError(err, 'deleteUser');
      }
    }

    this.store.users = this.store.users.filter(
      (u) => u.id !== targetId && u.id !== userId && u.username !== targetUsername && u.username !== userId
    );
    this.store.wallets = this.store.wallets.filter((w) => w.user_id !== targetId && w.user_id !== userId);
    this.store.withdraws = this.store.withdraws.filter((w) => w.user_id !== targetId && w.user_id !== userId);
    this.store.likes = this.store.likes.filter((l) => l.user_id !== targetId && l.user_id !== userId);
    this.store.notifications = this.store.notifications.filter((n) => n.user_id !== targetId && n.user_id !== userId);
    this.saveStore();
    return true;
  }

  async deleteWithdrawRequest(id: string) {
    if (prisma) {
      try {
        await prisma.withdrawRequest.deleteMany({ where: { id } });
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
        let wallet = await withPrismaTimeout(prisma.wallet.findUnique({ where: { user_id: userId } }), 8000);
        if (!wallet) {
          const dbUser = await withPrismaTimeout(prisma.user.findUnique({ where: { id: userId } }), 8000);
          if (dbUser) {
            const userCurrency = dbUser ? this.resolveCurrencyAndCountry((dbUser as any).country, dbUser.phone_country_code).currency : 'RWF';
            wallet = await withPrismaTimeout(
              prisma.wallet.upsert({
                where: { user_id: userId },
                create: {
                  user_id: userId,
                  balance: 15000.0,
                  currency: userCurrency,
                },
                update: {},
              }), 8000);
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
        handlePrismaError(err, 'getWalletByUserId');
      }
    }

    let wallet = this.store.wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      const user = this.store.users.find((u) => u.id === userId);
      const userCurrency = user ? this.resolveCurrencyAndCountry(user.country, user.phone_country_code).currency : 'RWF';
      wallet = {
        id: `w_${Date.now()}`,
        user_id: userId,
        balance: 15000.0,
        currency: userCurrency,
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
        const dbUser = await withPrismaTimeout(prisma.user.findUnique({ where: { id: userId } }), 8000);
        if (dbUser) {
          const current = await this.getWalletByUserId(userId);
          let newBal = current.balance;
          if (action === 'add') newBal += amount;
          else if (action === 'reduce') newBal = Math.max(0, newBal - amount);
          else if (action === 'set') newBal = Math.max(0, amount);

          const updated = await withPrismaTimeout(
            prisma.wallet.upsert({
              where: { user_id: userId },
              create: {
                user_id: userId,
                balance: newBal,
                currency: current.currency || 'RWF',
              },
              update: {
                balance: newBal,
              },
            }), 8000);

          await withPrismaTimeout(
            prisma.notification.create({
              data: {
                user_id: userId,
                title: action === 'add' ? 'Balance Topup' : action === 'reduce' ? 'Balance Deducted' : 'Balance Updated',
                message: `Amafaranga ari mu gapuri kawe ubu ni: ${newBal.toLocaleString()} ${current.currency || 'RWF'}.${
                  note ? ` (${note})` : ''
                }`,
                read: false,
              },
            }), 8000).catch((e) => console.warn('[Prisma] notification create error:', e?.message));

          return {
            id: updated.id,
            user_id: updated.user_id,
            balance: updated.balance,
            currency: updated.currency,
            updated_at: updated.updated_at.toISOString(),
          };
        }
      } catch (err: any) {
        handlePrismaError(err, 'updateUserBalance');
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
      message: `Amafaranga ari mu gapuri kawe ubu ni: ${wallet.balance.toLocaleString()}.${
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
        let dbAdmin = await withPrismaTimeout(
          prisma.admin.findFirst({
            where: { username: { equals: clean, mode: 'insensitive' } },
          }), 8000);

        if (!dbAdmin) {
          const adminCount = await withPrismaTimeout(prisma.admin.count(), 8000);
          if (adminCount === 0) {
            dbAdmin = await withPrismaTimeout(
              prisma.admin.create({
                data: {
                  username: 'admin',
                  password_hash: DEFAULT_ADMIN_HASH,
                },
              }), 8000);
            console.log('[Database] Default admin account auto-seeded in PostgreSQL.');
          } else if (clean === 'admin' || clean === 'administrator') {
            dbAdmin = await withPrismaTimeout(prisma.admin.findFirst(), 8000);
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
        handlePrismaError(err, 'getAdminByUsername');
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
        const dbAdmin = await withPrismaTimeout(prisma.admin.findUnique({ where: { id } }), 8000);
        if (dbAdmin) {
          return {
            id: dbAdmin.id,
            username: dbAdmin.username,
            password_hash: dbAdmin.password_hash,
          };
        }
      } catch (err) {
        handlePrismaError(err, 'getAdminById');
      }
    }

    if (!this.store.admins || this.store.admins.length === 0) {
      this.store.admins = INITIAL_STORE.admins;
      this.saveStore();
    }

    return this.store.admins.find((a) => a.id === id);
  }

  async updateAdminPassword(adminId: string, newPasswordHash: string, newUsername?: string) {
    this.refreshStore();
    if (prisma) {
      try {
        const updateData: any = { password_hash: newPasswordHash };
        if (newUsername) updateData.username = newUsername;

        const dbAdmin = await withPrismaTimeout(prisma.admin.findUnique({ where: { id: adminId } }), 8000);
        if (dbAdmin) {
          await withPrismaTimeout(
            prisma.admin.update({
              where: { id: adminId },
              data: updateData,
            }), 8000);
        } else {
          await withPrismaTimeout(
            prisma.admin.updateMany({
              data: updateData,
            }), 8000);
        }
      } catch (err) {
        handlePrismaError(err, 'updateAdminPassword');
      }
    }

    if (!this.store.admins || this.store.admins.length === 0) {
      this.store.admins = INITIAL_STORE.admins;
    }

    let admin = this.store.admins.find((a) => a.id === adminId) || this.store.admins[0];
    if (admin) {
      admin.password_hash = newPasswordHash;
      if (newUsername) admin.username = newUsername;
    }

    for (const a of this.store.admins) {
      a.password_hash = newPasswordHash;
      if (newUsername) a.username = newUsername;
    }

    this.saveStore();
    return true;
  }

  // Images & Likes
  async getAllImages(userId?: string) {
    if (prisma) {
      try {
        const count = await withPrismaTimeout(prisma.image.count(), 8000);
        if (count === 0 && PRODUCT_LIBRARY && PRODUCT_LIBRARY.length > 0) {
          console.log('[Prisma] Seeding PRODUCT_LIBRARY into Image table asynchronously...');
          prisma.image
            .createMany({
              data: PRODUCT_LIBRARY.map((item) => ({
                id: item.id,
                title: item.title,
                image_url: item.image_url,
                reward: item.reward || 1000,
                active: item.active ?? true,
              })),
              skipDuplicates: true,
            })
            .catch((err) => console.error('[Prisma] Seed image error:', err));
        }

        const dbImages = await withPrismaTimeout(
          prisma.image.findMany({
            include: { likes: true },
            orderBy: { created_at: 'asc' },
          }), 8000);

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
        handlePrismaError(err, 'getAllImages');
      }
    }

    const imagesList =
      this.store && Array.isArray(this.store.images) && this.store.images.length > 0
        ? this.store.images
        : PRODUCT_LIBRARY;
    const likesList = this.store && Array.isArray(this.store.likes) ? this.store.likes : [];

    return imagesList.map((img) => {
      const likes_count = likesList.filter((l) => l.image_id === img.id).length;
      const user_liked = userId ? likesList.some((l) => l.image_id === img.id && l.user_id === userId) : false;
      return { ...img, likes_count, user_liked };
    });
  }

  async createImage(data: { title: string; image_url: string; reward: number; active: boolean }) {
    if (prisma) {
      try {
        const img = await withPrismaTimeout(
          prisma.image.create({
            data: {
              title: data.title,
              image_url: data.image_url,
              reward: Number(data.reward) || 1000,
              active: data.active ?? true,
            },
          }), 8000);
        return {
          id: img.id,
          title: img.title,
          image_url: img.image_url,
          reward: img.reward,
          active: img.active,
          created_at: img.created_at.toISOString(),
        };
      } catch (err) {
        handlePrismaError(err, 'createImage');
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
        const updated = await withPrismaTimeout(
          prisma.image.update({
            where: { id },
            data: {
              ...(data.title !== undefined && { title: data.title }),
              ...(data.image_url !== undefined && { image_url: data.image_url }),
              ...(data.reward !== undefined && { reward: Number(data.reward) }),
              ...(data.active !== undefined && { active: data.active }),
            },
          }), 8000);
        return {
          id: updated.id,
          title: updated.title,
          image_url: updated.image_url,
          reward: updated.reward,
          active: updated.active,
          created_at: updated.created_at.toISOString(),
        };
      } catch (err) {
        handlePrismaError(err, 'updateImage');
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
        await withPrismaTimeout(prisma.imageLike.deleteMany({ where: { image_id: id } }), 8000);
        await withPrismaTimeout(prisma.image.deleteMany({ where: { id } }), 8000);
      } catch (err) {
        handlePrismaError(err, 'deleteImage');
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

          const existing = await withPrismaTimeout(
            prisma.imageLike.findUnique({
              where: {
                user_id_image_id: { user_id: userId, image_id: imageId },
              },
            }), 8000);
          if (existing) {
            throw new Error('Wamaze gukunda iyi foto! (Already liked this image)');
          }

          await withPrismaTimeout(
            prisma.imageLike.create({
              data: {
                user_id: userId,
                image_id: imageId,
              },
            }), 8000);

          const rewardAmount = dbImage.reward || 1000;
          const wallet = await withPrismaTimeout(
            prisma.wallet.upsert({
              where: { user_id: userId },
              create: { user_id: userId, balance: 15000.0 + rewardAmount, currency: 'RWF' },
              update: { balance: { increment: rewardAmount } },
            }), 8000);

          await withPrismaTimeout(
            prisma.notification.create({
              data: {
                user_id: userId,
                title: `Wakoreye ${rewardAmount.toLocaleString()}!`,
                message: `Urakoze gukunda: "${dbImage.title}". Agashimwe k'amafaranga ${rewardAmount.toLocaleString()} kagiriwe mu gapuri kawe.`,
              },
            }), 8000).catch((e) => console.warn('[Prisma] notification warning:', e?.message));

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
        handlePrismaError(err, 'likeImage');
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
      title: `Wakoreye ${rewardAmount.toLocaleString()}!`,
      message: `Urakoze gukunda: "${image.title}". Agashimwe k'amafaranga ${rewardAmount.toLocaleString()} kagiriwe mu gapuri kawe.`,
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
            throw new Error('Ingano ya muke yo kwaka ni 5,000 (Minimum withdrawal is 5,000).');
          }

          const wallet = await this.getWalletByUserId(userId);
          if (wallet.balance < amount) {
            throw new Error('Nta mafaranga ahagije ari mu gapuri kawe (Insufficient wallet balance).');
          }

          // Deduct pending balance from wallet
          await withPrismaTimeout(
            prisma.wallet.update({
              where: { user_id: userId },
              data: { balance: { decrement: amount } },
            }), 8000);

          const request = await withPrismaTimeout(
            prisma.withdrawRequest.create({
              data: {
                user_id: userId,
                amount,
                payment_account: paymentAccount,
                status: 'pending',
              },
            }), 8000);

          await withPrismaTimeout(
            prisma.notification.create({
              data: {
                user_id: userId,
                title: 'Ubusabe bwo kwaka amafaranga bwagize success',
                message: `Ubusabe bwawe bwa ${amount.toLocaleString()} kuri numero ${paymentAccount} bwagize success. Buririndiriye kuremurwa n'ubuyobozi.`,
              },
            }), 8000).catch(() => {});

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
        handlePrismaError(err, 'createWithdrawRequest');
      }
    }

    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.status !== 'approved') throw new Error('Konte yawe igomba kwemerwa n\'ubuyobozi (Account pending approval).');

    const wallet = await this.getWalletByUserId(userId);
    if (amount < 5000) {
      throw new Error('Ingano ya muke yo kwaka ni 5,000 (Minimum withdrawal is 5,000).');
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
      message: `Ubusabe bwawe bwa ${amount.toLocaleString()} kuri numero ${paymentAccount} bwagize success. Buririndiriye kuremurwa n'ubuyobozi.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    this.saveStore();
    return request;
  }

  async getUserWithdrawRequests(userId: string) {
    if (prisma) {
      try {
        const dbRequests = await withPrismaTimeout(
          prisma.withdrawRequest.findMany({
            where: { user_id: userId },
            include: { user: true },
            orderBy: { created_at: 'desc' },
          }), 8000);
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
        handlePrismaError(err, 'getUserWithdrawRequests');
      }
    }
    return this.store.withdraws.filter((w) => w.user_id === userId);
  }

  async getAllWithdrawRequests() {
    if (prisma) {
      try {
        const dbRequests = await withPrismaTimeout(
          prisma.withdrawRequest.findMany({
            include: { user: true },
            orderBy: { created_at: 'desc' },
          }), 8000);
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
        handlePrismaError(err, 'getAllWithdrawRequests');
      }
    }
    return this.store.withdraws;
  }

  async updateWithdrawRequestStatus(id: string, status: WithdrawStatus, adminMessage?: string) {
    if (prisma) {
      try {
        const req = await withPrismaTimeout(prisma.withdrawRequest.findUnique({ where: { id } }), 8000);
        if (!req) throw new Error('Withdrawal request not found');

        const oldStatus = req.status;
        const updated = await withPrismaTimeout(
          prisma.withdrawRequest.update({
            where: { id },
            data: {
              status,
              admin_message: adminMessage,
            },
            include: { user: true },
          }), 8000);

        // Refund if rejected from pending
        if (oldStatus === 'pending' && status === 'rejected') {
          await withPrismaTimeout(
            prisma.wallet.update({
              where: { user_id: req.user_id },
              data: { balance: { increment: req.amount } },
            }), 8000);
        }

        await withPrismaTimeout(
          prisma.notification.create({
            data: {
              user_id: req.user_id,
              title: `Ubusabe bwa ${req.amount.toLocaleString()}: ${status.toUpperCase()}`,
              message: `Ubusabe bwawe bwa ${req.amount.toLocaleString()} bwagize inyifato: ${status}.${
                adminMessage ? ` Ubumenyeshi bw'Admin: "${adminMessage}"` : ''
              }`,
            },
          }), 8000);

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
        handlePrismaError(err, 'updateWithdrawRequestStatus');
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
      title: `Ubusabe bwa ${req.amount.toLocaleString()}: ${status.toUpperCase()}`,
      message: `Ubusabe bwawe bwa ${req.amount.toLocaleString()} bwagize inyifato: ${status}.${
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
        let ps = await withPrismaTimeout(prisma.paymentSettings.findUnique({ where: { id: 'default' } }), 8000);
        if (!ps) {
          ps = await withPrismaTimeout(
            prisma.paymentSettings.create({
              data: {
                id: 'default',
                account_number: '+257 69 00 11 22',
                whatsapp_number: '+257 69 00 11 22',
                ussd_code: '*163#',
                payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga.',
              },
            }), 8000);
        }
        if (ps) {
          return {
            account_number: ps.account_number,
            whatsapp_number: ps.whatsapp_number,
            ussd_code: ps.ussd_code,
            payment_instructions: ps.payment_instructions,
          };
        }
      } catch (err) {
        handlePrismaError(err, 'getPaymentSettings');
      }
    }
    return (this.store && this.store.paymentSettings) || INITIAL_STORE.paymentSettings;
  }

  async updatePaymentSettings(data: Partial<PaymentSettings>) {
    this.store.paymentSettings = { ...this.store.paymentSettings, ...data };
    this.saveStore();

    if (prisma) {
      try {
        const ps = await withPrismaTimeout(
          prisma.paymentSettings.upsert({
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
          }), 8000);
        return {
          account_number: ps.account_number,
          whatsapp_number: ps.whatsapp_number,
          ussd_code: ps.ussd_code,
          payment_instructions: ps.payment_instructions,
        };
      } catch (err) {
        handlePrismaError(err, 'updatePaymentSettings');
      }
    }
    return this.store.paymentSettings;
  }

  // Notifications
  async getUserNotifications(userId: string) {
    if (prisma) {
      try {
        const dbNotifs = await withPrismaTimeout(
          prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
          }), 8000);
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
        handlePrismaError(err, 'getUserNotifications');
      }
    }
    return this.store.notifications.filter((n) => n.user_id === userId);
  }

  async markNotificationsRead(userId: string) {
    if (prisma) {
      try {
        await withPrismaTimeout(
          prisma.notification.updateMany({
            where: { user_id: userId, read: false },
            data: { read: true },
          }), 8000);
      } catch (err) {
        handlePrismaError(err, 'markNotificationsRead');
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
    const { country: resolvedCountry, currency: resolvedCurrency } = this.resolveCurrencyAndCountry(
      data.country,
      data.phone_country_code
    );

    if (prisma) {
      try {
        const updatedUser = await withPrismaTimeout(
          prisma.user.update({
            where: { id: userId },
            data: {
              ...(data.username && { username: data.username }),
              ...(data.phone_number && { phone_number: data.phone_number }),
              ...(data.phone_country_code && { phone_country_code: data.phone_country_code }),
              ...(data.country && { country: data.country }),
              ...(data.language && { language: data.language }),
            },
          }), 8000);

        // Update wallet currency if country changed
        if (data.country || data.phone_country_code) {
          try {
            await withPrismaTimeout(
              prisma.wallet.updateMany({
                where: { user_id: userId },
                data: { currency: resolvedCurrency },
              }), 8000);
          } catch {
            // ignore
          }
        }

        const { password_hash, ...rest } = updatedUser;
        const wallet = await this.getWalletByUserId(userId);
        if (wallet) wallet.currency = resolvedCurrency;

        return {
          ...rest,
          language: rest.language as any,
          status: rest.status as any,
          created_at: rest.created_at.toISOString(),
          updated_at: rest.updated_at.toISOString(),
          wallet,
        };
      } catch (err) {
        handlePrismaError(err, 'updateUserProfile');
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

    // Update wallet currency in local store
    const localWallet = this.store.wallets.find((w) => w.user_id === userId);
    if (localWallet) {
      localWallet.currency = resolvedCurrency;
    }

    this.saveStore();
    const { password_hash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      wallet: localWallet || undefined,
    };
  }

  // General Settings
  async getGeneralSettings(): Promise<GeneralSettings> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        let gs = await withPrismaTimeout(prisma.generalSettings.findUnique({ where: { id: 'default' } }), 8000);
        if (!gs) {
          gs = await withPrismaTimeout(
            prisma.generalSettings.create({
              data: {
                id: 'default',
                registration_bonus: 15000,
                like_reward: 1000,
                min_withdraw_amount: 5000,
                enabled_languages: ['rn', 'rw', 'en', 'fr'],
                maintenance_mode: false,
              },
            }),
            8000
          );
        }
        if (gs) {
          return {
            registration_bonus: gs.registration_bonus,
            like_reward: gs.like_reward,
            min_withdraw_amount: gs.min_withdraw_amount,
            enabled_languages: gs.enabled_languages as any,
            maintenance_mode: gs.maintenance_mode,
          };
        }
      } catch (err) {
        handlePrismaError(err, 'getGeneralSettings');
      }
    }

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

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const gs = await withPrismaTimeout(
          prisma.generalSettings.upsert({
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
          }),
          8000
        );
        return {
          registration_bonus: gs.registration_bonus,
          like_reward: gs.like_reward,
          min_withdraw_amount: gs.min_withdraw_amount,
          enabled_languages: gs.enabled_languages as any,
          maintenance_mode: gs.maintenance_mode,
        };
      } catch (err) {
        handlePrismaError(err, 'updateGeneralSettings');
      }
    }
    return this.store.generalSettings;
  }

  // Admin stats
  async getAdminStats(): Promise<AdminStats> {
    this.refreshStore();
    if (prisma) {
      try {
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
        ] = await withPrismaTimeout(
          Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'pending' } }),
            prisma.user.count({ where: { status: 'approved' } }),
            prisma.image.count(),
            prisma.image.count({ where: { active: true } }),
            prisma.withdrawRequest.count(),
            prisma.withdrawRequest.count({ where: { status: 'pending' } }),
            prisma.withdrawRequest.findMany({ where: { status: 'approved' } }),
            prisma.wallet.aggregate({ _sum: { balance: true } }),
            prisma.user.findMany({ take: 5, orderBy: { created_at: 'desc' } }),
            prisma.withdrawRequest.findMany({ take: 5, orderBy: { created_at: 'desc' }, include: { user: true } }),
          ]),
          8000
        );

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
      } catch (err) {
        handlePrismaError(err, 'getAdminStats');
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

export const db = new LocalDatabase();
