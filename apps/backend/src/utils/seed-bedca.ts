import 'dotenv/config';
import { db } from '../config/db.js';
import { foods } from '../db/schema/nutrition.js';
import { BEDCA_DB } from '../data/bedca-data.js';
import { createLogger } from '../utils/logger.js';
import { eq } from 'drizzle-orm';

const seedLogger = createLogger('SEED-BEDCA');
const BATCH_SIZE = 100;

async function seedBedca() {
  seedLogger.info('Starting BEDCA seed...');

  const existingRows = await db.select({ name: foods.name }).from(foods).where(eq(foods.source, 'BEDCA'));
  const existingNames = new Set(existingRows.map(r => r.name));
  seedLogger.info('Existing BEDCA foods', { count: existingNames.size });

  const toInsert = BEDCA_DB.filter(f => !existingNames.has(f.name));
  seedLogger.info('New foods to insert', { count: toInsert.length });

  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const values = batch.map(f => ({
      name: f.name,
      category: f.groupName.slice(0, 50),
      caloriesPer100g: f.kcal != null ? String(f.kcal) : null,
      proteinPer100g: f.protein != null ? String(f.protein) : null,
      carbsPer100g: f.carbs != null ? String(f.carbs) : null,
      fatPer100g: f.fat != null ? String(f.fat) : null,
      fiberPer100g: f.fiber != null ? String(f.fiber) : null,
      sodiumPer100g: f.sodium != null ? String(f.sodium) : null,
      region: 'ES',
      isLocal: true,
      source: 'BEDCA' as const,
      externalId: String(f.id),
    }));

    await db.insert(foods).values(values);
    inserted += values.length;
    seedLogger.info('Batch inserted', { batch: Math.floor(i / BATCH_SIZE) + 1, totalInserted: inserted });
  }

  seedLogger.info('BEDCA seed completed', { totalInserted: inserted });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedBedca()
    .then(() => process.exit(0))
    .catch((err) => {
      seedLogger.error('Seed error', { error: err.message, stack: err.stack });
      process.exit(1);
    });
}
