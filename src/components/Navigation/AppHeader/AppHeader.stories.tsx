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
		user: { name: 'Ana Ruiz', role: 'Administrador' },
		isMobile: false,
	},
};

export const Mobile: Story = {
	args: {
		title: 'CENTRA',
		user: { name: 'Ana', role: 'Usuario' },
		isMobile: true,
		onToggleMenu: () => {},
	},
};
