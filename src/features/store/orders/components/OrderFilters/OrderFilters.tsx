import { useCallback, useEffect, useMemo } from 'react';
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
    collection_status: string;
}

interface OrderFiltersProps {
    filters: OrderFiltersType;
    loading: boolean;
    onFilterChange: (filters: Partial<OrderFiltersType>) => void;
    onReset: () => void;
}

const STATUS_OPTIONS = [
    { label: 'Todos', value: '' },
    { label: 'Abierto', value: 'open' },
    { label: 'Confirmado', value: 'confirmed' },
    { label: 'Cerrados', value: 'closed' },
    { label: 'Entregados', value: 'delivered' },
    { label: 'Parcialmente entregados', value: 'partially_delivered' },
    { label: 'Cancelados', value: 'cancelled' },
];

const OrderFilters: React.FC<OrderFiltersProps> = ({
    filters,
    onFilterChange,
    onReset,
}) => {
    const [form] = Form.useForm<OrderFiltersFormValues>();
    const dateValue = Form.useWatch('date', form);
    const operationNumberValue = Form.useWatch('operation_number', form);
    const customerNameValue = Form.useWatch('customer_name', form);
    const localityValue = Form.useWatch('locality', form);
    const statusValue = Form.useWatch('status', form);
    const collectionStatusValue = Form.useWatch('collection_status', form);

    const buildFilters = useCallback(
        (values: OrderFiltersFormValues): Partial<OrderFiltersType> => {
            return {
                date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
                operation_number: values.operation_number || undefined,
                customer_name: values.customer_name || undefined,
                locality: values.locality || undefined,
                status: values.status || undefined,
                has_pending_balance:
                    values.collection_status === 'pending'
                        ? true
                        : values.collection_status === 'paid'
                          ? false
                          : undefined,
            };
        },
        []
    );

    const debouncedSetFilters = useMemo(
        () =>
            debounce((values: OrderFiltersFormValues) => {
                onFilterChange(buildFilters(values));
            }, 300),
        [onFilterChange, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: OrderFiltersFormValues) => {
            debouncedSetFilters(allValues);
        },
        [debouncedSetFilters]
    );

    useEffect(() => () => debouncedSetFilters.cancel(), [debouncedSetFilters]);

    useEffect(() => {
        const nextValues = {
            date: filters.date ? dayjs(filters.date) : null,
            operation_number: filters.operation_number ?? '',
            customer_name: filters.customer_name ?? '',
            locality: filters.locality ?? '',
            status: filters.status ?? '',
            collection_status:
                filters.has_pending_balance === true
                    ? 'pending'
                    : filters.has_pending_balance === false
                      ? 'paid'
                      : '',
        };
        const currentValues = form.getFieldsValue();
        const isCurrentValue = currentValues.date?.format?.('YYYY-MM-DD') === nextValues.date?.format('YYYY-MM-DD')
            && currentValues.operation_number === nextValues.operation_number
            && currentValues.customer_name === nextValues.customer_name
            && currentValues.locality === nextValues.locality
            && currentValues.status === nextValues.status
            && currentValues.collection_status === nextValues.collection_status;

        if (!isCurrentValue) {
            form.setFieldsValue(nextValues);
        }
    }, [filters, form]);

    const handleReset = useCallback(() => {
        debouncedSetFilters.cancel();
        form.resetFields();
        onReset();
    }, [debouncedSetFilters, form, onReset]);
    const hasActiveFilters = Boolean(
        dateValue ||
            operationNumberValue ||
            customerNameValue ||
            localityValue ||
            statusValue ||
            collectionStatusValue
    );

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
                status: '',
                collection_status: '',
            }}
        >
            <div className="orderFiltersRow">
                <Form.Item name="date" label="Fecha" className="mb-0">
                    <DatePicker
                        placeholder="Seleccionar fecha"
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                        allowClear
                    />
                </Form.Item>

                <InputField
                    name="operation_number"
                    label="Nº de pedido"
                    placeholder="Buscar por número"
                    allowClear
                />

                <InputField
                    name="customer_name"
                    label="Cliente"
                    placeholder="Buscar por cliente"
                    allowClear
                />

                <InputField
                    name="locality"
                    label="Localidad"
                    placeholder="Buscar por localidad"
                    allowClear
                />

                <SelectField
                    name="status"
                    label="Estado"
                    placeholder="Seleccionar"
                    options={STATUS_OPTIONS}
                    allowClear
                />

                <SelectField
                    name="collection_status"
                    label="Cobranza"
                    placeholder="Todos"
                    options={[
                        { label: 'Todos', value: '' },
                        { label: 'Con saldo pendiente', value: 'pending' },
                        { label: 'Sin saldo pendiente', value: 'paid' },
                    ]}
                    allowClear
                />

                <div className="orderFiltersActions">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={!hasActiveFilters}
                    />
                </div>
            </div>
        </Form>
    );
};

export default OrderFilters;
