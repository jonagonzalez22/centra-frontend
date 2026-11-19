import { Form, Input, Select } from 'antd';
import { debounce } from 'lodash';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/Button';
import type {
    EligibleOrderLocality,
    EligibleOrdersFilters,
} from '../../interfaces/route.interface';
import './EligibleOrderFilters.css';

type Values = Pick<EligibleOrdersFilters, 'search' | 'locality_id'>;

interface EligibleOrderFiltersProps {
    filters: Values;
    localities: EligibleOrderLocality[];
    onChange: (filters: Values) => void;
}

export const EligibleOrderFilters = ({
    filters,
    localities,
    onChange,
}: EligibleOrderFiltersProps) => {
    const [form] = Form.useForm<Values>();
    const debouncedSearch = useMemo(() => debounce(onChange, 400), [onChange]);

    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);
    useEffect(
        () =>
            form.setFieldsValue({ search: filters.search ?? '', locality_id: filters.locality_id }),
        [filters, form]
    );

    const normalize = (values: Values): Values => ({
        search: values.search?.trim() || undefined,
        locality_id: values.locality_id || undefined,
    });
    const onValuesChange = (changed: Partial<Values>, values: Values) => {
        if ('search' in changed) debouncedSearch(normalize(values));
        else {
            debouncedSearch.cancel();
            onChange(normalize(values));
        }
    };
    const clear = () => {
        debouncedSearch.cancel();
        form.resetFields();
        onChange({});
    };
    const hasFilters = Boolean(filters.search || filters.locality_id);

    return (
        <section className="eligibleOrderFilters" aria-label="Filtros de pedidos elegibles">
            <Form
                form={form}
                layout="vertical"
                className="eligibleOrderFiltersForm"
                onValuesChange={onValuesChange}
            >
                <Form.Item name="search" label="Cliente">
                    <Input allowClear placeholder="Buscar por cliente" />
                </Form.Item>
                <Form.Item name="locality_id" label="Localidad">
                    <Select
                        allowClear
                        placeholder="Todas las localidades"
                        options={localities.map((locality) => ({
                            value: locality.id,
                            label: locality.name,
                        }))}
                    />
                </Form.Item>
            </Form>
            <div className="eligibleOrderFiltersActions">
                <Button variant="default" label="Limpiar" disabled={!hasFilters} action={clear} />
            </div>
        </section>
    );
};
