import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoreLayout } from './StoreLayout';

const meta: Meta<typeof StoreLayout> = {
    title: 'Layouts/StoreLayout',
    component: StoreLayout,
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
        header: <div>Store Header</div>,
        sider: <div>Store Menu</div>,
        children: <div>Store Content</div>,
    },
};

export const OnlyContent: Story = {
    args: {
        children: <div>Products List</div>,
    },
};

export const OnlySider: Story = {
    args: {
        sider: <div>Only Menu</div>,
    },
};

export const Empty: Story = {
    args: {},
};
