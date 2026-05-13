import React from 'react';
import { Form, Select } from 'antd';
import type { Rule } from 'antd/es/form';

export interface SelectFieldProps {
    name: string;
    label?: string;
    rules?: Rule[];
    options: { label: string; value: string | number | boolean }[];
    placeholder?: string;
    allowClear?: boolean;
    loading?: boolean;
    disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
    name,
    label,
    rules,
    options,
    ...selectProps
}) => {
    return (
        <Form.Item
            name={name}
            label={label}
            rules={rules}
            labelCol={{ style: { paddingBottom: 1 } }}
        >
            <Select options={options} {...selectProps} />
        </Form.Item>
    );
};

export default SelectField;