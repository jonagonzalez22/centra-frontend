import { Button as AntButton, type ButtonProps as AntButtonProps } from 'antd';
import { forwardRef } from 'react';
import { CENTRA_COLORS } from '@/theme/centraBrand';

export type CentraButtonVariant = 'primary' | 'secondary' | 'danger';

type LockedAntProps = 'type' | 'danger' | 'variant' | 'color';

export type CentraButtonProps = Omit<AntButtonProps, LockedAntProps> & {
  /** Variante visual CENTRA; por defecto `primary`. */
  variant?: CentraButtonVariant;
};

const variantProps: Record<
  CentraButtonVariant,
  Pick<AntButtonProps, 'type' | 'danger' | 'variant' | 'color' | 'styles'>
> = {
  primary: { type: 'primary', variant: 'solid' },
  secondary: {
    type: 'default',
    variant: 'outlined',
    styles: {
      root: {
        borderColor: CENTRA_COLORS.secondary,
        color: CENTRA_COLORS.secondary,
      },
    },
  },
  danger: { type: 'primary', variant: 'solid', danger: true },
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, CentraButtonProps>(
  ({ variant = 'primary', ...props }, ref) => (
    <AntButton ref={ref} {...variantProps[variant]} {...props} />
  ),
);

Button.displayName = 'Button';
