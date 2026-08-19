import { useState, useEffect } from 'react';

type UserRole = string | null;

interface UsePermissionsReturn {
  userRole: UserRole;
  hasRole: (...roles: string[]) => boolean;
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

export function usePermissions(): UsePermissionsReturn {
  const [userRole, setUserRole] = useState<UserRole>(() => {
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
          setUserRole(null);
          return;
        }
        const payload = decodeJwtPayload(token);
        setUserRole((payload?.rol as string) ?? (payload?.role as string) ?? null);
      } catch {
        setUserRole(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const hasRole = (...roles: string[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  return { userRole, hasRole };
}
