// Food search proxy routes — Drizzle ORM
import { Router } from 'express';
import https from 'https';
import { eq, ilike, and, or, asc, count } from 'drizzle-orm';

import { db } from '../config/db.js';
import { foods } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod } from '../middleware/zodValidate.js';
import { FoodImportSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 3600000;
const CACHE_MAX = 500;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  cache.delete(key); cache.set(key, entry);
  return entry.data;
}

function setCache(key: string, data: unknown) {
  if (cache.has(key)) cache.delete(key);
  while (cache.size >= CACHE_MAX) { const oldest = cache.keys().next().value; if (oldest) cache.delete(oldest); }
  cache.set(key, { data, ts: Date.now() });
}

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'VeridiaHT/1.0' } }, (res) => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { reject(new Error('Invalid JSON')); } });
    }).on('error', reject).setTimeout(15000, function (this: any) { this.destroy(); reject(new Error('Timeout')); });
  });
}

router.get('/off/search', authenticate, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) return res.error(400, 'Mínimo 2 caracteres');
    const ck = 'off:' + q;
    const cached = getCached(ck);
    if (cached) return res.success(cached);
    const data = await fetchJSON(`https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=30&lc=es&fields=code,product_name,product_name_es,brands,nutriments,nutrition_grades`);
    const result = { products: data.products || [], count: data.count || 0 };
    setCache(ck, result);
    res.success(result);
  } catch (err) { res.error(502, 'Error al buscar en OpenFoodFacts'); }
});

router.get('/usda/search', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const q = (req.query.q as string) || '';
    const dt = (req.query.dataType as string) || 'SR Legacy';
    if (q.length < 2) return res.error(400, 'Mínimo 2 caracteres');
    const ck = 'usda:' + q + ':' + dt;
    const cached = getCached(ck);
    if (cached) return res.success(cached);
    const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
    const data = await fetchJSON(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(q)}&pageSize=30&dataType=${encodeURIComponent(dt)}`);
    const result = { foods: data.foods || [], totalHits: data.totalHits || 0 };
    setCache(ck, result);
    res.success(result);
  } catch (err) { res.error(502, 'Error al buscar en USDA'); }
});

router.get('/off/product/:code', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const code = req.params.code;
    const ck = 'off_prod:' + code;
    const cached = getCached(ck);
    if (cached) return res.success(cached);
    const data = await fetchJSON(`https://world.openfoodfacts.net/api/v2/product/${code}.json?fields=code,product_name,product_name_es,brands,nutriments,nutriments_estimated,nutrition_grades,categories_tags,ingredients_text_es,allergens_tags,quantity`);
    if (data.status === 0) return res.error(404, 'Producto no encontrado');
    const p = data.product || {};
    p.nutriments_all = Object.assign({}, p.nutriments_estimated || {}, p.nutriments || {});
    setCache(ck, { product: p });
    res.success({ product: p });
  } catch (err) { res.error(502, 'Error al obtener producto'); }
});

router.post('/import', authenticate, authorize('admin', 'nutricionista'), validateZod(FoodImportSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const f = req.body;
    const result = await db.insert(foods).values({
      name: f.name, brand: f.brand, category: f.category,
      caloriesPer100g: String(f.calories_per_100g), proteinPer100g: String(f.protein_per_100g),
      carbsPer100g: String(f.carbs_per_100g), fatPer100g: String(f.fat_per_100g),
      fiberPer100g: String(f.fiber_per_100g), sodiumPer100g: String(f.sodium_per_100g),
      sugarPer100g: String(f.sugar_per_100g), allergens: f.allergens, dietTypes: f.diet_types,
      barcode: f.barcode, region: f.region, isLocal: f.is_local, source: f.source,
    }).returning();
    await logAudit(user?.id, 'CREATE', 'Food', result[0].id, req);
    res.created(result[0]);
  } catch (err) { console.error(err); res.error(500, 'Error interno'); }
});

router.get('/search/barcode/:barcode', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(foods).where(eq(foods.barcode, req.params.barcode));
    if (!r.length) return res.error(404, 'Alimento no encontrado');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { search, page = 1, limit = 50, is_local } = req.query;
    const conditions = [];
    if (search) conditions.push(or(ilike(foods.name, `%${String(search)}%`), ilike(foods.brand, `%${String(search)}%`), ilike(foods.category, `%${String(search)}%`)));
    if (is_local !== undefined) conditions.push(eq(foods.isLocal, is_local === 'true'));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db.select().from(foods).where(where).orderBy(asc(foods.name)).limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    const c = await db.select({ count: count() }).from(foods).where(where);
    res.paginated(data, parseInt(String(c[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;