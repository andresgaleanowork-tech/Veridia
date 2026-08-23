import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label and placeholder', () => {
    render(<Input id="name" label="Nombre" placeholder="Escribe tu nombre" />)
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/escribe tu nombre/i)).toBeInTheDocument()
  })

  it('renders error state with helper text', () => {
    render(<Input id="email" label="Email" error="Email inválido" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
  })

  it('renders helper text when no error', () => {
    render(<Input id="phone" label="Teléfono" helperText="Incluye código de área" />)
    expect(screen.getByText(/incluye código de área/i)).toBeInTheDocument()
  })

  it('renders with left icon', () => {
    render(
      <Input
        id="search"
        label="Buscar"
        leftIcon={<span data-testid="left-icon">🔍</span>}
      />
    )
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('renders with right icon', () => {
    render(
      <Input
        id="password"
        label="Contraseña"
        type="password"
        rightIcon={<span data-testid="right-icon">👁️</span>}
      />
    )
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('applies error styles when error is present', () => {
    render(<Input id="error-input" error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('border-danger')
  })

  it('links label to input via htmlFor', () => {
    render(<Input id="linked" label="Campo" />)
    const label = screen.getByText(/campo/i)
    const input = screen.getByRole('textbox')
    expect(label).toHaveAttribute('for', 'linked')
    expect(input).toHaveAttribute('id', 'linked')
  })
})
