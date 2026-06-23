import React from 'react';
import { Form, DatePicker } from 'antd';
import type { Rule } from 'antd/es/form';

export interface DatePickerFieldProps {
    name: string;
    label?: string;
    rules?: Rule[];
    placeholder?: string;
    allowClear?: boolean;
    disabled?: boolean;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
    name,
    label,
    rules,
    ...datePickerProps
}) => {
    return (
        <Form.Item
            name={name}
            label={label}
            rules={rules}
            labelCol={{ style: { paddingBottom: 1 } }}
        >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" {...datePickerProps} />
        </Form.Item>
    );
};

export default DatePickerField;
