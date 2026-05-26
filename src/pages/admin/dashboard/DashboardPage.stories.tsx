import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardPageView } from './DashboardPageView';

const meta: Meta<typeof DashboardPageView> = {
    title: 'Pages/Admin/Dashboard/DashboardPage',
    component: DashboardPageView,
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

const mockData = {
    metrics: {
        total_stores: 11,
        total_users: 6,
        estimated_mrr: 90,
        active_plans_count: 2,
    },
    charts: {
        stores_by_plan: [
            { plan_name: 'Beta (Piloto)', store_count: 1 },
            { plan_name: 'Esencial', store_count: 9 },
        ],
        stores_by_business_type: [
            { business_type_name: 'Articulos de limpieza', store_count: 5 },
            { business_type_name: 'Ferretería', store_count: 5 },
        ],
        growth_last_6_months: [
            { month: '2026-04', store_count: 1 },
            { month: '2026-05', store_count: 10 },
        ],
    },
    recent_activity: {
        latest_stores: [
            {
                id: 'a8112713-5987-493b-a259-19c414db4503',
                name: 'Limplieza Clorín',
                created_at: '2026-05-14T19:25:59+00:00',
            },
            {
                id: '1a2b9f05-989d-4ea8-b56f-b35675f17f4b',
                name: 'Ferretería El Clavito 3',
                created_at: '2026-05-14T03:24:15+00:00',
            },
        ],
    },
};

export const Default: Story = {
    args: {
        title: 'Dashboard',
        description: 'Resumen del sistema',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Dashboard' }],
        data: mockData,
        loading: false,
        error: null,
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        data: null,
        loading: true,
    },
};

export const WithError: Story = {
    args: {
        ...Default.args,
        data: null,
        loading: false,
        error: 'Error al cargar el dashboard',
    },
};