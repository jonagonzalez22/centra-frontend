import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlansTable } from './PlansTable';

const meta: Meta<typeof PlansTable> = {
    title: 'Features/Admin/Plans/PlansTable',
    component: PlansTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onEdit: () => {},
        onManageFeatures: () => {},
        onDelete: () => {},
    },
};

export const Loading: Story = {
    args: {
        onEdit: () => {},
        onManageFeatures: () => {},
        onDelete: () => {},
    },
};

export const Empty: Story = {
    args: {
        onEdit: () => {},
        onManageFeatures: () => {},
        onDelete: () => {},
    },
};
