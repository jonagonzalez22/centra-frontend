import React from 'react';
import { Form, Input as AntInput } from 'antd';
import { Rule } from 'antd/es/form';

export interface InputPasswordProps {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  width?: number;
  size?: 'large' | 'middle' | 'small';
  rules?: Rule[];
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
  rules,
  ...inputProps
}) => {
  const internalRules: Rule[] = [];

  if (required) {
    internalRules.push({
      required: true,
      message: `${label || name} is required`,
    });
  }

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[...internalRules, ...(rules ?? [])]}
      validateStatus={error?.status ? 'error' : undefined}
      help={error?.status ? error.message : undefined}
    >
      <AntInput.Password {...inputProps} style={{ width: `${width}px` }} />
    </Form.Item>
  );
};

export default InputPassword;
