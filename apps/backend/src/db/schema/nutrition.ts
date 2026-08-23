import { sql } from "drizzle-orm";
import { pgTable, uuid, varchar, text, date, integer, decimal, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { timestamps, uuidPk, textArray, tipoAlimentoEnum, estadoPlanEnum } from './_common.js';
import { patients } from './patients.js';
import { users } from './users.js';

export const foods = pgTable('foods', {
  id: uuidPk(),
  name: varchar('name', { length: 200 }).notNull(),
  brand: varchar('brand', { length: 200 }),
  category: varchar('category', { length: 50 }),
  caloriesPer100g: decimal('calories_per_100g', { precision: 8, scale: 1 }),
  proteinPer100g: decimal('protein_per_100g', { precision: 6, scale: 1 }),
  carbsPer100g: decimal('carbs_per_100g', { precision: 6, scale: 1 }),
  fatPer100g: decimal('fat_per_100g', { precision: 6, scale: 1 }),
  fiberPer100g: decimal('fiber_per_100g', { precision: 6, scale: 1 }),
  sodiumPer100g: decimal('sodium_per_100g', { precision: 8, scale: 1 }),
  sugarPer100g: decimal('sugar_per_100g', { precision: 6, scale: 1 }),
  allergens: text('allergens'),
  dietTypes: textArray('diet_types'),
  barcode: varchar('barcode', { length: 50 }),
  region: varchar('region', { length: 50 }).default('ES'),
  isLocal: boolean('is_local').default(true),
  source: tipoAlimentoEnum('source'),
  externalId: varchar('external_id', { length: 100 }),
  ...timestamps,
}, (table) => ({
  nameIdx: index('foods_name_idx').on(table.name),
  barcodeIdx: index('foods_barcode_idx').on(table.barcode),
  categoryIdx: index('foods_category_idx').on(table.category),
  isLocalIdx: index('foods_is_local_idx').on(table.isLocal),
  sourceIdx: index('foods_source_idx').on(table.source),
}));

export const foodFavorites = pgTable('food_favorites', {
  id: uuidPk(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  foodData: jsonb('food_data').notNull(),
  source: varchar('source', { length: 10 }).default('BEDCA'),
  ...timestamps,
}, (table) => ({
  userIdx: index('food_favorites_user_idx').on(table.userId),
}));

export const customDishes = pgTable('custom_dishes', {
  id: uuidPk(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  raciones: integer('raciones').default(1),
  ingredientes: jsonb('ingredientes').default(sql`'[]'::jsonb`).notNull(),
  kcal: decimal('kcal', { precision: 8, scale: 1 }),
  prot: decimal('prot', { precision: 6, scale: 1 }),
  grasas: decimal('grasas', { precision: 6, scale: 1 }),
  hc: decimal('hc', { precision: 6, scale: 1 }),
  fibra: decimal('fibra', { precision: 6, scale: 1 }),
  ...timestamps,
}, (table) => ({
  userIdx: index('custom_dishes_user_idx').on(table.userId),
}));

export const recipes = pgTable('recipes', {
  id: uuidPk(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  categoria: varchar('categoria', { length: 30 }),
  raciones: integer('raciones').default(1),
  kcal: decimal('kcal', { precision: 8, scale: 1 }),
  prot: decimal('prot', { precision: 6, scale: 1 }),
  grasas: decimal('grasas', { precision: 6, scale: 1 }),
  hc: decimal('hc', { precision: 6, scale: 1 }),
  fibra: decimal('fibra', { precision: 6, scale: 1 }),
  ingredientes: textArray('ingredientes'),
  pasos: textArray('pasos'),
  source: varchar('source', { length: 20 }).default('local'),
  mealdbId: varchar('mealdb_id', { length: 20 }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  nombreIdx: index('recipes_nombre_idx').on(table.nombre),
  categoriaIdx: index('recipes_categoria_idx').on(table.categoria),
}));

export const mealPlans = pgTable('meal_plans', {
  id: uuidPk(),
  pacienteId: uuid('paciente_id').references(() => patients.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 200 }),
  estado: estadoPlanEnum('estado').default('activo').notNull(),
  fechaCreacion: date('fecha_creacion').default(sql`CURRENT_DATE`),
  kcalObjetivo: integer('kcal_objetivo'),
  protG: integer('prot_g'),
  grasasG: integer('grasas_g'),
  hcG: integer('hc_g'),
  fibraG: integer('fibra_g'),
  aguaL: decimal('agua_l', { precision: 3, scale: 1 }),
  formulaUsada: varchar('formula_usada', { length: 50 }),
  factorActividad: decimal('factor_actividad', { precision: 4, scale: 3 }),
  patologia: varchar('patologia', { length: 200 }),
  dias: jsonb('dias').default(sql`'[]'::jsonb`).notNull(),
  comidas: jsonb('comidas').default(sql`'[]'::jsonb`).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  pacienteIdx: index('meal_plans_paciente_idx').on(table.pacienteId),
  estadoIdx: index('meal_plans_estado_idx').on(table.estado),
  pacienteEstadoIdx: index('meal_plans_paciente_estado_idx').on(table.pacienteId, table.estado),
}));

export const mealPlanTemplates = pgTable('meal_plan_templates', {
  id: uuidPk(),
  name: varchar('name', { length: 255 }).notNull(),
  objectives: jsonb('objectives').notNull(),
  durationDays: integer('duration_days').default(7),
  isAutoGenerated: boolean('is_auto_generated').default(false),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  createdByIdx: index('meal_plan_templates_created_by_idx').on(table.createdBy),
}));

export const mealPlanDays = pgTable('meal_plan_days', {
  id: uuidPk(),
  planTemplateId: uuid('plan_template_id').references(() => mealPlanTemplates.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  meals: jsonb('meals').notNull(),
  totalCalories: integer('total_calories'),
  totalMacros: jsonb('total_macros'),
  ...timestamps,
}, (table) => ({
  planTemplateIdx: index('meal_plan_days_plan_template_idx').on(table.planTemplateId),
}));

export const planTemplates = pgTable('plan_templates', {
  id: uuidPk(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  kcalObjetivo: integer('kcal_objetivo'),
  protG: integer('prot_g'),
  grasasG: integer('grasas_g'),
  hcG: integer('hc_g'),
  comidas: jsonb('comidas').default(sql`'[]'::jsonb`).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
}, (table) => ({
  nombreIdx: index('plan_templates_nombre_idx').on(table.nombre),
}));

export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type FoodFavorite = typeof foodFavorites.$inferSelect;
export type NewFoodFavorite = typeof foodFavorites.$inferInsert;
export type CustomDish = typeof customDishes.$inferSelect;
export type NewCustomDish = typeof customDishes.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;
export type MealPlanTemplate = typeof mealPlanTemplates.$inferSelect;
export type NewMealPlanTemplate = typeof mealPlanTemplates.$inferInsert;
export type MealPlanDay = typeof mealPlanDays.$inferSelect;
export type NewMealPlanDay = typeof mealPlanDays.$inferInsert;
export type PlanTemplate = typeof planTemplates.$inferSelect;
export type NewPlanTemplate = typeof planTemplates.$inferInsert;