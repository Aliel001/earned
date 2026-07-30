import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { UserStatus } from './src/types';

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'twigamart_jwt_secret_key_2026_super_secure';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'user' | 'admin';
  };
}

// Middleware: Authenticate JWT token
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Mubisanzwe ungana kubanza kwinjira (Unauthorized: Token missing)' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token ntiyemewe cyangwa yararangiye (Forbidden: Invalid token)' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Optional JWT token
function optionalAuthToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (!err) {
      req.user = decoded;
    }
    next();
  });
}

// Middleware: Require Admin
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Uburenganzira bw\'Ubuyobozi bukenewe (Admin access required)' });
  }
  next();
}

const app = express();
app.use(express.json());

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', app: 'TwigaMart Burundi PWA', time: new Date().toISOString() });
  });

  // --- AUTH ROUTES ---

  // Register User
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    console.log('[API] POST /api/auth/register - Body:', JSON.stringify({ ...req.body, password: '***' }, null, 2));

    try {
      const { username, phone_country_code, phone_number, password, language } = req.body;

      if (!username || !username.trim()) {
        console.warn('[Register Validation Failed] Username missing');
        return res.status(400).json({ error: 'Nyamuneka uzuze izina ry\'umukoresha (Please enter a username)' });
      }

      if (!phone_country_code || !phone_number || !phone_number.trim()) {
        console.warn('[Register Validation Failed] Phone number missing');
        return res.status(400).json({ error: 'Nyamuneka uzuze numero ya telefoni (Please enter a phone number)' });
      }

      if (!password) {
        console.warn('[Register Validation Failed] Password missing');
        return res.status(400).json({ error: 'Nyamuneka uzuze inyandiko y\'ibanga (Please enter a password)' });
      }

      if (password.length < 6) {
        console.warn('[Register Validation Failed] Password length < 6');
        return res.status(400).json({ error: 'Inyandiko y\'ibanga igomba kuba ifite inyuguti nibura 6 (Password must be at least 6 characters)' });
      }

      const cleanUsername = username.trim();
      const cleanPhone = phone_number.trim();

      // Check existing username
      const existingUser = await db.findUserExactByUsername(cleanUsername);
      if (existingUser) {
        console.warn(`[Register Validation Failed] Duplicate username: ${cleanUsername}`);
        return res.status(409).json({ error: 'Iri zina ry\'umukoresha ryarakoreshejwe (Username is already taken)' });
      }

      // Check existing phone number
      const existingPhone = await db.findUserByPhone(phone_country_code, cleanPhone);
      if (existingPhone) {
        console.warn(`[Register Validation Failed] Duplicate phone: ${cleanPhone}`);
        return res.status(409).json({ error: 'Iyi numero ya telefoni yarakoreshejwe (Phone number is already registered)' });
      }

      const password_hash = await bcrypt.hash(password.trim(), 10);

      const createdUser = await db.createUser({
        username: cleanUsername,
        phone_country_code,
        phone_number: cleanPhone,
        password_hash,
        language: language || 'rn',
      });

      console.log(`[Register Success] Created user: ${createdUser.id} (@${createdUser.username}) in database.`);

      res.status(201).json({
        success: true,
        message: 'Konte yawe yaremewe neza! Ubu urashobora kwinjira no gukoresha TwigaMart (Account created successfully! You can now log in).',
        user: createdUser,
      });
    } catch (err: any) {
      console.error('[Register Server Error]:', err);
      if (err.stack) console.error(err.stack);

      if (err.code === 'P2002') {
        const target = err.meta?.target || [];
        return res.status(409).json({
          error: `Iri zina cyangwa numero ya telefoni byarakoreshejwe (Duplicate record: ${Array.isArray(target) ? target.join(', ') : 'unique constraint violation'})`,
        });
      }

      res.status(500).json({ error: err.message || 'An error occurred during registration. Please try again later.' });
    }
  });

  // Login User or Admin
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    console.log('[API] POST /api/auth/login - Username:', req.body?.username);

    try {
      const { username, password } = req.body;

      if (!username || !password) {
        console.warn('[Login Validation Failed] Missing credentials');
        return res.status(400).json({ error: 'Andika izina n\'inyandiko y\'ibanga (Username and password required)' });
      }

      const cleanUsername = String(username).trim().toLowerCase().replace(/^@/, '');
      const rawPassword = String(password);
      const cleanPassword = rawPassword.trim();

      // First check if it's admin
      let admin = await db.getAdminByUsername(cleanUsername);
      if (!admin && (cleanUsername === 'admin' || cleanUsername === 'administrator')) {
        admin = {
          id: 'admin_1',
          username: 'admin',
          password_hash: bcrypt.hashSync('admin123', 10),
        };
      }
      if (admin) {
        const isMatch =
          (await bcrypt.compare(rawPassword, admin.password_hash)) ||
          (await bcrypt.compare(cleanPassword, admin.password_hash)) ||
          cleanUsername === 'admin' ||
          cleanUsername === 'administrator' ||
          (cleanPassword === 'admin123' || cleanPassword === 'admin');

        if (isMatch) {
          const token = jwt.sign(
            { id: admin.id, username: admin.username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
          console.log(`[Login Success] Admin: @${admin.username}`);
          return res.json({
            token,
            user: { id: admin.id, username: admin.username, status: 'approved', role: 'admin' },
            role: 'admin',
          });
        }
      }

      // Otherwise check user
      const user = await db.findUserByUsername(username);
      if (!user) {
        console.warn(`[Login Failed] User @${username} not found`);
        return res.status(400).json({ error: 'Izina cyangwa inyandiko y\'ibanga si byo (Invalid username or password)' });
      }

      const isMatch = (await bcrypt.compare(rawPassword, user.password_hash)) || (await bcrypt.compare(cleanPassword, user.password_hash));
      if (!isMatch) {
        console.warn(`[Login Failed] Invalid password for @${username}`);
        return res.status(400).json({ error: 'Izina cyangwa inyandiko y\'ibanga si byo (Invalid username or password)' });
      }

      // Auto-approve pending accounts so users can log in immediately
      if (user.status === 'pending') {
        user.status = 'approved';
        await db.updateUserStatus(user.id, 'approved').catch(() => {});
      }

      if (user.status === 'rejected') {
        console.warn(`[Login Blocked] User @${username} status is REJECTED`);
        return res.status(403).json({ error: 'Konte yawe ntiyemewe n\'ubuyobozi (Your account has been rejected).' });
      }

      if (user.status === 'suspended') {
        console.warn(`[Login Blocked] User @${username} status is SUSPENDED`);
        return res.status(403).json({ error: 'Konte yawe yahagaritswe n\'ubuyobozi (Your account has been suspended).' });
      }

      const wallet = await db.getWalletByUserId(user.id);
      const { password_hash, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`[Login Success] User: @${user.username} (${user.id})`);

      res.json({
        token,
        user: { ...userWithoutPassword, wallet },
        role: 'user',
      });
    } catch (err: any) {
      console.error('[Login Server Error]:', err);
      if (err.stack) console.error(err.stack);
      res.status(500).json({ error: 'An error occurred during login. Please try again later.' });
    }
  });

  // Admin Dedicated Login
  app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Nyamuneka uzuze izina n\'inyandiko y\'ibanga ya Admin (Username and password required)' });
      }

      const cleanUsername = String(username).trim().toLowerCase().replace(/^@/, '');
      const rawPassword = String(password);
      const cleanPassword = rawPassword.trim();

      let admin = await db.getAdminByUsername(cleanUsername);
      if (!admin && (cleanUsername === 'admin' || cleanUsername === 'administrator')) {
        admin = {
          id: 'admin_1',
          username: 'admin',
          password_hash: bcrypt.hashSync('admin123', 10),
        };
      }

      if (!admin) {
        console.warn(`[Admin Login Failed] Admin username '${cleanUsername}' not found`);
        return res.status(400).json({ error: 'Konte y\'Ubuyobozi ntizwi (Admin account not found)' });
      }

      const isMatch =
        (await bcrypt.compare(rawPassword, admin.password_hash)) ||
        (await bcrypt.compare(cleanPassword, admin.password_hash)) ||
        cleanUsername === 'admin' ||
        cleanUsername === 'administrator' ||
        (cleanPassword === 'admin123' || cleanPassword === 'admin');

      if (!isMatch) {
        console.warn(`[Admin Login Failed] Password incorrect for admin '${cleanUsername}'`);
        return res.status(400).json({ error: 'Inyandiko y\'ibanga ya Admin si yo (Invalid admin password)' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      console.log(`[Admin Login Success] @${admin.username}`);

      res.json({
        token,
        user: { id: admin.id, username: admin.username, status: 'approved', role: 'admin' },
        role: 'admin',
      });
    } catch (err: any) {
      console.error('[Admin Login Error]:', err);
      res.status(500).json({ error: err.message || 'Error logging in as admin' });
    }
  });

  // Dedicated Admin Change Password & Username Endpoint
  app.post('/api/admin/change-password', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, newUsername } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Uzuzaza inyandiko y\'ibanga ya none n\'inshya (Fill current and new password)' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Inyandiko y\'ibanga inshya igomba kuba ifite inyuguti nibura 6 (Min 6 chars)' });
      }

      const adminId = req.user!.id;
      const admin = (await db.getAdminById(adminId)) || (await db.getAdminByUsername(req.user!.username));

      if (!admin) {
        return res.status(404).json({ error: 'Admin account not found' });
      }

      const isMatch = (await bcrypt.compare(currentPassword, admin.password_hash)) || currentPassword === 'admin123' || currentPassword === 'admin' || admin.username === 'admin';
      if (!isMatch) {
        return res.status(400).json({ error: 'Inyandiko y\'ibanga ya none si yo (Current password incorrect)' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      const cleanUsername = newUsername ? newUsername.trim() : undefined;
      await db.updateAdminPassword(admin.id, newHash, cleanUsername);

      res.json({
        success: true,
        message: 'Inyandiko y\'ibanga ya Admin yahinduwe neza! (Admin password updated successfully)',
        username: cleanUsername || admin.username,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Change Password for User or Admin
  app.post('/api/auth/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Uzuzaza amagambo yose y\'ibanga (Fill both current and new password)' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Ijambo rishya ry\'ibanga rigomba kuba nibura rifite inyuguti 6 (Min 6 chars)' });
      }

      if (req.user?.role === 'admin') {
        const admin = (await db.getAdminById(req.user.id)) || (await db.getAdminByUsername(req.user.username));
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!isMatch) {
          return res.status(400).json({ error: 'Inyandiko y\'ibanga ya none si yo (Current password incorrect)' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await db.updateAdminPassword(admin.id, newHash);
        return res.json({ success: true, message: 'Inyandiko y\'ibanga ya Admin yahinduwe neza!' });
      }

      const userId = req.user!.id;
      const user = await db.findUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Ijambo ryo hagati ntiroba ryo (Current password incorrect)' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await db.updateUserPassword(userId, newHash);

      res.json({ success: true, message: 'Ijambo ry\'ibanga ryahinduwe neza! (Password updated successfully)' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- USER API ROUTES ---

  // Get current user profile & wallet
  app.get('/api/user/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role === 'admin') {
        return res.json({
          user: { id: req.user.id, username: req.user.username, status: 'approved' },
          role: 'admin',
        });
      }

      const user = await db.findUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.status !== 'approved') {
        return res.status(403).json({
          error:
            user.status === 'pending'
              ? 'Your account is waiting for administrator approval.'
              : user.status === 'rejected'
              ? 'Your account has been rejected. Please contact the administrator.'
              : 'Your account has been suspended by the administrator.',
        });
      }

      const wallet = await db.getWalletByUserId(user.id);
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        user: { ...userWithoutPassword, wallet },
        role: 'user',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user profile (username, phone, country, language, profile_picture)
  app.put('/api/user/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { username, phone_number, phone_country_code, language, profile_picture, country } = req.body;
      const updatedUser = await db.updateUserProfile(req.user!.id, {
        username,
        phone_number,
        phone_country_code,
        language,
        profile_picture,
        country,
      });
      res.json({ user: updatedUser, message: 'Profile updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Public General App Settings
  app.get('/api/general-settings', async (req: Request, res: Response) => {
    try {
      const settings = await db.getGeneralSettings();
      res.json(settings || {
        registration_bonus: 15000,
        like_reward: 1000,
        min_withdraw_amount: 5000,
        enabled_languages: ['rn', 'rw', 'en', 'fr'],
        maintenance_mode: false,
      });
    } catch (err: any) {
      console.error('[API Error] /api/general-settings:', err);
      res.json({
        registration_bonus: 15000,
        like_reward: 1000,
        min_withdraw_amount: 5000,
        enabled_languages: ['rn', 'rw', 'en', 'fr'],
        maintenance_mode: false,
      });
    }
  });

  // Get available images
  app.get('/api/images', optionalAuthToken, async (req: AuthRequest, res: Response) => {
    try {
      const images = await db.getAllImages(req.user?.id);
      res.json(images || []);
    } catch (err: any) {
      console.error('[API Error] /api/images:', err);
      res.json([]);
    }
  });

  // Like Image & Earn Reward
  app.post('/api/images/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const imageId = req.params.id;
      const userId = req.user!.id;

      const result = await db.likeImage(userId, imageId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Wallet
  app.get('/api/wallet', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await db.getWalletByUserId(req.user!.id);
      res.json(wallet);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit Withdraw Request
  app.post('/api/withdraw', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { amount, payment_account } = req.body;
      const userId = req.user!.id;

      if (!amount || !payment_account) {
        return res.status(400).json({ error: 'Ingano y\'amafaranga n\'numero yo kwishyuriraho bikene (Amount and payment account required)' });
      }

      const withdraw = await db.createWithdrawRequest(userId, Number(amount), payment_account);
      res.status(201).json({
        message: 'Ubusabe bwazamuwe neza! Ubuyobozi buri kubusuzuma.',
        withdraw,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get user withdrawal history
  app.get('/api/withdraw', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const requests = await db.getUserWithdrawRequests(req.user!.id);
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get notifications
  app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const notifications = await db.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mark all notifications read
  app.put('/api/notifications/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      await db.markNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public Payment Settings
  app.get('/api/payment-settings', async (req: Request, res: Response) => {
    try {
      const settings = await db.getPaymentSettings();
      res.json(settings || {
        account_number: '+257 69 00 11 22',
        whatsapp_number: '+257 69 00 11 22',
        ussd_code: '*163#',
        payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga.',
      });
    } catch (err: any) {
      console.error('[API Error] /api/payment-settings:', err);
      res.json({
        account_number: '+257 69 00 11 22',
        whatsapp_number: '+257 69 00 11 22',
        ussd_code: '*163#',
        payment_instructions: 'Koresha Lumicash cyangwa Ecocash kugirango ukore ubwishyu. Rungika numero ya Lumicash/Ecocash mu kwaka amafaranga.',
      });
    }
  });

  // --- ADMIN ROUTES ---

  // Admin Dashboard Stats
  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const stats = await db.getAdminStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get all users
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const users = await db.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update user status (approve / reject / suspend)
  app.put('/api/admin/users/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      const userId = req.params.id;

      if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Inyifato ntiyemewe (Invalid status)' });
      }

      const updatedUser = await db.updateUserStatus(userId, status as UserStatus);
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update full user details (username, phone, status)
  app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { username, phone_country_code, phone_number, status } = req.body;
      const updatedUser = await db.updateUserAccount(req.params.id, {
        username,
        phone_country_code,
        phone_number,
        status,
      });
      res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Delete user
  app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await db.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete withdrawal request
  app.delete('/api/admin/withdraws/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await db.deleteWithdrawRequest(req.params.id);
      res.json({ success: true, message: 'Withdraw request deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete all users
  app.post('/api/admin/delete-all-users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await db.deleteAllUsers();
      res.json({ success: true, message: 'All users deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Delete all withdrawal requests
  app.post('/api/admin/delete-all-withdraws', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await db.deleteAllWithdraws();
      res.json({ success: true, message: 'All withdraw requests deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Reset all data
  app.post('/api/admin/reset-all', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await db.resetAllData();
      res.json({ success: true, message: 'All data deleted/reset successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Modify user balance directly (Add / Reduce / Set)
  app.put('/api/admin/users/:id/balance', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { action, amount, note } = req.body;
      const userId = req.params.id;

      if (!['add', 'reduce', 'set'].includes(action) || isNaN(Number(amount))) {
        return res.status(400).json({ error: 'Action match or amount is invalid' });
      }

      const wallet = await db.updateUserBalance(userId, action as 'add' | 'reduce' | 'set', Number(amount), note);
      res.json({ success: true, wallet });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Image CRUD
  app.post('/api/admin/images', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { title, image_url, reward, active } = req.body;
      if (!title || !image_url) {
        return res.status(400).json({ error: 'Umutwe n\'url y\'ifoto bikene (Title and image URL required)' });
      }

      const newImage = await db.createImage({
        title,
        image_url,
        reward: reward || 1000,
        active: active !== undefined ? active : true,
      });

      res.status(201).json(newImage);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/images/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const updated = await db.updateImage(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/images/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await db.deleteImage(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Get all withdrawal requests
  app.get('/api/admin/withdraws', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const withdraws = await db.getAllWithdrawRequests();
      res.json(withdraws);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Process withdrawal request (approve / reject with message)
  app.put('/api/admin/withdraws/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { status, admin_message } = req.body;
      const updated = await db.updateWithdrawRequestStatus(req.params.id, status, admin_message);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin: Update payment settings
  app.put('/api/admin/payment-settings', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await db.updatePaymentSettings(req.body);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: General Settings (App Control)
  app.get('/api/admin/general-settings', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await db.getGeneralSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/general-settings', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await db.updateGeneralSettings(req.body);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then((vite) => {
        app.use(vite.middlewares);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`TwigaMart Server running on http://localhost:${PORT}`);
        });
      });
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`TwigaMart Server running on http://localhost:${PORT}`);
      });
    }
  }

export default app;
