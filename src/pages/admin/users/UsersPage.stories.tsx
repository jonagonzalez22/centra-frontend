import type { Meta, StoryObj } from '@storybook/react-vite';
import { UsersPageView } from './UsersPageView';

const meta: Meta<typeof UsersPageView> = {
    title: 'Pages/Admin/Users/UsersPage',
    component: UsersPageView,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div className="bg-centra-surface p-6">
                <Story />
            </div>
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