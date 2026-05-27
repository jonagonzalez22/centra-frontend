import type { Meta, StoryObj } from '@storybook/react-vite';
import { UsersPageView } from './UsersPageView';
import { UsersProvider } from '@/features/admin/users/contexts/UsersProvider';
import type { UseUsersReturn } from '@/features/admin/users/hooks/useUsers';

const createMockUsersState = (overrides: Partial<UseUsersReturn> = {}): UseUsersReturn => ({
    users: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: () => {},
    deleteUser: () => Promise.resolve(),
    filterOptions: null,
    filterOptionsLoading: false,
    ...overrides,
});

const meta: Meta<typeof UsersPageView> = {
    title: 'Pages/Admin/Users/UsersPage',
    component: UsersPageView,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <UsersProvider value={createMockUsersState()}>
                <div className="bg-centra-surface p-6">
                    <Story />
                </div>
            </UsersProvider>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Gestión de Usuarios',
        description: 'Administra los usuarios del sistema',
        breadcrumbs: [{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Usuarios' }],
        canCreateUser: true,
        error: null,
    },
};

export const Loading: Story = {
    args: {
        ...Default.args,
        canCreateUser: false,
        error: null,
    },
};

export const Empty: Story = {
    args: {
        ...Default.args,
        canCreateUser: false,
        error: null,
    },
};

export const WithError: Story = {
    args: {
        ...Default.args,
        canCreateUser: false,
        error: 'Error al cargar los usuarios',
    },
};
