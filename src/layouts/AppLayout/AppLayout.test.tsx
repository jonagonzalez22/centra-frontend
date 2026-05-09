import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './AppLayout';

const adminMenuItems = [
    { key: '/admin', label: 'Dashboard' },
    { key: '/admin/stores', label: 'Tiendas' },
];

describe('AppLayout', () => {
    const renderWithRouter = (content: React.ReactNode, initialPath = '/admin') => {
        return render(
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route
                        path="/admin"
                        element={<AppLayout title="Backoffice Admin" menuItems={adminMenuItems} />}
                    >
                        <Route index element={content} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
    };

    test('renders outlet content', () => {
        renderWithRouter(<div>Main Content</div>);

        expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    test('renders layout structure correctly', () => {
        const { container } = renderWithRouter(<div>Content</div>);

        expect(container.querySelector('.ant-layout')).toBeInTheDocument();
    });

    test('applies layout styles', () => {
        const { container } = renderWithRouter(<div>Styled</div>);

        expect(container.firstChild).toHaveClass('appLayout');
    });

    test('renders multiple outlet elements correctly', () => {
        renderWithRouter(
            <>
                <div>Item 1</div>
                <div>Item 2</div>
            </>
        );

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    test('renders sidebar and header', () => {
        renderWithRouter(<div>Dashboard</div>);

        expect(screen.getByText('Backoffice Admin')).toBeInTheDocument();
        expect(screen.getAllByText('Dashboard')).toHaveLength(2);
    });

    test('renders children when provided', () => {
        render(
            <MemoryRouter initialEntries={['/any']}>
                <AppLayout title="Test" menuItems={[]}>
                    <div>Children Content</div>
                </AppLayout>
            </MemoryRouter>
        );

        expect(screen.getByText('Children Content')).toBeInTheDocument();
    });

    test('renders with different title and menu items', () => {
        const storeMenuItems = [
            { key: '/tienda/stock', label: 'Stock' },
            { key: '/tienda/pos', label: 'POS' },
        ];

        render(
            <MemoryRouter initialEntries={['/tienda']}>
                <AppLayout title="Mi Tienda" menuItems={storeMenuItems}>
                    <div>Store Content</div>
                </AppLayout>
            </MemoryRouter>
        );

        expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
        expect(screen.getByText('Stock')).toBeInTheDocument();
        expect(screen.getByText('POS')).toBeInTheDocument();
    });
});