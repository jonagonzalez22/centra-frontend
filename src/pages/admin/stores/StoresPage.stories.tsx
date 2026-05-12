import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoresPageView } from './StoresPageView';

const meta: Meta<typeof StoresPageView> = {
    title: 'Pages/Admin/Stores/StoresPage',
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

export const Default: Story = {
    args: {
        title: 'Gestión de Tiendas',
        description: 'Administra las tiendas registradas en el sistema',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tiendas' }],
        canCreateStore: true,
        error: null,
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        canCreateStore: false,
        error: null,
    },
};

export const Empty: Story = {
    args: {
        ...Default.args,
        canCreateStore: false,
        error: null,
    },
};

export const WithError: Story = {
    args: {
        ...Default.args,
        canCreateStore: false,
        error: 'Error al cargar las tiendas',
    },
};