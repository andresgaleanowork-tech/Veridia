// API Proxy — Gemini AI + USDA (no DB, ESM)
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateZod, validateZodQuery } from '../middleware/zodValidate.js';

const router = Router();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const USDA_URL = 'https://api.nal.usda.gov/fdc/v1';

const GeminiRequestSchema = z.object({ prompt: z.string().min(1, 'Prompt required'), context: z.string().optional() });
const USDAQuerySchema = z.object({ query: z.string().min(1, 'Query required'), dataType: z.string().optional(), pageSize: z.coerce.number().int().positive().max(100).optional() });

router.post('/gemini', authenticate, validateZod(GeminiRequestSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const key = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    if (!key) return res.error(500, 'Gemini API key not configured');
    const { prompt, context } = req.body;
    const response = await fetch(GEMINI_URL + model + ':generateContent?key=' + key, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: (context || '') + '\n\n' + prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }),
    });
    if (!response.ok) return res.error(response.status, 'Gemini API error: ' + response.status);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- third-party Gemini API response shape
    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.success({ text, model, tokens: text.length });
  } catch (err) { res.error(500, 'Proxy error: ' + (err instanceof Error ? err.message : String(err))); }
});

router.get('/usda/search', authenticate, validateZodQuery(USDAQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const key = process.env.USDA_API_KEY || 'DEMO_KEY';
    const { query, dataType, pageSize } = req.query;
    let url = USDA_URL + '/foods/search?api_key=' + key + '&query=' + encodeURIComponent(query as string) + '&pageSize=' + (pageSize || 50);
    if (dataType) url += '&dataType=' + encodeURIComponent(dataType as string);
    const response = await fetch(url);
    if (!response.ok) return res.error(response.status, 'USDA API error: ' + response.status);
    const data = await response.json();
    res.success(data);
  } catch (err) { res.error(500, 'Proxy error: ' + (err instanceof Error ? err.message : String(err))); }
});

export default router;