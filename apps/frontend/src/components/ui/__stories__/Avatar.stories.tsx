import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@/components/ui/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy', null],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    alt: 'John Doe',
    fallback: 'JD',
  },
};

export const WithFallback: Story = {
  args: {
    src: '',
    alt: 'No image',
    fallback: 'NA',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="sm" fallback="XS" />
      <Avatar size="md" fallback="SM" />
      <Avatar size="lg" fallback="MD" />
      <Avatar className="h-16 w-16" fallback="LG" />
      <Avatar className="h-24 w-24" fallback="XL" />
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar fallback="ON" status="online" />
      <Avatar fallback="OF" status="offline" />
      <Avatar fallback="BU" status="busy" />
      <Avatar fallback="NO" />
    </div>
  ),
};