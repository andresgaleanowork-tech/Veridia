import { useState, useEffect } from 'react';

export interface PermissionReturn {
  hasRole: (...roles: string[]) => boolean;
  isAdmin: boolean;
  isNutricionista: boolean;
  isSecretaria: boolean;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function usePermission(): PermissionReturn {
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const token = localStorage.getItem('veridia_token');
      if (!token) return null;
      const payload = decodeJwtPayload(token);
      return (payload?.rol as string) ?? (payload?.role as string) ?? null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = () => {
      try {
        const token = localStorage.getItem('veridia_token');
        if (!token) {
          setRole(null);
          return;
        }
        const payload = decodeJwtPayload(token);
        setRole((payload?.rol as string) ?? (payload?.role as string) ?? null);
      } catch {
        setRole(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return {
    hasRole: (...roles: string[]) => (role ? roles.includes(role) : false),
    isAdmin: role === 'admin',
    isNutricionista: role === 'nutricionista',
    isSecretaria: role === 'secretaria',
  };
}
