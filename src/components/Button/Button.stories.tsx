import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'default', 'danger'],
      description: 'Variante de boton CENTRA',
    },
    loading: {
      control: 'boolean',
      description: 'Indica si el botón está en estado de carga',
    },
    icon: {
      control: false,
      description: 'Icono del botón',
    },
    action: {
      control: false,
      description: 'Función que se ejecuta al hacer click',
    },
    disabled: {
      control: 'boolean',
      description: 'Indica si el botón está deshabilitado',
    },
    label: {
      control: 'text',
      description: 'Texto del botón',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    action: () => {},
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'default',
    action: () => {},
  },
};

export const Danger: Story = {
  args: {
    label: 'Danger Button',
    variant: 'danger',
    action: () => {},
  },
};

export const Loading: Story = {
  args: {
    label: 'Loading Button',
    variant: 'primary',
    loading: true,
    action: () => {},
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    variant: 'primary',
    disabled: true,
    action: () => {},
  },
};