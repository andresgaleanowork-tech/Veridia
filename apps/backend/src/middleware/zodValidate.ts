import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `ZodType<any, any>` es el patrón estándar para middlewares de validación por schema
export function validateZod(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Validación fallida', details });
    }
    req.body = result.data;
    next();
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `ZodType<any, any>` es el patrón estándar para middlewares de validación por schema
export function validateZodQuery(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Validación fallida', details });
    }
    req.query = result.data;
    next();
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `ZodType<any, any>` es el patrón estándar para middlewares de validación por schema
export function validateZodParams(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Validación fallida', details });
    }
    req.params = result.data;
    next();
  };
}
