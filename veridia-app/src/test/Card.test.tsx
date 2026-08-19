import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardFooter } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Contenido de la tarjeta</Card>)
    expect(screen.getByText(/contenido de la tarjeta/i)).toBeInTheDocument()
  })

  it('applies glass-card class', () => {
    const { container } = render(<Card>Test</Card>)
    expect(container.querySelector('.glass-card')).toBeInTheDocument()
  })
})

describe('CardHeader', () => {
  it('renders title and description', () => {
    render(<CardHeader title="Título" description="Descripción" />)
    expect(screen.getByText(/título/i)).toBeInTheDocument()
    expect(screen.getByText(/descripción/i)).toBeInTheDocument()
  })

  it('renders action slot', () => {
    render(
      <CardHeader
        title="Acciones"
        action={<button>Acción</button>}
      />
    )
    expect(screen.getByRole('button', { name: /acción/i })).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <CardHeader title="Con hijos">
        <span data-testid="child">Hijo</span>
      </CardHeader>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Pie de tarjeta</CardFooter>)
    expect(screen.getByText(/pie de tarjeta/i)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CardFooter className="custom-class">
        Contenido
      </CardFooter>
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})
