import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLayout } from './AdminLayout';

const meta: Meta<typeof AdminLayout> = {
    title: 'Layouts/AdminLayout',
    component: AdminLayout,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        header: {
            control: false,
            table: {
                type: { summary: 'ReactNode' },
            },
        },
        sider: {
            control: false,
            table: {
                type: { summary: 'ReactNode' },
            },
        },
        children: {
            control: false,
            table: {
                type: { summary: 'ReactNode' },
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FullLayout: Story = {
    args: {
        header: <div>Admin Header</div>,
        sider: <div>Admin Menu</div>,
        children: <div>Dashboard Content</div>,
    },
};

export const WithoutHeader: Story = {
    args: {
        sider: <div>Admin Menu</div>,
        children: <div>Content Only</div>,
    },
};

export const WithoutSider: Story = {
    args: {
        header: <div>Header Only</div>,
        children: <div>Main Content</div>,
    },
};

export const OnlySider: Story = {
    args: {
        sider: <div>Admin Menu</div>,
    },
};

export const Empty: Story = {
    args: {},
};
