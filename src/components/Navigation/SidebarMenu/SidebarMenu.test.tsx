import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { SidebarMenu } from './SidebarMenu';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(() => ({
        user: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            store_id: null,
            roles: ['SUPER_ADMIN'],
            permissions: ['stores.view', 'users.view', 'settings.view'],
            features: [],
        },
    })),
}));

describe('SidebarMenu', () => {
    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>);
    };

    test('renders desktop sider when not mobile', () => {
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey={'/admin/dashboard'} />
        );

        expect(screen.getByText(/CENTRA/i)).toBeInTheDocument();
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    test('renders drawer when mobile and open', () => {
        renderWithRouter(
            <SidebarMenu isMobile={true} isOpen={true} selectedKey={'/admin/dashboard'} />
        );

        expect(screen.getByText(/CENTRA/i)).toBeInTheDocument();
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    test('renders Configuraciones submenu for admin users with permission', () => {
        renderWithRouter(
            <SidebarMenu isMobile={false} isOpen={false} selectedKey={'/admin/dashboard'} />
        );

        expect(screen.getByText(/Configuraciones/i)).toBeInTheDocument();
    });

    test('opens Configuraciones submenu when on a settings route', () => {
        renderWithRouter(
            <SidebarMenu
                isMobile={false}
                isOpen={false}
                selectedKey={'/admin/configuraciones/tipos-de-negocio'}
            />
        );

        expect(screen.getByText(/Configuraciones/i)).toBeInTheDocument();
        expect(screen.getByText(/Tipos de Negocio/i)).toBeInTheDocument();
    });
});