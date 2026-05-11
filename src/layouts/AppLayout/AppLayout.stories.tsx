import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppLayout } from './AppLayout';

const meta: Meta<typeof AppLayout> = {
	title: 'layouts/AppLayout',
	component: AppLayout,
	tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Layout principal para el backoffice de administración.',
			},
		},
	},
	args: {
		title: 'Backoffice Admin',
	},
	render: (args) => (
		<AppLayout {...args}>
			<div style={{ padding: '20px', color: '#666' }}>
				Contenido de la página - usa Outlet para rutas anidadas de React Router
			</div>
		</AppLayout>
	),
};

export const StoreLayout: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Layout unificado para el panel de administración de tienda.',
			},
		},
	},
	args: {
		title: 'Mi Tienda',
	},
	render: (args) => (
		<AppLayout {...args}>
			<div style={{ padding: '20px', color: '#666' }}>
				Contenido del dashboard de tienda
			</div>
		</AppLayout>
	),
};