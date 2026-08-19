const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod, validateZodParams } = require('../middleware/zodValidate');
const { AIScribeTranscribeSchema, AIScribeNoteSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');
const { sanitize } = require('../middleware/validate');

const router = express.Router();

// POST /api/ai-scribe/transcribe
router.post('/transcribe', authenticate, authorize('admin', 'nutricionista'), validateZod(AIScribeTranscribeSchema), async (req, res) => {
  try {
    const { patientId, audio, text } = req.body;
    
    let transcription = '';
    
    if (text) {
      transcription = text;
    } else if (audio) {
      transcription = '[Audio transcription placeholder - integrate with Gemini/Whisper]';
    }

    const soapNote = {
      subjective: 'Paciente refiere...',
      objective: 'Signos vitales estables...',
      assessment: 'Evaluación nutricional...',
      plan: 'Plan de alimentación...',
    };

    const result = await query(
      `INSERT INTO ai_scribe_notes (patient_id, professional_id, audio_url, transcription, soap_note, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patientId, req.user.id, audio ? 'audio_placeholder' : null, sanitize(transcription), JSON.stringify(soapNote), 'draft']
    );

    await logAudit(req.user.id, 'CREATE', 'AIScribeNote', `Nota para paciente ${patientId}`, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error('POST ai-scribe error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/ai-scribe/notes/:patientId
router.get('/notes/:patientId', authenticate, validateZodParams(z.object({ patientId: z.string().uuid() })), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM ai_scribe_notes WHERE patient_id = $1 ORDER BY created_at DESC',
      [req.params.patientId]
    );
    res.success(result.rows);
  } catch (err) {
    console.error('GET ai-scribe error:', err);
    res.error(500, 'Error interno');
  }
});

// GET /api/ai-scribe/note/:id
router.get('/note/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM ai_scribe_notes WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Nota no encontrada');
    res.success(result.rows[0]);
  } catch (err) {
    console.error('GET ai-scribe note error:', err);
    res.error(500, 'Error interno');
  }
});

// PUT /api/ai-scribe/note/:id
router.put('/note/:id', authenticate, authorize('admin', 'nutricionista'), validateZod(AIScribeNoteSchema.partial()), async (req, res) => {
  try {
    const { transcription, soapNote, status } = req.body;
    const result = await query(
      `UPDATE ai_scribe_notes SET transcription = $1, soap_note = $2, status = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [sanitize(transcription), soapNote ? JSON.stringify(soapNote) : null, status, req.params.id]
    );
    if (!result.rows.length) return res.error(404, 'Nota no encontrada');
    await logAudit(req.user.id, 'UPDATE', 'AIScribeNote', `Nota ${req.params.id}`, req);
    res.success(result.rows[0]);
  } catch (err) {
    console.error('PUT ai-scribe error:', err);
    res.error(500, 'Error interno');
  }
});

// DELETE /api/ai-scribe/note/:id
router.delete('/note/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query('DELETE FROM ai_scribe_notes WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.error(404, 'Nota no encontrada');
    await logAudit(req.user.id, 'DELETE', 'AIScribeNote', `Nota ${req.params.id}`, req);
    res.success({ id: req.params.id });
  } catch (err) {
    console.error('DELETE ai-scribe error:', err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
