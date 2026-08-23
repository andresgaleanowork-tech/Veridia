import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders with success variant', () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders with danger variant', () => {
    render(<Badge variant="danger">Error</Badge>)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders with dot indicator', () => {
    render(<Badge dot>With Dot</Badge>)
    expect(screen.getByText('With Dot')).toBeInTheDocument()
  })
})
