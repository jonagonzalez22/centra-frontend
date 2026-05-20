import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useBusinessTypesContext } from '../../hooks/useBusinessTypesContext';
import type { BusinessTypesFilters } from '../../types/business-type.types';
import './BusinessTypeSearchBar.css';

interface BusinessTypeFiltersForm {
    name?: string;
    status?: string;
}

const statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
];

export const BusinessTypeSearchBar = () => {
    const { loading, refetch } = useBusinessTypesContext();
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const statusValue = Form.useWatch('status', form);

    const hasActiveFilters = nameValue || statusValue;

    const buildFilters = useCallback((values: BusinessTypeFiltersForm): BusinessTypesFilters => {
        const filters: BusinessTypesFilters = {};

        if (values.name) filters.name = values.name;
        if (values.status) filters.status = values.status;

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: BusinessTypeFiltersForm) => {
                const hasFilters = values.name || values.status;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 400),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: BusinessTypeFiltersForm) => {
            debouncedRefetch(allValues);
        },
        [debouncedRefetch]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        refetch({});
    }, [form, refetch]);

    return (
        <Form
            form={form}
            layout="vertical"
            className="businessTypeSearchBar"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
        >
            <div className="businessTypeSearchBarRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={loading}
                />

                <SelectField
                    name="status"
                    label="Estado"
                    placeholder="Seleccionar"
                    options={statusOptions}
                    allowClear
                    disabled={loading}
                />

                <div className="businessTypeSearchBarActions">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={loading || !hasActiveFilters}
                    />
                </div>
            </div>
        </Form>
    );
};