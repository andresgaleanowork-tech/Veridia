import { z } from 'zod';
import { UUIDSchema, ISODateSchema, ISODateTimeSchema, PaginationSchema, ApiEnvelopeSchema } from './common';

export const FoodSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  category: z.string().optional(),
  kcal: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
  portion: z.string().optional(),
  source: z.string().optional(),
  created_at: ISODateSchema,
});

export type Food = z.infer<typeof FoodSchema>;

export const FoodCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  category: z.string().optional(),
  kcal: z.coerce.number().nonnegative().optional(),
  protein: z.coerce.number().nonnegative().optional(),
  fat: z.coerce.number().nonnegative().optional(),
  carbs: z.coerce.number().nonnegative().optional(),
  fiber: z.coerce.number().nonnegative().optional(),
  portion: z.string().optional(),
});

export type FoodCreate = z.infer<typeof FoodCreateSchema>;

export const FoodListQuerySchema = PaginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
});

export type FoodListQuery = z.infer<typeof FoodListQuerySchema>;

export const RecipeSchema = z.object({
  id: UUIDSchema,
  nombre: z.string().min(1),
  categoria: z.string().optional(),
  raciones: z.number().int().positive(),
  kcal: z.number().nonnegative().optional(),
  prot: z.number().nonnegative().optional(),
  grasas: z.number().nonnegative().optional(),
  hc: z.number().nonnegative().optional(),
  fibra: z.number().nonnegative().optional(),
  ingredientes: z.array(z.string()).optional(),
  pasos: z.array(z.string()).optional(),
  source: z.string().optional(),
  mealdb_id: z.string().optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
});

export type Recipe = z.infer<typeof RecipeSchema>;

export const RecipeCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  categoria: z.string().optional(),
  raciones: z.coerce.number().int().positive(),
  kcal: z.coerce.number().nonnegative().optional(),
  prot: z.coerce.number().nonnegative().optional(),
  grasas: z.coerce.number().nonnegative().optional(),
  hc: z.coerce.number().nonnegative().optional(),
  fibra: z.coerce.number().nonnegative().optional(),
  ingredientes: z.array(z.string()).optional(),
  pasos: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export type RecipeCreate = z.infer<typeof RecipeCreateSchema>;

export const RecipeListQuerySchema = PaginationSchema.extend({
  categoria: z.string().optional(),
  search: z.string().optional(),
});

export type RecipeListQuery = z.infer<typeof RecipeListQuerySchema>;

export const MealPlanMealSchema = z.object({
  nombre: z.string().min(1),
  receta_id: UUIDSchema.optional(),
  alimento_id: UUIDSchema.optional(),
  cantidad: z.number().positive(),
  unidad: z.string().optional(),
  kcal: z.number().nonnegative().optional(),
  prot: z.number().nonnegative().optional(),
  grasas: z.number().nonnegative().optional(),
  hc: z.number().nonnegative().optional(),
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
  paciente_nombre: z.string().optional(),
  nombre: z.string().optional(),
  estado: MealPlanStatusSchema,
  fecha_creacion: ISODateSchema,
  kcal_objetivo: z.number().positive().optional(),
  prot_g: z.number().nonnegative().optional(),
  grasas_g: z.number().nonnegative().optional(),
  hc_g: z.number().nonnegative().optional(),
  fibra_g: z.number().nonnegative().optional(),
  agua_l: z.number().nonnegative().optional(),
  formula_usada: z.string().optional(),
  factor_actividad: z.number().optional(),
  patologia: z.string().optional(),
  dias: z.array(MealPlanDaySchema).optional(),
  comidas: z.array(z.unknown()).optional(),
  created_by: UUIDSchema.optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type MealPlan = z.infer<typeof MealPlanSchema>;

export const MealPlanCreateSchema = z.object({
  paciente_id: UUIDSchema,
  nombre: z.string().min(1, 'Nombre requerido'),
  kcal_objetivo: z.coerce.number().positive().optional(),
  prot_g: z.coerce.number().nonnegative().optional(),
  grasas_g: z.coerce.number().nonnegative().optional(),
  hc_g: z.coerce.number().nonnegative().optional(),
  fibra_g: z.coerce.number().nonnegative().optional(),
  notas: z.string().optional(),
  dias: z.array(MealPlanDaySchema).optional(),
});

export type MealPlanCreate = z.infer<typeof MealPlanCreateSchema>;

export const MealPlanListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
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
  calories: z.coerce.number().nonnegative().optional(),
  macros: z.record(z.coerce.number()).optional(),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

export const MealEntrySchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foods: z.array(FoodItemSchema).default([]),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido').optional(),
});

export type MealEntry = z.infer<typeof MealEntrySchema>;

export const ExerciseEntrySchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  duration: z.coerce.number().int().positive().optional(),
  intensity: z.string().optional(),
  calories: z.coerce.number().nonnegative().optional(),
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
  notes: z.string().optional(),
  photo_urls: z.array(z.string()),
  created_by: UUIDSchema.optional(),
  created_at: ISODateTimeSchema,
  updated_at: ISODateTimeSchema,
});

export type FoodJournalEntry = z.infer<typeof FoodJournalSchema>;

export const FoodJournalCreateSchema = z.object({
  patient_id: UUIDSchema.optional(),
  date: ISODateSchema.optional(),
  meals: z.array(MealEntrySchema).default([]),
  symptoms: z.array(z.string()).default([]),
  exercise: z.array(ExerciseEntrySchema).default([]),
  water_intake: z.coerce.number().int().nonnegative().default(0),
  mood: MoodSchema.optional(),
  notes: z.string().optional(),
  photo_urls: z.array(z.string().url('URL inválida')).default([]),
});

export type FoodJournalCreate = z.infer<typeof FoodJournalCreateSchema>;

export const FoodJournalUpdateSchema = FoodJournalCreateSchema.partial();

export type FoodJournalUpdate = z.infer<typeof FoodJournalUpdateSchema>;

export const FoodJournalQuerySchema = PaginationSchema.extend({
  patient_id: UUIDSchema.optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
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
  allergens: z.array(z.string()).optional().default([]),
  dietType: z.string().optional().default('balanced'),
});

export const MealPlanGenerateSchema = z.object({
  calories: z.number().min(1000).max(5000),
  macros: z.object({
    protein: z.number().min(0).max(300),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(200),
  }),
  allergens: z.array(z.string()).optional().default([]),
  dietType: z.string().optional().default('balanced'),
  durationDays: z.number().min(1).max(14).default(7),
});
