import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mockLogout = vi.fn().mockResolvedValue(undefined);
vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(() => ({ user: { name: 'Ana Ruiz', roles: ['Admin'] }, logout: mockLogout })),
}));

describe('AppHeader', () => {
    const renderHeader = (isMobile = false, onToggleMenu?: () => void) =>
        render(
            <MemoryRouter>
                <AppHeader title="T" isMobile={isMobile} onToggleMenu={onToggleMenu} />
            </MemoryRouter>
        );

    test('renders the provided title', () => {
        render(
            <MemoryRouter>
                <AppHeader title="Mi Aplicación" isMobile={false} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Mi Aplicación/i)).toBeInTheDocument();
    });

    test('shows user name and role when not mobile', () => {
        renderHeader();

        expect(screen.getByText(/Ana Ruiz/i)).toBeInTheDocument();
        expect(screen.getByText(/Admin/i)).toBeInTheDocument();
    });

    test('does not show user name when mobile', () => {
        renderHeader(true);

        expect(screen.queryByText(/Ana Ruiz/i)).toBeNull();
    });

    test('calls onToggleMenu when mobile menu button is clicked', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();

        renderHeader(true, onToggle);

        await user.click(screen.getByRole('button'));

        expect(onToggle).toHaveBeenCalled();
    });

    test('navigates to a clean login location before explicit logout', async () => {
        const user = userEvent.setup();
        const LocationProbe = () => {
            const location = useLocation();
            return <span data-testid="location">{`${location.pathname}:${location.state ? 'state' : 'clean'}`}</span>;
        };

        render(
            <MemoryRouter initialEntries={['/tienda/conductor/rutas']}>
                <AppHeader title="T" isMobile={false} />
                <Routes>
                    <Route path="*" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        );

        await user.click(screen.getByText('Ana Ruiz').closest('.appHeaderUserMenuTrigger')!);
        await user.click(await screen.findByText('Cerrar Sesion'));

        expect(screen.getByTestId('location')).toHaveTextContent('/login:clean');
        expect(mockLogout).toHaveBeenCalled();
    });
});
