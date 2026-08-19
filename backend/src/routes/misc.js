// Cash, Favorites, Settings, Audit routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  CashSessionCreateSchema,
  CashMovementCreateSchema,
  FoodFavoriteCreateSchema,
  CustomDishCreateSchema,
  SettingsUpdateSchema,
  AuditListQuerySchema,
  UserUpdateSchema,
  UserRoleSchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// ─── CASH SESSIONS ───

// GET /api/cash/current
router.get('/cash/current', authenticate, async (req, res) => {
  try {
    const result = await query("SELECT * FROM cash_sessions WHERE estado = 'Abierta' ORDER BY created_at DESC LIMIT 1", []);
    res.success(result.rows[0] || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

// POST /api/cash/open
router.post('/cash/open', authenticate, authorize('admin', 'nutricionista'), validateZod(CashSessionCreateSchema), async (req, res) => {
  try {
    await query("UPDATE cash_sessions SET estado = 'Cerrada' WHERE estado = 'Abierta'", []);
    const result = await query(
      'INSERT INTO cash_sessions (saldo_inicial, created_by) VALUES ($1, $2) RETURNING *',
      [req.body.saldo_inicial, req.user.id]
    );
    res.created(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

// POST /api/cash/movement
router.post('/cash/movement', authenticate, validateZod(CashMovementCreateSchema), async (req, res) => {
  try {
    const session = await query("SELECT * FROM cash_sessions WHERE estado = 'Abierta' LIMIT 1", []);
    if (!session.rows.length) return res.error(400, 'No hay sesión abierta');

    const s = session.rows[0];
    const movimientos = s.movimientos || [];
    movimientos.push({
      tipo: req.body.tipo,
      importe: parseFloat(req.body.importe),
      descripcion: req.body.descripcion || '',
      metodo: req.body.metodo || 'Efectivo',
      fecha: req.body.fecha || new Date().toISOString()
    });

    const result = await query('UPDATE cash_sessions SET movimientos = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(movimientos), s.id]);
    res.success(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

// POST /api/cash/close
router.post('/cash/close', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query("UPDATE cash_sessions SET estado = 'Cerrada' WHERE estado = 'Abierta' RETURNING *", []);
    res.success(result.rows[0] || null);
  } catch (err) { res.error(500, 'Error interno'); }
});

// GET /api/cash/history
router.get('/cash/history', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM cash_sessions ORDER BY created_at DESC LIMIT 50', []);
    res.success(result.rows);
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── FOOD FAVORITES ───

router.get('/foods/favorites', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM food_favorites WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.success(result.rows);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/foods/favorites', authenticate, validateZod(FoodFavoriteCreateSchema), async (req, res) => {
  try {
    const { food_data, source } = req.body;
    const result = await query(
      `INSERT INTO food_favorites (user_id, food_data, source)
       VALUES ($1,$2,$3) ON CONFLICT (user_id, source, (food_data->>'n')) DO NOTHING RETURNING *`,
      [req.user.id, JSON.stringify(food_data), source || 'BEDCA']
    );
    res.created(result.rows[0] || { ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/foods/favorites/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    await query('DELETE FROM food_favorites WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── CUSTOM DISHES ───

router.get('/foods/custom-dishes', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM custom_dishes WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.success(result.rows);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/foods/custom-dishes', authenticate, validateZod(CustomDishCreateSchema), async (req, res) => {
  try {
    const { nombre, raciones, ingredientes, kcal, prot, grasas, hc, fibra } = req.body;
    const result = await query(
      `INSERT INTO custom_dishes (user_id, nombre, raciones, ingredientes, kcal, prot, grasas, hc, fibra)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, sanitize(nombre), raciones || 1, JSON.stringify(ingredientes || []), kcal, prot, grasas, hc, fibra]
    );
    res.created(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/foods/custom-dishes/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    await query('DELETE FROM custom_dishes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── SETTINGS ───

router.get('/settings', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.error(404, 'Usuario no encontrado');
    const u = result.rows[0];
    res.success({
      name: u.name, email: u.email, role: u.role, initials: u.initials,
      dni: u.dni, telefono: u.telefono, titulacion: u.titulacion,
      matricula: u.matricula, pais: u.pais
    });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/settings', authenticate, validateZod(SettingsUpdateSchema), async (req, res) => {
  try {
    const updates = [], values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) { updates.push(`${key} = $${idx++}`); values.push(value); }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.user.id);
    const result = await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING name, email, role, dni, telefono, titulacion, matricula, pais`, values);
    res.success(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── AUDIT LOG ───

router.get('/audit', authenticate, authorize('admin'), validateZodQuery(AuditListQuerySchema), async (req, res) => {
  try {
    const { user_id, entidad, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    let idx = 1;

    if (user_id) { sql += ` AND user_id = $${idx++}`; params.push(user_id); }
    if (entidad) { sql += ` AND entidad ILIKE $${idx++}`; params.push(`%${entidad}%`); }
    if (fecha_desde) { sql += ` AND created_at >= $${idx++}`; params.push(fecha_desde); }
    if (fecha_hasta) { sql += ` AND created_at <= $${idx++}`; params.push(fecha_hasta); }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    res.paginated(result.rows, result.rows.length, parseInt(page), parseInt(limit));
  } catch (err) { res.error(500, 'Error interno'); }
});

// ─── USER MANAGEMENT (admin) ───

router.get('/auth/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, initials, active, created_at, trial_expires FROM users ORDER BY name');
    res.success(result.rows);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/auth/users/:id', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(UserUpdateSchema), async (req, res) => {
  try {
    const updates = [], values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) { updates.push(`${key} = $${idx++}`); values.push(value); }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role, active`, values);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.put('/auth/users/:id/deactivate', authenticate, authorize('admin'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('UPDATE users SET active = false WHERE id = $1 RETURNING id, name, active', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success(result.rows[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

module.exports = router;
