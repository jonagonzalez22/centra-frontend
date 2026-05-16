import { Input as AntInput } from 'antd';

interface InputSearchProps {
    value?: string;
    placeholder?: string;
    onSearch?: (value: string) => void;
    loading?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
    width?: number;
}

const InputSearch: React.FC<InputSearchProps> = ({
    width,
    loading,
    ...props
}) => {
    return (
        <AntInput.Search
            {...props}
            loading={loading}
            style={{ width: width ? `${width}px` : undefined }}
        />
    );
};

export default InputSearch;