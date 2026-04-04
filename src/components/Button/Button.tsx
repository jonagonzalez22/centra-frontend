import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { CENTRA_TOKENS } from '../../design-system/tokens';

type ButtonVariant = 'primary' | 'default' | 'danger' | 'success' | 'warning' | 'text' | 'link';

interface ButtonProps {
  variant?: ButtonVariant;
  action: () => void;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPlacement?: 'start' | 'end';
  loading?: boolean;
  shape?: 'circle' | 'round' | 'default';
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

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  action,
  label,
  disabled,
  icon,
  iconPlacement,
  loading,
  shape,
}) => {
  return (
    <AntButton
      {...variantMap[variant]}
      onClick={action}
      disabled={disabled}
      icon={icon}
      iconPlacement={iconPlacement}
      loading={loading}
      shape={shape}
    >
      {label}
    </AntButton>
  )
}