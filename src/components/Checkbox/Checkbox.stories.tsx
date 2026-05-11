import type { Meta, StoryObj } from '@storybook/react-vite';
import Checkbox from './Checkbox';

const meta: Meta<typeof Checkbox> = {
    title: 'Components/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Recordarme',
    },
};

export const Checked: Story = {
    args: {
        children: 'Recordarme',
        checked: true,
    },
};

export const Disabled: Story = {
    args: {
        children: 'Recordarme',
        disabled: true,
    },
};
