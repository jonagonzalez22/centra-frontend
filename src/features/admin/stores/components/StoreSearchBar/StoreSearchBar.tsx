import { Form, Input, Select } from 'antd';
import { Button } from '@/components/Button';
import { useStoresContext } from '@/features/admin/stores/hooks/useStoresContext';
import type { StoresFilters } from '@/features/admin/stores/types/store.types';
import './StoreSearchBar.css';

export const StoreSearchBar = () => {
    const { loading, refetch } = useStoresContext();
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const statusValue = Form.useWatch('status', form);

    const hasActiveFilters = nameValue || statusValue;

    const handleFinish = (values: { name?: string; status?: 'active' | 'inactive' }) => {
        const hasFilters = values.name || values.status;

        if (!hasFilters) {
            return;
        }

        const filters: StoresFilters = {
            name: values.name,
            is_active:
                values.status === 'active'
                    ? true
                    : values.status === 'inactive'
                      ? false
                      : undefined,
        };
        refetch(filters);
    };

    const handleReset = () => {
        form.resetFields();
        refetch({});
    };

    return (
        <Form
            form={form}
            layout="vertical"
            className="storeSearchBar"
            onFinish={handleFinish}
        >
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
                <Button
                    variant="primary"
                    label="Filtrar"
                    htmlType="submit"
                    action={() => form.submit()}
                    disabled={loading}
                />
            </Form.Item>

            <Form.Item className="storeSearchBarAction">
                <Button
                    variant="default"
                    label="Limpiar"
                    action={handleReset}
                    disabled={loading || !hasActiveFilters}
                />
            </Form.Item>
        </Form>
    );
};