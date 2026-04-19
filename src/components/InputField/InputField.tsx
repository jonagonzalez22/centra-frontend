import React from 'react';
import { Form } from 'antd';
import Input, { InputProps } from '../Input/Input';
import { Rule } from 'antd/es/form';

export interface InputFieldProps extends InputProps {
  name: string;
  label?: string;
  required?: boolean;
  rules?: Rule[];
  error?: {
    status: boolean;
    message: string;
  };
}

const InputField: React.FC<InputFieldProps> = ({ name, label, required, error,rules, ...inputProps }) => {
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
      labelCol={{ style: { paddingBottom: 1 } }}
      validateStatus={error?.status ? 'error' : undefined}
      help={error?.status ? error.message : undefined}
    >
      <Input {...inputProps} />
    </Form.Item>
  );
};

export default InputField;
