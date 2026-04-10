import React from 'react';
import { Form, Input as AntInput } from 'antd';

export interface InputPasswordProps {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  width?: number;
  size?: 'large' | 'middle' | 'small';
  error?: {
    status: boolean;
    message: string;
  };
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
}

const InputPassword: React.FC<InputPasswordProps> = ({
  name,
  label,
  required,
  error,
  width,
  ...inputProps
}) => {
  const rules = [];

  if (required) {
    rules.push({
      required: true,
      message: `${label || name} is required`,
    });
  }

  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      validateStatus={error?.status ? 'error' : undefined}
      help={error?.status ? error.message : undefined}
    >
      <AntInput.Password {...inputProps} style={{ width: `${width}px` }} />
    </Form.Item>
  );
};

export default InputPassword;
