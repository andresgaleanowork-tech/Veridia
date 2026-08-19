const express = require('express');
const { z } = require('zod');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { InsuranceVerifySchema, InsuranceClaimSchema } = require('../schemas');
const { logAudit } = require('../utils/audit');

const router = express.Router();

router.post('/verify', authenticate, validateZod(InsuranceVerifySchema), async (req, res) => {
  try {
    const { patientId, insuranceId, memberId } = req.body;
    const eligibilityId = `270-${Date.now()}`;
    await query(
      `INSERT INTO insurance_claims (patient_id, claim_type, request_payload, response_payload, status, submitted_at) VALUES ($1, '270', $2, $3, 'processed', NOW())`,
      [patientId, { insuranceId, memberId }, { eligibilityId, status: 'active', coverage: 'verified' }]
    );
    await logAudit(req.user.id, 'CREATE', 'InsuranceClaim', eligibilityId, req);
    res.created({ eligibilityId, status: 'active', coverage: 'verified' });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.post('/submit-claim', authenticate, validateZod(InsuranceClaimSchema), async (req, res) => {
  try {
    const { patientId, claimType, requestPayload } = req.body;
    const claimId = `claim-${Date.now()}`;
    await query(
      `INSERT INTO insurance_claims (patient_id, claim_type, request_payload, response_payload, status, submitted_at) VALUES ($1, $2, $3, $4, 'submitted', NOW())`,
      [patientId, claimType, requestPayload, { claimId, status: 'received' }]
    );
    await logAudit(req.user.id, 'CREATE', 'InsuranceClaim', claimId, req);
    res.created({ claimId, status: 'submitted' });
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/claims/:patientId', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM insurance_claims WHERE patient_id = $1 ORDER BY created_at DESC', [req.params.patientId]);
    res.success(result.rows);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
