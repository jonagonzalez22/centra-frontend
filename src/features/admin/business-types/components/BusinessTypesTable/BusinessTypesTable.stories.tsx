import type { Meta, StoryObj } from '@storybook/react-vite';
import { BusinessTypesTable } from './BusinessTypesTable';
import { BusinessTypesProvider } from '@/features/admin/business-types/contexts/BusinessTypesProvider';
import type { UseBusinessTypesReturn } from '@/features/admin/business-types/hooks/useBusinessTypes';

const createMockBusinessTypesState = (overrides: Partial<UseBusinessTypesReturn> = {}): UseBusinessTypesReturn => ({
    businessTypes: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: () => {},
    deleteBusinessType: () => Promise.resolve(),
    ...overrides,
});

const meta: Meta<typeof BusinessTypesTable> = {
    title: 'Features/Admin/BusinessTypes/BusinessTypesTable',
    component: BusinessTypesTable,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BusinessTypesProvider value={createMockBusinessTypesState()}>
                <Story />
            </BusinessTypesProvider>
        ),
    ],
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
