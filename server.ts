import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { UserStatus } from './src/types';

const PORT = 3000;
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

async function startServer() {
  const app = express();

  app.use(express.json());

  // Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', app: 'TwigaMart Burundi PWA', time: new Date().toISOString() });
  });

  // --- AUTH ROUTES ---

  // Register User
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, phone_country_code, phone_number, password, language } = req.body;

      if (!username || !phone_country_code || !phone_number || !password) {
        return res.status(400).json({ error: 'Nyamuneka uzuze imyanya yose ikenewe (Please fill in all required fields)' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Inyandiko y\'ibanga igomba kuba ifite inyuguti nibura 6 (Password must be at least 6 characters)' });
      }

      // Check existing username
      const existingUser = await db.findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Iri zina ry\'umukoresha ryarakoreshejwe (Username is already taken)' });
      }

      // Check existing phone number
      const existingPhone = await db.findUserByPhone(phone_country_code, phone_number);
      if (existingPhone) {
        return res.status(400).json({ error: 'Iyi numero ya telefoni yarakoreshejwe (Phone number is already registered)' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const user = await db.createUser({
        username,
        phone_country_code,
        phone_number,
        password_hash,
        language: language || 'rn',
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        token,
        user,
        role: 'user',
        message: 'Kwirangisha byagenze neza! Bonus ya 15,000 BIF yongewe mu gapuri kawe.',
      });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: err.message || 'Server error during registration' });
    }
  });

  // Login User or Admin
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Andika izina n\'inyandiko y\'ibanga (Username and password required)' });
      }

      // First check if it's admin
      const admin = await db.getAdminByUsername(username);
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (isMatch) {
          const token = jwt.sign(
            { id: admin.id, username: admin.username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '30d' }
          );
          return res.json({
            token,
            user: { id: admin.id, username: admin.username, status: 'approved' },
            role: 'admin',
          });
        }
      }

      // Otherwise check user
      const user = await db.findUserByUsername(username);
      if (!user) {
        return res.status(400).json({ error: 'Izina cyangwa inyandiko y\'ibanga si byo (Invalid credentials)' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Izina cyangwa inyandiko y\'ibanga si byo (Invalid credentials)' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Konte yawe irahagaritswe n\'ubuyobozi (Account suspended by admin)' });
      }

      const wallet = await db.getWalletByUserId(user.id);
      const { password_hash, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: user.id, username: user.username, role: 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: { ...userWithoutPassword, wallet },
        role: 'user',
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message || 'Server error during login' });
    }
  });

  // Admin Quick Login / Dedicated Login
  app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const admin = await db.getAdminByUsername(username || 'admin');

      if (!admin) {
        return res.status(400).json({ error: 'Admin account not found' });
      }

      const isMatch = await bcrypt.compare(password || 'admin123', admin.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid admin credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        user: { id: admin.id, username: admin.username, status: 'approved' },
        role: 'admin',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Change Password
  app.post('/api/auth/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Uzuzaza amagambo yose y\'ibanga (Fill both current and new password)' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Ijambo rishya ry\'ibanga rigomba kuba nibura rifite inyuguti 6 (Min 6 chars)' });
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
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get available images
  app.get('/api/images', optionalAuthToken, async (req: AuthRequest, res: Response) => {
    try {
      const images = await db.getAllImages(req.user?.id);
      res.json(images);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`TwigaMart Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export default startServer();
