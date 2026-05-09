import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppLayout } from './AppLayout';

const adminMenuItems = [
    { key: '/admin', label: 'Dashboard' },
    { key: '/admin/stores', label: 'Tiendas' },
];

const storeMenuItems = [
    { key: '/tienda/stock', label: 'Stock' },
    { key: '/tienda/pos', label: 'POS' },
    { key: '/tienda/orders', label: 'Pedidos' },
];

type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Layout principal para el backoffice de administración.',
            },
        },
    },
    args: {
        title: 'Backoffice Admin',
        menuItems: adminMenuItems,
    },
    render: (args) => (
        <AppLayout {...args}>
            <div style={{ padding: '20px', color: '#666' }}>
                Contenido de la página - usa Outlet para rutas anidadas de React Router
            </div>
        </AppLayout>
    ),
};

export const StoreLayout: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Layout unificado para el panel de administración de tienda.',
            },
        },
    },
    args: {
        title: 'Mi Tienda',
        menuItems: storeMenuItems,
    },
    render: (args) => (
        <AppLayout {...args}>
            <div style={{ padding: '20px', color: '#666' }}>
                Contenido del dashboard de tienda
            </div>
        </AppLayout>
    ),
};

export default {
    title: 'layouts/AppLayout',
    component: AppLayout,
    tags: ['autodocs'],
} satisfies Meta<typeof AppLayout>;