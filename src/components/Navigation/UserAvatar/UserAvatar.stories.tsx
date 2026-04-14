import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserAvatar } from './UserAvatar';

const meta: Meta<typeof UserAvatar> = {
	title: 'Components/Navigation/UserAvatar',
	component: UserAvatar,
	tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleName: Story = {
	args: { name: 'Ana' },
};

export const FullName: Story = {
	args: { name: 'Ana Ruiz' },
};
