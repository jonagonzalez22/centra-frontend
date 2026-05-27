import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlansTable } from './PlansTable';
import { PlansProvider } from '@/features/admin/plans/contexts/PlansProvider';
import type { UsePlansReturn } from '@/features/admin/plans/hooks/usePlans';

const createMockPlansState = (overrides: Partial<UsePlansReturn> = {}): UsePlansReturn => ({
    plans: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: () => {},
    ...overrides,
});

const meta: Meta<typeof PlansTable> = {
    title: 'Features/Admin/Plans/PlansTable',
    component: PlansTable,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <PlansProvider value={createMockPlansState()}>
                <Story />
            </PlansProvider>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onEdit: () => {},
        onManageFeatures: () => {},
        onDelete: () => {},
    },
};

export const Loading: Story = {
    args: {
        onEdit: () => {},
        onManageFeatures: () => {},
        onDelete: () => {},
    },
};

export const Empty: Story = {
    args: {
        onEdit: () => {},
        onManageFeatures: () => {},
        onDelete: () => {},
    },
};
