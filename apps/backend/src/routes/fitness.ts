// Fitness Platform Integration routes - raw SQL (no Drizzle schema)
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZodParams } from '../middleware/zodValidate.js';
import { UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { queryOne, queryMany, query } from '../config/db.js';

interface FitnessConnectionRow {
  id: string;
  paciente_id: string;
  platform: string;
  external_user_id: string | null;
  scopes: unknown;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface FitnessActivityRow {
  id: string;
  paciente_id: string;
  connection_id: string;
  platform: string;
  external_id: string;
  type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  steps: number;
  calories_burned: number;
  distance_meters: number;
  active_minutes: number;
  intensity: string;
  source_data: unknown;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientActivityFactorRow {
  factor: number;
  label: string;
  reason: string | null;
}

interface ActivitySummaryRow {
  total_activities: string;
  total_steps: string;
  total_active_minutes: string;
  total_calories_burned: string;
  total_duration_minutes: string;
  total_distance_meters: string;
}

const router = Router();
const FITNESS_PLATFORMS = ['google_fit', 'apple_health', 'fitbit', 'samsung_health', 'garmin'] as const;
const ACTIVITY_FACTORS: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };

function parseFactor(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(n) || n < 1.0 || n > 2.5) return null;
  return +n.toFixed(3);
}

function factorLabel(factor: number): string {
  for (const [k, v] of Object.entries(ACTIVITY_FACTORS)) { if (Math.abs(v - factor) < 0.001) return k; }
  return 'custom';
}

router.post('/connect/:platform', authenticate, authorize('nutricionista'), validateZodParams(z.object({ platform: z.enum(FITNESS_PLATFORMS) })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { platform } = req.params;
    const { paciente_id, external_user_id, scopes } = req.body;
    if (!paciente_id) return res.error(400, 'paciente_id es requerido');
    const patient = await queryOne<{ id: string; nombre: string; apellidos: string }>(`SELECT id, nombre, apellidos FROM patients WHERE id = $1`, [paciente_id]);
    if (!patient) return res.error(404, 'Paciente no encontrado');
    const existing = await queryOne<{ id: string }>(`SELECT id FROM fitness_connections WHERE paciente_id = $1 AND platform = $2`, [paciente_id, platform]);
    if (existing) return res.error(409, 'Conexión ya existe');
    const result = await queryOne<FitnessConnectionRow>(`INSERT INTO fitness_connections (paciente_id, platform, external_user_id, scopes, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [paciente_id, platform, external_user_id || null, scopes || {}, user?.id]);
    await logAudit(user?.id, 'CREATE', 'FitnessConnection', `${platform} para ${patient.nombre}`, req);
    res.created(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/disconnect', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, platform } = req.body;
    if (!paciente_id || !platform) return res.error(400, 'paciente_id y platform son requeridos');
    const result = await queryOne<FitnessConnectionRow>(`UPDATE fitness_connections SET active = false WHERE paciente_id = $1 AND platform = $2 RETURNING *`, [paciente_id, platform]);
    if (!result) return res.error(404, 'Conexión no encontrada');
    await logAudit(user?.id, 'UPDATE', 'FitnessConnection', `Desconectar ${platform}`, req);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/activities/:patientId', authenticate, authorize('nutricionista'), validateZodParams(z.object({ patientId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patientId } = req.params;
    const { from, to, limit = 100 } = req.query;
    let sql = 'SELECT * FROM fitness_activities WHERE paciente_id = $1';
    const params: unknown[] = [patientId];
    let idx = 2;
    if (from) { sql += ` AND start_time >= $${idx++}`; params.push(from); }
    if (to) { sql += ` AND start_time <= $${idx++}`; params.push(to); }
    sql += ` ORDER BY start_time DESC LIMIT $${idx}`;
    params.push(Math.min(parseInt(limit as string, 10) || 100, 500));
    const result = await queryMany<FitnessActivityRow>(sql, params);
    res.success(result);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/summary/:patientId', authenticate, authorize('nutricionista'), validateZodParams(z.object({ patientId: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { patientId } = req.params;
    const { from, to } = req.query;
    let where = 'WHERE paciente_id = $1';
    const params: unknown[] = [patientId];
    let idx = 2;
    if (from) { where += ` AND start_time >= $${idx++}`; params.push(from); }
    if (to) { where += ` AND start_time <= $${idx++}`; params.push(to); }
    const [summaryRow, factorRow] = await Promise.all([
      queryOne<ActivitySummaryRow>(`SELECT COUNT(*) as total_activities, COALESCE(SUM(steps), 0) as total_steps, COALESCE(SUM(active_minutes), 0) as total_active_minutes, COALESCE(SUM(calories_burned), 0) as total_calories_burned, COALESCE(SUM(duration_minutes), 0) as total_duration_minutes, COALESCE(SUM(distance_meters), 0) as total_distance_meters FROM fitness_activities ${where}`, params),
      queryOne<PatientActivityFactorRow>(`SELECT factor, label, reason FROM patient_activity_factors WHERE paciente_id = $1 AND active = true`, [patientId]),
    ]);
    const summary = summaryRow || ({} as ActivitySummaryRow);
    const activeFactor = factorRow || null;
    res.success({
      patientId, totalActivities: parseInt(summary.total_activities || '0'), totalSteps: parseInt(summary.total_steps || '0'),
      totalActiveMinutes: parseInt(summary.total_active_minutes || '0'), totalCaloriesBurned: parseFloat(summary.total_calories_burned || '0'),
      totalDurationMinutes: parseInt(summary.total_duration_minutes || '0'), totalDistanceMeters: parseFloat(summary.total_distance_meters || '0'),
      activityFactor: activeFactor ? { factor: activeFactor.factor, label: activeFactor.label, reason: activeFactor.reason } : { factor: ACTIVITY_FACTORS.moderate, label: 'moderate', reason: null },
    });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/activities/import', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, platform, activities } = req.body;
    if (!paciente_id || !platform || !Array.isArray(activities)) return res.error(400, 'paciente_id, platform y activities son requeridos');
    const connResult = await queryOne<{ id: string }>(`SELECT id FROM fitness_connections WHERE paciente_id = $1 AND platform = $2 AND active = true`, [paciente_id, platform]);
    if (!connResult) return res.error(404, 'Conexión no encontrada');
    const connectionId = connResult.id;
    let imported = 0, skipped = 0;
    for (const act of activities) {
      try {
        const externalId = act.external_id || `${platform}_${act.start_time}`;
        const duration = act.duration_minutes || Math.round((new Date(act.end_time).getTime() - new Date(act.start_time).getTime()) / 60000);
        const intensity = ['light', 'moderate', 'vigorous'].includes(act.intensity) ? act.intensity : 'unknown';
        await query(`INSERT INTO fitness_activities (paciente_id, connection_id, platform, external_id, type, start_time, end_time, duration_minutes, steps, calories_burned, distance_meters, active_minutes, intensity, source_data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (paciente_id, platform, external_id) DO UPDATE SET type=EXCLUDED.type, start_time=EXCLUDED.start_time, end_time=EXCLUDED.end_time, duration_minutes=EXCLUDED.duration_minutes, steps=EXCLUDED.steps, calories_burned=EXCLUDED.calories_burned, distance_meters=EXCLUDED.distance_meters, active_minutes=EXCLUDED.active_minutes, intensity=EXCLUDED.intensity, source_data=EXCLUDED.source_data, imported_at=NOW()`,
          [paciente_id, connectionId, platform, externalId, act.type || 'unknown', act.start_time, act.end_time, duration, act.steps || 0, act.calories_burned || 0, act.distance_meters || 0, act.active_minutes || Math.max(0, Math.round(duration * 0.4)), intensity, act.source_data || {}]);
        imported++;
      } catch { skipped++; }
    }
    await logAudit(user?.id, 'IMPORT', 'FitnessActivity', `Importadas ${imported} actividades`, req, { platform, imported, skipped });
    res.success({ imported, skipped });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.post('/factor', authenticate, authorize('nutricionista'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { paciente_id, factor, label, reason } = req.body;
    if (!paciente_id || factor === undefined) return res.error(400, 'paciente_id y factor son requeridos');
    const parsed = parseFactor(factor);
    if (parsed === null) return res.error(400, 'factor inválido (1.0 - 2.5)');
    const patient = await queryOne<{ id: string; nombre: string; apellidos: string }>(`SELECT id, nombre, apellidos FROM patients WHERE id = $1`, [paciente_id]);
    if (!patient) return res.error(404, 'Paciente no encontrado');
    const finalLabel = label || factorLabel(parsed);
    await query(`INSERT INTO patient_activity_factors (paciente_id, factor, label, reason, created_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (paciente_id) DO UPDATE SET factor=EXCLUDED.factor, label=EXCLUDED.label, reason=EXCLUDED.reason, active=true, updated_at=NOW()`, [paciente_id, parsed, finalLabel, reason || null, user?.id]);
    await logAudit(user?.id, 'UPDATE', 'PatientActivityFactor', `FA ${parsed} para ${patient.nombre}`, req);
    res.success({ paciente_id, factor: parsed, label: finalLabel, reason: reason || null });
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

export default router;
