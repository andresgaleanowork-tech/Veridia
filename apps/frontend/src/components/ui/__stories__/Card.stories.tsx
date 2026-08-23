import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Card Title</h3>
        <p className="text-text-3">This is a default card with some content.</p>
      </div>
    ),
  },
};

export const Glass: Story = {
  args: {
    className: 'backdrop-blur-xl bg-white/5',
    children: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Glass Card</h3>
        <p className="text-text-3">This card has a glassmorphism effect.</p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    className: 'shadow-2xl',
    children: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Elevated Card</h3>
        <p className="text-text-3">This card has a shadow elevation.</p>
      </div>
    ),
  },
};

export const WithPadding: Story = {
  args: {
    className: 'p-8',
    children: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Padded Card</h3>
        <p className="text-text-3">This card has large padding.</p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    className: 'cursor-pointer hover:bg-white/5 transition-colors',
    children: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Interactive Card</h3>
        <p className="text-text-3">Hover to see the effect.</p>
      </div>
    ),
  },
};