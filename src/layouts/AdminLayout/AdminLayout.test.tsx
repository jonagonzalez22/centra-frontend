import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

describe('AdminLayout', () => {
    const renderWithRouter = (content: React.ReactNode) => {
        return render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/admin" element={<AdminLayout />}>
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

        expect(container.firstChild).toHaveStyle('min-height: 100vh');
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
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
});
