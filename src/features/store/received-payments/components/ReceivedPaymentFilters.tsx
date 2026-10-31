import { DatePicker, Form, Input, Select, Tag, theme } from 'antd';
import { Filter } from 'lucide-react';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import Drawer from '@/components/Drawer/Drawer';
import { getPaymentOriginLabel } from '@/utils/paymentOrigin';
import { ReceivedPaymentsService } from '../services/received-payments.service';
import './ReceivedPaymentFilters.css';
import type {
    ReceivedPaymentFilterOptions,
    ReceivedPaymentsFilters,
} from '../interfaces/received-payment.interface';

interface Values {
    date_from: dayjs.Dayjs | null;
    date_to: dayjs.Dayjs | null;
    operation_number: string;
    customer: string;
    store_payment_method_id: string;
    origin: string;
    status: string;
    collected_by: string;
}
const origins = [
    'pos_sale',
    'order_deposit',
    'manual_collection',
    'route_collection',
    'unknown',
] as const;
const secondaryKeys = ['store_payment_method_id', 'origin', 'status', 'collected_by'] as const;
const has = (values: Partial<Values>, key: keyof Values) =>
    Object.prototype.hasOwnProperty.call(values, key);
const asPrimaryFilters = (values: Partial<Values>): Partial<ReceivedPaymentsFilters> => ({
    ...(has(values, 'date_from') && { date_from: values.date_from?.format('YYYY-MM-DD') }),
    ...(has(values, 'date_to') && { date_to: values.date_to?.format('YYYY-MM-DD') }),
    ...(has(values, 'operation_number') && {
        operation_number: values.operation_number || undefined,
    }),
    ...(has(values, 'customer') && { customer: values.customer || undefined }),
});
const asFilters = (values: Partial<Values>): Partial<ReceivedPaymentsFilters> => ({
    ...asPrimaryFilters(values),
    store_payment_method_id: values.store_payment_method_id || undefined,
    origin: (values.origin || undefined) as ReceivedPaymentsFilters['origin'],
    status: (values.status || undefined) as ReceivedPaymentsFilters['status'],
    collected_by: values.collected_by || undefined,
});
const asValues = (filters: ReceivedPaymentsFilters): Values => ({
    date_from: filters.date_from ? dayjs(filters.date_from) : null,
    date_to: filters.date_to ? dayjs(filters.date_to) : null,
    operation_number: filters.operation_number ?? '',
    customer: filters.customer ?? '',
    store_payment_method_id: filters.store_payment_method_id ?? '',
    origin: filters.origin ?? '',
    status: filters.status ?? '',
    collected_by: filters.collected_by ?? '',
});
const asAdvancedFilters = (values: Partial<Values>): Partial<ReceivedPaymentsFilters> => ({
    store_payment_method_id: values.store_payment_method_id || undefined,
    origin: (values.origin || undefined) as ReceivedPaymentsFilters['origin'],
    status: (values.status || undefined) as ReceivedPaymentsFilters['status'],
    collected_by: values.collected_by || undefined,
});
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    return isMobile;
};

const FilterFields = ({
    primary = true,
    advanced = true,
    options,
}: {
    primary?: boolean;
    advanced?: boolean;
    options: ReceivedPaymentFilterOptions;
}) => (
    <>
        {primary && (
            <>
                <Form.Item name="date_from" label="Fecha desde">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </Form.Item>
                <Form.Item name="date_to" label="Fecha hasta">
                    <DatePicker format="DD/MM/YYYY" className="w-full" />
                </Form.Item>
                <Form.Item name="operation_number" label="Referencia">
                    <Input allowClear placeholder="V-000010 o P-000022" />
                </Form.Item>
                <Form.Item name="customer" label="Cliente">
                    <Input allowClear placeholder="Buscar por cliente" />
                </Form.Item>
            </>
        )}
        {advanced && (
            <>
                <Form.Item name="store_payment_method_id" label="Medio">
                    <Select
                        allowClear
                        options={options.payment_methods.map((method) => ({
                            value: method.id,
                            label: `${method.name ?? 'Sin nombre'}${method.is_enabled ? '' : ' · Inactivo'}`,
                        }))}
                    />
                </Form.Item>
                <Form.Item name="origin" label="Origen">
                    <Select
                        allowClear
                        options={origins.map((origin) => ({
                            value: origin,
                            label: getPaymentOriginLabel(origin),
                        }))}
                    />
                </Form.Item>
                <Form.Item name="status" label="Estado">
                    <Select
                        allowClear
                        options={[
                            { value: 'active', label: 'Activo' },
                            { value: 'reversed', label: 'Revertido' },
                        ]}
                    />
                </Form.Item>
                <Form.Item name="collected_by" label="Cobrado por">
                    <Select
                        allowClear
                        options={options.collectors.map((collector) => ({
                            value: collector.id,
                            label: collector.name,
                        }))}
                    />
                </Form.Item>
            </>
        )}
    </>
);

export const ReceivedPaymentFilters = ({
    filters,
    onChange,
    onReset,
}: {
    filters: ReceivedPaymentsFilters;
    onChange: (changes: Partial<ReceivedPaymentsFilters>) => void;
    onReset: () => void;
}) => {
    const { token } = theme.useToken();
    const isMobile = useIsMobile();
    const [desktopForm] = Form.useForm<Values>();
    const [mobileForm] = Form.useForm<Values>();
    const [secondaryForm] = Form.useForm<Values>();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [options, setOptions] = useState<ReceivedPaymentFilterOptions>({
        payment_methods: [],
        collectors: [],
    });
    const debouncedChange = useMemo(
        () => debounce((values: Partial<Values>) => onChange(asPrimaryFilters(values)), 300),
        [onChange]
    );
    const appliedCount = Object.entries(filters).filter(
        ([key, value]) => !['page', 'per_page'].includes(key) && Boolean(value)
    ).length;
    const secondaryCount = secondaryKeys.filter((key) => Boolean(filters[key])).length;
    useEffect(() => () => debouncedChange.cancel(), [debouncedChange]);
    useEffect(() => {
        void ReceivedPaymentsService.getFilterOptions()
            .then(setOptions)
            .catch(() => setOptions({ payment_methods: [], collectors: [] }));
    }, []);
    useEffect(() => {
        if (!isMobile) desktopForm.setFieldsValue(asValues(filters));
    }, [desktopForm, filters, isMobile]);
    useEffect(() => {
        if (mobileOpen) mobileForm.setFieldsValue(asValues(filters));
        if (desktopOpen) secondaryForm.setFieldsValue(asValues(filters));
    }, [filters, mobileForm, mobileOpen, secondaryForm, desktopOpen]);
    const method = options.payment_methods.find(
        (item) => item.id === filters.store_payment_method_id
    );
    const collector = options.collectors.find((item) => item.id === filters.collected_by);
    const chips: {
        key: string;
        label: string;
        value: string;
        clear: Partial<ReceivedPaymentsFilters>;
    }[] = [];
    const dateFrom = filters.date_from ? dayjs(filters.date_from).format('DD/MM/YYYY') : undefined;
    const dateTo = filters.date_to ? dayjs(filters.date_to).format('DD/MM/YYYY') : undefined;
    if (dateFrom || dateTo)
        chips.push({
            key: 'date',
            label: 'Fecha',
            value:
                dateFrom && dateTo
                    ? `${dateFrom} – ${dateTo}`
                    : dateFrom
                      ? `Desde ${dateFrom}`
                      : `Hasta ${dateTo}`,
            clear: { date_from: undefined, date_to: undefined },
        });
    if (filters.operation_number)
        chips.push({
            key: 'operation_number',
            label: 'Referencia',
            value: filters.operation_number,
            clear: { operation_number: undefined },
        });
    if (filters.customer)
        chips.push({
            key: 'customer',
            label: 'Cliente',
            value: filters.customer,
            clear: { customer: undefined },
        });
    if (filters.store_payment_method_id)
        chips.push({
            key: 'store_payment_method_id',
            label: 'Medio',
            value: method?.name ?? filters.store_payment_method_id,
            clear: { store_payment_method_id: undefined },
        });
    if (filters.origin)
        chips.push({
            key: 'origin',
            label: 'Origen',
            value: getPaymentOriginLabel(filters.origin),
            clear: { origin: undefined },
        });
    if (filters.status)
        chips.push({
            key: 'status',
            label: 'Estado',
            value: filters.status === 'active' ? 'Activo' : 'Revertido',
            clear: { status: undefined },
        });
    if (filters.collected_by)
        chips.push({
            key: 'collected_by',
            label: 'Cobrado por',
            value: collector?.name ?? filters.collected_by,
            clear: { collected_by: undefined },
        });
    const chipsView = chips.length ? (
        <div
            className={`mt-2 flex max-w-full flex-wrap gap-2 ${isMobile ? 'mb-3' : ''}`}
            aria-label="Filtros aplicados"
        >
            {chips.map((chip) => (
                <Tag
                    key={chip.key}
                    closable
                    onClose={() => onChange(chip.clear)}
                    className="received-payment-filter-chip !m-0 !flex !h-7 !max-w-full !items-center !rounded-full !px-2 !text-sm"
                    style={
                        {
                            background: token.colorPrimary,
                            borderColor: token.colorPrimary,
                            color: token.colorTextLightSolid,
                        '--received-payment-chip-close-bg': token.colorTextLightSolid,
                        '--received-payment-chip-close-color': token.colorPrimary,
                        '--received-payment-chip-close-hover': token.colorPrimaryBg,
                            '--received-payment-chip-close-focus': token.colorTextLightSolid,
                        } as React.CSSProperties
                    }
                >
                    <span style={{ color: token.colorTextLightSolid }}>{chip.label}</span>
                    <span className="mx-1" style={{ color: token.colorTextLightSolid }}>
                        ·
                    </span>
                    <span className="truncate" style={{ color: token.colorTextLightSolid }}>
                        {chip.value}
                    </span>
                </Tag>
            ))}
        </div>
    ) : null;
    const applyAdvanced = () => {
        debouncedChange.cancel();
        onChange(asAdvancedFilters(secondaryForm.getFieldsValue()));
        setDesktopOpen(false);
    };
    const mobileApply = () => {
        debouncedChange.cancel();
        onChange(asFilters(mobileForm.getFieldsValue()));
        setMobileOpen(false);
    };
    const advancedFooter = (
        <div className="flex justify-between gap-3">
            <Button variant="default" label="Limpiar" action={() => secondaryForm.resetFields()} />
            <Button variant="primary" label="Aplicar filtros" action={applyAdvanced} />
        </div>
    );
    if (isMobile)
        return (
            <>
                <Button
                    variant="default"
                    icon={<Filter size={16} />}
                    action={() => setMobileOpen(true)}
                    className="mb-5 min-h-10"
                >
                    <span>Filtros</span>
                    {appliedCount > 0 && (
                        <span className="ml-2 rounded-full bg-centra-primary px-2 py-0.5 text-xs text-white">
                            {appliedCount}
                        </span>
                    )}
                </Button>
                <Drawer
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    title="Filtros"
                    footer={
                        <div className="flex justify-between gap-3">
                            <Button
                                variant="default"
                                label="Limpiar"
                                action={() => mobileForm.resetFields()}
                            />
                            <Button
                                variant="primary"
                                label="Aplicar filtros"
                                action={mobileApply}
                            />
                        </div>
                    }
                >
                    <Form form={mobileForm} layout="vertical">
                        <div className="grid grid-cols-1 gap-y-1">
                            <FilterFields options={options} />
                        </div>
                    </Form>
                </Drawer>
                {chipsView}
            </>
        );
    return (
        <Form
            form={desktopForm}
            layout="vertical"
            onValuesChange={(changed) => debouncedChange(changed)}
            className="mb-6"
        >
            <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                <FilterFields advanced={false} options={options} />
            </div>
            <div className="-mt-1 flex items-center gap-2">
                <Button
                    variant="default"
                    label={`Más filtros${secondaryCount > 0 ? ` ${secondaryCount}` : ''}`}
                    icon={<Filter size={16} />}
                    aria-expanded={desktopOpen}
                    action={() => setDesktopOpen(true)}
                >
                    <span>Más filtros</span>
                    {secondaryCount > 0 && (
                        <span className="ml-2 rounded-full bg-centra-primary px-2 py-0.5 text-xs text-white">
                            {secondaryCount}
                        </span>
                    )}
                </Button>
                <Button
                    variant="default"
                    label="Limpiar"
                    action={() => {
                        debouncedChange.cancel();
                        desktopForm.resetFields();
                        onReset();
                    }}
                    disabled={appliedCount === 0}
                />
            </div>
            <Drawer
                open={desktopOpen}
                onClose={() => setDesktopOpen(false)}
                title="Más filtros"
                width={450}
                footer={advancedFooter}
            >
                <Form form={secondaryForm} layout="vertical">
                    <FilterFields primary={false} options={options} />
                </Form>
            </Drawer>
            {chipsView}
        </Form>
    );
};
