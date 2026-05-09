import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import { useAuthStore } from '@/store/useAuthStore.store';

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(() => ({ user: { name: 'Ana Ruiz', roles: ['Admin'] }, logout: vi.fn() })),
}));

describe('AppHeader', () => {
    test('renders the provided title', () => {
        render(<AppHeader title="Mi Aplicación" isMobile={false} />);

        expect(screen.getByText(/Mi Aplicación/i)).toBeInTheDocument();
    });

    test('shows user name and role when not mobile', () => {
        render(<AppHeader title="T" isMobile={false} />);

        expect(screen.getByText(/Ana Ruiz/i)).toBeInTheDocument();
        expect(screen.getByText(/Admin/i)).toBeInTheDocument();
    });

    test('does not show user name when mobile', () => {
        render(<AppHeader title="T" isMobile={true} />);

        expect(screen.queryByText(/Ana Ruiz/i)).toBeNull();
    });

    test('calls onToggleMenu when mobile menu button is clicked', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();

        render(<AppHeader title="T" isMobile={true} onToggleMenu={onToggle} />);

        await user.click(screen.getByRole('button'));

        expect(onToggle).toHaveBeenCalled();
    });
});