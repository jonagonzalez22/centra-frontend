import React from 'react';
import { Form } from 'antd';
import Input, { InputProps } from '../Input/Input';

export interface InputFieldProps extends InputProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: {
    status: boolean;
    message: string;
  };
}

const InputField: React.FC<InputFieldProps> = ({ name, label, required, error, ...inputProps }) => {
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
      <Input {...inputProps} />
    </Form.Item>
  );
};

export default InputField;
