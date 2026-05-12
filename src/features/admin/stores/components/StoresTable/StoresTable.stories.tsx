import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoresTable } from './StoresTable';

const meta: Meta<typeof StoresTable> = {
    title: 'Features/Admin/Stores/StoresTable',
    component: StoresTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const stores = [
    {
        id: '1',
        name: 'Sucursal Centro',
        email: 'centro@centra.com',
        is_active: true,
        inactive_reason: null,
        inactive_at: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        business_type: { id: 1, name: 'Ferretería' },
        plan: { id: 'plan-1', name: 'Plan Básico' },
    },
    {
        id: '2',
        name: 'Sucursal Norte',
        email: null,
        is_active: false,
        inactive_reason: 'Renovación pendiente',
        inactive_at: '2024-02-20T15:30:00Z',
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-02-20T15:30:00Z',
        business_type: null,
        plan: null,
    },
];

const mockPagination = {
    current: 1,
    total: 2,
    pageSize: 15,
};

export const Default: Story = {
    args: {
        stores,
        loading: false,
        pagination: mockPagination,
        onPageChange: () => {},
    },
};

export const Loading: Story = {
    args: {
        stores: [],
        loading: true,
        pagination: mockPagination,
        onPageChange: () => {},
    },
};

export const Empty: Story = {
    args: {
        stores: [],
        loading: false,
        pagination: { ...mockPagination, total: 0 },
        onPageChange: () => {},
    },
};