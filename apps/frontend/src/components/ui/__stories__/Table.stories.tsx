/* eslint-disable no-console -- Callbacks de demo del story: logean interacciones a propósito. */
import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '@/components/ui/Table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const meta: Meta<typeof Table<User>> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
];

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'Editor', status: 'Inactive' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Viewer', status: 'Pending' },
];

export const Default: Story = {
  args: {
    columns,
    data: users,
    keyExtractor: (user: User) => user.id,
  },
};

export const Empty: Story = {
  args: {
    columns,
    data: [],
    keyExtractor: (user: User) => user.id,
    emptyMessage: 'No users found',
  },
};

export const Loading: Story = {
  args: {
    columns,
    data: [],
    keyExtractor: (user: User) => user.id,
    loading: true,
  },
};

export const Selectable: Story = {
  args: {
    columns,
    data: users,
    keyExtractor: (user: User) => user.id,
    selectable: true,
    onSelectionChange: (keys: string[]) => console.log('Selected:', keys),
  },
};

export const WithActions: Story = {
  args: {
    columns,
    data: users,
    keyExtractor: (user: User) => user.id,
    actions: [
      { label: 'Edit', onClick: (user: User) => console.log('Edit:', user), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg> },
      { label: 'Delete', onClick: (user: User) => console.log('Delete:', user), variant: 'danger', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
    ],
  },
};

export const WithCustomRow: Story = {
  args: {
    columns: [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'email', header: 'Email', sortable: true },
      { key: 'role', header: 'Role', sortable: true },
      { key: 'status', header: 'Status', sortable: false },
    ],
    data: users,
    keyExtractor: (user: User) => user.id,
    renderRow: (user: User) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      status: (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.status === 'Active' ? 'bg-success/20 text-success' :
          user.status === 'Inactive' ? 'bg-text-3/20 text-text-3' :
          'bg-warning/20 text-warning'
        }`}>
          {user.status}
        </span>
      ),
    }),
  },
};

export const Sorted: Story = {
  args: {
    columns: columns.map(c => ({ ...c, sortable: true })),
    data: users,
    keyExtractor: (user: User) => user.id,
  },
};