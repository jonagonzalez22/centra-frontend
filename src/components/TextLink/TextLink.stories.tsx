import type { Meta, StoryObj } from '@storybook/react-vite';
import TextLink from './TextLink';

const meta: Meta<typeof TextLink> = {
    title: 'Components/TextLink',
    component: TextLink,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        to: '/forgot-password',
        children: 'Olvidé contraseña',
    },
};
