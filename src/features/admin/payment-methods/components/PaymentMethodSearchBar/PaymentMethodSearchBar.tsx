import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { usePaymentMethodsContext } from '../../hooks/usePaymentMethodsContext';
import type { PaymentMethodsFilters } from '../../types/payment-method.types';

interface PaymentMethodFiltersForm {
    name?: string;
    code?: string;
    is_active?: string;
}

const activeOptions = [
    { label: 'Activo', value: 'true' },
    { label: 'Inactivo', value: 'false' },
];

export const PaymentMethodSearchBar = () => {
    const { loading, refetch } = usePaymentMethodsContext();
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const codeValue = Form.useWatch('code', form);
    const activeValue = Form.useWatch('is_active', form);

    const hasActiveFilters = nameValue || codeValue || activeValue;

    const buildFilters = useCallback((values: PaymentMethodFiltersForm): PaymentMethodsFilters => {
        const filters: PaymentMethodsFilters = {};

        if (values.name) filters.name = values.name;
        if (values.code) filters.code = values.code;
        if (values.is_active) filters.is_active = values.is_active === 'true';

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: PaymentMethodFiltersForm) => {
                const hasFilters = values.name || values.code || values.is_active;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 400),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: PaymentMethodFiltersForm) => {
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
            className="mb-6"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
        >
            <div className="flex flex-wrap items-end gap-3">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={loading}
                />

                <InputField
                    name="code"
                    label="Código"
                    placeholder="Buscar por código"
                    allowClear
                    disabled={loading}
                />

                <SelectField
                    name="is_active"
                    label="Estado"
                    placeholder="Seleccionar"
                    options={activeOptions}
                    allowClear
                    disabled={loading}
                />

                <div className="flex gap-2 items-end">
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
