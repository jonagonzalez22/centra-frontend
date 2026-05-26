import type { Meta, StoryObj } from '@storybook/react-vite';
import { Store } from 'lucide-react';
import MetricCard from './MetricCard';

const meta: Meta<typeof MetricCard> = {
    title: 'Components/MetricCard',
    component: MetricCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Total Tiendas',
        value: 11,
        icon: Store,
    },
};

export const Loading: Story = {
    args: {
        title: 'Total Tiendas',
        value: 0,
        icon: Store,
        loading: true,
    },
};