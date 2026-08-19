// Recipes CRUD routes with Zod validation
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  RecipeCreateSchema,
  RecipeUpdateSchema,
  RecipeListQuerySchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// GET /api/recipes
router.get('/', authenticate, validateZodQuery(RecipeListQuerySchema), async (req, res) => {
  try {
    const { search, categoria, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM recipes WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) { sql += ` AND nombre ILIKE $${idx++}`; params.push(`%${search}%`); }
    if (categoria) { sql += ` AND categoria = $${idx++}`; params.push(categoria); }

    sql += ' ORDER BY nombre';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const count = await query('SELECT COUNT(*) FROM recipes', []);
    res.paginated(result.rows, parseInt(count.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// GET /api/recipes/:id
router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('SELECT * FROM recipes WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Receta no encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// POST /api/recipes
router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(RecipeCreateSchema), async (req, res) => {
  try {
    const { nombre, categoria, raciones, kcal, prot, grasas, hc, fibra, ingredientes, pasos, source, mealdb_id } = req.body;
    const result = await query(
      `INSERT INTO recipes (nombre, categoria, raciones, kcal, prot, grasas, hc, fibra, ingredientes, pasos, source, mealdb_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [sanitize(nombre), categoria, raciones || 1, kcal, prot, grasas, hc, fibra, ingredientes || [], pasos || [], source || 'local', mealdb_id, req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'Recipe', nombre, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST recipe error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/recipes/:id
router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(RecipeUpdateSchema), async (req, res) => {
  try {
    const fields = ['nombre', 'categoria', 'raciones', 'kcal', 'prot', 'grasas', 'hc', 'fibra', 'ingredientes', 'pasos', 'source', 'mealdb_id'];
    const updates = [], values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(Array.isArray(req.body[f]) ? req.body[f] : req.body[f]);
      }
    }
    if (!updates.length) return res.error(400, 'Sin campos para actualizar');
    values.push(req.params.id);
    const result = await query(`UPDATE recipes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

// DELETE /api/recipes/:id
router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const result = await query('DELETE FROM recipes WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'No encontrada');
    await logAudit(req.user.id, 'DELETE', 'Recipe', 'Receta eliminada', req);
    res.success({ ok: true });
  } catch (err) {
    res.error(500, 'Error interno');
  }
});

module.exports = router;
