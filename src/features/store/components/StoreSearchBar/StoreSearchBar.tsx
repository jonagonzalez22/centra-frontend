import { Button, Form, Input, Select } from 'antd';
import './StoreSearchBar.css';

interface StoreSearchBarProps {
    onFilter: () => void;
    onReset: () => void;
}

export const StoreSearchBar = ({ onFilter, onReset }: StoreSearchBarProps) => {
    const [form] = Form.useForm();

    const handleReset = () => {
        form.resetFields();
        onReset();
    };

    return (
        <Form form={form} layout="vertical" className="storeSearchBar" onFinish={onFilter}>
            <Form.Item name="name" label="Nombre" className="storeSearchBarName">
                <Input placeholder="Buscar por nombre" allowClear />
            </Form.Item>

            <Form.Item name="status" label="Estado" className="storeSearchBarStatus">
                <Select
                    placeholder="Estado"
                    allowClear
                    options={[
                        { label: 'Activo', value: 'active' },
                        { label: 'Inactivo', value: 'inactive' },
                    ]}
                />
            </Form.Item>

            <Form.Item className="storeSearchBarAction">
                <Button type="primary" htmlType="submit">
                    Filtrar
                </Button>
            </Form.Item>

            <Form.Item className="storeSearchBarAction">
                <Button onClick={handleReset}>Limpiar</Button>
            </Form.Item>
        </Form>
    );
};
