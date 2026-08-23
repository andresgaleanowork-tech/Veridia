-- ============================================================
-- Veridia HealthTech V5.3 — Consolidated Baseline Migration
-- Generated from Drizzle ORM schemas
-- Tables: 39+ | Enums: 23 | Indexes: 60+
-- ============================================================

-- ENUMS
CREATE TYPE "role" AS ENUM ('admin', 'nutricionista', 'secretaria', 'trial');
CREATE TYPE "sexo" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');
CREATE TYPE "estado_cita" AS ENUM ('Pendiente', 'Confirmada', 'Realizada', 'No asistió', 'Cancelada');
CREATE TYPE "estado_factura" AS ENUM ('Pendiente', 'Pagada', 'Vencida', 'Anulada');
CREATE TYPE "severidad" AS ENUM ('leve', 'moderada', 'grave', 'critica');
CREATE TYPE "sender" AS ENUM ('patient', 'nutri');
CREATE TYPE "estado_alerta" AS ENUM ('pendiente', 'revisada');
CREATE TYPE "estado_plan" AS ENUM ('activo', 'inactivo', 'borrador');
CREATE TYPE "tipo_alimento" AS ENUM ('BEDCA', 'OFF', 'USDA', 'local');
CREATE TYPE "metodo_pago" AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'bizum', 'otro');
CREATE TYPE "tipo_gasto" AS ENUM ('suministros', 'equipamiento', 'formacion', 'marketing', 'alquiler', 'servicios', 'otro');
CREATE TYPE "frecuencia_gasto" AS ENUM ('mensual', 'trimestral', 'anual', 'unico');
CREATE TYPE "estado_suscripcion" AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE "tipo_notificacion" AS ENUM ('clinical_alert', 'appointment_reminder', 'patient_message', 'system_update', 'adherence_check', 'weekly_checkin', 'birthday');
CREATE TYPE "canal_notificacion" AS ENUM ('email', 'push', 'sms', 'in_app');
CREATE TYPE "est" AS ENUM ('sent', 'delivered', 'failed', 'read');
CREATE TYPE "tipo_diario" AS ENUM ('animo', 'hambre', 'sueno', 'sintoma');
CREATE TYPE "screening_tool" AS ENUM ('MNA', 'MUST', 'SGA', 'NRS2002', '其他');
CREATE TYPE "platform" AS ENUM ('web', 'ios', 'android');
CREATE TYPE "report_tipo" AS ENUM ('paciente_completo', 'clinico', 'nutricional', 'evolucion', 'comparativo', 'custom');
CREATE TYPE "template_tipo" AS ENUM ('informe', 'consentimiento', 'protocolo', 'receta', 'otro');

-- TABLES

-- 1. users
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(200) NOT NULL,
  "email" varchar(200) UNIQUE NOT NULL,
  "password_hash" varchar(200) NOT NULL,
  "role" "role" NOT NULL,
  "initials" varchar(4),
  "avatar" varchar(500),
  "active" boolean DEFAULT true NOT NULL,
  "trial_expires" timestamptz,
  "dni" varchar(20),
  "telefono" varchar(30),
  "titulacion" varchar(100),
  "matricula" varchar(50),
  "pais" varchar(50),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "users_active_idx" ON "users" ("active");

-- 2. patients
CREATE TABLE IF NOT EXISTS "patients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" varchar(100) NOT NULL,
  "apellidos" varchar(100) NOT NULL,
  "dni" varchar(20) UNIQUE,
  "fecha_nacimiento" date,
  "sexo" "sexo",
  "email" varchar(200),
  "telefono" varchar(30),
  "direccion" text,
  "profesion" varchar(100),
  "nacionalidad" varchar(50),
  "estado_civil" varchar(30),
  "educacion" varchar(50),
  "procedencia" varchar(100),
  "motivo_consulta" text,
  "grupo_sanguineo" varchar(10),
  "tags" text[] DEFAULT '{}',
  "consents" jsonb DEFAULT '{}',
  "activo" boolean DEFAULT true NOT NULL,
  "clinica_id" integer DEFAULT 1,
  "password_hash" text,
  "portal_enabled" boolean DEFAULT false,
  "portal_token" uuid UNIQUE,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "patients_dni_idx" ON "patients" ("dni");
CREATE INDEX IF NOT EXISTS "patients_activo_idx" ON "patients" ("activo");
CREATE INDEX IF NOT EXISTS "patients_clinica_idx" ON "patients" ("clinica_id");
CREATE INDEX IF NOT EXISTS "patients_nombre_idx" ON "patients" ("apellidos", "nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "patients_portal_token_idx" ON "patients" ("portal_token");

-- 3. patient_weight_goals
CREATE TABLE IF NOT EXISTS "patient_weight_goals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "target_weight" decimal(6,2),
  "target_date" date,
  "weekly_rate" decimal(4,2),
  "notes" text,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "pwg_paciente_idx" ON "patient_weight_goals" ("paciente_id");

-- 4. clinical_histories
CREATE TABLE IF NOT EXISTS "clinical_histories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "version" integer DEFAULT 1 NOT NULL,
  "antecedentes" text,
  "antecedentes_familiares" text,
  "alergias" text,
  "medicacion" text,
  "suplementacion" text,
  "historial_ponderal" jsonb DEFAULT '{}',
  "actividad_fisica" jsonb DEFAULT '{}',
  "habitos_toxicos" text,
  "sueno" text,
  "estres" text,
  "ingesta_hidrica" text,
  "observaciones" text,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ch_paciente_idx" ON "clinical_histories" ("paciente_id");
CREATE INDEX IF NOT EXISTS "ch_paciente_version_idx" ON "clinical_histories" ("paciente_id", "version");

-- 5. anamnesis
CREATE TABLE IF NOT EXISTS "anamnesis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "fecha" date DEFAULT CURRENT_DATE,
  "template" varchar(30),
  "profesional" varchar(200),
  "sistemas" text[] DEFAULT '{}',
  "respuestas" jsonb DEFAULT '{}',
  "red_flags" jsonb DEFAULT '[]' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "anamnesis_paciente_idx" ON "anamnesis" ("paciente_id");
CREATE INDEX IF NOT EXISTS "anamnesis_paciente_fecha_idx" ON "anamnesis" ("paciente_id", "fecha");

-- 6. antropometrias
CREATE TABLE IF NOT EXISTS "antropometrias" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "fecha" date DEFAULT CURRENT_DATE,
  "peso" decimal(6,2),
  "talla" decimal(5,1),
  "imc" decimal(5,2),
  "imc_classification" varchar(20),
  "circunferencia_cintura" decimal(5,1),
  "circunferencia_cadera" decimal(5,1),
  "cintura_cadera" decimal(4,2),
  "pliegue_triceps" decimal(4,1),
  "pliegue_subescapular" decimal(4,1),
  "pliegue_suprailiaco" decimal(4,1),
  "pliegue_abdominal" decimal(4,1),
  "sum_pliegues" decimal(5,1),
  "metodo" varchar(30),
  "biceps" decimal(4,1),
  "muneca" decimal(4,1),
  "femur" decimal(4,1),
  "biacromial" decimal(5,1),
  "bipedal" decimal(5,1),
  "condilo_humeral" decimal(4,1),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "antro_paciente_idx" ON "antropometrias" ("paciente_id");
CREATE INDEX IF NOT EXISTS "antro_paciente_fecha_idx" ON "antropometrias" ("paciente_id", "fecha");

-- 7. analiticas
CREATE TABLE IF NOT EXISTS "analiticas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "fecha" date DEFAULT CURRENT_DATE,
  "tipo" varchar(50),
  "marcadores" jsonb DEFAULT '[]',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "analiticas_paciente_idx" ON "analiticas" ("paciente_id");

-- 8. alerts
CREATE TABLE IF NOT EXISTS "alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "tipo" varchar(50),
  "severidad" "severidad",
  "mensaje" text,
  "estado" "estado_alerta" DEFAULT 'pendiente',
  "detalles" jsonb DEFAULT '{}',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "alerts_paciente_idx" ON "alerts" ("paciente_id");
CREATE INDEX IF NOT EXISTS "alerts_estado_idx" ON "alerts" ("estado");

-- 9. appointments
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid REFERENCES "patients"("id"),
  "profesional" varchar(200),
  "fecha" date NOT NULL,
  "hora" time NOT NULL,
  "tipo" varchar(30),
  "asunto" text,
  "estado" "estado_cita" DEFAULT 'Pendiente' NOT NULL,
  "pago" varchar(20) DEFAULT 'Pendiente',
  "precio" decimal(8,2) DEFAULT '0',
  "duracion" integer DEFAULT 45,
  "nota" text,
  "enfermedad" text,
  "sintomas" text,
  "medicamentos" text,
  "color" varchar(20) DEFAULT 'review',
  "acta" jsonb DEFAULT '{}',
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "appointments_fecha_idx" ON "appointments" ("fecha");
CREATE INDEX IF NOT EXISTS "appointments_paciente_idx" ON "appointments" ("paciente_id");
CREATE INDEX IF NOT EXISTS "appointments_estado_idx" ON "appointments" ("estado");
CREATE INDEX IF NOT EXISTS "appointments_fecha_estado_idx" ON "appointments" ("fecha", "estado");
CREATE INDEX IF NOT EXISTS "appointments_profesional_fecha_idx" ON "appointments" ("profesional", "fecha");

-- 10. horarios_block
CREATE TABLE IF NOT EXISTS "horarios_block" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "fecha" date NOT NULL,
  "hora_inicio" time NOT NULL,
  "hora_fin" time NOT NULL,
  "motivo" text,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 11. invoices
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "numero" varchar(30) UNIQUE NOT NULL,
  "paciente_id" uuid REFERENCES "patients"("id"),
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "estado" "estado_factura" DEFAULT 'Pendiente' NOT NULL,
  "total" decimal(10,2) DEFAULT '0' NOT NULL,
  "lineas" jsonb DEFAULT '[]' NOT NULL,
  "pagos" jsonb DEFAULT '[]' NOT NULL,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_numero_idx" ON "invoices" ("numero");
CREATE INDEX IF NOT EXISTS "invoices_paciente_idx" ON "invoices" ("paciente_id");
CREATE INDEX IF NOT EXISTS "invoices_estado_idx" ON "invoices" ("estado");
CREATE INDEX IF NOT EXISTS "invoices_fecha_idx" ON "invoices" ("fecha");

-- 12. cash_sessions
CREATE TABLE IF NOT EXISTS "cash_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "estado" varchar(20) DEFAULT 'Abierta' NOT NULL,
  "saldo_inicial" decimal(10,2) DEFAULT '0',
  "movimientos" jsonb DEFAULT '[]' NOT NULL,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "cash_sessions_fecha_idx" ON "cash_sessions" ("fecha");

-- 13. recipes
CREATE TABLE IF NOT EXISTS "recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" varchar(200) NOT NULL,
  "categoria" varchar(50),
  "raciones" integer DEFAULT 1,
  "kcal" decimal(8,2),
  "prot" decimal(6,2),
  "grasas" decimal(6,2),
  "hc" decimal(6,2),
  "fibra" decimal(6,2),
  "ingredientes" jsonb DEFAULT '[]',
  "pasos" jsonb DEFAULT '[]',
  "source" varchar(20) DEFAULT 'local',
  "mealdb_id" varchar(20),
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "recipes_nombre_idx" ON "recipes" ("nombre");

-- 14. meal_plans
CREATE TABLE IF NOT EXISTS "meal_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "nombre" varchar(200),
  "estado" "estado_plan" DEFAULT 'activo',
  "fecha_creacion" timestamptz DEFAULT now(),
  "kcal_objetivo" decimal(8,2),
  "prot_g" decimal(6,2),
  "grasas_g" decimal(6,2),
  "hc_g" decimal(6,2),
  "fibra_g" decimal(6,2),
  "agua_l" decimal(4,1),
  "formula_usada" varchar(100),
  "factor_actividad" decimal(4,2),
  "patologia" varchar(200),
  "dias" jsonb DEFAULT '[]',
  "comidas" jsonb DEFAULT '[]',
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "mp_paciente_idx" ON "meal_plans" ("paciente_id");
CREATE INDEX IF NOT EXISTS "mp_estado_idx" ON "meal_plans" ("estado");

-- 15. foods
CREATE TABLE IF NOT EXISTS "foods" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(200) NOT NULL,
  "brand" varchar(200),
  "category" varchar(50),
  "calories_per_100g" decimal(8,1),
  "protein_per_100g" decimal(6,1),
  "carbs_per_100g" decimal(6,1),
  "fat_per_100g" decimal(6,1),
  "fiber_per_100g" decimal(6,1),
  "sodium_per_100g" decimal(8,1),
  "sugar_per_100g" decimal(6,1),
  "allergens" text,
  "diet_types" text[] DEFAULT '{}',
  "barcode" varchar(50),
  "region" varchar(50) DEFAULT 'ES',
  "is_local" boolean DEFAULT true,
  "source" "tipo_alimento",
  "external_id" varchar(100),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "foods_name_idx" ON "foods" ("name");
CREATE INDEX IF NOT EXISTS "foods_barcode_idx" ON "foods" ("barcode");
CREATE INDEX IF NOT EXISTS "foods_category_idx" ON "foods" ("category");

-- 16. food_favorites
CREATE TABLE IF NOT EXISTS "food_favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "food_data" jsonb NOT NULL,
  "source" varchar(20) DEFAULT 'BEDCA',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ff_user_food_idx" ON "food_favorites" ("user_id", "food_data");
CREATE INDEX IF NOT EXISTS "ff_user_idx" ON "food_favorites" ("user_id");

-- 17. custom_dishes
CREATE TABLE IF NOT EXISTS "custom_dishes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "nombre" varchar(200) NOT NULL,
  "raciones" integer DEFAULT 1,
  "ingredientes" jsonb DEFAULT '[]',
  "kcal" decimal(8,2),
  "prot" decimal(6,2),
  "grasas" decimal(6,2),
  "hc" decimal(6,2),
  "fibra" decimal(6,2),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "cd_user_idx" ON "custom_dishes" ("user_id");

-- 18. messages
CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "sender" "sender" NOT NULL,
  "text" text NOT NULL,
  "read" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "messages_paciente_idx" ON "messages" ("paciente_id");

-- 19. patient_diary
CREATE TABLE IF NOT EXISTS "patient_diary" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "toma" varchar(30),
  "texto" text,
  "hora" time,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "pd_paciente_idx" ON "patient_diary" ("paciente_id");

-- 20. patient_symptoms
CREATE TABLE IF NOT EXISTS "patient_symptoms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "tipo" "tipo_diario",
  "valor" text,
  "hora" time,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ps_paciente_idx" ON "patient_symptoms" ("paciente_id");

-- 21. patient_food_journals
CREATE TABLE IF NOT EXISTS "patient_food_journals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "date" date NOT NULL,
  "meals" jsonb DEFAULT '[]',
  "symptoms" jsonb DEFAULT '[]',
  "exercise" jsonb DEFAULT '[]',
  "water_intake" integer DEFAULT 0,
  "mood" varchar(20),
  "notes" text,
  "photo_urls" jsonb DEFAULT '[]',
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "pfj_paciente_fecha_idx" ON "patient_food_journals" ("paciente_id", "date");
CREATE INDEX IF NOT EXISTS "pfj_paciente_idx" ON "patient_food_journals" ("paciente_id");

-- 22. patient_sessions
CREATE TABLE IF NOT EXISTS "patient_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patient_id" uuid NOT NULL REFERENCES "patients"("id"),
  "token" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "psess_patient_idx" ON "patient_sessions" ("patient_id");

-- 23. gastos
CREATE TABLE IF NOT EXISTS "gastos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoria" "tipo_gasto" NOT NULL,
  "descripcion" text NOT NULL,
  "importe" decimal(10,2) NOT NULL,
  "fecha" date DEFAULT CURRENT_DATE,
  "metodo_pago" "metodo_pago" DEFAULT 'efectivo',
  "recurrente" boolean DEFAULT false,
  "frecuencia" "frecuencia_gasto",
  "proveedor" varchar(200),
  "notas" text,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "gastos_fecha_idx" ON "gastos" ("fecha");
CREATE INDEX IF NOT EXISTS "gastos_categoria_idx" ON "gastos" ("categoria");

-- 24. token_blacklist
CREATE TABLE IF NOT EXISTS "token_blacklist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" text UNIQUE NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "tb_expires_idx" ON "token_blacklist" ("expires_at");

-- 25. audit_log
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id"),
  "usuario" varchar(200),
  "rol" varchar(30),
  "accion" varchar(30) NOT NULL,
  "entidad" varchar(100),
  "paciente" varchar(200),
  "ip" varchar(50),
  "detalles" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "al_user_idx" ON "audit_log" ("user_id");
CREATE INDEX IF NOT EXISTS "al_created_idx" ON "audit_log" ("created_at");

-- 26. service_packages
CREATE TABLE IF NOT EXISTS "service_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(200) NOT NULL,
  "description" text,
  "sessions" integer DEFAULT 1,
  "price" decimal(10,2) NOT NULL,
  "duration_days" integer DEFAULT 30,
  "includes_meal_plan" boolean DEFAULT false,
  "includes_food_journal" boolean DEFAULT false,
  "includes_telehealth" boolean DEFAULT false,
  "active" boolean DEFAULT true,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 27. patient_subscriptions
CREATE TABLE IF NOT EXISTS "patient_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "package_id" uuid NOT NULL REFERENCES "service_packages"("id"),
  "start_date" date,
  "end_date" date,
  "sessions_total" integer DEFAULT 0,
  "sessions_used" integer DEFAULT 0,
  "status" "estado_suscripcion" DEFAULT 'active',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "psubs_paciente_idx" ON "patient_subscriptions" ("paciente_id");

-- 28. session_credits
CREATE TABLE IF NOT EXISTS "session_credits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "subscription_id" uuid REFERENCES "patient_subscriptions"("id"),
  "remaining" integer DEFAULT 0,
  "expires_at" date,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "sc_paciente_idx" ON "session_credits" ("paciente_id");

-- 29. automations
CREATE TABLE IF NOT EXISTS "automations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" integer,
  "name" varchar(255) NOT NULL,
  "trigger" varchar(100) NOT NULL,
  "conditions" jsonb,
  "actions" jsonb,
  "active" boolean DEFAULT true,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "auto_trigger_idx" ON "automations" ("trigger");
CREATE INDEX IF NOT EXISTS "auto_active_idx" ON "automations" ("active");

-- 30. automation_logs
CREATE TABLE IF NOT EXISTS "automation_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "automation_id" uuid NOT NULL REFERENCES "automations"("id"),
  "trigger_data" jsonb,
  "result" jsonb,
  "executed_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "alog_automation_idx" ON "automation_logs" ("automation_id");

-- 31. notification_log
CREATE TABLE IF NOT EXISTS "notification_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid REFERENCES "patients"("id"),
  "professional_id" uuid REFERENCES "users"("id"),
  "type" varchar(50) NOT NULL,
  "channel" "canal_notificacion" NOT NULL,
  "status" "est" DEFAULT 'sent' NOT NULL,
  "details" jsonb DEFAULT '{}',
  "error" text,
  "sent_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "nl_paciente_idx" ON "notification_log" ("paciente_id");

-- 32. push_subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "fcm_token" text NOT NULL,
  "platform" "platform" DEFAULT 'web',
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "pushsub_paciente_idx" ON "push_subscriptions" ("paciente_id");
CREATE UNIQUE INDEX IF NOT EXISTS "pushsub_paciente_fcm_idx" ON "push_subscriptions" ("paciente_id", "fcm_token");

-- 33. professional_notifications
CREATE TABLE IF NOT EXISTS "professional_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "professional_id" uuid NOT NULL REFERENCES "users"("id"),
  "type" varchar(50) NOT NULL,
  "title" varchar(200) NOT NULL,
  "body" text,
  "data" jsonb DEFAULT '{}',
  "read" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "pn_professional_idx" ON "professional_notifications" ("professional_id");
CREATE INDEX IF NOT EXISTS "pn_professional_read_idx" ON "professional_notifications" ("professional_id", "read");

-- 34. user_settings
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid UNIQUE NOT NULL REFERENCES "users"("id"),
  "notifications" jsonb DEFAULT '{}',
  "branding" jsonb DEFAULT '{}',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 35. calendar_exports
CREATE TABLE IF NOT EXISTS "calendar_exports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid UNIQUE NOT NULL REFERENCES "users"("id"),
  "export_token" text NOT NULL,
  "last_exported_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 36. plan_templates
CREATE TABLE IF NOT EXISTS "plan_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(200) NOT NULL,
  "description" text,
  "template_data" jsonb DEFAULT '{}',
  "active" boolean DEFAULT true,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 37. ai_scribe_notes
CREATE TABLE IF NOT EXISTS "ai_scribe_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "patient_id" uuid REFERENCES "patients"("id"),
  "professional_id" uuid REFERENCES "users"("id"),
  "audio_url" text,
  "transcription" text,
  "soap_note" jsonb,
  "status" varchar(50) DEFAULT 'draft',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "aisn_patient_idx" ON "ai_scribe_notes" ("patient_id");

-- 38. care_processes
CREATE TABLE IF NOT EXISTS "care_processes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid NOT NULL REFERENCES "patients"("id"),
  "motivo_consulta" varchar(200) NOT NULL,
  "screening_tool" varchar(20) NOT NULL,
  "screening_score" varchar(20) NOT NULL,
  "screening_risk" varchar(20) NOT NULL,
  "current_step" varchar(50) DEFAULT 'screening',
  "data" jsonb DEFAULT '{}' NOT NULL,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "cp_paciente_idx" ON "care_processes" ("paciente_id");

-- 39. clinical_templates
CREATE TABLE IF NOT EXISTS "clinical_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" varchar(200) NOT NULL,
  "tipo" varchar(20) NOT NULL,
  "contenido" jsonb NOT NULL,
  "tags" text[] DEFAULT '{}',
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ct_tipo_idx" ON "clinical_templates" ("tipo");

-- 40. api_keys
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "key_hash" varchar(64) UNIQUE NOT NULL,
  "key_prefix" varchar(12) NOT NULL,
  "scopes" text[] DEFAULT '{}',
  "active" boolean DEFAULT true,
  "last_used_at" timestamptz,
  "expires_at" timestamptz,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ak_prefix_idx" ON "api_keys" ("key_prefix");

-- 41. reports
CREATE TABLE IF NOT EXISTS "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paciente_id" uuid REFERENCES "patients"("id"),
  "tipo" "report_tipo",
  "plantilla" varchar(50),
  "titulo" varchar(200),
  "file_content" text,
  "name" varchar(200),
  "type" varchar(50),
  "params" jsonb,
  "result" jsonb,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "reports_paciente_idx" ON "reports" ("paciente_id");

-- 42. report_templates
CREATE TABLE IF NOT EXISTS "report_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nombre" varchar(100) NOT NULL,
  "tipo" "template_tipo",
  "contenido" jsonb,
  "activo" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- TRIGGER: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users', 'patients', 'clinical_histories', 'anamnesis', 'antropometrias',
    'analiticas', 'alerts', 'appointments', 'invoices', 'cash_sessions',
    'recipes', 'meal_plans', 'foods', 'food_favorites', 'custom_dishes',
    'messages', 'patient_diary', 'patient_symptoms', 'patient_food_journals',
    'gastos', 'token_blacklist', 'service_packages', 'patient_subscriptions',
    'session_credits', 'automations', 'push_subscriptions', 'professional_notifications',
    'user_settings', 'calendar_exports', 'plan_templates', 'ai_scribe_notes',
    'care_processes', 'clinical_templates', 'api_keys', 'reports', 'report_templates',
    'patient_weight_goals', 'horarios_block', 'patient_sessions'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;
