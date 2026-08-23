import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    open: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DialogDemo title="Confirm Action" description="Are you sure you want to proceed? This action cannot be undone.">
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Confirm</Button>
      </div>
    </DialogDemo>
  ),
};

export const WithForm: Story = {
  render: () => (
    <DialogDemo title="New Patient" description="Enter the patient's information below." size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" className="w-full px-3 py-2 border border-border rounded-lg bg-bg input-text" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 border border-border rounded-lg bg-bg input-text" placeholder="email@example.com" />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Create</Button>
        </div>
      </div>
    </DialogDemo>
  ),
};

export const Alert: Story = {
  render: () => (
    <DialogDemo 
      title="Delete Patient?" 
      description="This will permanently delete the patient and all associated data. This action cannot be undone."
      size="sm"
    >
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </div>
    </DialogDemo>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <DialogDemo title="Small Dialog" size="sm">Small dialog content</DialogDemo>
      <DialogDemo title="Medium Dialog" size="md">Medium dialog content</DialogDemo>
      <DialogDemo title="Large Dialog" size="lg">Large dialog content</DialogDemo>
      <DialogDemo title="XL Dialog" size="xl">XL dialog content</DialogDemo>
    </div>
  ),
};

// Helper component to show open dialog
function DialogDemo({ title, description, size = 'lg', children }: { title: string; description?: string; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; children: React.ReactNode }) {
  return (
    <Dialog open={true} onClose={() => {}} title={title} description={description} size={size}>
      {children}
    </Dialog>
  );
}