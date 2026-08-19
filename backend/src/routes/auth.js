// Authentication routes: login, register, refresh, change password with Zod validation
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const {
  LoginRequestSchema,
  RegisterRequestSchema,
  ChangePasswordRequestSchema,
  RefreshRequestSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' };

// POST /api/auth/login
router.post('/login', validateZod(LoginRequestSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1 AND active = true', [email]);
    if (!result.rows.length) return res.error(401, 'Credenciales incorrectas');

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logAudit(user.id, 'LOGIN_FAILED', 'Session', null, req);
      return res.error(401, 'Credenciales incorrectas');
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

    await query('INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING', [refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);

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

    const blacklisted = await query('SELECT 1 FROM token_blacklist WHERE token = $1', [refreshToken]);
    if (blacklisted.rows.length) return res.error(401, 'Refresh token revocado');

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await query('SELECT id, name, email, role, initials FROM users WHERE id = $1 AND active = true', [decoded.id]);
    if (!result.rows.length) return res.error(401, 'Usuario no encontrado');

    const user = result.rows[0];
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, initials: user.initials };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

    await query('INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2)', [refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);

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
      await query('INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING', [refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
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
    if (req.user.role !== 'admin') return res.error(403, 'Solo admin puede registrar usuarios');

    const { name, email, password, role } = req.body;
    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.error(409, 'Email ya registrado');

    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    const result = await query(
      'INSERT INTO users (name, email, password_hash, role, initials) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, initials',
      [name, email, hash, role, initials]
    );

    await logAudit(req.user.id, 'CREATE', 'User', name, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('Register error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, validateZod(ChangePasswordRequestSchema), async (req, res) => {
  try {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.error(404, 'Usuario no encontrado');

    const valid = await bcrypt.compare(req.body.currentPassword, result.rows[0].password_hash);
    if (!valid) return res.error(401, 'Contraseña actual incorrecta');

    const hash = await bcrypt.hash(req.body.newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    await logAudit(req.user.id, 'PASSWORD_CHANGE', 'User', req.user.name, req);
    res.success({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, initials, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
