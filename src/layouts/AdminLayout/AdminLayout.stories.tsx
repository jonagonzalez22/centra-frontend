import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router-dom';
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
    render: () => (
        <Routes>
            <Route path="/" element={<AdminLayout />}>
                <Route
                    index
                    element={
                        <div>
                            <h1>Dashboard Content</h1>
                            <p>Contenido de ejemplo dentro del layout admin.</p>
                        </div>
                    }
                />
            </Route>
        </Routes>
    ),
};
