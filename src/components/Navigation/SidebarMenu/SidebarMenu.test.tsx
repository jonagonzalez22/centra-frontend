import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { SidebarMenu } from './SidebarMenu';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';

vi.mock('@/store/useAuthStore.store', () => ({
    useAuthStore: vi.fn(() => ({ user: null })),
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
});