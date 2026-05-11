import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppHeader } from './AppHeader';

const meta: Meta<typeof AppHeader> = {
	title: 'Components/Navigation/AppHeader',
	component: AppHeader,
	tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	args: {
		title: 'CENTRA Dashboard',
		isMobile: false,
	},
};

export const Mobile: Story = {
	args: {
		title: 'CENTRA',
		isMobile: true,
		onToggleMenu: () => {},
	},
};