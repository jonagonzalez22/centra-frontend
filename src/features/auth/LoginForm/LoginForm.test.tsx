import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import LoginForm from './LoginForm';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({
            state: null,
        }),
    };
});

const mockLogIn = vi.fn();

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: () => ({
        logIn: mockLogIn,
        loading: false,
    }),
}));

describe('LoginForm', () => {
    test('renders login form correctly', () => {
        render(<LoginForm />);

        expect(screen.getByText(/acceso a plataforma/i)).toBeInTheDocument();

        expect(screen.getByText(/ingresa tus credenciales para acceder/i)).toBeInTheDocument();

        expect(screen.getByPlaceholderText(/ingresá tu email/i)).toBeInTheDocument();

        expect(screen.getByPlaceholderText(/ingresá tu contraseña/i)).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
    });

    test('shows validation errors when submitting empty form', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('El email es obligatorio.')).toBeInTheDocument();

        expect(await screen.findByText('La contraseña es obligatoria.')).toBeInTheDocument();
    });

    test('shows error for invalid email format', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText(/email/i), 'email-invalido');

        await user.type(screen.getByPlaceholderText(/contraseña/i), '12345678');

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('Formato de email inválido.')).toBeInTheDocument();
    });

    test('shows error for short password', async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');

        await user.type(screen.getByPlaceholderText(/contraseña/i), '123');

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(await screen.findByText('Mínimo 8 caracteres.')).toBeInTheDocument();
    });

    test('submits form with valid credentials and redirects', async () => {
        mockLogIn.mockResolvedValue(undefined);

        const user = userEvent.setup();

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');

        await user.type(screen.getByPlaceholderText(/contraseña/i), '12345678');

        await user.click(screen.getByRole('button', { name: /ingresar/i }));

        expect(mockLogIn).toHaveBeenCalledWith('test@example.com', '12345678');
    });
});
