import type { Meta, StoryObj } from '@storybook/react-vite';
import InputPassword from './InputPassword';

const meta: Meta<typeof InputPassword> = {
  title: 'Components/InputPassword',
  component: InputPassword,
  argTypes: {
    error: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof InputPassword>;

export const Default: Story = {
  args: {
    name: 'password',
    label: 'Password',
    placeholder: 'Enter password',
  },
};

export const Required: Story = {
  args: {
    name: 'password',
    label: 'Password',
    required: true,
    placeholder: 'Enter password',
  },
};

export const WithError: Story = {
  args: {
    name: 'password',
    label: 'Password',
    error: {
      status: true,
      message: 'Password is too weak',
    },
  },
};

export const Disabled: Story = {
  args: {
    name: 'password',
    label: 'Password',
    disabled: true,
    placeholder: 'Disabled password',
  },
};
