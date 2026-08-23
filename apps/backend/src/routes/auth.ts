// Authentication routes — Drizzle ORM
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';

import { db } from '../config/db.js';
import { users, tokenBlacklist } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  ChangePasswordRequestSchema,
} from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: 'strict' as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' };

// POST /api/auth/login
router.post('/login', validateZod(LoginRequestSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.select().from(users).where(and(eq(users.email, email), eq(users.active, true)));
    if (!result.length) return res.error(401, 'Credenciales incorrectas');

    const user = result[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAudit(user.id, 'LOGIN_FAILED', 'Session', null, req);
      return res.error(401, 'Credenciales incorrectas');
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jwt.SignOptions.expiresIn does not accept plain string in @types/jsonwebtoken
    const signOpts = { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as any;
    const token = jwt.sign(payload, process.env.JWT_SECRET!, signOpts);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jwt.SignOptions.expiresIn does not accept plain string in @types/jsonwebtoken
    const refreshOpts = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any;
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, refreshOpts);

    await logAudit(user.id, 'LOGIN', 'Session', null, req);
    res.cookie('__Host-refresh', refreshToken, COOKIE_OPTS);
    res.success({ token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    res.error(500, 'Error interno');
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.['__Host-refresh'] || req.body?.refreshToken;
    if (!refreshToken) return res.error(401, 'Refresh token requerido');

    const blacklisted = await db.select().from(tokenBlacklist).where(eq(tokenBlacklist.token, refreshToken));
    if (blacklisted.length) return res.error(401, 'Refresh token revocado');

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const result = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, initials: users.initials,
    }).from(users).where(and(eq(users.id, decoded.id), eq(users.active, true)));
    if (!result.length) return res.error(401, 'Usuario no encontrado');

    const user = result[0];
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jwt.SignOptions.expiresIn does not accept plain string in @types/jsonwebtoken
    const signOpts = { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as any;
    const token = jwt.sign(payload, process.env.JWT_SECRET!, signOpts);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jwt.SignOptions.expiresIn does not accept plain string in @types/jsonwebtoken
    const refreshOpts = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as any;
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, refreshOpts);

    await db.insert(tokenBlacklist).values({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie('__Host-refresh', newRefreshToken, COOKIE_OPTS);
    res.success({ token, user: payload });
  } catch (err) {
    res.error(401, 'Refresh token inválido');
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.['__Host-refresh'];
    if (refreshToken) {
      await db.insert(tokenBlacklist).values({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).onConflictDoNothing();
    }
    res.clearCookie('__Host-refresh', { path: '/', httpOnly: true, secure: true, sameSite: 'strict' });
    res.success({ message: 'Sesión cerrada' });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/auth/register (admin only)
router.post('/register', authenticate, validateZod(RegisterRequestSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    if (user.role !== 'admin') return res.error(403, 'Solo admin puede registrar usuarios');

    const { name, email, password, role } = req.body;
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (exists.length) return res.error(409, 'Email ya registrado');

    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

    const result = await db.insert(users).values({
      name, email, passwordHash: hash, role, initials,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, initials: users.initials });

    await logAudit(user.id, 'CREATE', 'User', name, req);
    res.created(result[0]);
  } catch (err) {
    console.error('Register error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, validateZod(ChangePasswordRequestSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id));
    if (!result.length) return res.error(404, 'Usuario no encontrado');

    const valid = await bcrypt.compare(req.body.currentPassword, result[0].passwordHash);
    if (!valid) return res.error(401, 'Contraseña actual incorrecta');

    const hash = await bcrypt.hash(req.body.newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, user.id));

    await logAudit(user.id, 'PASSWORD_CHANGE', 'User', user.name ?? null, req);
    res.success({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const result = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role, initials: users.initials, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, user.id));
    if (!result.length) return res.error(404, 'No encontrado');
    res.success(result[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

export default router;