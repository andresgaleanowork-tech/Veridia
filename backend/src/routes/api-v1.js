const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod, validateZodQuery } = require('../middleware/zodValidate');
const { ApiKeyCreateSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const crypto = require('crypto');

const router = express.Router();

// Middleware para API key
function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'API key requerida' });
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  // En producción, buscar en DB
  next();
}

router.get('/patients', apiKeyAuth, validateZodQuery(z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(50) })), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await query('SELECT id, nombre, apellidos, email, telefono, fecha_nacimiento FROM patients WHERE activo = true LIMIT $1 OFFSET $2', [limit, (page - 1) * limit]);
    const count = await query('SELECT COUNT(*) FROM patients WHERE activo = true');
    res.paginated(result.rows, parseInt(count.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/patients/:id', apiKeyAuth, async (req, res) => {
  try {
    const result = await query('SELECT id, nombre, apellidos, email, telefono, fecha_nacimiento FROM patients WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Paciente no encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/appointments', authenticate, validateZod(require('../schemas').AppointmentCreateSchema), async (req, res) => {
  try {
    const { paciente_id, fecha, hora, tipo, asunto, estado, pago, precio, duracion, nota, color } = req.body;
    const result = await query(
      `INSERT INTO appointments (paciente_id, fecha, hora, tipo, asunto, estado, pago, precio, duracion, nota, color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [paciente_id, fecha, hora, tipo, asunto, estado || 'Pendiente', pago, precio, duracion, nota, color]
    );
    await logAudit(req.user.id, 'CREATE', 'Appointment', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
