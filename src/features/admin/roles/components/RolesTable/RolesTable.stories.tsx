import type { Meta, StoryObj } from '@storybook/react-vite';
import { RolesTable } from './RolesTable';

const meta: Meta<typeof RolesTable> = {
    title: 'Features/Admin/Roles/RolesTable',
    component: RolesTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const mockRole = {
    id: 'r1',
    name: 'Administrador',
    description: 'Rol de administrador',
    permissions: ['stores.view', 'stores.edit', 'plans.view', 'plans.create'],
    users_count: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
};

export const Default: Story = {
    args: {
        roles: [mockRole],
        loading: false,
        onEditPermissions: () => {},
    },
};

export const Loading: Story = {
    args: {
        roles: [],
        loading: true,
        onEditPermissions: () => {},
    },
};

export const Empty: Story = {
    args: {
        roles: [],
        loading: false,
        onEditPermissions: () => {},
    },
};