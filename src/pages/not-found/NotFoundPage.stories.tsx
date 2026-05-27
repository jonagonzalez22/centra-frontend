import type { Meta, StoryObj } from '@storybook/react-vite';
import NotFoundPage from './NotFoundPage';

const meta: Meta<typeof NotFoundPage> = {
    title: 'Pages/NotFoundPage',
    component: NotFoundPage,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                story: 'Página mostrada cuando el usuario navega a una ruta inexistente.',
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
