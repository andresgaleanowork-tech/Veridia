// Patient Food Journal routes — meals, symptoms, exercise, water, mood
const express = require('express');
const { z } = require('zod');

const { query } = require('../config/db');
const { authOrPatient } = require('../middleware/auth');
const { validateZod, validateZodQuery, validateZodParams } = require('../middleware/zodValidate');
const {
  PatientFoodJournalCreateSchema,
  PatientFoodJournalUpdateSchema,
  PatientFoodJournalQuerySchema,
  UUIDSchema,
} = require('../schemas');
const { logAudit } = require('../utils/audit');

const router = express.Router();

const PROFESSIONAL_ROLES = ['admin', 'nutricionista', 'secretaria'];

// Resolve target patient_id: professionals can specify any, patients are scoped to self
function resolvePatientId(req, res, next) {
  if (req.isPatient) {
    req.target_patient_id = req.paciente_id;
  } else {
    req.target_patient_id = req.body?.patient_id || req.query?.patient_id || req.params.patientId;
  }
  next();
}

const JournalIdParamsSchema = z.object({ id: UUIDSchema });

// ─── LIST ───
// GET /api/patient-journal — list journals with filters + pagination
router.get(
  '/',
  authOrPatient(PROFESSIONAL_ROLES),
  validateZodQuery(PatientFoodJournalQuerySchema),
  resolvePatientId,
  async (req, res) => {
    try {
      const { patient_id, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;

      if (patient_id && !req.isPatient) {
        const patientCheck = await query('SELECT id FROM patients WHERE id = $1', [patient_id]);
        if (!patientCheck.rows.length) return res.error(404, 'Paciente no encontrado');
      }

      let sql = 'SELECT * FROM patient_food_journals';
      const conditions = [];
      const params = [];
      let idx = 1;

      if (req.isPatient) {
        conditions.push(`patient_id = $${idx++}`);
        params.push(req.paciente_id);
      } else if (patient_id) {
        conditions.push(`patient_id = $${idx++}`);
        params.push(patient_id);
      }

      if (fecha_desde) { conditions.push(`date >= $${idx++}`); params.push(fecha_desde); }
      if (fecha_hasta) { conditions.push(`date <= $${idx++}`); params.push(fecha_hasta); }

      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');

      sql += ` ORDER BY date DESC LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await query(sql, params);

      const countSql = `SELECT COUNT(*) FROM patient_food_journals` + (conditions.length ? ' WHERE ' + conditions.join(' AND ') : '');
      const countResult = await query(countSql, conditions.length ? params.slice(0, params.length - 2) : []);

      res.paginated(result.rows, parseInt(countResult.rows[0].count), parseInt(page), parseInt(limit));
    } catch (err) {
      console.error('GET patient-journal error:', err);
      res.error(500, 'Error interno');
    }
  }
);

// ─── CREATE ───
// POST /api/patient-journal — create or update today's journal
router.post(
  '/',
  authOrPatient(PROFESSIONAL_ROLES),
  validateZod(PatientFoodJournalCreateSchema),
  resolvePatientId,
  async (req, res) => {
    try {
      const patientId = req.target_patient_id;
      const patientCheck = await query('SELECT id FROM patients WHERE id = $1', [patientId]);
      if (!patientCheck.rows.length) return res.error(404, 'Paciente no encontrado');

      const { date, meals, symptoms, exercise, water_intake, mood, notes, photo_urls } = req.body;

      const result = await query(
        `INSERT INTO patient_food_journals
         (patient_id, date, meals, symptoms, exercise, water_intake, mood, notes, photo_urls, created_by)
         VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (patient_id, date) DO UPDATE SET
           meals = EXCLUDED.meals,
           symptoms = EXCLUDED.symptoms,
           exercise = EXCLUDED.exercise,
           water_intake = EXCLUDED.water_intake,
           mood = EXCLUDED.mood,
           notes = EXCLUDED.notes,
           photo_urls = EXCLUDED.photo_urls,
           updated_at = NOW()
         RETURNING *`,
        [
          patientId,
          date || new Date().toISOString().split('T')[0],
          JSON.stringify(meals || []),
          symptoms || [],
          JSON.stringify(exercise || []),
          water_intake || 0,
          mood || null,
          notes || null,
          photo_urls || [],
          req.user?.id || null,
        ]
      );

      const action = result.rows.length ? 'UPSERT' : 'CREATE';
      await logAudit(
        req.user?.id || null,
        action,
        'PatientFoodJournal',
        `Diario alimentación ${date || 'hoy'} paciente ${patientId}`,
        req,
        { mood, water_intake }
      );

      res.created(result.rows[0]);
    } catch (err) {
      console.error('POST patient-journal error:', err);
      if (err.code === '23505') return res.error(409, 'Ya existe un journal para esta fecha');
      res.error(500, 'Error interno');
    }
  }
);

// ─── DETAIL ───
// GET /api/patient-journal/:id
router.get(
  '/:id',
  authOrPatient(PROFESSIONAL_ROLES),
  validateZodParams(JournalIdParamsSchema),
  async (req, res) => {
    try {
      const result = await query('SELECT * FROM patient_food_journals WHERE id = $1', [req.params.id]);
      if (!result.rows.length) return res.error(404, 'Journal no encontrado');

      const journal = result.rows[0];
      if (req.isPatient && journal.patient_id !== req.paciente_id) {
        return res.error(403, 'Sin permisos para acceder a este journal');
      }

      if (req.user) {
        await logAudit(req.user.id, 'READ', 'PatientFoodJournal', `Journal ${req.params.id}`, req);
      }
      res.success(journal);
    } catch (err) {
      res.error(500, 'Error interno');
    }
  }
);

// ─── UPDATE ───
// PUT /api/patient-journal/:id
router.put(
  '/:id',
  authOrPatient(PROFESSIONAL_ROLES),
  validateZodParams(JournalIdParamsSchema),
  validateZod(PatientFoodJournalUpdateSchema),
  async (req, res) => {
    try {
      const existing = await query('SELECT * FROM patient_food_journals WHERE id = $1', [req.params.id]);
      if (!existing.rows.length) return res.error(404, 'Journal no encontrado');

      const journal = existing.rows[0];
      if (req.isPatient && journal.patient_id !== req.paciente_id) {
        return res.error(403, 'Sin permisos para modificar este journal');
      }

      const fields = ['meals', 'symptoms', 'exercise', 'water_intake', 'mood', 'notes', 'photo_urls'];
      const updates = [], values = [];
      let idx = 1;

      for (const f of fields) {
        if (req.body[f] !== undefined) {
          const col = f === 'water_intake' ? 'water_intake' : f;
          updates.push(`${col} = $${idx++}`);
          values.push(typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
        }
      }
      if (!updates.length) return res.error(400, 'Sin campos para actualizar');

      values.push(req.params.id);
      const result = await query(
        `UPDATE patient_food_journals SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values
      );

      await logAudit(req.user?.id || null, 'UPDATE', 'PatientFoodJournal', `Journal ${req.params.id}`, req);
      res.success(result.rows[0]);
    } catch (err) {
      console.error('PUT patient-journal error:', err);
      res.error(500, 'Error interno');
    }
  }
);

// ─── DELETE ───
// DELETE /api/patient-journal/:id
router.delete(
  '/:id',
  authOrPatient(PROFESSIONAL_ROLES),
  validateZodParams(JournalIdParamsSchema),
  async (req, res) => {
    try {
      const existing = await query('SELECT * FROM patient_food_journals WHERE id = $1', [req.params.id]);
      if (!existing.rows.length) return res.error(404, 'Journal no encontrado');

      const journal = existing.rows[0];
      if (req.isPatient && journal.patient_id !== req.paciente_id) {
        return res.error(403, 'Sin permisos para eliminar este journal');
      }

      await query('DELETE FROM patient_food_journals WHERE id = $1', [req.params.id]);

      await logAudit(req.user?.id || null, 'DELETE', 'PatientFoodJournal', `Journal ${req.params.id}`, req);
      res.success({ ok: true });
    } catch (err) {
      console.error('DELETE patient-journal error:', err);
      res.error(500, 'Error interno');
    }
  }
);

// ─── STATS ───
// GET /api/patient-journal/stats/:patientId
router.get(
  '/stats/:patientId',
  authOrPatient(PROFESSIONAL_ROLES),
  validateZodParams(z.object({ patientId: UUIDSchema })),
  async (req, res) => {
    try {
      const { patientId } = req.params;

      if (req.isPatient && patientId !== req.paciente_id) {
        return res.error(403, 'Sin permisos para acceder a estas estadísticas');
      }

      const patientCheck = await query('SELECT id FROM patients WHERE id = $1', [patientId]);
      if (!patientCheck.rows.length) return res.error(404, 'Paciente no encontrado');

      const journals = await query(
        'SELECT date, meals, symptoms, exercise, water_intake, mood FROM patient_food_journals WHERE patient_id = $1 ORDER BY date DESC',
        [patientId]
      );

      const entries = journals.rows;

      // Calculate streak (consecutive days with journals, counting from today backwards)
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < entries.length; i++) {
        const entryDate = new Date(entries[i].date);
        const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - entryDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        if (diffDays === streak) {
          streak++;
        } else if (diffDays > streak) {
          break;
        }
      }

      // Mood distribution
      const moodDist = { great: 0, good: 0, neutral: 0, bad: 0, terrible: 0 };
      let totalWater = 0;
      let totalCalories = 0;
      let calorieCount = 0;
      let totalExerciseMinutes = 0;
      let exerciseCount = 0;
      const symptomFreq = {};

      for (const e of entries) {
        if (e.mood && moodDist[e.mood] !== undefined) moodDist[e.mood]++;
        if (e.water_intake) totalWater += e.water_intake;
        const meals = typeof e.meals === 'string' ? JSON.parse(e.meals) : e.meals;
        if (Array.isArray(meals)) {
          for (const m of meals) {
            if (Array.isArray(m?.foods)) {
              for (const f of m.foods) {
                if (f?.calories) totalCalories += f.calories;
              }
            }
          }
        }
        const exercise = typeof e.exercise === 'string' ? JSON.parse(e.exercise) : e.exercise;
        if (Array.isArray(exercise)) {
          for (const ex of exercise) {
            if (ex?.duration) totalExerciseMinutes += ex.duration;
            if (ex?.calories) { totalCalories += ex.calories; calorieCount++; }
          }
          exerciseCount += exercise.length;
        }
        if (Array.isArray(e.symptoms)) {
          for (const s of e.symptoms) {
            symptomFreq[s] = (symptomFreq[s] || 0) + 1;
          }
        }
      }

      const dayCount = entries.length || 1;

      res.success({
        patientId,
        totalEntries: entries.length,
        streak,
        averages: {
          waterIntakeMl: Math.round(totalWater / dayCount),
          calories: Math.round(totalCalories / dayCount),
          exerciseMinutes: Math.round(totalExerciseMinutes / dayCount),
          exerciseSessions: Math.round(exerciseCount / dayCount),
        },
        moodDistribution: moodDist,
        topSymptoms: Object.entries(symptomFreq)
          .map(([s, c]) => ({ symptom: s, count: c }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        completionRate: entries.length > 0 ? Math.round((entries.filter(e => e.mood).length / dayCount) * 100) : 0,
      });
    } catch (err) {
      console.error('GET patient-journal stats error:', err);
      res.error(500, 'Error interno');
    }
  }
);

module.exports = router;
