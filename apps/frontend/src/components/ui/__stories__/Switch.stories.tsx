import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@/components/ui/Switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onChange: () => {},
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    checked: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

export const WithLabels: Story = {
  render: () => <WithLabelsStory />,
};

function WithLabelsStory() {
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={notifications} onChange={setNotifications} />
        <span className="text-sm">Disable notifications</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={darkMode} onChange={setDarkMode} />
        <span className="text-sm">Enable dark mode</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={false} onChange={() => {}} disabled />
        <span className="text-sm text-text-3">Auto-save (disabled)</span>
      </label>
    </div>
  );
}