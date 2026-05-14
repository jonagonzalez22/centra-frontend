import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoresTable } from './StoresTable';

const meta: Meta<typeof StoresTable> = {
    title: 'Features/Admin/Stores/StoresTable',
    component: StoresTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onEdit: () => {},
    },
};

export const Loading: Story = {
    args: {
        onEdit: () => {},
    },
};

export const Empty: Story = {
    args: {
        onEdit: () => {},
    },
};