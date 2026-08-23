import { uuid, text, jsonb, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['admin', 'nutricionista', 'secretaria', 'trial']);
export const sexoEnum = pgEnum('sexo', ['MASCULINO', 'FEMENINO', 'OTRO']);
export const estadoCitaEnum = pgEnum('estado_cita', ['Pendiente', 'Confirmada', 'Realizada', 'No asistió', 'Cancelada']);
export const estadoFacturaEnum = pgEnum('estado_factura', ['Pendiente', 'Pagada', 'Vencida', 'Anulada']);
export const severidadEnum = pgEnum('severidad', ['leve', 'moderada', 'grave', 'critica']);
export const senderEnum = pgEnum('sender', ['patient', 'nutri']);
export const estadoAlertaEnum = pgEnum('estado_alerta', ['pendiente', 'revisada']);
export const estadoPlanEnum = pgEnum('estado_plan', ['activo', 'inactivo', 'borrador']);
export const tipoAlimentoEnum = pgEnum('tipo_alimento', ['BEDCA', 'OFF', 'USDA', 'local']);
export const metodoPagoEnum = pgEnum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia', 'bizum', 'otro']);
export const tipoGastoEnum = pgEnum('tipo_gasto', ['suministros', 'equipamiento', 'formacion', 'marketing', 'alquiler', 'servicios', 'otro']);
export const frecuenciaGastoEnum = pgEnum('frecuencia_gasto', ['mensual', 'trimestral', 'anual', 'unico']);
export const estadoSuscripcionEnum = pgEnum('estado_suscripcion', ['active', 'cancelled', 'past_due', 'trialing']);
export const tipoNotificacionEnum = pgEnum('tipo_notificacion', ['clinical_alert', 'appointment_reminder', 'patient_message', 'system_update', 'adherence_check', 'weekly_checkin', 'birthday']);
export const canalNotificacionEnum = pgEnum('canal_notificacion', ['email', 'push', 'sms', 'in_app']);
export const estadoNotificacionEnum = pgEnum('estado_notificacion', ['sent', 'failed', 'pending']);
export const tipoDiarioEnum = pgEnum('tipo_diario', ['animo', 'hambre', 'sueno', 'sintoma']);
export const screeningToolEnum = pgEnum('screening_tool', ['NRS-2002', 'MUST', 'SNAQ', 'MNA-SF']);
export const screeningRiskEnum = pgEnum('screening_risk', ['BAJO', 'MODERADO', 'ALTO']);
export const careProcessStepEnum = pgEnum('care_process_step', ['screening', 'assessment', 'diagnosis', 'planning', 'implementation', 'monitoring', 'evaluation']);
export const templateTipoEnum = pgEnum('template_tipo', ['meal_plan', 'note', 'report']);
export const reportTypeEnum = pgEnum('report_type', ['clinical', 'nutritional', 'anthropometric', 'analytical', 'progress', 'discharge']);
export const platformEnum = pgEnum('platform', ['web', 'ios', 'android']);

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const uuidPk = (name: string = 'id') => uuid(name).primaryKey().defaultRandom();
export const uuidFk = (name: string) => uuid(name);

export const textArray = (name: string) => text(name).array().default(sql`'{}'::text[]`);
export const jsonbDefault = (name: string, defaultValue: string = "'{}'::jsonb") => jsonb(name).default(sql.raw(defaultValue)).notNull();