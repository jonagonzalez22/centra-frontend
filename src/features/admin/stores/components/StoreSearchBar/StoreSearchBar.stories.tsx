import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoreSearchBar } from './StoreSearchBar';
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

const meta: Meta<typeof StoreSearchBar> = {
    title: 'Features/Admin/Stores/StoreSearchBar',
    component: StoreSearchBar,
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

export const Default: Story = {};
