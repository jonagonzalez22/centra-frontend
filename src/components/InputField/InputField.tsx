import React from 'react';
import { Form } from 'antd';
import Input, { InputProps } from '../Input/Input';
import { Rule } from 'antd/es/form';

export interface InputFieldProps extends InputProps {
  name: string;
  label?: string;
  rules?: Rule[];
}

const InputField: React.FC<InputFieldProps> = ({ name, label,rules, ...inputProps }) => {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={rules}
      labelCol={{ style: { paddingBottom: 1 } }}
    >
      <Input {...inputProps} />
    </Form.Item>
  );
};

export default InputField;
