import type { Meta, StoryObj } from '@storybook/react-vite';
import InputField from './InputField';

const meta: Meta<typeof InputField> = {
  title: 'Components/InputField',
  component: InputField,
  argTypes: {
    prefix: { control: false },
    suffix: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof InputField>;

export const Default: Story = {
  args: {
    name: 'email',
    label: 'Email',
    placeholder: 'Enter email',
  },
};

export const Required: Story = {
  args: {
    name: 'username',
    label: 'Username',
    rules: [{ required: true, message: 'Username is required' }],
    placeholder: 'Enter username',
  },
};

export const WithExtras: Story = {
  args: {
    name: 'name',
    label: 'Name',
    prefix: <span>👤</span>,
    suffix: <span>✓</span>,
    count: true,
    max: 10,
    placeholder: 'Type name',
  },
};

export const Disabled: Story = {
  args: {
    name: 'email',
    label: 'Email',
    disabled: true,
    placeholder: 'Disabled field',
  },
};