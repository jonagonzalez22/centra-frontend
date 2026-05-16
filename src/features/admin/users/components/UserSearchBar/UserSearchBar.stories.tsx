import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserSearchBar } from './UserSearchBar';

const meta: Meta<typeof UserSearchBar> = {
    title: 'Features/Admin/Users/UserSearchBar',
    component: UserSearchBar,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};