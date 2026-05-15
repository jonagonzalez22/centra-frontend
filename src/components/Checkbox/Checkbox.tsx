import { Checkbox as AntCheckbox } from 'antd';
import type { CheckboxProps as AntCheckboxProps } from 'antd';

export type CheckboxProps = AntCheckboxProps;

const Checkbox = (props: CheckboxProps) => {
    return <AntCheckbox {...props} />;
};

export default Checkbox;
