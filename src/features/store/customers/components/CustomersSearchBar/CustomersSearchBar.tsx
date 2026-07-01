import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import type { CustomersFilters } from '../../types/customer.types';
import type { CommercialGroup } from '@/features/store/commercial-groups/types/commercialGroup.types';

interface CustomersSearchBarProps {
    loading: boolean;
    refetch: (filters?: CustomersFilters) => void;
    commercialGroups: CommercialGroup[];
    groupsLoading: boolean;
}

interface SearchFormValues {
    search_text?: string;
    status?: 'active' | 'inactive';
    commercial_group_id?: string;
}

export const CustomersSearchBar: React.FC<CustomersSearchBarProps> = ({
    loading,
    refetch,
    commercialGroups,
    groupsLoading,
}) => {
    const [form] = Form.useForm();

    const searchTextValue = Form.useWatch('search_text', form);
    const statusValue = Form.useWatch('status', form);
    const groupValue = Form.useWatch('commercial_group_id', form);

    const hasActiveFilters = !!(searchTextValue || statusValue || groupValue);

    const buildFilters = useCallback((values: SearchFormValues): CustomersFilters => {
        const filters: CustomersFilters = {};
        if (values.search_text) filters.search_text = values.search_text;
        if (values.status) filters.status = values.status;
        if (values.commercial_group_id) filters.commercial_group_id = values.commercial_group_id;
        return filters;
    }, []);

    const debouncedRefetch = useMemo(
        () =>
            debounce((values: SearchFormValues) => {
                const hasFilters = !!(values.search_text || values.status || values.commercial_group_id);

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

    const commercialGroupOptions = commercialGroups.map((group) => ({
        label: group.name,
        value: group.id,
    }));

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
                        name="search_text"
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
                <div className="min-w-[200px]">
                    <SelectField
                        name="commercial_group_id"
                        label="Grupo Comercial"
                        placeholder="Todos"
                        options={commercialGroupOptions}
                        allowClear
                        loading={groupsLoading}
                        disabled={loading || groupsLoading}
                        showSearch
                        filterOption={(input, option) =>
                            ((option as { label: string })?.label ?? '')
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
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
