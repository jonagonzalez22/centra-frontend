import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import { CENTRA_TOKENS } from '../../design-system/tokens';
import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'default' | 'danger' | 'success' | 'warning' | 'text' | 'link';

interface ButtonProps extends Omit<AntButtonProps, 'type' | 'onClick' | 'variant'> {
    variant?: ButtonVariant;
    action?: AntButtonProps['onClick'];
    label?: string;
    children?: ReactNode;
}

const variantMap: Record<ButtonVariant, Partial<AntButtonProps>> = {
    primary: { type: 'primary' },
    default: { type: 'default' },
    danger: { type: 'primary', danger: true },
    text: { type: 'text' },
    link: { type: 'link' },

    success: {
        styles: {
            root: {
                backgroundColor: CENTRA_TOKENS.colorSuccess,
                borderColor: CENTRA_TOKENS.colorSuccess,
            },
        },
    },

    warning: {
        styles: {
            root: {
                backgroundColor: CENTRA_TOKENS.colorWarning,
                borderColor: CENTRA_TOKENS.colorWarning,
            },
        },
    },
};

const Button = ({
    variant = 'primary',
    action,
    label,
    children,
    htmlType = 'button',
    ...buttonProps
}: ButtonProps) => {
    return (
        <AntButton {...variantMap[variant]} onClick={action} htmlType={htmlType} {...buttonProps}>
            {children ?? label}
        </AntButton>
    );
};

export default Button;
