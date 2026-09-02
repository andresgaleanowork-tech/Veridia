// Recipes CRUD routes - Drizzle ORM
import { Router } from 'express';
import https from 'https';
import { eq, ilike, asc, count } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../config/db.js';
import { recipes, foods } from '../db/schema/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateZod, validateZodQuery, validateZodParams } from '../middleware/zodValidate.js';
import { RecipeCreateSchema, RecipeUpdateSchema, RecipeListQuerySchema, RecipeScaleSchema, UUIDSchema } from '../schemas/index.js';
import { logAudit } from '../utils/audit.js';
import { sanitize } from '../middleware/validate.js';
import { scaleRecipe } from '../services/recipe-scaling.js';

const router = Router();

function fetchJSON<T = Record<string, unknown>>(url: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'VeridiaHT/1.0' } }, (res) => {
      let d = '';
      res.on('data', (c: string) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d) as T); } catch { reject(new Error('Invalid JSON')); } });
    }).on('error', reject).setTimeout(15000, function (this: import('http').ClientRequest) { this.destroy(); reject(new Error('Timeout')); });
  });
}

router.get('/mealdb/search', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) return res.error(400, 'Mínimo 2 caracteres');
    const data = await fetchJSON<{ meals: unknown[] }>(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
    res.success({ meals: data.meals || [] });
  } catch (err) { res.error(502, 'Error al buscar en TheMealDB'); }
});

router.get('/mealdb/:id', async (req, res) => {
  try {
    const data = await fetchJSON<{ meals?: Record<string, string>[] }>(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${req.params.id}`);
    const meal = data.meals?.[0];
    if (!meal) return res.error(404, 'Receta no encontrada');
    res.success(meal);
  } catch (err) { res.error(502, 'Error al obtener receta'); }
});

router.get('/mealdb/:id/ingredients/map', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const meal = await fetchJSON<{ meals?: Record<string, string>[] }>(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${req.params.id}`);
    const m = meal.meals?.[0];
    if (!m) return res.error(404, 'Receta no encontrada');

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const name = m[`strIngredient${i}`];
      const measure = m[`strMeasure${i}`];
      if (!name || !name.trim()) continue;

      const localMatches = await db.select().from(foods)
        .where(ilike(foods.name, `%${String(name).trim()}%`))
        .limit(3);

      ingredients.push({
        name: name.trim(),
        measure: measure?.trim() || '',
        localMatches: localMatches.map(f => ({ id: f.id, name: f.name, calories: f.caloriesPer100g })),
      });
    }
    res.success({ ingredients });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/', authenticate, validateZodQuery(RecipeListQuerySchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { search, categoria, page = 1, limit = 50 } = req.query;
    const conditions = [];
    if (search) conditions.push(ilike(recipes.nombre, `%${String(search)}%`));
    if (categoria) conditions.push(eq(recipes.categoria, String(categoria)));
    const where = conditions.length > 0 ? conditions[0] : undefined;
    const data = await db.select().from(recipes).where(where).orderBy(asc(recipes.nombre)).limit(parseInt(String(limit))).offset((parseInt(String(page)) - 1) * parseInt(String(limit)));
    const c = await db.select({ count: count() }).from(recipes).where(where);
    res.paginated(data, parseInt(String(c[0].count)), parseInt(String(page)), parseInt(String(limit)));
  } catch (err) { res.error(500, 'Error interno'); }
});

router.get('/:id', authenticate, validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(recipes).where(eq(recipes.id, req.params.id));
    if (!r.length) return res.error(404, 'Receta no encontrada');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/', authenticate, authorize('admin', 'nutricionista'), validateZod(RecipeCreateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const { nombre, categoria, raciones, kcal, prot, grasas, hc, fibra, ingredientes, pasos, source, mealdb_id } = req.body;
    const result = await db.insert(recipes).values({
      nombre: sanitize(nombre), categoria, raciones: raciones || 1,
      kcal: String(kcal), prot: String(prot), grasas: String(grasas), hc: String(hc), fibra: String(fibra),
      ingredientes: ingredientes || [], pasos: pasos || [], source: source || 'local', mealdbId: mealdb_id, createdBy: user?.id,
    }).returning();
    await logAudit(user?.id, 'CREATE', 'Recipe', nombre, req);
    res.created(result[0]);
  } catch (err) { console.error('POST recipe error:', err); res.error(500, 'Error interno'); }
});

router.put('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), validateZod(RecipeUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const fieldMap: Record<string, string> = { nombre: 'nombre', categoria: 'categoria', raciones: 'raciones', kcal: 'kcal', prot: 'prot', grasas: 'grasas', hc: 'hc', fibra: 'fibra', ingredientes: 'ingredientes', pasos: 'pasos', source: 'source', mealdb_id: 'mealdbId' };
    const updates: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(fieldMap)) { if (req.body[k] !== undefined) updates[f] = typeof req.body[k] === 'number' ? String(req.body[k]) : req.body[k]; }
    if (!Object.keys(updates).length) return res.error(400, 'Sin campos para actualizar');
    const r = await db.update(recipes).set(updates).where(eq(recipes.id, req.params.id)).returning();
    if (!r.length) return res.error(404, 'No encontrada');
    res.success(r[0]);
  } catch (err) { res.error(500, 'Error interno'); }
});

router.delete('/:id', authenticate, authorize('admin', 'nutricionista'), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.delete(recipes).where(eq(recipes.id, req.params.id)).returning({ id: recipes.id });
    if (!r.length) return res.error(404, 'No encontrada');
    await logAudit(user?.id, 'DELETE', 'Recipe', 'Receta eliminada', req);
    res.success({ ok: true });
  } catch (err) { res.error(500, 'Error interno'); }
});

router.post('/:id/scale', authenticate, validateZod(RecipeScaleSchema), validateZodParams(z.object({ id: UUIDSchema })), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.error(401, 'Unauthorized');
    const r = await db.select().from(recipes).where(eq(recipes.id, req.params.id));
    if (!r.length) return res.error(404, 'Receta no encontrada');
    const scaled = scaleRecipe(r[0], req.body.targetServings);
    res.success(scaled);
  } catch (err) { res.error(500, 'Error interno'); }
});

export default router;