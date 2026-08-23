import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when key is missing', () => {
    const { result } = renderHook(() => useLocalStorage('missing', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('theme', JSON.stringify('dark'))
    const { result } = renderHook(() => useLocalStorage('theme', 'light'))
    expect(result.current[0]).toBe('dark')
  })

  it('writes value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('name', 'Veridia'))
    act(() => {
      result.current[1]('New Name')
    })
    expect(result.current[0]).toBe('New Name')
    expect(JSON.parse(localStorage.getItem('name') || '')).toBe('New Name')
  })

  it('supports updater function', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0))
    act(() => {
      result.current[1]((prev) => prev + 1)
    })
    expect(result.current[0]).toBe(1)
    expect(JSON.parse(localStorage.getItem('count') || '')).toBe(1)
  })
})
