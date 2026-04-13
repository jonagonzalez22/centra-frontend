import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuthLayout } from './AuthLayout';

const meta: Meta<typeof AuthLayout> = {
    title: 'Layouts/Auth',
    component: AuthLayout,
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

export const Default: Story = {
    args: {
        children: <div>Auth Content</div>,
    },
};

export const WithForm: Story = {
    args: {
        children: (
            <form>
                <input placeholder="Email" />
                <input placeholder="Password" type="password" />
                <button>Login</button>
            </form>
        ),
    },
};

export const Empty: Story = {
    args: {},
};
