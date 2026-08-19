import { z } from 'zod';
import { UUIDSchema, ISODateSchema, ApiEnvelopeSchema } from './common';

export const UserRoleSchema = z.enum(['admin', 'nutricionista', 'secretaria', 'trial']);

export const UserSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  initials: z.string().optional(),
  active: z.boolean(),
  trial_expires: ISODateSchema.optional(),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  titulacion: z.string().optional(),
  matricula: z.string().optional(),
  pais: z.string().optional(),
  created_at: ISODateSchema,
  updated_at: ISODateSchema,
});

export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  user: UserSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshResponseSchema = z.object({
  token: z.string().min(1),
  user: UserSchema,
});

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

export const RegisterRequestSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: UserRoleSchema,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const UserApiEnvelopeSchema = ApiEnvelopeSchema(UserSchema);
export const LoginApiEnvelopeSchema = ApiEnvelopeSchema(LoginResponseSchema);
export const RefreshApiEnvelopeSchema = ApiEnvelopeSchema(RefreshResponseSchema);
