import React from 'react';
import { Form, Input as AntInput } from 'antd';
import { Rule } from 'antd/es/form';

export interface InputPasswordProps {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  width?: number;
  size?: 'large' | 'middle' | 'small';
  rules?: Rule[];
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
}

const InputPassword: React.FC<InputPasswordProps> = ({
  name,
  label,
  width,
  rules,
  ...inputProps
}) => {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
    >
      <AntInput.Password {...inputProps} style={{ width: `${width}px` }} />
    </Form.Item>
  );
};

export default InputPassword;
