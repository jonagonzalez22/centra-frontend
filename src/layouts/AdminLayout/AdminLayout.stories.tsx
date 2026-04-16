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
        children: <div>Dashboard Content</div>
    },
};

export const WithoutChildren: Story = {
    args: {},
};
