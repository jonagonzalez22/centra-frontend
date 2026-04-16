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
        children: <div>Store Content</div>,
    },
};

export const WithoutChildren: Story = {
    args: {},
};
