import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RolesTable } from './RolesTable';
import type { Role } from '../../types/role.types';

interface TestGlobal {
    __permissions?: string[];
}

vi.mock('@/hooks/usePermissions', () => {
    return {
        usePermissions: vi.fn(() => ({ can: (permission: string) => (globalThis as TestGlobal).__permissions?.includes(permission) ?? false })),
    };
});

const mockRole: Role = {
    id: 'r1',
    name: 'Administrador',
    description: 'Rol de administrador',
    permissions: ['stores.view', 'stores.edit'],
    users_count: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
};

const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('RolesTable', () => {
    beforeEach(() => {
        (globalThis as TestGlobal).__permissions = ['roles.edit'];
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('renders role name', () => {
        const onEditPermissions = vi.fn();

        renderWithRouter(
            <RolesTable
                roles={[mockRole]}
                loading={false}
                onEditPermissions={onEditPermissions}
            />
        );

        expect(screen.getByText('Administrador')).toBeInTheDocument();
    });

    test('renders base table columns', () => {
        const onEditPermissions = vi.fn();

        renderWithRouter(
            <RolesTable
                roles={[]}
                loading={false}
                onEditPermissions={onEditPermissions}
            />
        );

        expect(screen.getByRole('columnheader', { name: 'Rol' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no roles', () => {
        const onEditPermissions = vi.fn();

        renderWithRouter(
            <RolesTable
                roles={[]}
                loading={false}
                onEditPermissions={onEditPermissions}
            />
        );

        expect(screen.getByText('No hay roles para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const onEditPermissions = vi.fn();
        const { container } = renderWithRouter(
            <RolesTable
                roles={[]}
                loading={true}
                onEditPermissions={onEditPermissions}
            />
        );

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    test('renders edit permissions button with correct aria-label', () => {
        const onEditPermissions = vi.fn();

        renderWithRouter(
            <RolesTable
                roles={[mockRole]}
                loading={false}
                onEditPermissions={onEditPermissions}
            />
        );

        const editButton = screen.getByRole('button', { name: 'Editar permisos' });
        expect(editButton).toBeInTheDocument();
    });
});
