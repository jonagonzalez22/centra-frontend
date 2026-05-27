import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserSearchBar } from './UserSearchBar';
import { UsersProvider } from '@/features/admin/users/contexts/UsersProvider';
import type { UseUsersReturn } from '@/features/admin/users/hooks/useUsers';

const createMockUsersState = (overrides: Partial<UseUsersReturn> = {}): UseUsersReturn => ({
    users: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: () => {},
    deleteUser: () => Promise.resolve(),
    filterOptions: null,
    filterOptionsLoading: false,
    ...overrides,
});

const meta: Meta<typeof UserSearchBar> = {
    title: 'Features/Admin/Users/UserSearchBar',
    component: UserSearchBar,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <UsersProvider value={createMockUsersState()}>
                <Story />
            </UsersProvider>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
