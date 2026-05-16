import { useCallback } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useUsersContext } from '../../hooks/useUsersContext';
import type { UsersFilters } from '../../types/user.types';
import './UserSearchBar.css';

interface UserFiltersForm {
    name?: string;
    role?: string;
    store_id?: string;
}

export const UserSearchBar = () => {
    const { refetch, filterOptions, filterOptionsLoading } = useUsersContext();
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const roleValue = Form.useWatch('role', form);
    const storeValue = Form.useWatch('store_id', form);

    const hasActiveFilters = nameValue || roleValue || storeValue;

    const handleFinish = useCallback((values: UserFiltersForm) => {
        const hasFilters = values.name || values.role || values.store_id;

        if (!hasFilters) {
            return;
        }

        const filters: UsersFilters = {};
        if (values.name) filters.name = values.name;
        if (values.role) filters.role = values.role;
        if (values.store_id) filters.store_id = values.store_id;

        refetch(filters);
    }, [refetch]);

    const handleReset = useCallback(() => {
        form.resetFields();
        refetch({});
    }, [form, refetch]);

    const roleOptions = filterOptions
        ? filterOptions.roles.map((r) => ({ label: r.name, value: r.name }))
        : [];

    const storeOptions = filterOptions
        ? filterOptions.stores.map((s) => ({ label: s.name, value: s.id }))
        : [];

    return (
        <Form
            form={form}
            layout="vertical"
            className="userSearchBar"
            onFinish={handleFinish}
        >
            <div className="userSearchBarRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={filterOptionsLoading}
                />

                <SelectField
                    name="role"
                    label="Rol"
                    placeholder="Seleccionar"
                    options={roleOptions}
                    allowClear
                    disabled={filterOptionsLoading}
                />

                <SelectField
                    name="store_id"
                    label="Tienda"
                    placeholder="Seleccionar"
                    options={storeOptions}
                    allowClear
                    disabled={filterOptionsLoading}
                    loading={filterOptionsLoading}
                />

                <div className="userSearchBarActions">
                    <Button
                        variant="primary"
                        label="Filtrar"
                        htmlType="submit"
                        action={() => form.submit()}
                        disabled={filterOptionsLoading}
                    />

                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={filterOptionsLoading || !hasActiveFilters}
                    />
                </div>
            </div>
        </Form>
    );
};