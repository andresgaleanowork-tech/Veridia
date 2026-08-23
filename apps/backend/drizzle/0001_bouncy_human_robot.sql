DO $$ BEGIN
 CREATE TYPE "public"."canal_notificacion" AS ENUM('email', 'push', 'sms', 'in_app');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."care_process_step" AS ENUM('screening', 'assessment', 'diagnosis', 'planning', 'implementation', 'monitoring', 'evaluation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_alerta" AS ENUM('pendiente', 'revisada');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_cita" AS ENUM('Pendiente', 'Confirmada', 'Realizada', 'No asistió', 'Cancelada');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_factura" AS ENUM('Pendiente', 'Pagada', 'Vencida', 'Anulada');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_notificacion" AS ENUM('sent', 'failed', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_plan" AS ENUM('activo', 'inactivo', 'borrador');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."estado_suscripcion" AS ENUM('active', 'cancelled', 'past_due', 'trialing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."frecuencia_gasto" AS ENUM('mensual', 'trimestral', 'anual', 'unico');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."metodo_pago" AS ENUM('efectivo', 'tarjeta', 'transferencia', 'bizum', 'otro');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."platform" AS ENUM('web', 'ios', 'android');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_type" AS ENUM('clinical', 'nutritional', 'anthropometric', 'analytical', 'progress', 'discharge');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('admin', 'nutricionista', 'secretaria', 'trial');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."screening_risk" AS ENUM('BAJO', 'MODERADO', 'ALTO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."screening_tool" AS ENUM('NRS-2002', 'MUST', 'SNAQ', 'MNA-SF');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sender" AS ENUM('patient', 'nutri');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."severidad" AS ENUM('leve', 'moderada', 'grave', 'critica');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sexo" AS ENUM('MASCULINO', 'FEMENINO', 'OTRO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."template_tipo" AS ENUM('meal_plan', 'note', 'report');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_alimento" AS ENUM('BEDCA', 'OFF', 'USDA', 'local');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_diario" AS ENUM('animo', 'hambre', 'sueno', 'sintoma');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_gasto" AS ENUM('suministros', 'equipamiento', 'formacion', 'marketing', 'alquiler', 'servicios', 'otro');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_notificacion" AS ENUM('clinical_alert', 'appointment_reminder', 'patient_message', 'system_update', 'adherence_check', 'weekly_checkin', 'birthday');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" varchar(200) NOT NULL,
	"role" "role" NOT NULL,
	"initials" varchar(4),
	"avatar" varchar(500),
	"active" boolean DEFAULT true NOT NULL,
	"trial_expires" timestamp with time zone,
	"dni" varchar(20),
	"telefono" varchar(30),
	"titulacion" varchar(100),
	"matricula" varchar(50),
	"pais" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_weight_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"peso_inicio" numeric(5, 1),
	"peso_objetivo" numeric(5, 1),
	"fecha_inicio" date DEFAULT CURRENT_DATE,
	"fecha_objetivo" date,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellidos" varchar(100) NOT NULL,
	"dni" varchar(20),
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
	"tags" text[] DEFAULT '{}'::text[],
	"consents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"clinica_id" integer DEFAULT 1,
	"password_hash" text,
	"portal_enabled" boolean DEFAULT false,
	"portal_token" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_dni_unique" UNIQUE("dni"),
	CONSTRAINT "patients_portal_token_unique" UNIQUE("portal_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"tipo" varchar(30),
	"severidad" "severidad",
	"mensaje" text NOT NULL,
	"recomendacion" text,
	"estado" "estado_alerta" DEFAULT 'pendiente' NOT NULL,
	"fecha" date DEFAULT CURRENT_DATE,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analiticas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"ayuno" boolean DEFAULT true NOT NULL,
	"marcadores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "anamnesis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"fecha" date DEFAULT CURRENT_DATE,
	"template" varchar(30),
	"profesional" varchar(200),
	"sistemas" text[] DEFAULT '{}'::text[],
	"respuestas" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"red_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "antropometrias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"peso" numeric(5, 1),
	"altura" numeric(5, 1),
	"imc" numeric(4, 1),
	"cintura" numeric(5, 1),
	"cadera" numeric(5, 1),
	"pantorrilla" numeric(5, 1),
	"grasa_corporal" numeric(4, 1),
	"masa_muscular" numeric(5, 1),
	"grasa_visceral" numeric(4, 1),
	"metodo" varchar(30) DEFAULT 'BIA',
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"antecedentes" text,
	"antecedentes_familiares" text,
	"alergias" text,
	"medicacion" text,
	"suplementacion" text,
	"historial_ponderal" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actividad_fisica" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"habitos_toxicos" text,
	"sueno" text,
	"estres" text,
	"ingesta_hidrica" text,
	"observaciones" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"profesional" varchar(200),
	"fecha" date NOT NULL,
	"hora" time NOT NULL,
	"tipo" varchar(30),
	"asunto" text,
	"estado" "estado_cita" DEFAULT 'Pendiente' NOT NULL,
	"pago" varchar(20) DEFAULT 'Pendiente',
	"precio" numeric(8, 2) DEFAULT '0',
	"duracion" integer DEFAULT 45,
	"nota" text,
	"enfermedad" text,
	"sintomas" text,
	"medicamentos" text,
	"color" varchar(20) DEFAULT 'review',
	"acta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "horarios_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fecha" date NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fin" time NOT NULL,
	"motivo" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cash_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"estado" varchar(20) DEFAULT 'Abierta' NOT NULL,
	"saldo_inicial" numeric(10, 2) DEFAULT '0',
	"movimientos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gastos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria" "tipo_gasto" NOT NULL,
	"descripcion" text,
	"importe" numeric(10, 2) NOT NULL,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"metodo_pago" "metodo_pago",
	"recurrente" boolean DEFAULT false,
	"frecuencia" "frecuencia_gasto",
	"proveedor" varchar(200),
	"notas" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" varchar(30) NOT NULL,
	"paciente_id" uuid,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"estado" "estado_factura" DEFAULT 'Pendiente' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"lineas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pagos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"package_id" uuid,
	"status" "estado_suscripcion" DEFAULT 'active' NOT NULL,
	"start_date" date DEFAULT CURRENT_DATE NOT NULL,
	"end_date" date,
	"stripe_subscription_id" varchar(100),
	"stripe_customer_id" varchar(100),
	"sessions_total" integer DEFAULT 1 NOT NULL,
	"sessions_used" integer DEFAULT 0 NOT NULL,
	"auto_renew" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"sessions" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"includes_meal_plan" boolean DEFAULT false,
	"includes_food_journal" boolean DEFAULT false,
	"includes_telehealth" boolean DEFAULT false,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"subscription_id" uuid,
	"tipo" varchar(50) DEFAULT 'consulta',
	"remaining" integer DEFAULT 1 NOT NULL,
	"expires_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"nombre" varchar(200) NOT NULL,
	"raciones" integer DEFAULT 1,
	"ingredientes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kcal" numeric(8, 1),
	"prot" numeric(6, 1),
	"grasas" numeric(6, 1),
	"hc" numeric(6, 1),
	"fibra" numeric(6, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"food_data" jsonb NOT NULL,
	"source" varchar(10) DEFAULT 'BEDCA',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"brand" varchar(200),
	"category" varchar(50),
	"calories_per_100g" numeric(8, 1),
	"protein_per_100g" numeric(6, 1),
	"carbs_per_100g" numeric(6, 1),
	"fat_per_100g" numeric(6, 1),
	"fiber_per_100g" numeric(6, 1),
	"sodium_per_100g" numeric(8, 1),
	"sugar_per_100g" numeric(6, 1),
	"allergens" text,
	"diet_types" text[] DEFAULT '{}'::text[],
	"barcode" varchar(50),
	"region" varchar(50) DEFAULT 'ES',
	"is_local" boolean DEFAULT true,
	"source" "tipo_alimento",
	"external_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_plan_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_template_id" uuid,
	"day_number" integer NOT NULL,
	"meals" jsonb NOT NULL,
	"total_calories" integer,
	"total_macros" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_plan_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"objectives" jsonb NOT NULL,
	"duration_days" integer DEFAULT 7,
	"is_auto_generated" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"nombre" varchar(200),
	"estado" "estado_plan" DEFAULT 'activo' NOT NULL,
	"fecha_creacion" date DEFAULT CURRENT_DATE,
	"kcal_objetivo" integer,
	"prot_g" integer,
	"grasas_g" integer,
	"hc_g" integer,
	"fibra_g" integer,
	"agua_l" numeric(3, 1),
	"formula_usada" varchar(50),
	"factor_actividad" numeric(4, 3),
	"patologia" varchar(200),
	"dias" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comidas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"descripcion" text,
	"kcal_objetivo" integer,
	"prot_g" integer,
	"grasas_g" integer,
	"hc_g" integer,
	"comidas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"categoria" varchar(30),
	"raciones" integer DEFAULT 1,
	"kcal" numeric(8, 1),
	"prot" numeric(6, 1),
	"grasas" numeric(6, 1),
	"hc" numeric(6, 1),
	"fibra" numeric(6, 1),
	"ingredientes" text[] DEFAULT '{}'::text[],
	"pasos" text[] DEFAULT '{}'::text[],
	"source" varchar(20) DEFAULT 'local',
	"mealdb_id" varchar(20),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"sender" "sender" NOT NULL,
	"text" text NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_diary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"toma" varchar(30),
	"texto" text,
	"hora" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_food_journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"date" date NOT NULL,
	"meals" jsonb,
	"symptoms" text[] DEFAULT '{}'::text[],
	"exercise" jsonb,
	"water_intake" integer DEFAULT 0,
	"mood" varchar(50),
	"notes" text,
	"photo_urls" text[] DEFAULT '{}'::text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_symptoms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"fecha" date DEFAULT CURRENT_DATE NOT NULL,
	"tipo" "tipo_diario",
	"valor" text,
	"hora" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid,
	"trigger_data" jsonb,
	"result" jsonb,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" integer,
	"name" varchar(255) NOT NULL,
	"trigger" varchar(100) NOT NULL,
	"conditions" jsonb,
	"actions" jsonb,
	"active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"export_token" varchar(64) NOT NULL,
	"last_exported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_exports_export_token_unique" UNIQUE("export_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"professional_id" uuid,
	"type" varchar(50) NOT NULL,
	"channel" "canal_notificacion" NOT NULL,
	"status" "estado_notificacion" DEFAULT 'sent' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professional_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"fcm_token" text NOT NULL,
	"platform" "platform" DEFAULT 'web',
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"notifications" jsonb DEFAULT '{"clinical_alerts":true,"appointment_reminders":true,"patient_messages":true,"system_updates":true}'::jsonb NOT NULL,
	"branding" jsonb DEFAULT '{"logo":"","primaryColor":"#0891B2","clinicName":"","clinicAddress":"","clinicPhone":"","professionalName":"","professionalTitle":"","license":"","cuit":""}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"scopes" text[] DEFAULT '{}'::text[],
	"active" boolean DEFAULT true,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"usuario" varchar(200),
	"rol" varchar(30),
	"accion" varchar(30) NOT NULL,
	"entidad" varchar(100),
	"paciente" varchar(200),
	"ip" varchar(50),
	"detalles" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_blacklist_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_scribe_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid,
	"professional_id" uuid,
	"audio_url" text,
	"transcription" text,
	"soap_note" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "care_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"motivo_consulta" varchar(200) NOT NULL,
	"screening_tool" varchar(20) NOT NULL,
	"screening_score" varchar(20) NOT NULL,
	"screening_risk" varchar(20) NOT NULL,
	"current_step" varchar(50) DEFAULT 'screening',
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinical_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"contenido" jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[],
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"tipo" "template_tipo",
	"contenido" jsonb,
	"activo" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paciente_id" uuid,
	"tipo" "report_type",
	"plantilla" varchar(50),
	"titulo" varchar(200),
	"file_content" text,
	"name" varchar(200),
	"type" varchar(50),
	"params" jsonb,
	"result" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_active_idx" ON "users" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_weight_goals_paciente_idx" ON "patient_weight_goals" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_weight_goals_activo_idx" ON "patient_weight_goals" USING btree ("activo");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "patients_dni_idx" ON "patients" USING btree ("dni");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patients_activo_idx" ON "patients" USING btree ("activo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patients_clinica_idx" ON "patients" USING btree ("clinica_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patients_nombre_idx" ON "patients" USING btree ("apellidos","nombre");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "patients_portal_token_idx" ON "patients" USING btree ("portal_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_paciente_idx" ON "alerts" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_estado_idx" ON "alerts" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_paciente_estado_idx" ON "alerts" USING btree ("paciente_id","estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analiticas_paciente_idx" ON "analiticas" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analiticas_paciente_fecha_idx" ON "analiticas" USING btree ("paciente_id","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anamnesis_paciente_idx" ON "anamnesis" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anamnesis_paciente_fecha_idx" ON "anamnesis" USING btree ("paciente_id","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "antropometrias_paciente_idx" ON "antropometrias" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "antropometrias_paciente_fecha_idx" ON "antropometrias" USING btree ("paciente_id","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clinical_histories_paciente_idx" ON "clinical_histories" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clinical_histories_paciente_version_idx" ON "clinical_histories" USING btree ("paciente_id","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_fecha_idx" ON "appointments" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_paciente_idx" ON "appointments" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_estado_idx" ON "appointments" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_fecha_estado_idx" ON "appointments" USING btree ("fecha","estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_profesional_fecha_idx" ON "appointments" USING btree ("profesional","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "horarios_block_fecha_idx" ON "horarios_block" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cash_sessions_fecha_idx" ON "cash_sessions" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cash_sessions_estado_idx" ON "cash_sessions" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gastos_fecha_idx" ON "gastos" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gastos_categoria_idx" ON "gastos" USING btree ("categoria");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_numero_idx" ON "invoices" USING btree ("numero");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_paciente_idx" ON "invoices" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_estado_idx" ON "invoices" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_fecha_idx" ON "invoices" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_paciente_estado_idx" ON "invoices" USING btree ("paciente_id","estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_subscriptions_paciente_idx" ON "patient_subscriptions" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_subscriptions_paciente_status_idx" ON "patient_subscriptions" USING btree ("paciente_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "patient_subscriptions_stripe_sub_idx" ON "patient_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_packages_active_idx" ON "service_packages" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_credits_paciente_idx" ON "session_credits" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_credits_subscription_idx" ON "session_credits" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_dishes_user_idx" ON "custom_dishes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "food_favorites_user_idx" ON "food_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "foods_barcode_idx" ON "foods" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "foods_category_idx" ON "foods" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "foods_is_local_idx" ON "foods" USING btree ("is_local");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "foods_source_idx" ON "foods" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_plan_days_plan_template_idx" ON "meal_plan_days" USING btree ("plan_template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_plan_templates_created_by_idx" ON "meal_plan_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_plans_paciente_idx" ON "meal_plans" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_plans_estado_idx" ON "meal_plans" USING btree ("estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_plans_paciente_estado_idx" ON "meal_plans" USING btree ("paciente_id","estado");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_templates_nombre_idx" ON "plan_templates" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipes_nombre_idx" ON "recipes" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipes_categoria_idx" ON "recipes" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_paciente_idx" ON "messages" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_paciente_fecha_idx" ON "messages" USING btree ("paciente_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_diary_paciente_idx" ON "patient_diary" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_diary_paciente_fecha_idx" ON "patient_diary" USING btree ("paciente_id","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_food_journals_paciente_idx" ON "patient_food_journals" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_food_journals_date_idx" ON "patient_food_journals" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "patient_food_journals_paciente_date_idx" ON "patient_food_journals" USING btree ("paciente_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_sessions_paciente_idx" ON "patient_sessions" USING btree ("paciente_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "patient_sessions_token_idx" ON "patient_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_symptoms_paciente_idx" ON "patient_symptoms" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patient_symptoms_paciente_fecha_idx" ON "patient_symptoms" USING btree ("paciente_id","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automation_logs_automation_idx" ON "automation_logs" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automation_logs_executed_at_idx" ON "automation_logs" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_trigger_idx" ON "automations" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_active_idx" ON "automations" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_tenant_idx" ON "automations" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_exports_user_idx" ON "calendar_exports" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_exports_token_idx" ON "calendar_exports" USING btree ("export_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_log_paciente_idx" ON "notification_log" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_log_type_idx" ON "notification_log" USING btree ("type","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "professional_notifications_professional_idx" ON "professional_notifications" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "professional_notifications_professional_read_idx" ON "professional_notifications" USING btree ("professional_id","read","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_subscriptions_paciente_idx" ON "push_subscriptions" USING btree ("paciente_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_paciente_fcm_idx" ON "push_subscriptions" USING btree ("paciente_id","fcm_token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_user_idx" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_active_idx" ON "api_keys" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_accion_idx" ON "audit_log" USING btree ("accion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_blacklist_expires_idx" ON "token_blacklist" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "token_blacklist_token_idx" ON "token_blacklist" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_scribe_notes_paciente_idx" ON "ai_scribe_notes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_scribe_notes_professional_idx" ON "ai_scribe_notes" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "care_processes_paciente_idx" ON "care_processes" USING btree ("paciente_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clinical_templates_nombre_idx" ON "clinical_templates" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clinical_templates_tipo_idx" ON "clinical_templates" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_paciente_idx" ON "reports" USING btree ("paciente_id");