import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useStoreUsersContext } from '../../hooks/useStoreUsersContext';
import type { StoreUsersFilters } from '../../types/storeUser.types';
import './StoreUserSearchBar.css';

interface StoreUserFiltersForm {
    name?: string;
    email?: string;
    is_active?: boolean;
}

export const StoreUserSearchBar = () => {
    const { refetch, filterOptionsLoading } = useStoreUsersContext();
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const emailValue = Form.useWatch('email', form);
    const isActiveValue = Form.useWatch('is_active', form);

    const hasActiveFilters = nameValue || emailValue || isActiveValue !== undefined;

    const buildFilters = useCallback((values: StoreUserFiltersForm): StoreUsersFilters => {
        const filters: StoreUsersFilters = {};

        if (values.name) filters.name = values.name;
        if (values.email) filters.email = values.email;
        if (values.is_active !== undefined) filters.is_active = values.is_active;

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: StoreUserFiltersForm) => {
                const hasFilters = values.name || values.email || values.is_active !== undefined;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 500),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: StoreUserFiltersForm) => {
            debouncedRefetch(allValues);
        },
        [debouncedRefetch]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        refetch({});
    }, [form, refetch]);

    const isActiveOptions = [
        { label: 'Activos', value: true },
        { label: 'Inactivos', value: false },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            className="storeUserSearchBar"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
        >
            <div className="storeUserSearchBarRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={filterOptionsLoading}
                />

                <InputField
                    name="email"
                    label="Email"
                    placeholder="Buscar por email"
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

                <div className="storeUserSearchBarActions">
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
