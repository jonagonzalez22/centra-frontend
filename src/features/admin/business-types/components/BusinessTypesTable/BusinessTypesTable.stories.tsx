import type { Meta, StoryObj } from '@storybook/react-vite';
import { BusinessTypesTable } from './BusinessTypesTable';

const meta: Meta<typeof BusinessTypesTable> = {
    title: 'Features/Admin/BusinessTypes/BusinessTypesTable',
    component: BusinessTypesTable,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onEdit: () => {},
    },
};

export const Loading: Story = {
    args: {
        onEdit: () => {},
    },
};

export const Empty: Story = {
    args: {
        onEdit: () => {},
    },
};