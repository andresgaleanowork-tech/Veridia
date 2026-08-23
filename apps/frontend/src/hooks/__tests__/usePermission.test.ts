import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from '../usePermission';

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns null role when no token', () => {
    const { result } = renderHook(() => usePermission());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isNutricionista).toBe(false);
    expect(result.current.isSecretaria).toBe(false);
    expect(result.current.hasRole('admin')).toBe(false);
  });

  it('detects admin role from token', () => {
    const payload = { rol: 'admin', exp: Date.now() / 1000 + 3600 };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('veridia_token', token);

    const { result } = renderHook(() => usePermission());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.hasRole('admin')).toBe(true);
  });

  it('detects nutricionista role from token', () => {
    const payload = { rol: 'nutricionista', exp: Date.now() / 1000 + 3600 };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('veridia_token', token);

    const { result } = renderHook(() => usePermission());
    expect(result.current.isNutricionista).toBe(true);
    expect(result.current.hasRole('nutricionista')).toBe(true);
  });

  it('detects secretaria role from token', () => {
    const payload = { rol: 'secretaria', exp: Date.now() / 1000 + 3600 };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('veridia_token', token);

    const { result } = renderHook(() => usePermission());
    expect(result.current.isSecretaria).toBe(true);
    expect(result.current.hasRole('secretaria')).toBe(true);
  });

  it('returns false for expired token', () => {
    const payload = { rol: 'admin', exp: Date.now() / 1000 - 3600 };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
    localStorage.setItem('veridia_token', token);

    const { result } = renderHook(() => usePermission());
    expect(result.current.isAdmin).toBe(false);
  });

  it('handles invalid token gracefully', () => {
    localStorage.setItem('veridia_token', 'invalid.token.here');
    const { result } = renderHook(() => usePermission());
    expect(result.current.isAdmin).toBe(false);
  });
});