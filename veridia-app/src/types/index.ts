// Database types — matches PostgreSQL schema

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'nutricionista' | 'secretaria' | 'trial';
  initials?: string;
  avatar?: string;
  active: boolean;
  trial_expires?: string;
  dni?: string;
  telefono?: string;
  titulacion?: string;
  matricula?: string;
  pais?: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  nombre: string;
  apellidos: string;
  dni?: string;
  fecha_nacimiento?: string;
  sexo?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  email?: string;
  telefono?: string;
  direccion?: string;
  profesion?: string;
  nacionalidad?: string;
  estado_civil?: string;
  educacion?: string;
  procedencia?: string;
  motivo_consulta?: string;
  grupo_sanguineo?: string;
  tags?: string[];
  consents?: Record<string, unknown>;
  activo: boolean;
  clinica_id?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalHistory {
  id: string;
  paciente_id: string;
  version: number;
  antecedentes?: string;
  antecedentes_familiares?: string;
  alergias?: string;
  medicacion?: string;
  suplementacion?: string;
  historial_ponderal?: Record<string, unknown>;
  actividad_fisica?: Record<string, unknown>;
  habitos_toxicos?: string;
  sueno?: string;
  estres?: string;
  ingesta_hidrica?: string;
  observaciones?: string;
  created_by?: string;
  created_at: string;
}

export interface Anamnesis {
  id: string;
  paciente_id: string;
  fecha: string;
  template?: string;
  profesional?: string;
  sistemas?: string[];
  respuestas?: Record<string, unknown>;
  red_flags?: unknown[];
  created_at: string;
}

export interface Antropometria {
  id: string;
  paciente_id: string;
  fecha: string;
  peso?: number;
  altura?: number;
  imc?: number;
  cintura?: number;
  cadera?: number;
  pantorrilla?: number;
  grasa_corporal?: number;
  masa_muscular?: number;
  grasa_visceral?: number;
  metodo?: string;
  created_by?: string;
  created_at: string;
}

export interface Analitica {
  id: string;
  paciente_id: string;
  fecha: string;
  ayuno?: boolean;
  marcadores: Biomarker[];
  created_by?: string;
  created_at: string;
}

export interface Biomarker {
  nombre: string;
  valor: number;
  unidad?: string;
  referencia?: string;
  alerta?: 'normal' | 'advertencia' | 'peligro';
}

export interface Appointment {
  id: string;
  paciente_id: string;
  paciente_nombre?: string;
  profesional?: string;
  fecha: string;
  hora: string;
  tipo?: string;
  asunto?: string;
  estado: 'Pendiente' | 'Confirmada' | 'Realizada' | 'No asistió' | 'Cancelada';
  pago?: string;
  precio?: number;
  duracion?: number;
  nota?: string;
  color?: string;
  provider_id?: string;
  acta?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  userId: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  colorCalendar: string;
  calendarType: string;
  active: boolean;
}

export interface CalendarEvent {
  id: string;
  providerId: string;
  appointmentId: string;
  externalEventId?: string;
  syncStatus: string;
}

export interface Invoice {
  id: string;
  numero: string;
  paciente_id: string;
  paciente_nombre?: string;
  fecha: string;
  estado: 'Pendiente' | 'Pagada' | 'Vencida' | 'Anulada';
  total: number;
  lineas: InvoiceLine[];
  pagos: InvoicePayment[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  descripcion: string;
  cantidad: number;
  precio: number;
}

export interface InvoicePayment {
  importe: number;
  metodo: string;
  fecha: string;
}

export interface Recipe {
  id: string;
  nombre: string;
  categoria?: string;
  raciones: number;
  kcal?: number;
  prot?: number;
  grasas?: number;
  hc?: number;
  fibra?: number;
  ingredientes?: string[];
  pasos?: string[];
  source?: string;
  mealdb_id?: string;
  created_by?: string;
  created_at: string;
}

export interface MealPlan {
  id: string;
  paciente_id: string;
  paciente_nombre?: string;
  nombre?: string;
  estado: 'activo' | 'inactivo' | 'borrador';
  fecha_creacion: string;
  kcal_objetivo?: number;
  prot_g?: number;
  grasas_g?: number;
  hc_g?: number;
  fibra_g?: number;
  agua_l?: number;
  formula_usada?: string;
  factor_actividad?: number;
  patologia?: string;
  dias?: unknown[];
  comidas?: unknown[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  paciente_id: string;
  tipo?: string;
  severidad: 'leve' | 'moderada' | 'grave' | 'critica';
  mensaje: string;
  recomendacion?: string;
  estado: 'pendiente' | 'revisada';
  fecha?: string;
  created_by?: string;
  created_at: string;
}

export interface Message {
  id: string;
  paciente_id: string;
  sender: 'patient' | 'nutri';
  text: string;
  read: boolean;
  created_at: string;
}

export interface CashSession {
  id: string;
  fecha: string;
  estado: 'Abierta' | 'Cerrada';
  saldo_inicial: number;
  movimientos: CashMovement[];
  created_by?: string;
  created_at: string;
}

export interface CashMovement {
  tipo: 'Ingreso' | 'Egreso';
  importe: number;
  descripcion: string;
  metodo: string;
  fecha: string;
}

export interface FoodFavorite {
  id: string;
  user_id: string;
  food_data: Record<string, unknown>;
  source: string;
  created_at: string;
}

export interface CustomDish {
  id: string;
  user_id: string;
  nombre: string;
  raciones: number;
  ingredientes: unknown[];
  kcal?: number;
  prot?: number;
  grasas?: number;
  hc?: number;
  fibra?: number;
  created_at: string;
}

export interface Food {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;
  sugar_per_100g?: number;
  allergens?: string[];
  diet_types?: string[];
  barcode?: string;
  region?: string;
  is_local?: boolean;
  source?: string;
}

export interface PatientDiary {
  id: string;
  paciente_id: string;
  fecha: string;
  toma: string;
  texto: string;
  hora: string;
  created_at: string;
}

export interface PatientSymptom {
  id: string;
  paciente_id: string;
  fecha: string;
  tipo: 'animo' | 'hambre' | 'sueno' | 'sintoma';
  valor: string;
  hora: string;
  created_at: string;
}

export interface Gasto {
  id: string;
  categoria: string;
  descripcion?: string;
  importe: number;
  fecha: string;
  metodo_pago?: string;
  recurrente?: boolean;
  frecuencia?: string;
  proveedor?: string;
  notas?: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  usuario?: string;
  rol?: string;
  accion: string;
  entidad?: string;
  paciente?: string;
  ip?: string;
  detalles?: Record<string, unknown>;
  created_at: string;
}

export interface FitnessConnection {
  id: string;
  paciente_id: string;
  platform: 'google_fit' | 'apple_health' | 'fitbit' | 'samsung_health' | 'garmin';
  external_user_id?: string;
  scopes?: string[];
  connected_at: string;
  last_synced_at?: string;
  active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FitnessActivity {
  id: string;
  paciente_id: string;
  connection_id: string;
  platform: string;
  external_id: string;
  type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  steps: number;
  calories_burned: number;
  distance_meters: number;
  active_minutes: number;
  intensity: 'light' | 'moderate' | 'vigorous' | 'unknown';
  source_data: Record<string, unknown>;
  imported_at: string;
}

export interface FitnessSummary {
  patientId: string;
  totalActivities: number;
  totalSteps: number;
  totalActiveMinutes: number;
  totalCaloriesBurned: number;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  activityFactor: {
    factor: number;
    label: string;
    reason?: string | null;
  };
}

export type ActivityFactor = {
  factor: number;
  label: string;
};

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}

export type ReportType = 'paciente_completo' | 'nutricional' | 'clinico' | 'evolucion' | 'kpis';

export interface ReportTemplate {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: ReportType;
  contenido: Record<string, unknown>;
  activo: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  params: any;
  result: any;
  fileUrl?: string;
  createdAt: string;
}

export interface KPIData {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  avgAppointmentsPerPatient: number;
  generatedAt: string;
}

// Desarrollada types
export interface ExchangeGroup {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  examples: string;
}

export interface PathologyProfile {
  key: string;
  name: string;
  fe: number;
  protGkg: number;
  grasasPct: number;
  micros: Record<string, { min?: number; max?: number; unit: string }>;
  note: string;
  espenMacros: string;
  ajusteKcal?: number;
  meds: Record<string, string>;
}

export interface FormulaInput {
  patientId: string;
  peso: number;
  altura: number;
  edad: number;
  sexo: 'M' | 'F';
  formula: 'Mifflin-St Jeor' | 'Harris-Benedict' | 'Owen';
  fa: number;
  fe: number;
  ajuste: number;
  patologia: string;
  patKey: string;
}

export interface MacroResult {
  geb: number;
  get: number;
  protGkg: number;
  grasasPct: number;
  protG: number;
  grasasG: number;
  hcG: number;
  fibraG: number;
  aguaL: number;
  fe: number;
  ajuste: number;
}

export interface MealItem {
  food: {
    n: string;
    k: number;
    p: number;
    gr: number;
    h: number;
    fi: number;
    na: number;
    K: number;
    _src: string;
  };
  gramos: number;
  nombre: string;
  grupo: string;
  unit: string;
}

export interface MealSlot {
  nombre: string;
  pct: number;
  alimentos: MealItem[];
}

export interface MealPlanTemplate {
  id: string;
  nombre: string;
  patologia: string;
  get: number;
  geb: number;
  protGkg: number;
  grasasPct: number;
  comidas: MealSlot[];
  createdAt: string;
}

export interface DesarrolladaState extends FormulaInput, MacroResult {
  step: number;
  selectedPaths: string[];
  combinedReqs: {
    prot: { min: number; max: number };
    grasas: { min: number; max: number };
    restrict: string[];
    increase: string[];
  } | null;
  microVigilados: Record<string, { min?: number; max?: number; unit: string }>;
  medAlerts: string[];
  comidas: MealSlot[];
  medicacion: string;
  alergias: string;
}

// Anamnesis form data type
export interface AnamnesisFormData {
  respuestas: Record<string, unknown>;
  red_flags: string[];
}

// Form data types
export interface AnamnesisFormData {
  respuestas: Record<string, unknown>;
  red_flags: string[];
}

export interface AnthropometryFormData {
  fecha: string;
  metodo?: string;
  peso?: number;
  altura?: number;
  cintura?: number;
  cadera?: number;
  pantorrilla?: number;
  grasa_corporal?: number;
  masa_muscular?: number;
  grasa_visceral?: number;
}

export interface RecipeFormData {
  nombre: string;
  raciones: number;
  grasas?: number;
  hc?: number;
  fibra?: number;
  kcal?: number;
  source?: string;
  categoria?: string;
  prot?: number;
  ingredientes?: string[];
  pasos?: string[];
}

export interface ReportFormData {
  paciente_id: string;
  tipo: ReportType;
  plantilla?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  titulo?: string;
}

// Food Journal
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  portion: string;
  calories?: number;
  macros?: Record<string, number>;
}

export interface MealEntry {
  type: MealType;
  foods: FoodItem[];
  time?: string;
}

export interface ExerciseEntry {
  type: string;
  duration?: number;
  intensity?: string;
  calories?: number;
}

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface FoodJournalEntry {
  id: string;
  patient_id: string;
  date: string;
  meals: MealEntry[];
  symptoms: string[];
  exercise: ExerciseEntry[];
  water_intake: number;
  mood?: Mood;
  notes?: string;
  photo_urls: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalStats {
  patientId: string;
  totalEntries: number;
  streak: number;
  averages: {
    waterIntakeMl: number;
    calories: number;
    exerciseMinutes: number;
    exerciseSessions: number;
  };
  moodDistribution: Record<Mood, number>;
  topSymptoms: { symptom: string; count: number }[];
  completionRate: number;
}


// AI Scribe
export interface AIScribeNote {
  id: string;
  patientId: string;
  professionalId: string;
  audioUrl?: string;
  transcription: string;
  soapNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  status: 'draft' | 'finalized';
  createdAt: string;
}

export interface MealObjective {
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  allergens?: string[];
  dietType?: string;
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  objectives: MealObjective;
  durationDays: number;
  isAutoGenerated: boolean;
  createdAt: string;
}

export interface MealPlanDay {
  day: number;
  meals: Array<{
    type: string;
    time: string;
    foods: Array<{
      foodId: number;
      name: string;
      portion: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
    totalCalories: number;
  }>;
  totalCalories: number;
}

export interface PatientPortalUser {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
}

export interface PatientPlan {
  id: string;
  nombre: string;
  objetivos: any;
  created_at: string;
  profesionalNombre?: string;
}

export interface PatientJournalEntry {
  id: string;
  date: string;
  meals: any[];
  symptoms: string[];
  exercise: any[];
  waterIntake: number;
  mood?: string;
  notes?: string;
  photoUrls: string[];
}

export interface PatientMessage {
  id: string;
  contenido: string;
  created_at: string;
  profesionalNombre?: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  active: boolean;
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  settings: any;
  active: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  tenantId: number;
  name: string;
  permissions: string[];
  createdAt: string;
}

export interface Subscription {
  id: string;
  patientId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string;
}
export interface TelehealthSession {
  appointmentId: string;
  telehealthLink: string;
  provider: 'zoom' | 'webrtc';
  meetingId: string;
  status: string;
}

// Desarrollada types
export interface ExchangeGroup {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  examples: string;
}

export interface PathologyProfile {
  key: string;
  name: string;
  fe: number;
  protGkg: number;
  grasasPct: number;
  micros: Record<string, { min?: number; max?: number; unit: string }>;
  note: string;
  espenMacros: string;
  ajusteKcal?: number;
  meds: Record<string, string>;
}

export interface FormulaInput {
  patientId: string;
  peso: number;
  altura: number;
  edad: number;
  sexo: 'M' | 'F';
  formula: 'Mifflin-St Jeor' | 'Harris-Benedict' | 'Owen';
  fa: number;
  fe: number;
  ajuste: number;
  patologia: string;
  patKey: string;
}

export interface MacroResult {
  geb: number;
  get: number;
  protGkg: number;
  grasasPct: number;
  protG: number;
  grasasG: number;
  hcG: number;
  fibraG: number;
  aguaL: number;
  fe: number;
  ajuste: number;
}

export interface MealItem {
  food: {
    n: string;
    k: number;
    p: number;
    gr: number;
    h: number;
    fi: number;
    na: number;
    K: number;
    _src: string;
  };
  gramos: number;
  nombre: string;
  grupo: string;
  unit: string;
}

export interface MealSlot {
  nombre: string;
  pct: number;
  alimentos: MealItem[];
}

export interface MealPlanTemplate {
  id: string;
  nombre: string;
  patologia: string;
  get: number;
  geb: number;
  protGkg: number;
  grasasPct: number;
  comidas: MealSlot[];
  createdAt: string;
}

export interface DesarrolladaState extends FormulaInput, MacroResult {
  step: number;
  selectedPaths: string[];
  combinedReqs: {
    prot: { min: number; max: number };
    grasas: { min: number; max: number };
    restrict: string[];
    increase: string[];
  } | null;
  microVigilados: Record<string, { min?: number; max?: number; unit: string }>;
  medAlerts: string[];
  comidas: MealSlot[];
  medicacion: string;
  alergias: string;
}

// Anamnesis form data type
export interface AnamnesisFormData {
  respuestas: Record<string, unknown>;
  red_flags: string[];
}

// Form data types
export interface AnamnesisFormData {
  respuestas: Record<string, unknown>;
  red_flags: string[];
}

export interface AnthropometryFormData {
  fecha: string;
  metodo?: string;
  peso?: number;
  altura?: number;
  cintura?: number;
  cadera?: number;
  pantorrilla?: number;
  grasa_corporal?: number;
  masa_muscular?: number;
  grasa_visceral?: number;
}

export interface RecipeFormData {
  nombre: string;
  raciones: number;
  grasas?: number;
  hc?: number;
  fibra?: number;
  kcal?: number;
  source?: string;
  categoria?: string;
  prot?: number;
  ingredientes?: string[];
  pasos?: string[];
}

export interface ReportFormData {
  paciente_id: string;
  tipo: ReportType;
  plantilla?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  titulo?: string;
}


// Onboarding
export interface OnboardingTemplate {
  id: string;
  name: string;
  fields: Array<{
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;
  active: boolean;
}

export interface OnboardingSubmission {
  id: string;
  patientId: string;
  templateId?: string;
  responses: Record<string, any>;
  waiversSigned: Record<string, any>;
  completedAt?: string;
}
