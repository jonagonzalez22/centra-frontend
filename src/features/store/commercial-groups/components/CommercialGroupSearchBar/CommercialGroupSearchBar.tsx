import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import type { CommercialGroupsFilters } from '../../types/commercialGroup.types';

interface CommercialGroupSearchBarProps {
    loading: boolean;
    refetch: (filters?: CommercialGroupsFilters) => void;
}

interface SearchFormValues {
    name?: string;
}

export const CommercialGroupSearchBar: React.FC<CommercialGroupSearchBarProps> = ({
    loading,
    refetch,
}) => {
    const [form] = Form.useForm();

    const nameValue = Form.useWatch('name', form);

    const hasActiveFilters = !!nameValue;

    const buildFilters = useCallback((values: SearchFormValues): CommercialGroupsFilters => {
        const filters: CommercialGroupsFilters = {};
        if (values.name) filters.name = values.name;
        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: SearchFormValues) => {
                if (!values.name) {
                    refetch({});
                    return;
                }
                refetch(buildFilters(values));
            }, 400),
        [refetch, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: SearchFormValues) => {
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
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
            className="mb-4"
        >
            <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-[180px]">
                    <InputField
                        name="name"
                        label="Nombre"
                        placeholder="Buscar por nombre"
                        allowClear
                        disabled={loading}
                    />
                </div>
                <div className="flex gap-2 min-[332px]:mt-6">
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
