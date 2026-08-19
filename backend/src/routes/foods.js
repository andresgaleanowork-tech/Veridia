// Food search proxy routes — BEDCA, OFF, USDA with server-side caching
const express = require('express');
const https = require('https');
const { authenticate, authorize } = require('../middleware/auth');
const { validateZod } = require('../middleware/zodValidate');
const { query } = require('../config/db');
const { logAudit } = require('../utils/audit');
const { FoodImportSchema } = require('../schemas');

const router = express.Router();

// Simple in-memory cache (TTL 1 hour)
const cache = new Map();
const CACHE_TTL = 3600000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 500) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'VeridiaHT/1.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('Invalid JSON')); } });
    }).on('error', reject).setTimeout(15000, function () { this.destroy(); reject(new Error('Timeout')); });
  });
}

// GET /api/foods/off/search?q=tomate
router.get('/off/search', authenticate, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.error(400, 'Mínimo 2 caracteres');

    const cacheKey = 'off:' + q;
    const cached = getCached(cacheKey);
    if (cached) return res.success(cached);

    const url = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=30&lc=es&fields=code,product_name,product_name_es,brands,nutriments,nutrition_grades`;
    const data = await fetchJSON(url);

    const result = { products: data.products || [], count: data.count || 0 };
    setCache(cacheKey, result);
    res.success(result);
  } catch (err) {
    console.error('OFF search error:', err.message);
    res.error(502, 'Error al buscar en OpenFoodFacts');
  }
});

// GET /api/foods/usda/search?q=chicken
router.get('/usda/search', authenticate, async (req, res) => {
  try {
    const q = req.query.q || '';
    const dt = req.query.dataType || 'SR Legacy';
    if (q.length < 2) return res.error(400, 'Mínimo 2 caracteres');

    const cacheKey = 'usda:' + q + ':' + dt;
    const cached = getCached(cacheKey);
    if (cached) return res.success(cached);

    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(q)}&pageSize=30&dataType=${encodeURIComponent(dt)}`;
    const data = await fetchJSON(url);

    const result = { foods: data.foods || [], totalHits: data.totalHits || 0 };
    setCache(cacheKey, result);
    res.success(result);
  } catch (err) {
    console.error('USDA search error:', err.message);
    res.error(502, 'Error al buscar en USDA');
  }
});

// GET /api/foods/off/product/:code
router.get('/off/product/:code', authenticate, async (req, res) => {
  try {
    const code = req.params.code;
    const cacheKey = 'off_prod:' + code;
    const cached = getCached(cacheKey);
    if (cached) return res.success(cached);

    const url = `https://world.openfoodfacts.net/api/v2/product/${code}.json?fields=code,product_name,product_name_es,brands,nutriments,nutriments_estimated,nutrition_grades,categories_tags,ingredients_text_es,allergens_tags,quantity`;
    const data = await fetchJSON(url);
    if (data.status === 0) return res.error(404, 'Producto no encontrado');

    const p = data.product || {};
    const merged = Object.assign({}, p.nutriments_estimated || {}, p.nutriments || {});
    p.nutriments_all = merged;

    setCache(cacheKey, { product: p });
    res.success({ product: p });
  } catch (err) {
    res.error(502, 'Error al obtener producto');
  }
});

router.post('/import', authenticate, authorize('admin', 'nutricionista'), validateZod(FoodImportSchema), async (req, res) => {
  try {
    const food = req.body;
    const result = await query(
      `INSERT INTO foods (name, brand, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sodium_per_100g, sugar_per_100g, allergens, diet_types, barcode, region, is_local, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [food.name, food.brand, food.category, food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g, food.fiber_per_100g, food.sodium_per_100g, food.sugar_per_100g, food.allergens, food.diet_types, food.barcode, food.region, food.is_local, food.source]
    );
    await logAudit(req.user.id, 'CREATE', 'Food', result.rows[0].id, req);
    res.created(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

router.get('/search/barcode/:barcode', async (req, res) => {
  try {
    const result = await query('SELECT * FROM foods WHERE barcode = $1', [req.params.barcode]);
    if (!result.rows.length) return res.error(404, 'Alimento no encontrado');
    res.success(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.error(500, 'Error interno');
  }
});

module.exports = router;
