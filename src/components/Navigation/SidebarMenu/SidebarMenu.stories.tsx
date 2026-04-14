import type { Meta, StoryObj } from '@storybook/react-vite';
import { SidebarMenu } from './SidebarMenu';
import type { MenuProps } from 'antd';

const meta: Meta<typeof SidebarMenu> = {
	title: 'Components/Navigation/SidebarMenu',
	component: SidebarMenu,
	tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

const items: MenuProps['items'] = [
	{ key: 'home', label: 'Home' },
	{ key: 'settings', label: 'Settings' },
];

export const Desktop: Story = {
	args: {
		items,
		isMobile: false,
		selectedKey: 'home',
	},
};

export const MobileOpen: Story = {
	args: {
		items,
		isMobile: true,
		isOpen: true,
		selectedKey: 'settings',
		onClose: () => {},
	},
};
