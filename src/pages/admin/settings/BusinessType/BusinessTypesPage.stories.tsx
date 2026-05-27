import type { Meta, StoryObj } from '@storybook/react-vite';
import { BusinessTypesPageView } from './BusinessTypesPageView';
import { BusinessTypesProvider } from '@/features/admin/business-types/contexts/BusinessTypesProvider';
import type { UseBusinessTypesReturn } from '@/features/admin/business-types/hooks/useBusinessTypes';

const createMockState = (overrides: Partial<UseBusinessTypesReturn> = {}): UseBusinessTypesReturn => ({
    businessTypes: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: () => {},
    deleteBusinessType: () => Promise.resolve(),
    ...overrides,
});

const meta: Meta<typeof BusinessTypesPageView> = {
    title: 'Pages/Admin/Settings/BusinessType/BusinessTypesPage',
    component: BusinessTypesPageView,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <BusinessTypesProvider value={createMockState()}>
                <div className="bg-centra-surface p-6">
                    <Story />
                </div>
            </BusinessTypesProvider>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Tipos de Negocio',
        description: 'Administra los tipos de negocio del sistema',
        breadcrumbs: [
            { label: 'Admin', path: '/admin/dashboard' },
            { label: 'Configuraciones', path: '/admin/configuraciones/tipos-de-negocio' },
            { label: 'Tipos de Negocio' },
        ],
        error: null,
        onEdit: () => {},
        onCreate: () => {},
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        error: null,
    },
};

export const Empty: Story = {
    args: {
        ...Default.args,
        error: null,
    },
};

export const WithError: Story = {
    args: {
        ...Default.args,
        error: 'Error al cargar los tipos de negocio',
    },
};
