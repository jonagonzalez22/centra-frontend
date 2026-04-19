import type { Rule } from 'antd/es/form';

export const emailRules = (): Rule[] => [
    { required: true, message: 'El email es obligatorio' },
    { type: 'email', message: 'Formato de email inválido' },
];

export const passwordRules = (): Rule[] => [
    { required: true, message: 'La contraseña es obligatoria' },
    { min: 8, message: 'Mínimo 8 caracteres' },
];
