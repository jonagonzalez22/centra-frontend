import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { DashboardPageView } from './DashboardPageView';
import type { DashboardStats } from '@/features/admin/dashboard/interfaces/dashboard.interface';

const mockData: DashboardStats = {
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
        ],
    },
};

const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('DashboardPage', () => {
    test('renders the page header and breadcrumb', () => {
        renderWithRouter(
            <DashboardPageView
                title="Dashboard"
                description="Resumen del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Dashboard' }]}
                data={mockData}
                loading={false}
                error={null}
            />
        );

        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
    });

    test('renders metric cards with data', () => {
        renderWithRouter(
            <DashboardPageView
                title="Dashboard"
                description="Resumen del sistema"
                breadcrumbs={[]}
                data={mockData}
                loading={false}
                error={null}
            />
        );

        expect(screen.getByText('Total Tiendas')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('Planes Activos')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('renders loading state for metric cards', () => {
        renderWithRouter(
            <DashboardPageView
                title="Dashboard"
                description="Resumen del sistema"
                breadcrumbs={[]}
                data={null}
                loading={true}
                error={null}
            />
        );

        const skeletons = document.querySelectorAll('.ant-skeleton-input');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    test('renders error message when dashboard fails to load', () => {
        renderWithRouter(
            <DashboardPageView
                title="Dashboard"
                description="Resumen del sistema"
                breadcrumbs={[]}
                data={null}
                loading={false}
                error="Error al cargar el dashboard"
            />
        );

        expect(screen.getByText('Error al cargar el dashboard')).toBeInTheDocument();
    });

    test('renders recent activity table with stores', () => {
        renderWithRouter(
            <DashboardPageView
                title="Dashboard"
                description="Resumen del sistema"
                breadcrumbs={[]}
                data={mockData}
                loading={false}
                error={null}
            />
        );

        expect(screen.getByText('Limplieza Clorín')).toBeInTheDocument();
        expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    });
});