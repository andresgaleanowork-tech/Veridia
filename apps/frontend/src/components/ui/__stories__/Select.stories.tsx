import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '@/components/ui/Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    searchable: { control: 'boolean' },
    nativeOnMobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: 'admin', label: 'Admin' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'trial', label: 'Trial' },
];

export const Default: Story = {
  args: {
    label: 'Role',
    placeholder: 'Select a role',
    options,
  },
};

export const WithValue: Story = {
  args: {
    label: 'Role',
    placeholder: 'Select a role',
    options,
    value: 'nutricionista',
  },
};

export const Searchable: Story = {
  args: {
    label: 'Patient',
    placeholder: 'Search patients...',
    options: [
      { value: 'p1', label: 'John Doe' },
      { value: 'p2', label: 'Jane Smith' },
      { value: 'p3', label: 'Bob Wilson' },
      { value: 'p4', label: 'Alice Brown' },
      { value: 'p5', label: 'Charlie Davis' },
      { value: 'p6', label: 'Diana Evans' },
      { value: 'p7', label: 'Eve Foster' },
      { value: 'p8', label: 'Frank Green' },
      { value: 'p9', label: 'Grace Hill' },
      { value: 'p10', label: 'Henry Irving' },
    ],
    searchable: true,
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Role',
    placeholder: 'Select a role',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'nutricionista', label: 'Nutricionista' },
      { value: 'secretaria', label: 'Secretaria', disabled: true },
      { value: 'trial', label: 'Trial', disabled: true },
    ],
  },
};

export const WithError: Story = {
  args: {
    label: 'Role',
    placeholder: 'Select a role',
    options,
    error: 'Please select a valid role',
  },
};

export const WithGroups: Story = {
  args: {
    label: 'Category',
    placeholder: 'Select category',
    options: [
      { value: 'cat1', label: 'Category 1' },
      { value: 'cat2', label: 'Category 2' },
      { value: 'cat3', label: 'Category 3' },
    ],
  },
};