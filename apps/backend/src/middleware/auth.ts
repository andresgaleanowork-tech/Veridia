// JWT Authentication middleware
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  id: string;
  type: string;
  email: string;
  nombre?: string;
  name: string;
  apellidos?: string;
  role: string;
  paciente_id?: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (decoded.type === 'patient') {
      return res.status(401).json({ error: 'Token de profesional requerido' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof Error && err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function patientAuthenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (decoded.type !== 'patient') {
      return res.status(401).json({ error: 'Token de paciente requerido' });
    }
    req.paciente = decoded;
    req.paciente_id = decoded.paciente_id;
    next();
  } catch (err) {
    if (err instanceof Error && err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function authOrPatient(allowedRoles: string[] | null = null) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    try {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      if (decoded.type === 'patient') {
        req.paciente = decoded;
        req.paciente_id = decoded.paciente_id;
        req.isPatient = true;
        return next();
      }
      if (allowedRoles && !allowedRoles.includes(decoded.role || '')) {
        return res.status(403).json({ error: 'Sin permisos' });
      }
      req.user = decoded;
      req.isPatient = false;
      next();
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    next();
  };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
