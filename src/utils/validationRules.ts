import type { Rule } from 'antd/es/form';

export const emailRules = (): Rule[] => [
    { required: true, message: 'El email es obligatorio.' },
    { type: 'email', message: 'Formato de email inválido.' },
];

export const passwordRules = (min = 8): Rule[] => [
    { required: true, message: 'La contraseña es obligatoria.' },
    { min, message: `Mínimo ${min} caracteres.` },
];

export const confirmPasswordRules = (): Rule[] => [
    { required: true, message: 'La confirmación de contraseña es obligatoria.' },
    ({ getFieldValue }) => ({
        validator: (_, value) => {
            if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
            }
            return Promise.reject(new Error('Las contraseñas no coinciden.'));
        },
    }),
];

export const storeNameRules = (): Rule[] => [
    { required: true, message: 'El nombre de tienda es obligatorio.' },
    { min: 3, message: 'Mínimo 3 caracteres.' },
    { max: 100, message: 'Máximo 100 caracteres.' },
];

export const storePhoneRules = (): Rule[] => [
    { required: true, message: 'El teléfono es obligatorio.' },
    { pattern: /^\+?[0-9\s-]{8,20}$/, message: 'Formato de teléfono inválido.' },
];

export const roleRules = (): Rule[] => [
    { required: true, message: 'El rol es obligatorio.' },
];

export const requiredStringRules = (fieldName: string, min = 1, max?: number): Rule[] => {
    const rules: Rule[] = [{ required: true, message: `${fieldName} es obligatorio.` }];
    if (min > 1) rules.push({ min, message: `Mínimo ${min} caracteres.` });
    if (max) rules.push({ max, message: `Máximo ${max} caracteres.` });
    return rules;
};
