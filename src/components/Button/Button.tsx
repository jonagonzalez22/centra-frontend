import { Button as AntButton } from 'antd';

type ButtonVariant = 'primary' | 'default' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
  action: () => void;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode
  loading?: boolean;
}

const variantMap = {
  primary: { type: 'primary'},
  default: { type: 'default' },
  danger: { type: 'primary', danger: true },
} as const;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  action,
  label,
  disabled,
  icon,
  loading,
}) => {
  return (
    <AntButton
      {...variantMap[variant]}
      onClick={action}
      disabled={disabled}
      icon={icon}
      loading={loading}
    >
      {label}
    </AntButton>
  )
}