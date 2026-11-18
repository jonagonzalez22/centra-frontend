import { DatePicker, Form, Input, Select, Tag, theme } from 'antd';
import { Filter } from 'lucide-react';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import Drawer from '@/components/Drawer/Drawer';
import type { RouteDriver, RouteStatus, RoutesFilters } from '../../interfaces/route.interface';
import './RouteFilters.css';

const statuses: { label: string; value: RouteStatus }[] = [{ label: 'Borrador', value: 'draft' }, { label: 'Planificada', value: 'planned' }, { label: 'Cargada', value: 'loaded' }, { label: 'Despachada', value: 'dispatched' }, { label: 'Pend. conciliación', value: 'awaiting_reconciliation' }, { label: 'Completada', value: 'completed' }, { label: 'Cancelada', value: 'cancelled' }];
const advancedFilterKeys = ['driver_id', 'status'] as const;
type Values = { route_number: string; route_name: string; from: dayjs.Dayjs | null; to: dayjs.Dayjs | null; driver_id: string; status: string };
const valuesFor = (filters: RoutesFilters): Values => ({ route_number: filters.route_number ?? '', route_name: filters.route_name ?? '', from: filters.from ? dayjs(filters.from) : null, to: filters.to ? dayjs(filters.to) : null, driver_id: filters.driver_id ?? '', status: filters.status ?? '' });
const has = (values: Partial<Values>, key: keyof Values) => Object.prototype.hasOwnProperty.call(values, key);
const primaryFilters = (values: Partial<Values>): Partial<RoutesFilters> => ({ ...(has(values, 'route_number') && { route_number: values.route_number?.trim().replace(/^#/, '') || undefined }), ...(has(values, 'route_name') && { route_name: values.route_name?.trim() || undefined }), ...(has(values, 'from') && { from: values.from?.format('YYYY-MM-DD') }), ...(has(values, 'to') && { to: values.to?.format('YYYY-MM-DD') }) });
const advancedFilters = (values: Partial<Values>): Partial<RoutesFilters> => ({ driver_id: values.driver_id || undefined, status: values.status as RouteStatus || undefined });

export const RouteFilters = ({ filters, drivers, driversLoading, onChange, onReset }: { filters: RoutesFilters; drivers: RouteDriver[]; driversLoading: boolean; onChange: (filters: RoutesFilters) => void; onReset: () => void }) => {
    const { token } = theme.useToken(); const [primaryForm] = Form.useForm<Values>(); const [advancedForm] = Form.useForm<Values>(); const [open, setOpen] = useState(false);
    const debouncedPrimary = useMemo(() => debounce((values: Partial<Values>) => onChange({ ...filters, ...primaryFilters(values) }), 300), [filters, onChange]);
    useEffect(() => () => debouncedPrimary.cancel(), [debouncedPrimary]);
    useEffect(() => primaryForm.setFieldsValue(valuesFor(filters)), [filters, primaryForm]);
    useEffect(() => { if (open) advancedForm.setFieldsValue(valuesFor(filters)); }, [advancedForm, filters, open]);
    const driverName = drivers.find((driver) => driver.id === filters.driver_id)?.name ?? filters.driver_id;
    const chips: { key: string; label: string; value: string; clear: Partial<RoutesFilters> }[] = [];
    if (filters.from || filters.to) chips.push({ key: 'date', label: 'Fecha', value: filters.from && filters.to ? `${dayjs(filters.from).format('DD/MM/YYYY')} – ${dayjs(filters.to).format('DD/MM/YYYY')}` : filters.from ? `Desde ${dayjs(filters.from).format('DD/MM/YYYY')}` : `Hasta ${dayjs(filters.to).format('DD/MM/YYYY')}`, clear: { from: undefined, to: undefined } });
    if (filters.driver_id) chips.push({ key: 'driver_id', label: 'Conductor', value: driverName ?? '', clear: { driver_id: undefined } });
    if (filters.status) chips.push({ key: 'status', label: 'Estado', value: statuses.find((item) => item.value === filters.status)?.label ?? filters.status, clear: { status: undefined } });
    const applyAdvanced = () => { debouncedPrimary.cancel(); onChange({ ...filters, ...advancedFilters(advancedForm.getFieldsValue()) }); setOpen(false); };
    return <section className="routeFilters" aria-label="Filtros de rutas">
        <Form form={primaryForm} layout="vertical" className="routeFiltersPrimary" onValuesChange={(changed) => debouncedPrimary(changed)}><Form.Item name="route_number" label="Número de ruta"><Input allowClear placeholder="#A1B2C3D4" /></Form.Item><Form.Item name="route_name" label="Nombre de ruta"><Input allowClear placeholder="Godoy Cruz - Las Heras" /></Form.Item><Form.Item name="from" label="Fecha desde"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item><Form.Item name="to" label="Fecha hasta"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></Form>
        <div className="routeFiltersActions"><Button variant="default" label={`Más filtros (${advancedFilterKeys.length})`} icon={<Filter size={16} />} aria-expanded={open} action={() => setOpen(true)} /><Button variant="default" label="Limpiar" disabled={!Object.values(filters).some(Boolean)} action={() => { debouncedPrimary.cancel(); primaryForm.resetFields(); onReset(); }} /></div>
        <Drawer open={open} onClose={() => setOpen(false)} title="Más filtros" width={450} footer={<div className="flex justify-between gap-3"><Button variant="default" label="Limpiar" action={() => advancedForm.resetFields()} /><Button variant="primary" label="Aplicar filtros" action={applyAdvanced} /></div>}><Form form={advancedForm} layout="vertical"><Form.Item name="driver_id" label="Conductor"><Select allowClear loading={driversLoading} options={drivers.map((driver) => ({ value: driver.id, label: driver.name }))} /></Form.Item><Form.Item name="status" label="Estado"><Select allowClear options={statuses} /></Form.Item></Form></Drawer>
        {chips.length > 0 && <div className="routeFiltersChips" aria-label="Filtros aplicados">{chips.map((chip) => <Tag key={chip.key} closable onClose={() => onChange({ ...filters, ...chip.clear })} className="routeFiltersChip !m-0 !flex !h-7 !max-w-full !items-center !rounded-full !px-2 !text-sm" style={{ background: token.colorPrimary, borderColor: token.colorPrimary, color: token.colorTextLightSolid, '--route-filter-chip-close-bg': token.colorTextLightSolid, '--route-filter-chip-close-color': token.colorPrimary, '--route-filter-chip-close-hover': token.colorPrimaryBg, '--route-filter-chip-close-focus': token.colorTextLightSolid } as React.CSSProperties}><span>{chip.label}</span><span className="mx-1">·</span><span className="truncate">{chip.value}</span></Tag>)}</div>}
    </section>;
};
