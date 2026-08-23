import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dialog } from './Dialog';
import { render, screen, fireEvent } from '@testing-library/react';

describe('Dialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Test Dialog',
    children: <p>Dialog content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<Dialog {...defaultProps} />);
    expect(screen.getByText('Test Dialog')).toBeTruthy();
    expect(screen.getByText('Dialog content')).toBeTruthy();
  });

  it('does not render when closed', () => {
    render(<Dialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Test Dialog')).toBeNull();
  });

  it('calls onClose when close button clicked', () => {
    render(<Dialog {...defaultProps} />);
    const closeBtn = screen.getByLabelText('Cerrar');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    render(<Dialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders children content', () => {
    render(
      <Dialog {...defaultProps}>
        <input type="text" aria-label="test input" />
      </Dialog>
    );
    expect(screen.getByLabelText('test input')).toBeTruthy();
  });
});
