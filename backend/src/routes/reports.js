const express = require('express');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodQuery } = require('../middleware/zodValidate');
const { ReportGenerateSchema, ReportQuerySchema } = require('../schemas');

const router = express.Router();

function generateVeridiaHTML(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #0B1120; color: #E2E8F0; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #0891B2, #06B6D4); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 20px; }
    .brand h1 { margin: 0; font-size: 20px; color: #fff; }
    .brand p { margin: 4px 0 0; font-size: 12px; color: #94A3B8; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .card h2 { margin: 0 0 16px; font-size: 16px; color: #0891B2; text-transform: uppercase; letter-spacing: 0.05em; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .row:last-child { border-bottom: none; }
    .label { color: #94A3B8; font-size: 13px; }
    .value { color: #F1F5F9; font-size: 14px; font-weight: 500; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748B; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { color: #0891B2; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">V</div>
      <div class="brand">
        <h1>Veridia HealthTech</h1>
        <p>Informe Clínico-Nutricional • ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </div>
    ${bodyContent}
    <div class="footer">
      Generado automáticamente por Veridia HealthTech v5.2.0 • ${new Date().toISOString()}
    </div>
  </div>
</body>
</html>`;
}

function buildPatientReport(patient, data) {
  const sections = [];

  sections.push(`<div class="card"><h2>Datos del Paciente</h2>
    <div class="row"><span class="label">Nombre</span><span class="value">${patient.nombre} ${patient.apellidos}</span></div>
    <div class="row"><span class="label">DNI</span><span class="value">${patient.dni || '—'}</span></div>
    <div class="row"><span class="label">Fecha de nacimiento</span><span class="value">${patient.fecha_nacimiento || '—'}</span></div>
    <div class="row"><span class="label">Sexo</span><span class="value">${patient.sexo || '—'}</span></div>
    <div class="row"><span class="label">Teléfono</span><span class="value">${patient.telefono || '—'}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${patient.email || '—'}</span></div>
  </div>`);

  if (data.history) {
    sections.push(`<div class="card"><h2>Historia Clínica</h2>
      <div class="row"><span class="label">Antecedentes</span><span class="value">${data.history.antecedentes || '—'}</span></div>
      <div class="row"><span class="label">Alergias</span><span class="value">${data.history.alergias || '—'}</span></div>
      <div class="row"><span class="label">Medicación</span><span class="value">${data.history.medicacion || '—'}</span></div>
      <div class="row"><span class="label">Observaciones</span><span class="value">${data.history.observaciones || '—'}</span></div>
    </div>`);
  }

  if (data.antropometrias?.length) {
    const rows = data.antropometrias.map(a => `<tr>
      <td>${new Date(a.fecha).toLocaleDateString('es-ES')}</td>
      <td>${a.peso || '—'}</td><td>${a.altura || '—'}</td><td>${a.imc || '—'}</td><td>${a.metodo || '—'}</td>
    </tr>`).join('');
    sections.push(`<div class="card"><h2>Antropometría</h2>
      <table><thead><tr><th>Fecha</th><th>Peso (kg)</th><th>Altura (cm)</th><th>IMC</th><th>Método</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div>`);
  }

  if (data.mealPlans?.length) {
    const rows = data.mealPlans.map(p => `<tr>
      <td>${new Date(p.fecha_creacion).toLocaleDateString('es-ES')}</td>
      <td>${p.nombre || '—'}</td><td>${p.kcal_objetivo || '—'}</td><td>${p.estado}</td>
    </tr>`).join('');
    sections.push(`<div class="card"><h2>Planes Alimenticios</h2>
      <table><thead><tr><th>Fecha</th><th>Nombre</th><th>Kcal objetivo</th><th>Estado</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div>`);
  }

  return sections.join('');
}

// POST /api/reports/generate
router.post('/generate', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const { paciente_id, tipo, plantilla = 'default', fecha_inicio, fecha_fin, titulo } = req.body;
    if (!paciente_id || !tipo) return res.error(400, 'paciente_id y tipo son requeridos');

    const patientRes = await query('SELECT * FROM patients WHERE id = $1', [paciente_id]);
    if (!patientRes.rows.length) return res.error(404, 'Paciente no encontrado');

    const patient = patientRes.rows[0];
    let extraData = {};

    if (['paciente_completo', 'clinico', 'nutricional'].includes(tipo)) {
      const [history, antro, plans] = await Promise.all([
        query('SELECT * FROM clinical_histories WHERE paciente_id = $1 ORDER BY version DESC LIMIT 1', [paciente_id]),
        query('SELECT * FROM antropometrias WHERE paciente_id = $1 ORDER BY fecha DESC', [paciente_id]),
        query('SELECT * FROM meal_plans WHERE paciente_id = $1 ORDER BY fecha_creacion DESC', [paciente_id]),
      ]);
      extraData = {
        history: history.rows[0] || null,
        antropometrias: antro.rows,
        mealPlans: plans.rows,
      };
    }

    const bodyContent = buildPatientReport(patient, extraData);
    const fileContent = generateVeridiaHTML(titulo || `Informe ${tipo}`, bodyContent);

    const result = await query(
      `INSERT INTO reports (paciente_id, tipo, plantilla, titulo, file_content, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paciente_id, tipo, plantilla, titulo || `Informe ${tipo}`, fileContent, req.user.id]
    );

    await logAudit(req.user.id, 'CREATE', 'Report', `${tipo} - ${patient.nombre} ${patient.apellidos}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST /reports/generate error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/reports — List reports
router.get('/', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const { paciente_id, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT r.*, p.nombre || \' \' || p.apellidos as paciente_nombre FROM reports r JOIN patients p ON r.paciente_id = p.id WHERE 1=1';
    const params = [];
    let idx = 1;
    if (paciente_id) { sql += ` AND r.paciente_id = $${idx++}`; params.push(paciente_id); }
    sql += ' ORDER BY r.created_at DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const countSql = 'SELECT COUNT(*) FROM reports' + (paciente_id ? ' WHERE paciente_id = $1' : '');
    const countRes = await query(countSql, paciente_id ? [paciente_id] : []);
    res.paginated(result.rows, parseInt(countRes.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    console.error('GET /reports error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/reports/:id/download
router.get('/:id/download', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Informe no encontrado');

    const report = result.rows[0];
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="informe_${report.tipo}_${report.paciente_id}.html"`);
    res.send(report.file_content);
  } catch (err) {
    console.error('GET /reports/download error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/report-templates
router.get('/templates', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM report_templates WHERE activo = true ORDER BY nombre');
    res.success(result.rows);
  } catch (err) {
    console.error('GET /report-templates error:', err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;


router.post('/generate', authenticate, validateZod(ReportGenerateSchema), async (req, res) => {
  try {
    const { name, type, params } = req.body;
    const result = {
      totalPatients: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      avgAppointmentsPerPatient: 0,
      generatedAt: new Date().toISOString(),
    };

    const patientsResult = await query('SELECT COUNT(*) FROM patients WHERE activo = true');
    result.totalPatients = parseInt(patientsResult.rows[0].count);

    const appointmentsResult = await query(`SELECT COUNT(*) FROM appointments WHERE fecha >= DATE_TRUNC('month', NOW())`);
    result.totalAppointments = parseInt(appointmentsResult.rows[0].count);

    const revenueResult = await query(`SELECT COALESCE(SUM(importe), 0) as total FROM cash_movements WHERE tipo = 'ingreso' AND fecha >= DATE_TRUNC('month', NOW())`);
    result.totalRevenue = parseFloat(revenueResult.rows[0].total);

    if (result.totalPatients > 0) {
      result.avgAppointmentsPerPatient = Math.round(result.totalAppointments / result.totalPatients * 10) / 10;
    }

    const saved = await query(
      `INSERT INTO reports (name, type, params, result, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type, params || {}, result, req.user.id]
    );
    await logAudit(req.user.id, 'CREATE', 'Report', saved.rows[0].id, req);
    res.created(saved.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/list', authenticate, validateZodQuery(ReportQuerySchema), async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    let idx = 1;

    if (type) { sql += ` AND type = $${idx++}`; params.push(type); }

    sql += ' ORDER BY created_at DESC';
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM reports' + (type ? ' WHERE type = $1' : ''), type ? [type] : []);
    res.paginated(result.rows, parseInt(countResult.rows[0].count), parseInt(page), parseInt(limit));
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});
