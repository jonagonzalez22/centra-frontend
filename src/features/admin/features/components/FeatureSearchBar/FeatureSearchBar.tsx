import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useFeaturesContext } from '../../hooks/useFeaturesContext';
import type { FeaturesFilters } from '../../types/feature.types';
import './FeatureSearchBar.css';

interface FeatureFiltersForm {
    code?: string;
    name?: string;
    has_plans?: string;
}

const hasPlansOptions = [
    { label: 'Con Plan', value: '1' },
    { label: 'Sin Plan', value: '0' },
];

export const FeatureSearchBar = () => {
    const { loading, refetch } = useFeaturesContext();
    const [form] = Form.useForm();

    const codeValue = Form.useWatch('code', form);
    const nameValue = Form.useWatch('name', form);
    const hasPlansValue = Form.useWatch('has_plans', form);

    const hasActiveFilters = codeValue || nameValue || hasPlansValue;

    const buildFilters = useCallback((values: FeatureFiltersForm): FeaturesFilters => {
        const filters: FeaturesFilters = {};

        if (values.code) filters.code = values.code;
        if (values.name) filters.name = values.name;
        if (values.has_plans) filters.has_plans = values.has_plans;

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: FeatureFiltersForm) => {
                const hasFilters = values.code || values.name || values.has_plans;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 400),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: FeatureFiltersForm) => {
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
            className="featureSearchBar"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
        >
            <div className="featureSearchBarRow">
                <InputField
                    name="code"
                    label="Código"
                    placeholder="Buscar por código"
                    allowClear
                    disabled={loading}
                />

                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={loading}
                />

                <SelectField
                    name="has_plans"
                    label="Planes"
                    placeholder="Seleccionar"
                    options={hasPlansOptions}
                    allowClear
                    disabled={loading}
                />

                <div className="featureSearchBarActions">
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