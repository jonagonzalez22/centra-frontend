import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import type { CategoriesFilters } from '../../interfaces/category.interface';
import './CategoriesSearchBar.css';

interface CategoriesSearchBarProps {
    loading: boolean;
    refetch: (filters?: CategoriesFilters) => void;
}

interface CategoryFiltersForm {
    name?: string;
    is_active?: string;
}

const activeOptions = [
    { label: 'Todos', value: '' },
    { label: 'Activos', value: 'true' },
    { label: 'Inactivos', value: 'false' },
];

export const CategoriesSearchBar: React.FC<CategoriesSearchBarProps> = ({ loading, refetch }) => {
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);
    const isActiveValue = Form.useWatch('is_active', form);

    const hasActiveFilters = !!(nameValue || isActiveValue);

    const buildFilters = useCallback((values: CategoryFiltersForm): CategoriesFilters => {
        const filters: CategoriesFilters = {};

        if (values.name) filters.name = values.name;
        if (values.is_active !== undefined && values.is_active !== '') {
            filters.is_active = values.is_active === 'true';
        }

        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: CategoryFiltersForm) => {
                const hasFilters = values.name || values.is_active;

                if (!hasFilters) {
                    refetch({});
                    return;
                }

                refetch(buildFilters(values));
            }, 400),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: CategoryFiltersForm) => {
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
            className="categoriesSearchBar"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
        >
            <div className="categoriesSearchBarRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
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

                <div className="categoriesSearchBarActions">
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