import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import type { CustomersFilters } from '../../types/customer.types';

interface CustomersSearchBarProps {
    loading: boolean;
    refetch: (filters?: CustomersFilters) => void;
}

interface SearchFormValues {
    search?: string;
    status?: 'active' | 'inactive';
    location_status?: 'all' | 'with_location' | 'without_location';
}

export const CustomersSearchBar: React.FC<CustomersSearchBarProps> = ({
    loading,
    refetch,
}) => {
    const [form] = Form.useForm();

    const searchTextValue = Form.useWatch('search', form);
    const statusValue = Form.useWatch('status', form);
    const locationStatusValue = Form.useWatch('location_status', form);

    const hasActiveFilters = !!(searchTextValue || statusValue || locationStatusValue);

    const buildFilters = useCallback((values: SearchFormValues): CustomersFilters => {
        const filters: CustomersFilters = {};
        if (values.search) filters.search = values.search;
        if (values.status) filters.status = values.status;
        if (values.location_status) filters.location_status = values.location_status;
        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: SearchFormValues) => {
                const hasFilters = !!(values.search || values.status || values.location_status);

                if (!hasFilters) {
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

    const statusOptions = [
        { label: 'Activos', value: 'active' },
        { label: 'Inactivos', value: 'inactive' },
    ];

    const locationStatusOptions = [
        { label: 'Todas', value: 'all' },
        { label: 'Geolocalizados', value: 'with_location' },
        { label: 'Pendientes de Ubicación', value: 'without_location' },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={(values) => refetch(buildFilters(values))}
            className="mb-4"
        >
            <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-[200px]">
                    <InputField
                        name="search"
                        label="Búsqueda"
                        placeholder="Buscar por nombre o código"
                        allowClear
                        disabled={loading}
                    />
                </div>
                <div className="min-w-[160px]">
                    <SelectField
                        name="status"
                        label="Estado"
                        placeholder="Todos"
                        options={statusOptions}
                        allowClear
                        disabled={loading}
                    />
                </div>
                <div className="min-w-[180px]">
                    <SelectField
                        name="location_status"
                        label="Estado de Ubicación"
                        placeholder="Todas"
                        options={locationStatusOptions}
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
