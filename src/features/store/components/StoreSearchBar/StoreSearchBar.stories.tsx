import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoreSearchBar } from './StoreSearchBar';

const meta: Meta<typeof StoreSearchBar> = {
    title: 'Features/Store/StoreSearchBar',
    component: StoreSearchBar,
    tags: ['autodocs'],
    args: {
        onFilter: () => {},
        onReset: () => {},
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
