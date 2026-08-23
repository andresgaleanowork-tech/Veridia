import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '@/components/ui/Switch'

describe('Switch', () => {
  it('renders with label', () => {
    render(<Switch label="Enable notifications" checked={false} onChange={() => {}} />)
    expect(screen.getByText('Enable notifications')).toBeInTheDocument()
  })

  it('toggles on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Switch label="Toggle" checked={false} onChange={onChange} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('shows checked state', () => {
    render(<Switch label="Checked" checked={true} onChange={() => {}} />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('can be disabled', () => {
    render(<Switch label="Disabled" checked={false} onChange={() => {}} disabled />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })
})
