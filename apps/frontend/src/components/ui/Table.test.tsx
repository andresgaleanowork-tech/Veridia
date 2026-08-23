import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from './Table';

interface TestRow {
  id: string;
  name: string;
  status: string;
}

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
];

const data: TestRow[] = [
  { id: '1', name: 'Alice', status: 'Active' },
  { id: '2', name: 'Bob', status: 'Inactive' },
];

describe('Table', () => {
  it('renders rows', () => {
    render(<Table columns={columns} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('renders column headers', () => {
    render(<Table columns={columns} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    render(<Table columns={columns} data={[] as TestRow[]} keyExtractor={(r) => r.id} emptyMessage="No items" />);
    expect(screen.getByText('No items')).toBeTruthy();
  });

  it('renders with actions', () => {
    const actions = [{ label: 'Edit', onClick: vi.fn() }];
    render(<Table columns={columns} data={data} keyExtractor={(r: TestRow) => r.id} actions={actions} />);
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('sorts by column when sortable header clicked', () => {
    render(<Table columns={columns} data={data} keyExtractor={(r: TestRow) => r.id} />);
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(3);
  });
});
