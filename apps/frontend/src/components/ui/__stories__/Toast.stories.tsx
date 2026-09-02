import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast, type ToastVariant } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

// Helper component to demonstrate toasts
function ToastDemo({ variant, title, description }: { variant: ToastVariant; title: string; description: string }) {
  const { addToast } = useToast();

  return (
    <Button
      variant="primary"
      onClick={() => addToast(variant, title, description, 5000)}
    >
      Show {variant} toast
    </Button>
  );
}

// Wrapper providing the ToastProvider context to every story
function ToastDemoWithProvider(props: { variant: ToastVariant; title: string; description: string }) {
  return (
    <ToastProvider>
      <ToastDemo {...props} />
    </ToastProvider>
  );
}

const meta: Meta<typeof ToastDemoWithProvider> = {
  title: 'UI/Toast',
  component: ToastDemoWithProvider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    description: 'Your changes have been saved.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    description: 'Something went wrong. Please try again.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    description: 'Please review your input before submitting.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    description: 'New features are available in the latest update.',
  },
};
