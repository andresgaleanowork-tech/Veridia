import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/ui/Skeleton'

describe('Skeleton', () => {
  it('renders with default rect variant', () => {
    const { container } = render(<Skeleton />)
    const el = container.querySelector('span')
    expect(el).toBeInTheDocument()
    expect(el?.className).toContain('rounded-xl')
  })

  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />)
    const el = container.querySelector('span')
    expect(el?.className).toContain('rounded')
    expect(el?.className).toContain('h-4')
  })

  it('renders circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />)
    const el = container.querySelector('span')
    expect(el?.className).toContain('rounded-full')
  })

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={100} height={50} />)
    const el = container.querySelector('span')
    expect(el).toHaveStyle({ width: '100px', height: '50px' })
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="extra-class" />)
    const el = container.querySelector('span')
    expect(el?.className).toContain('extra-class')
  })

  it('is aria-hidden', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('span[aria-hidden="true"]')).toBeInTheDocument()
  })
})
