import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminLayout } from './AdminLayout';

const meta: Meta<typeof AdminLayout> = {
    title: 'Layouts/AdminLayout',
    component: AdminLayout,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
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