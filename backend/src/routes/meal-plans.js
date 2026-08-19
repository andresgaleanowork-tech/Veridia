// Meal Plans CRUD routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  MealPlanCreateSchema,
  MealPlanUpdateSchema,
  MealPlanStatusSchema,
  MealPlanListQuerySchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/meal-plans
router.get('/', authenticate, validateZodQuery(MealPlanListQuerySchema), async (req, res) => {
  try {
    const { paciente_id, estado, page = 1, limit = 50 } = req.query;
    let sql = `SELECT mp.*, p.nombre || ' ' || p.apellidos AS paciente_nombre
               FROM meal_plans mp
               LEFT JOIN patients p ON p.id = mp.paciente_id
               WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (paciente_id) { sql += ` AND mp.paciente_id = $${idx++}`; params.push(paciente_id); }
    if (estado) { sql += ` AND mp.estado = $${idx++}`; params.push(estado); }

    sql += ' ORDER BY mp.created_at DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    res.success(result.rows);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/meal-plans/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('SELECT * FROM meal_plans WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Plan no encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/meal-plans
router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(MealPlanCreateSchema), async (req, res) => {
  try {
    const { paciente_id, nombre, kcal_objetivo, prot_g, grasas_g, hc_g, fibra_g, agua_l, formula_usada, factor_actividad, patologia, dias, comidas } = req.body;
    const result = await query(
      `INSERT INTO meal_plans (paciente_id, nombre, kcal_objetivo, prot_g, grasas_g, hc_g, fibra_g, agua_l, formula_usada, factor_actividad, patologia, dias, comidas, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [paciente_id, sanitize(nombre) || 'Plan sin nombre', kcal_objetivo, prot_g, grasas_g, hc_g, fibra_g, agua_l, formula_usada, factor_actividad, patologia, JSON.stringify(dias || []), JSON.stringify(comidas || []), req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'MealPlan', `Plan para ${paciente_id}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST meal plan error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/meal-plans/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(MealPlanUpdateSchema), async (req, res) => {
  try {
    const fields = ['nombre', 'estado', 'kcal_objetivo', 'prot_g', 'grasas_g', 'hc_g', 'fibra_g', 'agua_l', 'dias', 'comidas'];
    const updates = [], values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push((f === 'dias' || f === 'comidas') ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE meal_plans SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// PUT /api/meal-plans/:id/status
router.put('/:id/status', authenticate, validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({ estado: MealPlanStatusSchema })), async (req, res) => {
  try {
    // If activating, deactivate other active plans for same patient
    if (req.body.estado === 'activo') {
      const plan = await query('SELECT paciente_id FROM meal_plans WHERE id = $1', [req.params.id]);
      if (plan.rows.length) {
        await query('UPDATE meal_plans SET estado = \'inactivo\' WHERE paciente_id = $1 AND estado = \'activo\' AND id != $2',
          [plan.rows[0].paciente_id, req.params.id]);
      }
    }
    const result = await query('UPDATE meal_plans SET estado = $1 WHERE id = $2 RETURNING *', [req.body.estado, req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/meal-plans/:id/copy
router.post('/:id/copy', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(z.object({
  paciente_id: UUIDSchema.optional(),
})), async (req, res) => {
  try {
    const original = await query('SELECT * FROM meal_plans WHERE id = $1', [req.params.id]);
    if (!original.rows.length) return res.error(404, 'No encontrado');
    const o = original.rows[0];
    const result = await query(
      `INSERT INTO meal_plans (paciente_id, nombre, kcal_objetivo, prot_g, grasas_g, hc_g, fibra_g, dias, comidas, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.body.paciente_id || o.paciente_id, o.nombre + ' (copia)', o.kcal_objetivo, o.prot_g, o.grasas_g, o.hc_g, o.fibra_g, JSON.stringify(o.dias), JSON.stringify(o.comidas), req.user.id]
    );
    res.created(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/meal-plans/:id
router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('DELETE FROM meal_plans WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrado');
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
