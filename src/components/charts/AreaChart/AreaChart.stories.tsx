import type { Meta, StoryObj } from '@storybook/react-vite';
import AreaChart from './AreaChart';

const meta: Meta<typeof AreaChart> = {
    title: 'Charts/AreaChart',
    component: AreaChart,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

const mockData = [
    { month: '2026-04', store_count: 1 },
    { month: '2026-05', store_count: 10 },
    { month: '2026-06', store_count: 15 },
    { month: '2026-07', store_count: 22 },
];

export const Default: Story = {
    args: {
        data: mockData,
        title: 'Crecimiento de Tiendas',
    },
};

export const Loading: Story = {
    args: {
        data: [],
        title: 'Crecimiento de Tiendas',
        loading: true,
    },
};