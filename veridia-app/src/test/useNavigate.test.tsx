import { useNavigate } from 'react-router-dom'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

describe('useNavigate', () => {
  it('works in MemoryRouter', () => {
    const { result } = renderHook(() => useNavigate(), {
      wrapper: MemoryRouter,
    })
    expect(typeof result.current).toBe('function')
  })
})
