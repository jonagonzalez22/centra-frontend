import { useCallback, useMemo } from 'react';
import { DatePicker, Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import type { OrderFilters as OrderFiltersType } from '../../interfaces/order.interface';
import dayjs from 'dayjs';
import './OrderFilters.css';

interface OrderFiltersFormValues {
    date: dayjs.Dayjs | null;
    operation_number: string;
    customer_name: string;
    locality: string;
    status: string;
}

interface OrderFiltersProps {
    loading: boolean;
    onFilterChange: (filters: Partial<OrderFiltersType>) => void;
    onReset: () => void;
}

const STATUS_OPTIONS = [
    { label: 'Abierto', value: 'open' },
    { label: 'Confirmado', value: 'confirmed' },
    { label: 'Cerrados', value: 'closed' },
    { label: 'Entregados', value: 'delivered' },
    { label: 'Parcialmente entregados', value: 'partially_delivered' },
    { label: 'Cancelados', value: 'cancelled' },
    { label: 'Todos', value: '' },
];

const OrderFilters: React.FC<OrderFiltersProps> = ({ loading, onFilterChange, onReset }) => {
    const [form] = Form.useForm<OrderFiltersFormValues>();

    const buildFilters = useCallback(
        (values: OrderFiltersFormValues): Partial<OrderFiltersType> => {
            return {
                date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                operation_number: values.operation_number || undefined,
                customer_name: values.customer_name || undefined,
                locality: values.locality || undefined,
                status: values.status !== undefined ? values.status : undefined,
            };
        },
        []
    );

    const debouncedSetFilters = useMemo(
        () =>
            debounce((values: OrderFiltersFormValues) => {
                onFilterChange(buildFilters(values));
            }, 400),
        [onFilterChange, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: OrderFiltersFormValues) => {
            debouncedSetFilters(allValues);
        },
        [debouncedSetFilters]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        onReset();
    }, [form, onReset]);

    return (
        <Form
            form={form}
            layout="vertical"
            className="orderFilters"
            onValuesChange={handleValuesChange}
            initialValues={{
                date: null,
                operation_number: '',
                customer_name: '',
                locality: '',
                status: 'open',
            }}
        >
            <div className="orderFiltersRow">
                <Form.Item name="date" label="Fecha" className="mb-0">
                    <DatePicker
                        placeholder="Seleccionar fecha"
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                        allowClear
                        disabled={loading}
                    />
                </Form.Item>

                <InputField
                    name="operation_number"
                    label="Nº de pedido"
                    placeholder="Buscar por número"
                    allowClear
                    disabled={loading}
                />

                <InputField
                    name="customer_name"
                    label="Cliente"
                    placeholder="Buscar por cliente"
                    allowClear
                    disabled={loading}
                />

                <InputField
                    name="locality"
                    label="Localidad"
                    placeholder="Buscar por localidad"
                    allowClear
                    disabled={loading}
                />

                <SelectField
                    name="status"
                    label="Estado"
                    placeholder="Seleccionar"
                    options={STATUS_OPTIONS}
                    allowClear
                    disabled={loading}
                />

                <div className="orderFiltersActions">
                    <Button
                        variant="default"
                        label="Limpiar filtros"
                        action={handleReset}
                        disabled={loading}
                    />
                </div>
            </div>
        </Form>
    );
};

export default OrderFilters;
