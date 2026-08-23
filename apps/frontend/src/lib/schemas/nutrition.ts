import { z } from 'zod';
import { UUIDSchema, ISODateSchema, ISODateTimeSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const FoodSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  kcal: z.number().nonnegative().optional().nullable(),
  protein: z.number().nonnegative().optional().nullable(),
  fat: z.number().nonnegative().optional().nullable(),
  carbs: z.number().nonnegative().optional().nullable(),
  fiber: z.number().nonnegative().optional().nullable(),
  portion: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  created_at: ISODateSchema,
});

export type Food = z.infer<typeof FoodSchema>;

export const FoodCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  category: z.string().optional().nullable(),
  kcal: z.coerce.number().nonnegative().optional().nullable(),
  protein: z.coerce.number().nonnegative().optional().nullable(),
  fat: z.coerce.number().nonnegative().optional().nullable(),
  carbs: z.coerce.number().nonnegative().optional().nullable(),
  fiber: z.coerce.number().nonnegative().optional().nullable(),
  portion: z.string().optional().nullable(),
});

export type FoodCreate = z.infer<typeof FoodCreateSchema>;

export const FoodListQuerySchema = PaginationSchema.extend({
  category: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

export type FoodListQuery = z.infer<typeof FoodListQuerySchema>;

export const RecipeSchema = z.object({
  id: UUIDSchema,
  nombre: z.string().min(1),
  categoria: z.string().optional().nullable(),
  raciones: z.number().int().positive(),
  kcal: z.number().nonnegative().optional().nullable(),
  prot: z.number().nonnegative().optional().nullable(),
  grasas: z.number().nonnegative().optional().nullable(),
  hc: z.number().nonnegative().optional().nullable(),
  fibra: z.number().nonnegative().optional().nullable(),
  ingredientes: z.array(z.string()).optional().nullable().nullable(),
  pasos: z.array(z.string()).optional().nullable().nullable(),
  source: z.string().optional().nullable(),
  mealdb_id: z.string().optional().nullable(),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateSchema,
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const RecipeCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.string().optional().nullable(),
  raciones: z.coerce.number().int().positive(),
  kcal: z.coerce.number().nonnegative().optional().nullable(),
  prot: z.coerce.number().nonnegative().optional().nullable(),
  grasas: z.coerce.number().nonnegative().optional().nullable(),
  hc: z.coerce.number().nonnegative().optional().nullable(),
  fibra: z.coerce.number().nonnegative().optional().nullable(),
  ingredientes: z.array(z.string()).optional().nullable(),
  pasos: z.array(z.string()).optional().nullable(),
  source: z.string().optional().nullable(),
});

export type RecipeCreate = z.infer<typeof RecipeCreateSchema>;

export const RecipeListQuerySchema = PaginationSchema.extend({
  categoria: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

export type RecipeListQuery = z.infer<typeof RecipeListQuerySchema>;

export const MealPlanMealSchema = z.object({
  nombre: z.string().min(1),
  receta_id: UUIDSchema.optional().nullable(),
  alimento_id: UUIDSchema.optional().nullable(),
  cantidad: z.number().positive(),
  unidad: z.string().optional().nullable(),
  kcal: z.number().nonnegative().optional().nullable(),
  prot: z.number().nonnegative().optional().nullable(),
  grasas: z.number().nonnegative().optional().nullable(),
  hc: z.number().nonnegative().optional().nullable(),
});

export type MealPlanMeal = z.infer<typeof MealPlanMealSchema>;

export const MealPlanDaySchema = z.object({
  dia: z.number().int().min(1).max(30),
  comidas: z.array(MealPlanMealSchema),
});

export type MealPlanDay = z.infer<typeof MealPlanDaySchema>;

export const MealPlanStatusSchema = z.enum(['activo', 'inactivo', 'borrador']);

export const MealPlanSchema = z.object({
  id: UUIDSchema,
  paciente_id: UUIDSchema,
  paciente_nombre: z.string().optional().nullable(),
  nombre: z.string().optional().nullable(),
  estado: MealPlanStatusSchema,
  fecha_creacion: ISODateSchema,
  kcal_objetivo: z.number().positive().optional().nullable(),
  prot_g: z.number().nonnegative().optional().nullable(),
  grasas_g: z.number().nonnegative().optional().nullable(),
  hc_g: z.number().nonnegative().optional().nullable(),
  fibra_g: z.number().nonnegative().optional().nullable(),
  agua_l: z.number().nonnegative().optional().nullable(),
  formula_usada: z.string().optional().nullable(),
  factor_actividad: z.number().optional().nullable(),
  patologia: z.string().optional().nullable(),
  dias: z.array(MealPlanDaySchema).optional().nullable(),
  comidas: z.array(z.unknown()).optional().nullable(),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type MealPlan = z.infer<typeof MealPlanSchema>;

export const MealPlanCreateSchema = z.object({
  paciente_id: UUIDSchema,
  nombre: z.string().min(1, 'Nombre requerido'),
  kcal_objetivo: z.coerce.number().positive().optional().nullable(),
  prot_g: z.coerce.number().nonnegative().optional().nullable(),
  grasas_g: z.coerce.number().nonnegative().optional().nullable(),
  hc_g: z.coerce.number().nonnegative().optional().nullable(),
  fibra_g: z.coerce.number().nonnegative().optional().nullable(),
  notas: z.string().optional().nullable(),
  dias: z.array(MealPlanDaySchema).optional().nullable(),
});

export type MealPlanCreate = z.infer<typeof MealPlanCreateSchema>;

export const MealPlanListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional().nullable(),
  estado: MealPlanStatusSchema.optional(),
});

export type MealPlanListQuery = z.infer<typeof MealPlanListQuerySchema>;

export const FoodApiEnvelopeSchema = ApiEnvelopeSchema(FoodSchema);
export const FoodListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(FoodSchema));
export const RecipeApiEnvelopeSchema = ApiEnvelopeSchema(RecipeSchema);
export const RecipeListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(RecipeSchema));
export const MealPlanApiEnvelopeSchema = ApiEnvelopeSchema(MealPlanSchema);
export const MealPlanListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(MealPlanSchema));


export const FoodItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  portion: z.string().min(1, 'Porción requerida'),
  calories: z.coerce.number().nonnegative().optional().nullable(),
  macros: z.record(z.coerce.number()).optional().nullable(),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

export const MealEntrySchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foods: z.array(FoodItemSchema).default([]),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido').optional().nullable(),
});

export type MealEntry = z.infer<typeof MealEntrySchema>;

export const ExerciseEntrySchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  duration: z.coerce.number().int().positive().optional().nullable(),
  intensity: z.string().optional().nullable(),
  calories: z.coerce.number().nonnegative().optional().nullable(),
});

export type ExerciseEntry = z.infer<typeof ExerciseEntrySchema>;

const MoodSchema = z.enum(['great', 'good', 'neutral', 'bad', 'terrible']);

export const FoodJournalSchema = z.object({
  id: UUIDSchema,
  patient_id: UUIDSchema,
  date: ISODateSchema,
  meals: z.array(MealEntrySchema),
  symptoms: z.array(z.string()),
  exercise: z.array(ExerciseEntrySchema),
  water_intake: z.coerce.number().int().nonnegative(),
  mood: MoodSchema.optional(),
  notes: z.string().optional().nullable(),
  photo_urls: z.array(z.string()),
  created_by: UUIDSchema.optional().nullable(),
  created_at: ISODateTimeSchema,
  updated_at: ISODateTimeSchema,
});

export type FoodJournalEntry = z.infer<typeof FoodJournalSchema>;

export const FoodJournalCreateSchema = z.object({
  patient_id: UUIDSchema.optional().nullable(),
  date: ISODateSchema.optional().nullable(),
  meals: z.array(MealEntrySchema).default([]),
  symptoms: z.array(z.string()).default([]),
  exercise: z.array(ExerciseEntrySchema).default([]),
  water_intake: z.coerce.number().int().nonnegative().default(0),
  mood: MoodSchema.optional(),
  notes: z.string().optional().nullable(),
  photo_urls: z.array(z.string().url('URL inválida')).default([]),
});

export type FoodJournalCreate = z.infer<typeof FoodJournalCreateSchema>;

export const FoodJournalUpdateSchema = FoodJournalCreateSchema.partial();

export type FoodJournalUpdate = z.infer<typeof FoodJournalUpdateSchema>;

export const FoodJournalQuerySchema = PaginationSchema.extend({
  patient_id: UUIDSchema.optional().nullable(),
  fecha_desde: ISODateSchema.optional().nullable(),
  fecha_hasta: ISODateSchema.optional().nullable(),
});

export type FoodJournalQuery = z.infer<typeof FoodJournalQuerySchema>;

export const JournalStatsSchema = z.object({
  patientId: UUIDSchema,
  totalEntries: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  averages: z.object({
    waterIntakeMl: z.number(),
    calories: z.number(),
    exerciseMinutes: z.number(),
    exerciseSessions: z.number(),
  }),
  moodDistribution: z.record(z.number()),
  topSymptoms: z.array(z.object({ symptom: z.string(), count: z.number() })),
  completionRate: z.number(),
});

export type JournalStats = z.infer<typeof JournalStatsSchema>;

export const FoodJournalApiEnvelopeSchema = ApiEnvelopeSchema(FoodJournalSchema);
export const FoodJournalListApiEnvelopeSchema = ApiEnvelopeSchema(z.array(FoodJournalSchema));
export const JournalStatsApiEnvelopeSchema = ApiEnvelopeSchema(JournalStatsSchema);

export const MealObjectiveSchema = z.object({
  calories: z.number().min(1000).max(5000),
  macros: z.object({
    protein: z.number().min(0).max(300),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(200),
  }),
  allergens: z.array(z.string()).optional().nullable().default([]),
  dietType: z.string().optional().nullable().default('balanced'),
});

export const MealPlanGenerateSchema = z.object({
  calories: z.number().min(1000).max(5000),
  macros: z.object({
    protein: z.number().min(0).max(300),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(200),
  }),
  allergens: z.array(z.string()).optional().nullable().default([]),
  dietType: z.string().optional().nullable().default('balanced'),
  durationDays: z.number().min(1).max(14).default(7),
});
