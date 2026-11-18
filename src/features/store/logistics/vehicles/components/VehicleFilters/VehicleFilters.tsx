import { Form, Input, Select } from 'antd';
import { debounce } from 'lodash';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/Button';
import type { VehicleType, VehiclesFilters } from '../../interfaces/vehicle.interface';
import './VehicleFilters.css';

interface VehicleFiltersProps {
    filters: VehiclesFilters;
    types: VehicleType[];
    onChange: (changes: Omit<VehiclesFilters, 'page' | 'per_page'>) => void;
    onReset: () => void;
}

type Values = Pick<VehiclesFilters, 'search' | 'type' | 'is_active'>;

const typeLabels: Record<VehicleType, string> = {
    auto: 'Auto',
    moto: 'Moto',
    bicicleta: 'Bicicleta',
    camioneta: 'Camioneta',
    camion: 'Camión',
};

const valuesFor = (filters: VehiclesFilters): Values => ({
    search: filters.search ?? '',
    type: filters.type,
    is_active: filters.is_active,
});

const toFilters = (values: Values): Values => ({
    search: values.search?.trim() || undefined,
    type: values.type || undefined,
    is_active: values.is_active,
});

export const VehicleFilters = ({ filters, types, onChange, onReset }: VehicleFiltersProps) => {
    const [form] = Form.useForm<Values>();
    const debouncedSearch = useMemo(
        () => debounce((values: Values) => onChange(toFilters(values)), 400),
        [onChange]
    );

    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);
    useEffect(() => form.setFieldsValue(valuesFor(filters)), [filters, form]);

    const handleValuesChange = (changed: Partial<Values>, values: Values) => {
        if ('search' in changed) {
            debouncedSearch(values);
            return;
        }
        debouncedSearch.cancel();
        onChange(toFilters(values));
    };

    const reset = () => {
        debouncedSearch.cancel();
        form.resetFields();
        onReset();
    };

    const hasActiveFilters = Boolean(
        filters.search || filters.type || filters.is_active !== undefined
    );

    return (
        <section className="vehicleFilters" aria-label="Filtros de vehículos">
            <Form
                form={form}
                layout="vertical"
                className="vehicleFiltersForm"
                onValuesChange={handleValuesChange}
            >
                <Form.Item name="search" label="Buscar">
                    <Input allowClear placeholder="Buscar por nombre o patente" />
                </Form.Item>
                <Form.Item name="type" label="Tipo">
                    <Select
                        allowClear
                        placeholder="Todos los tipos"
                        options={types.map((type) => ({ value: type, label: typeLabels[type] }))}
                    />
                </Form.Item>
                <Form.Item name="is_active" label="Estado">
                    <Select
                        allowClear
                        placeholder="Todos los estados"
                        options={[
                            { value: true, label: 'Activos' },
                            { value: false, label: 'Inactivos' },
                        ]}
                    />
                </Form.Item>
            </Form>
            <div className="vehicleFiltersActions">
                <Button
                    variant="default"
                    label="Limpiar"
                    action={reset}
                    disabled={!hasActiveFilters}
                />
            </div>
        </section>
    );
};
