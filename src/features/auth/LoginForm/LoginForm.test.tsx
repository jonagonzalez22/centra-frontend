import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useAuthStore } from '@/store/useAuthStore.store';

const mockNavigate = vi.fn();
const mockLocationState: { value: { from?: { pathname?: string } } | null } = { value: null };
const mockAuthenticatedUser = {
    id: 1,
    is_active: true,
    name: 'Test User',
    email: 'test@example.com',
    store_id: 1,
    store: null,
    roles: ['STORE_ADMIN'],
    permissions: ['drivers.view'],
    features: [{ code: 'deliveries', limit: null }],
};
const mockGetState = vi.fn(() => ({ user: mockAuthenticatedUser }));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: mockLocationState.value }),
    };
});

const mockLogIn = vi.fn();

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: () => ({
        logIn: mockLogIn,
        loading: false,
    }),
}));

// LoginForm reads the latest authenticated user from the bound Zustand store.
(useAuthStore as unknown as { getState: typeof mockGetState }).getState = mockGetState;

describe('LoginForm', () => {
    const renderLoginForm = () => {
        return render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        mockLocationState.value = null;
        mockNavigate.mockClear();
        mockLogIn.mockReset();
        mockLogIn.mockResolvedValue(undefined);
    });

    test('renders login form correctly', () => {
        renderLoginForm();

        expect(screen.getByText(/acceso a plataforma/i)).toBeInTheDocument();

        expect(screen.getByText(/ingresa tus credenciales para acceder/i)).toBeInTheDocument();

        expect(screen.getByPlaceholderText(/ingresá tu email/i)).toBeInTheDocument();

        expect(screen.getByPlaceholderText(/ingresá tu contraseña/i)).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
    });

    test('shows validation errors when submitting empty form', async () => {
        const user = userEvent.setup();
        renderLoginForm();

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('El email es obligatorio.')).toBeInTheDocument();

        expect(await screen.findByText('La contraseña es obligatoria.')).toBeInTheDocument();
    });

    test('shows error for invalid email format', async () => {
        const user = userEvent.setup();
        renderLoginForm();

        await user.type(screen.getByPlaceholderText(/email/i), 'email-invalido');

        await user.type(screen.getByPlaceholderText(/contraseña/i), '12345678');

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('Formato de email inválido.')).toBeInTheDocument();
    });

    test('shows error for short password', async () => {
        const user = userEvent.setup();
        renderLoginForm();

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');

        await user.type(screen.getByPlaceholderText(/contraseña/i), '123');

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('Mínimo 8 caracteres.')).toBeInTheDocument();
    });

    test('submits form with valid credentials and redirects', async () => {
        mockLogIn.mockResolvedValue(undefined);

        const user = userEvent.setup();

        renderLoginForm();

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');

        await user.type(screen.getByPlaceholderText(/contraseña/i), '12345678');

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(mockLogIn).toHaveBeenCalledWith('test@example.com', '12345678');
    });

    test('renders remember me checkbox and forgot password action', () => {
        renderLoginForm();

        expect(screen.getByRole('checkbox', { name: /recordarme/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /olvidé contraseña/i })).toHaveAttribute(
            'href',
            '/'
        );
    });

    test('falls back to the authenticated role home for an unauthorized return URL', async () => {
        mockLocationState.value = { from: { pathname: '/tienda/conductor/rutas' } };
        const user = userEvent.setup();
        renderLoginForm();

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
        await user.type(screen.getByPlaceholderText(/contraseña/i), '12345678');
        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/tienda', { replace: true, state: null });
    });
});
