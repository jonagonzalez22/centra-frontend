import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useStoresContext } from '@/features/admin/stores/hooks/useStoresContext';
import type { StoresFilters } from '@/features/admin/stores/types/store.types';
import './StoreSearchBar.css';

interface StoreFiltersForm {
    name?: string;
    business_type_id?: number;
    plan_id?: string;
    is_active?: boolean;
    cuit?: string;
}

export const StoreSearchBar = () => {
    const { loading, filterOptions, filterOptionsLoading, refetch } = useStoresContext();

    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const businessTypeValue = Form.useWatch('business_type_id', form);
    const planValue = Form.useWatch('plan_id', form);
    const isActiveValue = Form.useWatch('is_active', form);
    const cuitValue = Form.useWatch('cuit', form);

    const hasActiveFilters =
        nameValue || businessTypeValue || planValue || isActiveValue !== undefined || cuitValue;

    const isDisabled = loading || filterOptionsLoading;

    const buildFilters = useCallback((values: StoreFiltersForm): StoresFilters => {
        const filters: StoresFilters = {};

        if (values.name) filters.name = values.name;
        if (values.business_type_id) filters.business_type_id = values.business_type_id;
        if (values.plan_id) filters.plan_id = values.plan_id;
        if (values.is_active !== undefined) filters.is_active = values.is_active;
        if (values.cuit) filters.cuit = values.cuit;

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: StoreFiltersForm) => {
                const hasFilters =
                    values.name ||
                    values.business_type_id ||
                    values.plan_id ||
                    values.is_active !== undefined ||
                    values.cuit;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 400),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: StoreFiltersForm) => {
            debouncedRefetch(allValues);
        },
        [debouncedRefetch]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        refetch({});
    }, [form, refetch]);

    const businessTypeOptions =
        filterOptions?.business_types.map((bt) => ({
            label: bt.name,
            value: bt.id,
        })) ?? [];

    const planOptions =
        filterOptions?.plans.map((p) => ({
            label: p.name,
            value: p.id,
        })) ?? [];

    const isActiveOptions =
        filterOptions?.is_active.map((ia) => ({
            label: ia.label,
            value: ia.value,
        })) ?? [];

    return (
        <Form
            form={form}
            layout="vertical"
            className="storeSearchBar"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
        >
            <div className="storeSearchBarRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={isDisabled}
                />

                <InputField
                    name="cuit"
                    label="CUIT"
                    placeholder="CUIT"
                    allowClear
                    disabled={isDisabled}
                />

                <SelectField
                    name="business_type_id"
                    label="Tipo de Negocio"
                    placeholder="Seleccionar"
                    options={businessTypeOptions}
                    allowClear
                    disabled={isDisabled}
                    loading={filterOptionsLoading}
                />

                <SelectField
                    name="plan_id"
                    label="Plan"
                    placeholder="Seleccionar"
                    options={planOptions}
                    allowClear
                    disabled={isDisabled}
                    loading={filterOptionsLoading}
                />

                <SelectField
                    name="is_active"
                    label="Estado"
                    placeholder="Seleccionar"
                    options={isActiveOptions}
                    allowClear
                    disabled={isDisabled}
                    loading={filterOptionsLoading}
                />

                <div className="storeSearchBarActions">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={isDisabled || !hasActiveFilters}
                    />
                </div>
            </div>
        </Form>
    );
};
