import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoresPageView } from './StoresPage';

const meta: Meta<typeof StoresPageView> = {
    title: 'Pages/Store/StoresPage',
    component: StoresPageView,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div className="bg-centra-surface p-6">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const stores = [
    { id: 1, name: 'Sucursal Centro', email: 'centro@centra.com', status: 'active' as const },
    { id: 2, name: 'Sucursal Norte', email: 'norte@centra.com', status: 'inactive' as const },
    { id: 3, name: 'Sucursal Sur', email: null, status: 'active' as const },
];

export const Default: Story = {
    args: {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        stores,
        loading: false,
        error: null,
        refetch: () => {},
    },
};

export const Loading: Story = {
    args: {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        stores: [],
        loading: true,
        error: null,
        refetch: () => {},
    },
};

export const Empty: Story = {
    args: {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        stores: [],
        loading: false,
        error: null,
        refetch: () => {},
    },
};

export const WithError: Story = {
    args: {
        title: 'Gestión de Tiendas',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        stores: [],
        loading: false,
        error: 'Error al cargar las tiendas',
        refetch: () => {},
    },
};
