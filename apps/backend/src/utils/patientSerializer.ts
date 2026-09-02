import { patients } from '../db/schema/index.js';

export type PatientRow = typeof patients.$inferSelect;

/**
 * Proyección pública de un paciente.
 *
 * - Contrato snake_case, alineado con el schema Zod del frontend
 *   (src/lib/schemas/patient.ts) y el tipo Patient de src/types.
 * - NUNCA expone campos sensibles: passwordHash, portalToken,
 *   portalEnabled y demás columnas no listas aquí.
 */
export function toPublicPatient(p: PatientRow) {
  return {
    id: p.id,
    nombre: p.nombre,
    apellidos: p.apellidos,
    dni: p.dni ?? null,
    fecha_nacimiento: p.fechaNacimiento ?? null,
    sexo: p.sexo ?? null,
    email: p.email ?? null,
    telefono: p.telefono ?? null,
    direccion: p.direccion ?? null,
    profesion: p.profesion ?? null,
    nacionalidad: p.nacionalidad ?? null,
    estado_civil: p.estadoCivil ?? null,
    educacion: p.educacion ?? null,
    procedencia: p.procedencia ?? null,
    motivo_consulta: p.motivoConsulta ?? null,
    grupo_sanguineo: p.grupoSanguineo ?? null,
    tags: p.tags ?? [],
    consents: p.consents ?? {},
    activo: p.activo,
    clinica_id: p.clinicaId ?? null,
    created_by: p.createdBy ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}
