import type { Meta, StoryObj } from '@storybook/react-vite';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Type here...',
  },
  argTypes: {
    prefix: { control: false },
    suffix: { control: false },
    onChange: { control: false },
    onKeyDown: { control: false },
  },
};

export const WithCount: Story = {
  args: {
    placeholder: 'Max 10 chars',
    count: true,
    max: 10,
  },
};

export const WithPrefix: Story = {
  args: {
    prefix: <span>🔍</span>,
    placeholder: 'Search...',
  },
  argTypes: {
    prefix: { control: false },
  },
};

export const WithSuffix: Story = {
  args: {
    suffix: <span>🔍</span>,
    placeholder: 'Search...',
  },
  argTypes: {
    suffix: { control: false },
    prefix: { control: false },
  },
};
