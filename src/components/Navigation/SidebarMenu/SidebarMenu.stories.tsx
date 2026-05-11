import type { Meta, StoryObj } from '@storybook/react-vite';
import { SidebarMenu } from './SidebarMenu';

const meta: Meta<typeof SidebarMenu> = {
	title: 'Components/Navigation/SidebarMenu',
	component: SidebarMenu,
	tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	args: {
		isMobile: false,
		isOpen: false,
		selectedKey: '/admin/dashboard',
	},
};

export const MobileOpen: Story = {
	args: {
		isMobile: true,
		isOpen: true,
		selectedKey: '/admin/dashboard',
		onClose: () => {},
	},
};