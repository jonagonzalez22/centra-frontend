import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
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
    is_active?: boolean;
}

export const UserSearchBar = () => {
    const { refetch, filterOptions, filterOptionsLoading } = useUsersContext();
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const roleValue = Form.useWatch('role', form);
    const storeValue = Form.useWatch('store_id', form);
    const isActiveValue = Form.useWatch('is_active', form);

    const hasActiveFilters = nameValue || roleValue || storeValue || isActiveValue !== undefined;

    const buildFilters = useCallback((values: UserFiltersForm): UsersFilters => {
        const filters: UsersFilters = {};

        if (values.name) filters.name = values.name;
        if (values.role) filters.role = values.role;
        if (values.store_id) filters.store_id = values.store_id;
        if (values.is_active !== undefined) filters.is_active = values.is_active;

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: UserFiltersForm) => {
                const hasFilters = values.name || values.role || values.store_id || values.is_active !== undefined;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 500),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: UserFiltersForm) => {
            debouncedRefetch(allValues);
        },
        [debouncedRefetch]
    );

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

    const isActiveOptions = [
        { label: 'Activos', value: true },
        { label: 'Inactivos', value: false },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            className="userSearchBar"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
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
                />

                <SelectField
                    name="is_active"
                    label="Estado"
                    placeholder="Seleccionar"
                    options={isActiveOptions}
                    allowClear
                    disabled={filterOptionsLoading}
                />

                <div className="userSearchBarActions">
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
