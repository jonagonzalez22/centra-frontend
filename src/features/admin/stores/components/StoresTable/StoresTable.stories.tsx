import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoresTable } from './';
import { StoresProvider } from '@/features/admin/stores/contexts/StoresProvider';
import type { UseStoresReturn } from '@/features/admin/stores/hooks/useStores';

const createMockStoresState = (overrides: Partial<UseStoresReturn> = {}): UseStoresReturn => ({
    stores: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: () => {},
    filterOptions: null,
    filterOptionsLoading: false,
    ...overrides,
});

const meta: Meta<typeof StoresTable> = {
    title: 'Features/Admin/Stores/StoresTable',
    component: StoresTable,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <StoresProvider value={createMockStoresState()}>
                <Story />
            </StoresProvider>
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
