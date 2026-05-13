import type { Meta, StoryObj } from '@storybook/react-vite';
import SelectField from './SelectField';

const meta: Meta<typeof SelectField> = {
    title: 'Components/SelectField',
    component: SelectField,
};

export default meta;

type Story = StoryObj<typeof SelectField>;

export const Default: Story = {
    args: {
        name: 'status',
        label: 'Estado',
        options: [
            { label: 'Activo', value: true },
            { label: 'Inactivo', value: false },
        ],
        placeholder: 'Seleccionar...',
    },
};

export const Required: Story = {
    args: {
        name: 'status',
        label: 'Estado',
        options: [
            { label: 'Activo', value: true },
            { label: 'Inactivo', value: false },
        ],
        rules: [{ required: true, message: 'El estado es requerido' }],
    },
};

export const Disabled: Story = {
    args: {
        name: 'status',
        label: 'Estado',
        options: [
            { label: 'Activo', value: true },
            { label: 'Inactivo', value: false },
        ],
        disabled: true,
        placeholder: 'Seleccionar...',
    },
};