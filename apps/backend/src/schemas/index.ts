import { z } from 'zod';

// Common schemas
const UUIDSchema = z.string().uuid('ID inválido');
const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');
const ISODateTimeSchema = z.string().datetime({ offset: true });

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
});

// Patient
const PatientSexSchema = z.enum(['MASCULINO', 'FEMENINO', 'OTRO']);

const PatientCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  apellidos: z.string().min(1, 'Apellidos requeridos').max(200),
  dni: z.string().optional(),
  fecha_nacimiento: ISODateSchema.optional(),
  sexo: PatientSexSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  profesion: z.string().optional(),
  nacionalidad: z.string().optional(),
  estado_civil: z.string().optional(),
  educacion: z.string().optional(),
  procedencia: z.string().optional(),
  motivo_consulta: z.string().optional(),
  grupo_sanguineo: z.string().optional(),
});

const PatientUpdateSchema = PatientCreateSchema.partial();

const PatientListQuerySchema = PaginationSchema.extend({
  activo: z.coerce.boolean().optional(),
});

// Appointment
const AppointmentStatusSchema = z.enum(['Pendiente', 'Confirmada', 'Realizada', 'No asistió', 'Cancelada']);

const AppointmentCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  tipo: z.string().optional(),
  asunto: z.string().optional(),
  estado: AppointmentStatusSchema.optional(),
  pago: z.string().optional(),
  precio: z.coerce.number().nonnegative().optional(),
  duracion: z.coerce.number().int().positive().optional(),
  nota: z.string().optional(),
  color: z.string().optional(),
  provider_id: UUIDSchema.optional(),
});

const AppointmentUpdateSchema = AppointmentCreateSchema.partial();

const AppointmentListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
  estado: AppointmentStatusSchema.optional(),
  fecha: ISODateSchema.optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
  provider_id: UUIDSchema.optional(),
});

// Invoice
const InvoiceStatusSchema = z.enum(['Pendiente', 'Pagada', 'Vencida', 'Anulada']);

const InvoiceLineSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().int().positive(),
  precio: z.number().nonnegative(),
});

const InvoicePaymentSchema = z.object({
  importe: z.number().positive(),
  metodo: z.string().min(1),
  fecha: ISODateSchema.optional(),
});

const InvoiceCreateSchema = z.object({
  paciente_id: UUIDSchema,
  concepto: z.string().min(1, 'Concepto requerido'),
  total: z.coerce.number().positive('Total requerido'),
  estado: InvoiceStatusSchema.optional(),
  fecha: ISODateSchema.optional(),
  notas: z.string().optional(),
  lineas: z.array(InvoiceLineSchema).optional(),
});

const InvoiceUpdateSchema = InvoiceCreateSchema.partial();

const InvoiceListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
  estado: InvoiceStatusSchema.optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});

// Recipe
const RecipeCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
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
  mealdb_id: z.string().optional(),
});

const RecipeUpdateSchema = RecipeCreateSchema.partial();

const RecipeListQuerySchema = PaginationSchema.extend({
  categoria: z.string().optional(),
  search: z.string().optional(),
});

const RecipeScaleSchema = z.object({
  targetServings: z.coerce.number().int().positive('Raciones objetivo requeridas'),
});

// Meal Plan
const MealPlanStatusSchema = z.enum(['activo', 'inactivo', 'borrador']);

const MealPlanMealSchema = z.object({
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

const MealPlanDaySchema = z.object({
  dia: z.number().int().min(1).max(30),
  comidas: z.array(MealPlanMealSchema),
});

const MealPlanCreateSchema = z.object({
  paciente_id: UUIDSchema,
  nombre: z.string().min(1, 'Nombre requerido').optional(),
  kcal_objetivo: z.coerce.number().positive().optional(),
  prot_g: z.coerce.number().nonnegative().optional(),
  grasas_g: z.coerce.number().nonnegative().optional(),
  hc_g: z.coerce.number().nonnegative().optional(),
  fibra_g: z.coerce.number().nonnegative().optional(),
  agua_l: z.coerce.number().nonnegative().optional(),
  formula_usada: z.string().optional(),
  factor_actividad: z.coerce.number().optional(),
  patologia: z.string().optional(),
  dias: z.array(MealPlanDaySchema).optional(),
});

const MealPlanUpdateSchema = MealPlanCreateSchema.partial();

const MealPlanListQuerySchema = PaginationSchema.extend({
  paciente_id: UUIDSchema.optional(),
  estado: MealPlanStatusSchema.optional(),
});

// Food
const FoodCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  category: z.string().optional(),
  kcal: z.coerce.number().nonnegative().optional(),
  protein: z.coerce.number().nonnegative().optional(),
  fat: z.coerce.number().nonnegative().optional(),
  carbs: z.coerce.number().nonnegative().optional(),
  fiber: z.coerce.number().nonnegative().optional(),
  portion: z.string().optional(),
});

const FoodUpdateSchema = FoodCreateSchema.partial();

const FoodListQuerySchema = PaginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
});

const FoodImportSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  calories_per_100g: z.coerce.number().nonnegative().optional(),
  protein_per_100g: z.coerce.number().nonnegative().optional(),
  carbs_per_100g: z.coerce.number().nonnegative().optional(),
  fat_per_100g: z.coerce.number().nonnegative().optional(),
  fiber_per_100g: z.coerce.number().nonnegative().optional(),
  sodium_per_100g: z.coerce.number().nonnegative().optional(),
  sugar_per_100g: z.coerce.number().nonnegative().optional(),
  allergens: z.array(z.string()).optional().default([]),
  diet_types: z.array(z.string()).optional().default([]),
  barcode: z.string().optional(),
  region: z.string().optional(),
  is_local: z.boolean().default(false),
  source: z.string().default('manual'),
});

// Clinical
const AnamnesisCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  template: z.string().optional(),
  profesional: z.string().optional(),
  sistemas: z.array(z.string()).optional(),
  respuestas: z.record(z.unknown()).optional(),
  red_flags: z.array(z.unknown()).optional(),
});

const AnthropometryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  peso: z.coerce.number().positive().optional(),
  altura: z.coerce.number().positive().optional(),
  cintura: z.coerce.number().positive().optional(),
  cadera: z.coerce.number().positive().optional(),
  pantorrilla: z.coerce.number().positive().optional(),
  grasa_corporal: z.coerce.number().nonnegative().optional(),
  masa_muscular: z.coerce.number().nonnegative().optional(),
  grasa_visceral: z.coerce.number().nonnegative().optional(),
  metodo: z.string().optional(),
});

const AnthropometryMetricSchema = z.enum(['peso', 'altura', 'imc', 'cintura', 'cadera', 'pantorrilla', 'grasa_corporal', 'masa_muscular', 'grasa_visceral']);

const AnthropometryTrendsQuerySchema = z.object({
  from: ISODateSchema.optional(),
  to: ISODateSchema.optional(),
  metric: AnthropometryMetricSchema.default('peso'),
});

const BiomarkerSchema = z.object({
  nombre: z.string().min(1),
  valor: z.number(),
  unidad: z.string().optional(),
  referencia: z.string().optional(),
  alerta: z.enum(['normal', 'advertencia', 'peligro']).optional(),
});

const AnalyticsCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema,
  ayuno: z.boolean().optional(),
  marcadores: z.array(BiomarkerSchema).min(1, 'Al menos un marcador requerido'),
});

const ClinicalHistoryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  version: z.number().int().positive().optional(),
  antecedentes: z.string().optional(),
  antecedentes_familiares: z.string().optional(),
  alergias: z.string().optional(),
  medicacion: z.string().optional(),
  suplementacion: z.string().optional(),
  historial_ponderal: z.record(z.unknown()).optional(),
  actividad_fisica: z.record(z.unknown()).optional(),
  habitos_toxicos: z.string().optional(),
  sueno: z.string().optional(),
  estres: z.string().optional(),
  ingesta_hidrica: z.string().optional(),
  observaciones: z.string().optional(),
});

const FormulaRequestSchema = z.object({
  peso: z.number().positive(),
  altura: z.number().positive(),
  edad: z.number().int().positive(),
  sexo: z.enum(['M', 'F']),
  formula: z.string().optional(),
  fa: z.number().min(1).max(2.5),
  fe: z.number().positive().default(1),
  ajuste: z.number().default(0),
  protGkg: z.number().positive().default(1.2),
  grasasPct: z.number().min(0).max(100).default(30),
  objetivo: z.enum(['mantener', 'perder', 'ganar']).optional(),
  patologia: z.string().optional(),
});

const AlertSeveritySchema = z.enum(['leve', 'moderada', 'grave', 'critica']);
const AlertStatusSchema = z.enum(['pendiente', 'revisada']);

const AlertCreateSchema = z.object({
  paciente_id: UUIDSchema,
  tipo: z.string().optional(),
  severidad: AlertSeveritySchema,
  mensaje: z.string().min(1),
  recomendacion: z.string().optional(),
  estado: AlertStatusSchema.optional(),
});

// Expense (Gasto)
const ExpenseCreateSchema = z.object({
  categoria: z.string().min(1, 'Categoría requerida'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  importe: z.coerce.number().positive('Importe requerido'),
  fecha: ISODateSchema,
  metodo_pago: z.string().optional(),
  recurrente: z.boolean().optional(),
  frecuencia: z.string().optional(),
  proveedor: z.string().optional(),
  notas: z.string().optional(),
});

const ExpenseUpdateSchema = ExpenseCreateSchema.partial();

const ExpenseListQuerySchema = PaginationSchema.extend({
  categoria: z.string().optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});

// Auth
const LoginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const RegisterRequestSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['admin', 'nutricionista', 'secretaria']),
});

const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
});

const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

// User
const UserRoleSchema = z.enum(['admin', 'nutricionista', 'secretaria', 'trial']);

const UserUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
  active: z.boolean().optional(),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  titulacion: z.string().optional(),
  matricula: z.string().optional(),
  pais: z.string().optional(),
});

const UserListQuerySchema = PaginationSchema.extend({
  role: UserRoleSchema.optional(),
  active: z.coerce.boolean().optional(),
});


// Onboarding
const OnboardingTemplateSchema = z.object({
  name: z.string().min(1),
  fields: z.array(z.object({
    type: z.string(),
    label: z.string(),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).default([]),
  active: z.boolean().default(true),
});

const OnboardingSubmitSchema = z.object({
  templateId: z.string().uuid().optional(),
  responses: z.record(z.any()),
  waiversSigned: z.record(z.any()).optional(),
  completed: z.boolean().optional().default(false),
});

// Tenant / RBAC
const TenantCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  settings: z.any().optional(),
});

const RoleCreateSchema = z.object({
  tenantId: z.number().int().positive(),
  name: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});
// Settings
const SettingsUpdateSchema = z.object({
  clinic_name: z.string().optional(),
  clinic_address: z.string().optional(),
  clinic_phone: z.string().optional(),
  clinic_email: z.string().email().optional(),
  clinic_nif: z.string().optional(),
  invoice_prefix: z.string().optional(),
  invoice_footer: z.string().optional(),
  default_vat: z.coerce.number().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  time_format: z.string().optional(),
  week_start: z.coerce.number().int().min(0).max(6).optional(),
  appointment_duration: z.coerce.number().int().positive().optional(),
  appointment_buffer: z.coerce.number().int().nonnegative().optional(),
  reminder_hours: z.coerce.number().int().positive().optional(),
  reminder_enabled: z.boolean().optional(),
  auto_backup: z.boolean().optional(),
  backup_frequency: z.string().optional(),
  backup_retention: z.coerce.number().int().positive().optional(),
});

// Messages
const MessageCreateSchema = z.object({
  paciente_id: UUIDSchema,
  sender: z.enum(['patient', 'nutri']),
  text: z.string().min(1, 'Mensaje requerido'),
});

// Patient Data
const DiaryCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema.optional(),
  toma: z.string().min(1, 'Toma requerida'),
  texto: z.string().min(1, 'Texto requerido'),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const SymptomCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha: ISODateSchema.optional(),
  tipo: z.enum(['animo', 'hambre', 'sueno', 'sintoma']),
  valor: z.string().min(1, 'Valor requerido'),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// Cash
const CashMovementSchema = z.object({
  tipo: z.enum(['Ingreso', 'Egreso']),
  importe: z.coerce.number().positive(),
  descripcion: z.string().optional(),
  metodo: z.string().optional(),
  fecha: ISODateTimeSchema.optional(),
});

const CashSessionCreateSchema = z.object({
  saldo_inicial: z.coerce.number().nonnegative(),
});

const CashMovementCreateSchema = z.object({
  tipo: z.enum(['Ingreso', 'Egreso']),
  importe: z.coerce.number().positive(),
  descripcion: z.string().min(1),
  metodo: z.string().min(1),
  fecha: ISODateTimeSchema.optional(),
});

// Food Favorites
const FoodFavoriteCreateSchema = z.object({
  food_data: z.record(z.unknown()),
  source: z.string().optional(),
});

// Custom Dishes
const CustomDishCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  raciones: z.coerce.number().int().positive().default(1),
  ingredientes: z.array(z.unknown()).optional(),
  kcal: z.coerce.number().nonnegative().optional(),
  prot: z.coerce.number().nonnegative().optional(),
  grasas: z.coerce.number().nonnegative().optional(),
  hc: z.coerce.number().nonnegative().optional(),
  fibra: z.coerce.number().nonnegative().optional(),
});

// Audit
const AuditListQuerySchema = PaginationSchema.extend({
  user_id: UUIDSchema.optional(),
  entidad: z.string().optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});

// Patient Food Journal
const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
const FoodItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  portion: z.string().min(1, 'Porción requerida'),
  calories: z.coerce.number().nonnegative().optional(),
  macros: z.record(z.coerce.number()).optional(),
});
const MealEntrySchema = z.object({
  type: MealTypeSchema,
  foods: z.array(FoodItemSchema).optional().default([]),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido').optional(),
});
const ExerciseEntrySchema = z.object({
  type: z.string().min(1, 'Tipo requerido'),
  duration: z.coerce.number().int().positive().optional(),
  intensity: z.string().optional(),
  calories: z.coerce.number().nonnegative().optional(),
});
const MoodSchema = z.enum(['great', 'good', 'neutral', 'bad', 'terrible']);

const PatientFoodJournalCreateSchema = z.object({
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

const PatientFoodJournalUpdateSchema = PatientFoodJournalCreateSchema.partial();

const PatientFoodJournalQuerySchema = PaginationSchema.extend({
  patient_id: UUIDSchema.optional(),
  fecha_desde: ISODateSchema.optional(),
  fecha_hasta: ISODateSchema.optional(),
});



// AI Scribe
const AIScribeTranscribeSchema = z.object({
  patientId: z.string().uuid(),
  audio: z.string().optional(),
  text: z.string().optional(),
});

const AIScribeNoteSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  transcription: z.string(),
  soapNote: z.object({
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
  }).optional(),
  status: z.enum(['draft', 'finalized']),
  createdAt: z.string().datetime(),
});

// Meal Plan Generator
const MealPlanGenerateSchema = z.object({
  patientId: z.string().uuid().optional(),
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

const MealPlanTemplateSchema = z.object({
  name: z.string().min(1),
  objectives: z.object({
    calories: z.number(),
    macros: z.object({ protein: z.number(), carbs: z.number(), fat: z.number() }),
    allergens: z.array(z.string()).optional(),
    dietType: z.string().optional(),
  }),
  durationDays: z.number().min(1).max(14).default(7),
  isAutoGenerated: z.boolean().default(false),
});

// Patient Portal
const PatientLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const PatientPortalSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  telefono: z.string().optional(),
});

// Automations
const AutomationCreateSchema = z.object({
  name: z.string().min(1),
  trigger: z.string(),
  conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })).optional().default([]),
  actions: z.array(z.object({ type: z.string(), params: z.any() })).optional().default([]),
  active: z.boolean().default(true),
});

const AutomationUpdateSchema = AutomationCreateSchema.partial();

const TelehealthStartSchema = z.object({
  appointmentId: UUIDSchema,
  provider: z.string().optional(),
});


// Payment
const PaymentCreateSchema = z.object({
  patientId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  method: z.string().min(1),
});

const SubscriptionCreateSchema = z.object({
  patientId: z.string().uuid(),
  plan: z.string(),
  stripeSubscriptionId: z.string().optional(),
});


// Reports
const ReportGenerateSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  params: z.any().optional(),
});

const ReportQuerySchema = PaginationSchema.extend({
  type: z.string().optional(),
});

// Integrations / API v1
const ApiKeyCreateSchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).optional().default([]),
});

const WebhookCreateSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  secret: z.string().optional(),
});

// Care Process
const CareProcessStartSchema = z.object({
  paciente_id: UUIDSchema,
  motivo_consulta: z.string().min(1).max(500),
  screening_tool: z.enum(['NRS-2002', 'MUST', 'SNAQ', 'MNA-SF']),
  screening_score: z.number().min(0).max(10),
  screening_risk: z.enum(['BAJO', 'MODERADO', 'ALTO']),
});

const CareProcessStepSchema = z.object({
  step: z.enum(['screening', 'assessment', 'diagnosis', 'intervention', 'followup', 'reevaluation']),
  data: z.record(z.any()),
});

const TemplateCreateSchema = z.object({
  nombre: z.string().min(1).max(200),
  tipo: z.enum(['meal_plan', 'note', 'report']),
  contenido: z.record(z.any()),
  tags: z.array(z.string()).optional(),
});

const TemplateUpdateSchema = TemplateCreateSchema.partial();

const ReportEnhancedCreateSchema = z.object({
  paciente_id: UUIDSchema,
  fecha_inicio: ISODateSchema,
  fecha_fin: ISODateSchema,
  tipo: z.enum(['comparison', 'timeline', 'outcomes']),
});

const SupplementTipoSchema = z.enum(['suplemento', 'medicamento', 'vitamina', 'mineral']);
const SupplementViaSchema = z.enum(['oral', 'inyectable', 'topica']);

const SupplementCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  tipo: SupplementTipoSchema,
  dosis: z.string().max(100).optional(),
  frecuencia: z.string().max(100).optional(),
  horarios: z.array(z.string()).optional().default([]),
  via: SupplementViaSchema.optional(),
  fechaInicio: ISODateSchema.optional(),
  fechaFin: ISODateSchema.optional(),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
  activo: z.boolean().default(true),
  pacienteId: UUIDSchema,
});

const SupplementUpdateSchema = SupplementCreateSchema.partial().omit({ pacienteId: true });

const SupplementAdherenceCreateSchema = z.object({
  fecha: ISODateSchema,
  tomado: z.boolean().default(false),
  horaTomado: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido').optional(),
  notas: z.string().optional(),
});

export {
  SupplementTipoSchema,
  SupplementViaSchema,
  SupplementCreateSchema,
  SupplementUpdateSchema,
  SupplementAdherenceCreateSchema,
};

export {
  UUIDSchema,
  ISODateSchema,
  ISODateTimeSchema,
  PaginationSchema,

  // Patient
  PatientCreateSchema,
  PatientUpdateSchema,
  PatientListQuerySchema,
  PatientSexSchema,

  // Appointment
  AppointmentCreateSchema,
  AppointmentUpdateSchema,
  AppointmentStatusSchema,
  AppointmentListQuerySchema,

  // Invoice
  InvoiceCreateSchema,
  InvoiceUpdateSchema,
  InvoiceLineSchema,
  InvoicePaymentSchema,
  InvoiceStatusSchema,
  InvoiceListQuerySchema,

  // Recipe
  RecipeCreateSchema,
  RecipeUpdateSchema,
  RecipeListQuerySchema,
  RecipeScaleSchema,

  // Meal Plan
  MealPlanCreateSchema,
  MealPlanUpdateSchema,
  MealPlanStatusSchema,
  MealPlanListQuerySchema,
  MealPlanMealSchema,
  MealPlanDaySchema,

  // Food
  FoodCreateSchema,
  FoodUpdateSchema,
  FoodListQuerySchema,
  FoodImportSchema,

  // Clinical
  AnamnesisCreateSchema,
  AnthropometryCreateSchema,
  AnthropometryTrendsQuerySchema,
  AnthropometryMetricSchema,
  AnalyticsCreateSchema,
  BiomarkerSchema,
  ClinicalHistoryCreateSchema,
  FormulaRequestSchema,
  AlertCreateSchema,
  AlertSeveritySchema,
  AlertStatusSchema,

  // Expense
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
  ExpenseListQuerySchema,

  // Auth
  LoginRequestSchema,
  RegisterRequestSchema,
  ChangePasswordRequestSchema,
  RefreshRequestSchema,

  // User
  UserUpdateSchema,
  UserListQuerySchema,
  UserRoleSchema,

  
  OnboardingTemplateSchema,
  OnboardingSubmitSchema,
// Settings
  SettingsUpdateSchema,

  // Messages
  MessageCreateSchema,

  // Patient Data
  DiaryCreateSchema,
  SymptomCreateSchema,

  // Patient Food Journal
  MealTypeSchema,
  FoodItemSchema,
  MealEntrySchema,
  ExerciseEntrySchema,
  MoodSchema,
  PatientFoodJournalCreateSchema,
  PatientFoodJournalUpdateSchema,
  PatientFoodJournalQuerySchema,

  // Cash
  CashMovementSchema,
  CashSessionCreateSchema,
  CashMovementCreateSchema,

  // Food Favorites
  FoodFavoriteCreateSchema,

  // Custom Dishes
  CustomDishCreateSchema,

  // Audit
  AuditListQuerySchema,

  // AI Scribe
  AIScribeTranscribeSchema,
  AIScribeNoteSchema,

  MealPlanGenerateSchema,
  MealPlanTemplateSchema,

  PatientLoginSchema,
  PatientPortalSchema,

  TelehealthStartSchema,
  ReportGenerateSchema,
  ReportQuerySchema,
  AutomationCreateSchema,
  AutomationUpdateSchema,

  // Tenant / RBAC
  TenantCreateSchema,
  RoleCreateSchema,

  // Integrations
  ApiKeyCreateSchema,
  WebhookCreateSchema,

  CareProcessStartSchema,
  CareProcessStepSchema,
  TemplateCreateSchema,
  TemplateUpdateSchema,
  ReportEnhancedCreateSchema,

  // Payment
  PaymentCreateSchema,
  SubscriptionCreateSchema,
};
