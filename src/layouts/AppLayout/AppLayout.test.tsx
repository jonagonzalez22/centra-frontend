import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, test, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './AppLayout';

const breakpoints = vi.hoisted(() => ({ screens: { xs: true, sm: true, md: true, lg: true } }));

vi.mock('antd', async (importOriginal) => {
    const actual = await importOriginal<typeof import('antd')>();
    return {
        ...actual,
        Grid: {
            ...actual.Grid,
            useBreakpoint: () => breakpoints.screens,
        },
    };
});

describe('AppLayout', () => {
    beforeEach(() => {
        breakpoints.screens = { xs: true, sm: true, md: true, lg: true };
        window.localStorage.clear();
    });

    const renderWithRouter = (content: React.ReactNode, initialPath = '/admin') => {
        return render(
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route
                        path="/admin"
                        element={<AppLayout title="Backoffice Admin" />}
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
    });

    test('lets the main layout reclaim space when the desktop sidebar collapses', async () => {
        const user = userEvent.setup();
        const { container } = renderWithRouter(<div>Dashboard</div>);
        const sidebar = container.querySelector('.sidebarMenuDesktopContainer');
        const mainLayout = container.querySelector('.appMainLayout');

        expect(sidebar).toHaveStyle({ width: '260px' });
        expect(mainLayout).toHaveClass('appMainLayout');
        expect((mainLayout as HTMLElement).style.width).toBe('');
        expect((mainLayout as HTMLElement).style.marginLeft).toBe('');

        await user.click(screen.getByRole('button', { name: 'Contraer menú lateral' }));

        expect(sidebar).toHaveStyle({ width: '68px' });
        expect(mainLayout).toBeInTheDocument();
        expect((mainLayout as HTMLElement).style.width).toBe('');
        expect((mainLayout as HTMLElement).style.marginLeft).toBe('');
    });

    test('uses the existing compact navigation pattern below the desktop sidebar breakpoint', () => {
        breakpoints.screens = { xs: true, sm: true, md: true, lg: false };
        const { container } = render(
            <MemoryRouter>
                <AppLayout title="Mi Tienda"><div>Contenido</div></AppLayout>
            </MemoryRouter>
        );

        expect(container.querySelector('.sidebarMenuDesktopContainer')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /abrir menú/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /menú lateral/i })).not.toBeInTheDocument();
    });

    test('updates navigation mode after a live viewport resize without losing desktop behavior', () => {
        const view = render(
            <MemoryRouter>
                <AppLayout title="Mi Tienda"><div>Contenido</div></AppLayout>
            </MemoryRouter>
        );

        expect(view.container.querySelector('.sidebarMenuDesktopContainer')).toBeInTheDocument();
        breakpoints.screens = { xs: true, sm: true, md: true, lg: false };
        view.rerender(
            <MemoryRouter>
                <AppLayout title="Mi Tienda"><div>Contenido</div></AppLayout>
            </MemoryRouter>
        );
        expect(view.container.querySelector('.sidebarMenuDesktopContainer')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /abrir menú/i })).toBeInTheDocument();

        breakpoints.screens = { xs: true, sm: true, md: true, lg: true };
        view.rerender(
            <MemoryRouter>
                <AppLayout title="Mi Tienda"><div>Contenido</div></AppLayout>
            </MemoryRouter>
        );
        expect(view.container.querySelector('.sidebarMenuDesktopContainer')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /abrir menú/i })).not.toBeInTheDocument();
    });

    test('renders children when provided', () => {
        render(
            <MemoryRouter initialEntries={['/any']}>
                <AppLayout title="Test">
                    <div>Children Content</div>
                </AppLayout>
            </MemoryRouter>
        );

        expect(screen.getByText('Children Content')).toBeInTheDocument();
    });

    test('renders with different title', () => {
        render(
            <MemoryRouter initialEntries={['/tienda']}>
                <AppLayout title="Mi Tienda">
                    <div>Store Content</div>
                </AppLayout>
            </MemoryRouter>
        );

        expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
        expect(screen.getByText('Store Content')).toBeInTheDocument();
    });
});
