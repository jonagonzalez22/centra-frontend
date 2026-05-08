import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoresTable } from './StoresTable';

const meta: Meta<typeof StoresTable> = {
    title: 'Features/Store/StoresTable',
    component: StoresTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const stores = [
    { id: 1, name: 'Sucursal Centro', email: 'centro@centra.com', status: 'active' as const },
    { id: 2, name: 'Sucursal Norte', email: null, status: 'inactive' as const },
];

export const Default: Story = {
    args: {
        stores,
        loading: false,
    },
};

export const Loading: Story = {
    args: {
        stores: [],
        loading: true,
    },
};

export const Empty: Story = {
    args: {
        stores: [],
        loading: false,
    },
};
