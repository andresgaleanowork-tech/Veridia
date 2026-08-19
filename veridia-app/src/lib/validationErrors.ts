import { z } from 'zod';

export interface FieldError {
  field: string;
  message: string;
}

export function formatZodError(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export function getFieldError(errors: FieldError[], field: string): string | undefined {
  const error = errors.find((e) => e.field === field);
  return error?.message;
}

export function getFieldErrors(errors: FieldError[], fieldPrefix: string): FieldError[] {
  return errors.filter((e) => e.field.startsWith(fieldPrefix));
}

export function hasFieldError(errors: FieldError[], field: string): boolean {
  return errors.some((e) => e.field === field);
}

export function toFieldErrorMap(errors: FieldError[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const error of errors) {
    if (!map[error.field]) {
      map[error.field] = error.message;
    }
  }
  return map;
}
