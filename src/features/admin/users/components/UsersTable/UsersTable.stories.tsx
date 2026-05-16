import type { Meta, StoryObj } from '@storybook/react-vite';
import { UsersTable } from './UsersTable';

const meta: Meta<typeof UsersTable> = {
    title: 'Features/Admin/Users/UsersTable',
    component: UsersTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onEdit: () => {},
        onDelete: () => Promise.resolve(),
    },
};

export const Loading: Story = {
    args: {
        onEdit: () => {},
        onDelete: () => Promise.resolve(),
    },
};

export const Empty: Story = {
    args: {
        onEdit: () => {},
        onDelete: () => Promise.resolve(),
    },
};