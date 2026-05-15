import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import NotFoundPage from './NotFoundPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockUseAuthStoreAuthenticated = {
    isAuthenticated: true,
    user: { id: 1, name: 'Test User', roles: ['SUPER_ADMIN'] as const },
};

const mockUseAuthStoreUnauthenticated = {
    isAuthenticated: false,
    user: null,
};

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/store/useAuthStore.store';

describe('NotFoundPage', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        vi.clearAllMocks();
    });

    test('renders 404 result for authenticated user', () => {
        vi.mocked(useAuthStore).mockReturnValue(mockUseAuthStoreAuthenticated);

        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/página no encontrada/i)).toBeInTheDocument();
        expect(screen.getByText(/la página que buscas no existe/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /volver atrás/i })).toBeInTheDocument();
    });

    test('renders back button that calls navigate(-1)', () => {
        vi.mocked(useAuthStore).mockReturnValue(mockUseAuthStoreAuthenticated);

        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>
        );

        const backButton = screen.getByRole('button', { name: /volver atrás/i });
        backButton.click();

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('does not render 404 content when user is not authenticated', () => {
        vi.mocked(useAuthStore).mockReturnValue(mockUseAuthStoreUnauthenticated);

        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>
        );

        expect(screen.queryByText(/página no encontrada/i)).not.toBeInTheDocument();
    });
});