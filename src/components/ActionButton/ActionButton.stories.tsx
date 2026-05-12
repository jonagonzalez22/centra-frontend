import type { Meta, StoryObj } from '@storybook/react-vite';
import ActionButton from './ActionButton';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const meta: Meta<typeof ActionButton> = {
    title: 'Components/ActionButton',
    component: ActionButton,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Texto del tooltip y aria-label',
        },
        icon: {
            control: false,
            description: 'Icono del botón',
        },
        action: {
            control: false,
            description: 'Función que se ejecuta al hacer click',
        },
        href: {
            control: 'text',
            description: 'Si se proporciona, renderiza como <a> en lugar de <button>',
        },
        disabled: {
            control: 'boolean',
            description: 'Indica si el botón está deshabilitado',
        },
        loading: {
            control: 'boolean',
            description: 'Indica si el botón está en estado de carga',
        },
    },
} satisfies Meta<typeof ActionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const View: Story = {
    args: {
        icon: <EyeOutlined />,
        label: 'Ver',
    },
};

export const Edit: Story = {
    args: {
        icon: <EditOutlined />,
        label: 'Editar',
    },
};

export const Delete: Story = {
    args: {
        icon: <DeleteOutlined />,
        label: 'Eliminar',
    },
};

export const AsLink: Story = {
    args: {
        icon: <EyeOutlined />,
        label: 'Ver tienda',
        href: '/admin/tiendas/1',
    },
};

export const Disabled: Story = {
    args: {
        icon: <EditOutlined />,
        label: 'Editar',
        disabled: true,
    },
};