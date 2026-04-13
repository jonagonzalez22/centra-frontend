import React from 'react';
import { Input as AntInput } from 'antd';
import { runes } from 'runes2';

export interface InputProps {
  value?: string | number;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  size?: 'large' | 'middle' | 'small';
  width?: number;
  allowClear?: boolean;
  count?: boolean;
  max?: number;
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
}

const Input: React.FC<InputProps> = ({ width, count, max, size = 'middle', ...props }) => {
  return (
    <AntInput
      {...props}
      size={size}
      style={{ width: `${width}px` }}
      count={
        count
          ? {
              show: true,
              max,
              strategy: (txt?: string) => runes(txt || '').length,
              exceedFormatter: (txt, { max }) =>
                runes(txt || '')
                  .slice(0, max)
                  .join(''),
            }
          : undefined
      }
    />
  );
};

export default Input;
