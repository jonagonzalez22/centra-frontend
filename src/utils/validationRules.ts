import type { Rule } from 'antd/es/form';

export const emailRules = (): Rule[] => [
    { required: true, message: 'El email es obligatorio' },
    { type: 'email', message: 'Formato de email inválido' },
];

export const passwordRules = (min = 8): Rule[] => [
    { required: true, message: 'La contraseña es obligatoria' },
    { min, message: `Mínimo ${min} caracteres` },
];
