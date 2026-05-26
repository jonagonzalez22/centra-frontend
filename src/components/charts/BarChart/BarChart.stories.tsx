import type { Meta, StoryObj } from '@storybook/react-vite';
import BarChart from './BarChart';

const meta: Meta<typeof BarChart> = {
    title: 'Charts/BarChart',
    component: BarChart,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

const mockData = [
    { plan_name: 'Beta (Piloto)', store_count: 1 },
    { plan_name: 'Esencial', store_count: 9 },
    { plan_name: 'Profesional', store_count: 5 },
];

export const Default: Story = {
    args: {
        data: mockData,
        title: 'Distribución por Plan',
    },
};

export const Loading: Story = {
    args: {
        data: [],
        title: 'Distribución por Plan',
        loading: true,
    },
};