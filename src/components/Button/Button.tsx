import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { CENTRA_TOKENS } from '../../design-system/tokens';

type ButtonVariant = 'primary' | 'default' | 'danger' | 'success' | 'warning' | 'error' | 'text';

interface ButtonProps {
  variant?: ButtonVariant;
  action: () => void;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPlacement?: 'start' | 'end';
  loading?: boolean;
}


const variantMap: Record<ButtonVariant, Partial<AntButtonProps>> = {
  primary: { type: 'primary' },
  default: { type: 'default' },
  danger: { type: 'primary', danger: true },
  error: { type: 'primary', danger: true },

  success: {
    styles: {
      root: {
        backgroundColor: CENTRA_TOKENS.colorSuccess,
        borderColor: CENTRA_TOKENS.colorSuccess,
        color: '#000',
      },
    },
  },

  warning: {
    styles: {
      root: {
        backgroundColor: CENTRA_TOKENS.colorWarning,
        borderColor: CENTRA_TOKENS.colorWarning,
        color: '#000',
      },
    },
  },

  text: { type: 'text' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  action,
  label,
  disabled,
  icon,
  iconPlacement,
  loading,
}) => {
  return (
    <AntButton
      {...variantMap[variant]}
/*       color='success'
      variant='solid' */
      onClick={action}
      disabled={disabled}
      icon={icon}
      iconPlacement={iconPlacement}
      loading={loading}
    >
      {label}
    </AntButton>
  )
}