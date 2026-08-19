// ═══════════════════════════════════════════
//  API Proxy — Protects API keys server-side
//  Gemini AI + USDA FoodData Central
// ═══════════════════════════════════════════

const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { validateZod, validateZodQuery } = require('../middleware/zodValidate');

const router = express.Router();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const USDA_URL = 'https://api.nal.usda.gov/fdc/v1';

const GeminiRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt required'),
  context: z.string().optional(),
});

const USDAQuerySchema = z.object({
  query: z.string().min(1, 'Query required'),
  dataType: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

// ── Gemini AI Proxy (auth required) ──
router.post('/gemini', authenticate, validateZod(GeminiRequestSchema), async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    if (!key) return res.error(500, 'Gemini API key not configured');

    const { prompt, context } = req.body;

    const response = await fetch(GEMINI_URL + model + ':generateContent?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: (context || '') + '\n\n' + prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', response.status, err);
      return res.error(response.status, 'Gemini API error: ' + response.status);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.success({ text, model, tokens: text.length });
  } catch (err) {
    console.error('Gemini proxy error:', err.message);
    res.error(500, 'Proxy error: ' + err.message);
  }
});

// ── USDA FoodData Central Proxy (auth required) ──
router.get('/usda/search', authenticate, validateZodQuery(USDAQuerySchema), async (req, res) => {
  try {
    const key = process.env.USDA_API_KEY || 'DEMO_KEY';
    const { query, dataType, pageSize } = req.query;

    let url = USDA_URL + '/foods/search?api_key=' + key
      + '&query=' + encodeURIComponent(query)
      + '&pageSize=' + (pageSize || 50);
    if (dataType) url += '&dataType=' + encodeURIComponent(dataType);

    const response = await fetch(url);
    if (!response.ok) {
      return res.error(response.status, 'USDA API error: ' + response.status);
    }

    const data = await response.json();
    res.success(data);
  } catch (err) {
    console.error('USDA proxy error:', err.message);
    res.error(500, 'Proxy error: ' + err.message);
  }
});

module.exports = router;
