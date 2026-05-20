import type { Meta, StoryObj } from '@storybook/react-vite';
import { BusinessTypeSearchBar } from './BusinessTypeSearchBar';

const meta: Meta<typeof BusinessTypeSearchBar> = {
    title: 'Features/Admin/BusinessTypes/BusinessTypeSearchBar',
    component: BusinessTypeSearchBar,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};