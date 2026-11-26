import { useMemo, useState, type ReactNode } from 'react';
import {
    Alert,
    Card,
    DatePicker,
    Descriptions,
    Empty,
    Form,
    Input,
    Modal,
    Pagination,
    Select,
    Space,
    Tag,
    Timeline,
    Typography,
    message,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Drawer from '@/components/Drawer/Drawer';
import Button from '@/components/Button/Button';
import Table from '@/components/Table/Table';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate, formatDateShort } from '@/utils/formatters';
import { FinancialIncidentsService } from '@/features/store/financial-incidents/services/financial-incidents.service';
import {
    financialIncidentKeys,
    useFinancialIncidents,
} from '@/features/store/financial-incidents/hooks/useFinancialIncidents';
import type {
    FinancialIncident,
    FinancialIncidentFilters,
    FinancialIncidentStatus,
} from '@/features/store/financial-incidents/interfaces/financial-incident.interface';

const statusLabel: Record<FinancialIncidentStatus, string> = {
    detected: 'Pendiente',
    in_review: 'En revisión',
    resolved: 'Resuelta',
    dismissed: 'Descartada',
};
const statusColor: Record<FinancialIncidentStatus, string> = {
    detected: 'gold',
    in_review: 'blue',
    resolved: 'green',
    dismissed: 'default',
};
const resolutionLabel: Record<string, string> = {
    justified_difference: 'Diferencia justificada',
    regularized: 'Regularizada',
    confirmed_loss: 'Pérdida confirmada',
    other: 'Otro',
};
const historyActionLabel: Record<string, string> = {
    review_started: 'Revisión iniciada',
    assigned: 'Responsable asignado',
    commented: 'Comentario registrado',
    resolved: 'Incidencia resuelta',
    dismissed: 'Incidencia descartada',
};
const typeLabel = (type: FinancialIncident['source_type']) =>
    type === 'cash_difference' ? 'Faltante de caja' : 'Cobranza rechazada';
const formatMoney = (value: string) => {
    const negative = value.startsWith('-');
    const [integer = '0', decimal = '00'] = value.replace(/^-/, '').split('.');
    const grouped = integer.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${negative ? '-' : ''}$ ${grouped || '0'},${decimal.padEnd(2, '0').slice(0, 2)}`;
};
const reference = (item: FinancialIncident) =>
    item.source_type === 'cash_difference'
        ? `Caja ${item.reference.cash_session_id.slice(0, 8).toUpperCase()}`
        : `Pedido ${(item.source_summary.operation_number as string | undefined) ?? '—'}`;
const Status = ({ status }: { status: FinancialIncidentStatus }) => (
    <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>
);
const EvidenceField = ({
    label,
    children,
    amount = false,
}: {
    label: string;
    children: ReactNode;
    amount?: boolean;
}) => (
    <div className="min-w-0">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div
            className={`mt-1 text-sm text-gray-900 ${amount ? 'whitespace-nowrap tabular-nums' : 'break-words'}`}
        >
            {children}
        </div>
    </div>
);

export const FinancialIncidentsPage = () => {
    const { can } = usePermissions();
    const [filters, setFilters] = useState<FinancialIncidentFilters>({ page: 1, per_page: 20 });
    const [selected, setSelected] = useState<FinancialIncident | null>(null);
    const { list, counters } = useFinancialIncidents(filters);
    const incidents = list.data?.items ?? [];
    const update = (changes: Partial<FinancialIncidentFilters>) =>
        setFilters((current) => ({ ...current, ...changes, page: changes.page ?? 1 }));
    const hasFilters = useMemo(
        () =>
            Object.entries(filters).some(
                ([key, value]) => !['page', 'per_page'].includes(key) && Boolean(value)
            ),
        [filters]
    );
    const resetFilters = () => setFilters({ page: 1, per_page: 20 });
    const emptyDescription = hasFilters
        ? 'No hay incidencias para los filtros seleccionados.'
        : 'No hay incidencias financieras registradas.';
    const columns = useMemo(
        () => [
            {
                title: 'Fecha',
                key: 'occurred_at',
                render: (_: unknown, row?: Record<string, unknown>) =>
                    formatDate((row as unknown as FinancialIncident).occurred_at),
                responsive: ['md'] as 'md'[],
            },
            {
                title: 'Tipo',
                key: 'type',
                render: (_: unknown, row?: Record<string, unknown>) =>
                    typeLabel((row as unknown as FinancialIncident).source_type),
            },
            {
                title: 'Referencia',
                key: 'reference',
                render: (_: unknown, row?: Record<string, unknown>) =>
                    reference(row as unknown as FinancialIncident),
            },
            {
                title: 'Importe',
                key: 'amount',
                align: 'right' as const,
                render: (_: unknown, row?: Record<string, unknown>) =>
                    formatMoney((row as unknown as FinancialIncident).amount),
                responsive: ['md'] as 'md'[],
            },
            {
                title: 'Responsable',
                key: 'assigned_to',
                render: (_: unknown, row?: Record<string, unknown>) =>
                    (row as unknown as FinancialIncident).assigned_to?.name ?? 'Sin asignar',
                responsive: ['lg'] as 'lg'[],
            },
            {
                title: 'Estado',
                key: 'status',
                render: (_: unknown, row?: Record<string, unknown>) => (
                    <Status status={(row as unknown as FinancialIncident).status} />
                ),
            },
            {
                title: 'Acción',
                key: 'action',
                render: (_: unknown, row?: Record<string, unknown>) => (
                    <Button
                        variant="link"
                        icon={<EyeOutlined aria-hidden />}
                        label="Ver detalle"
                        action={() => setSelected(row as unknown as FinancialIncident)}
                    />
                ),
            },
        ],
        []
    );

    return (
        <main className="space-y-5">
            <div>
                <Typography.Title level={2}>Incidencias financieras</Typography.Title>
                <Typography.Paragraph type="secondary">
                    Consultá y gestioná faltantes de caja y cobranzas rechazadas.
                </Typography.Paragraph>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(
                    ['detected', 'in_review', 'resolved', 'dismissed'] as FinancialIncidentStatus[]
                ).map((status) => (
                    <div key={status} className="rounded border bg-white p-3">
                        <div className="text-sm text-gray-500">{statusLabel[status]}</div>
                        <strong className="text-2xl">{counters.data?.[status] ?? 0}</strong>
                    </div>
                ))}
            </div>
            <section aria-label="Filtros de incidencias" className="space-y-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-700">
                        Fecha desde
                        <DatePicker
                            value={
                                filters.date_from ? dayjs(filters.date_from, 'YYYY-MM-DD') : null
                            }
                            format="DD/MM/YYYY"
                            placeholder="Seleccionar fecha"
                            className="w-full"
                            disabledDate={(date) =>
                                Boolean(
                                    filters.date_to &&
                                    date.isAfter(dayjs(filters.date_to, 'YYYY-MM-DD'), 'day')
                                )
                            }
                            onChange={(_, value) =>
                                update({
                                    date_from:
                                        typeof value === 'string' && value
                                            ? dayjs(value, 'DD/MM/YYYY').format('YYYY-MM-DD')
                                            : undefined,
                                })
                            }
                        />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-700">
                        Fecha hasta
                        <DatePicker
                            value={filters.date_to ? dayjs(filters.date_to, 'YYYY-MM-DD') : null}
                            format="DD/MM/YYYY"
                            placeholder="Seleccionar fecha"
                            className="w-full"
                            disabledDate={(date) =>
                                Boolean(
                                    filters.date_from &&
                                    date.isBefore(dayjs(filters.date_from, 'YYYY-MM-DD'), 'day')
                                )
                            }
                            onChange={(_, value) =>
                                update({
                                    date_to:
                                        typeof value === 'string' && value
                                            ? dayjs(value, 'DD/MM/YYYY').format('YYYY-MM-DD')
                                            : undefined,
                                })
                            }
                        />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-700">
                        Tipo
                        <Select
                            aria-label="Tipo"
                            value={filters.source_type}
                            placeholder="Todos"
                            allowClear
                            className="w-full"
                            onChange={(value) => update({ source_type: value })}
                            options={[
                                { value: 'cash_difference', label: 'Faltante de caja' },
                                { value: 'route_collection_rejected', label: 'Cobranza rechazada' },
                            ]}
                        />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-gray-700">
                        Estado
                        <Select
                            aria-label="Estado"
                            value={filters.status}
                            placeholder="Todos"
                            allowClear
                            className="w-full"
                            onChange={(value) => update({ status: value })}
                            options={Object.entries(statusLabel).map(([value, label]) => ({
                                value,
                                label,
                            }))}
                        />
                    </label>
                    <div className="flex items-end">
                        <Button
                            variant="default"
                            label="Limpiar"
                            disabled={!hasFilters}
                            action={resetFilters}
                        />
                    </div>
                </div>
                {hasFilters && (
                    <div className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
                        {filters.date_from && (
                            <Tag closable onClose={() => update({ date_from: undefined })}>
                                Fecha desde · {dayjs(filters.date_from).format('DD/MM/YYYY')}
                            </Tag>
                        )}
                        {filters.date_to && (
                            <Tag closable onClose={() => update({ date_to: undefined })}>
                                Fecha hasta · {dayjs(filters.date_to).format('DD/MM/YYYY')}
                            </Tag>
                        )}
                        {filters.source_type && (
                            <Tag closable onClose={() => update({ source_type: undefined })}>
                                Tipo · {typeLabel(filters.source_type)}
                            </Tag>
                        )}
                        {filters.status && (
                            <Tag closable onClose={() => update({ status: undefined })}>
                                Estado · {statusLabel[filters.status]}
                            </Tag>
                        )}
                    </div>
                )}
            </section>
            {list.isError ? (
                <Alert type="error" showIcon message="No se pudieron cargar las incidencias." />
            ) : (
                <>
                    <div className="hidden md:block">
                        <Table
                            loading={list.isLoading}
                            columns={columns}
                            dataSource={incidents.map((item) => ({
                                ...item,
                                id: `${item.source_type}:${item.source_id}`,
                            }))}
                            scroll={{ x: 'max-content' }}
                            pagination={{
                                current: list.data?.current_page,
                                pageSize: list.data?.per_page,
                                total: list.data?.total,
                                onChange: (page) => update({ page }),
                            }}
                            emptyText={<Empty description={emptyDescription} />}
                        />
                    </div>
                    <div className="space-y-3 md:hidden">
                        {list.isLoading ? (
                            <Typography.Text type="secondary">
                                Cargando incidencias…
                            </Typography.Text>
                        ) : incidents.length ? (
                            <>
                                {incidents.map((item) => (
                                    <button
                                        type="button"
                                        key={`${item.source_type}:${item.source_id}`}
                                        className="w-full rounded border bg-white p-4 text-left"
                                        onClick={() => setSelected(item)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <strong>{typeLabel(item.source_type)}</strong>
                                            <Status status={item.status} />
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            {reference(item)}
                                        </div>
                                        <div className="mt-3 flex justify-between gap-3">
                                            <span>{formatDate(item.occurred_at)}</span>
                                            <strong>{formatMoney(item.amount)}</strong>
                                        </div>
                                    </button>
                                ))}
                                <Pagination
                                    current={list.data?.current_page}
                                    pageSize={list.data?.per_page}
                                    total={list.data?.total}
                                    size="small"
                                    showSizeChanger={false}
                                    onChange={(page) => update({ page })}
                                />
                            </>
                        ) : (
                            <Empty description={emptyDescription} />
                        )}
                    </div>
                </>
            )}
            <IncidentDrawer
                incident={selected}
                open={selected !== null}
                onClose={() => setSelected(null)}
                canManage={can('financial_incidents.manage')}
            />
        </main>
    );
};

const IncidentDrawer = ({
    incident,
    open,
    onClose,
    canManage,
}: {
    incident: FinancialIncident | null;
    open: boolean;
    onClose: () => void;
    canManage: boolean;
}) => {
    const client = useQueryClient();
    const [comment, setComment] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | undefined>();
    const [modal, setModal] = useState<'resolve' | 'dismiss' | null>(null);
    const [form] = Form.useForm();
    const type = incident?.source_type;
    const sourceId = incident?.source_id;
    const detail = useQuery({
        queryKey: financialIncidentKeys.detail(type ?? '', sourceId ?? ''),
        queryFn: () => FinancialIncidentsService.detail(type!, sourceId!),
        enabled: open && !!type && !!sourceId,
    });
    const history = useQuery({
        queryKey: financialIncidentKeys.history(type ?? '', sourceId ?? ''),
        queryFn: () => FinancialIncidentsService.history(type!, sourceId!),
        enabled: open && !!type && !!sourceId,
    });
    const assignees = useQuery({
        queryKey: financialIncidentKeys.assignees(),
        queryFn: FinancialIncidentsService.assignees,
        enabled: open && canManage && !!type && !!sourceId,
    });
    const action = useMutation({
        mutationFn: (payload: {
            kind: 'start' | 'assign' | 'comment' | 'resolve' | 'dismiss';
            note?: string;
            resolution?: string;
        }) => {
            if (payload.kind === 'start')
                return FinancialIncidentsService.startReview(type!, sourceId!);
            if (payload.kind === 'assign')
                return FinancialIncidentsService.assign(type!, sourceId!, payload.note!);
            if (payload.kind === 'comment')
                return FinancialIncidentsService.comment(type!, sourceId!, payload.note!);
            if (payload.kind === 'resolve')
                return FinancialIncidentsService.resolve(
                    type!,
                    sourceId!,
                    payload.resolution!,
                    payload.note!
                );
            return FinancialIncidentsService.dismiss(type!, sourceId!, payload.note!);
        },
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: financialIncidentKeys.all });
            setComment('');
            setAssigneeId(undefined);
            setModal(null);
            form.resetFields();
            message.success('Seguimiento actualizado.');
        },
        onError: () =>
            message.error(
                'No se pudo actualizar la incidencia. Verificá los datos e intentá nuevamente.'
            ),
    });
    const current = detail.data ?? incident;
    const summary = current?.source_summary ?? {};
    const terminal = current?.status === 'resolved' || current?.status === 'dismissed';
    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Detalle de incidencia"
            width={880}
            loading={detail.isLoading}
            destroyOnClose
        >
            {detail.isError ? (
                <Alert type="error" message="La incidencia no está disponible o no tenés acceso." />
            ) : (
                current && (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.85fr)]">
                        <div className="space-y-6">
                            <Card size="small" className="!border-gray-200">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <Typography.Title level={4} className="!mb-1">
                                            {typeLabel(current.source_type)}
                                        </Typography.Title>
                                        <Typography.Text type="secondary">
                                            {reference(current)} · {formatDate(current.occurred_at)}
                                        </Typography.Text>
                                    </div>
                                    <Status status={current.status} />
                                </div>
                                <div className="mt-4 flex items-end justify-between gap-4 border-t border-gray-100 pt-3">
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            {current.source_type === 'cash_difference'
                                                ? 'Faltante'
                                                : 'Importe declarado'}
                                        </div>
                                        <strong className="text-xl">
                                            {formatMoney(current.amount)}
                                        </strong>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div className="text-gray-500">Responsable</div>
                                        <div>{current.assigned_to?.name ?? 'Sin asignar'}</div>
                                    </div>
                                </div>
                            </Card>
                            <section>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <Typography.Title level={5} className="!mb-0">
                                        {current.source_type === 'cash_difference'
                                            ? 'Información del arqueo'
                                            : 'Información de la cobranza'}
                                    </Typography.Title>
                                    <Typography.Text type="secondary" className="text-xs">
                                        Original · solo lectura
                                    </Typography.Text>
                                </div>
                                {current.source_type === 'cash_difference' ? (
                                    <div className="rounded border border-gray-200 bg-gray-50 p-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <EvidenceField label="Jornada">
                                                {summary.business_date
                                                    ? formatDateShort(
                                                          summary.business_date as string
                                                      )
                                                    : '—'}
                                            </EvidenceField>
                                            <EvidenceField label="Cajero">
                                                {(summary.cashier as { name?: string } | undefined)
                                                    ?.name ?? '—'}
                                            </EvidenceField>
                                            <EvidenceField label="Arqueador">
                                                {(
                                                    summary.closed_by as
                                                        | { name?: string }
                                                        | undefined
                                                )?.name ?? '—'}
                                            </EvidenceField>
                                        </div>
                                        <div className="my-4 border-t border-gray-200" />
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <EvidenceField label="Efectivo esperado" amount>
                                                {formatMoney(
                                                    (summary.expected_amount as string) ?? '0.00'
                                                )}
                                            </EvidenceField>
                                            <EvidenceField label="Efectivo real" amount>
                                                {formatMoney(
                                                    (summary.real_amount as string) ?? '0.00'
                                                )}
                                            </EvidenceField>
                                            <EvidenceField label="Faltante" amount>
                                                {current.source_difference
                                                    ? formatMoney(current.source_difference)
                                                    : '—'}
                                            </EvidenceField>
                                        </div>
                                        <div className="my-4 border-t border-gray-200" />
                                        <EvidenceField label="Observación del arqueo">
                                            {(summary.notes as string) ?? '—'}
                                        </EvidenceField>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 rounded border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                                        <EvidenceField label="Pedido">
                                            {(summary.operation_number as string) ?? '—'}
                                        </EvidenceField>
                                        <EvidenceField label="Ruta / parada">
                                            {current.reference.route_stop_id
                                                ? `Parada ${current.reference.route_stop_id}`
                                                : '—'}
                                        </EvidenceField>
                                        <EvidenceField label="Medio de pago">
                                            {(summary.payment_method as string) ?? '—'}
                                        </EvidenceField>
                                        <EvidenceField label="Importe declarado" amount>
                                            {formatMoney(current.amount)}
                                        </EvidenceField>
                                        <EvidenceField label="Conductor declarante">
                                            {(summary.declared_by as { name?: string } | undefined)
                                                ?.name ?? '—'}
                                        </EvidenceField>
                                        <EvidenceField label="Verificador">
                                            {(summary.verified_by as { name?: string } | undefined)
                                                ?.name ?? '—'}
                                        </EvidenceField>
                                        <div className="sm:col-span-2">
                                            <EvidenceField label="Motivo del rechazo">
                                                {(summary.rejection_reason as string) ?? '—'}
                                            </EvidenceField>
                                        </div>
                                    </div>
                                )}
                            </section>
                            {terminal && current.tracking && (
                                <section>
                                    <Typography.Title level={5}>
                                        Cierre administrativo
                                    </Typography.Title>
                                    <Descriptions
                                        column={1}
                                        size="small"
                                        items={[
                                            {
                                                key: 'result',
                                                label:
                                                    current.status === 'resolved'
                                                        ? 'Resultado'
                                                        : 'Motivo de descarte',
                                                children:
                                                    current.status === 'resolved'
                                                        ? (resolutionLabel[
                                                              current.tracking.resolution_type ?? ''
                                                          ] ?? '—')
                                                        : (current.tracking.resolution_note ?? '—'),
                                            },
                                            {
                                                key: 'note',
                                                label: 'Observación',
                                                children:
                                                    current.status === 'resolved'
                                                        ? (current.tracking.resolution_note ?? '—')
                                                        : '—',
                                            },
                                            {
                                                key: 'resolved-by',
                                                label: 'Cerrada por',
                                                children: current.tracking.resolved_by?.name ?? '—',
                                            },
                                            {
                                                key: 'resolved-at',
                                                label: 'Fecha de cierre',
                                                children: formatDate(current.tracking.resolved_at),
                                            },
                                        ]}
                                    />
                                </section>
                            )}
                            {canManage && current.status === 'detected' && (
                                <section className="space-y-3">
                                    <Typography.Title level={5}>
                                        Seguimiento administrativo
                                    </Typography.Title>
                                    <Button
                                        disabled={action.isPending}
                                        label="Iniciar revisión"
                                        action={() => action.mutate({ kind: 'start' })}
                                    />
                                    <Alert
                                        type="info"
                                        showIcon
                                        message="Iniciar una revisión habilita la asignación de responsable, comentarios y el cierre administrativo de la incidencia."
                                    />
                                </section>
                            )}
                            {canManage && current.status === 'in_review' && (
                                <section className="space-y-3">
                                    <Typography.Title level={5}>
                                        Seguimiento administrativo
                                    </Typography.Title>
                                    {assignees.isError ? (
                                        <Alert
                                            type="error"
                                            showIcon
                                            message="No se pudieron cargar los responsables elegibles."
                                        />
                                    ) : assignees.isLoading ? (
                                        <Typography.Text type="secondary">
                                            Cargando responsables…
                                        </Typography.Text>
                                    ) : assignees.data?.length ? (
                                        <div className="space-y-1.5">
                                            <Typography.Text className="text-sm font-medium">
                                                Responsable del seguimiento
                                            </Typography.Text>
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Select
                                                    className="min-w-0 flex-1"
                                                    value={assigneeId ?? current.assigned_to?.id}
                                                    placeholder="Seleccionar responsable"
                                                    onChange={setAssigneeId}
                                                    options={assignees.data.map((user) => ({
                                                        value: user.id,
                                                        label: user.name,
                                                    }))}
                                                />
                                                <Button
                                                    disabled={
                                                        !assigneeId ||
                                                        assigneeId === current.assigned_to?.id ||
                                                        action.isPending
                                                    }
                                                    label={
                                                        current.assigned_to
                                                            ? 'Reasignar'
                                                            : 'Asignar responsable'
                                                    }
                                                    action={() =>
                                                        action.mutate({
                                                            kind: 'assign',
                                                            note: assigneeId,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <Alert
                                            type="info"
                                            showIcon
                                            message="No hay responsables activos elegibles en esta tienda."
                                        />
                                    )}
                                    <div className="space-y-2">
                                        <Typography.Text className="text-sm font-medium">
                                            Nueva observación
                                        </Typography.Text>
                                        <Input.TextArea
                                            value={comment}
                                            onChange={(event) => setComment(event.target.value)}
                                            placeholder="Describí los avances de la investigación..."
                                            rows={3}
                                        />
                                        <Typography.Text type="secondary" className="block text-xs">
                                            Las observaciones quedan registradas en el historial con
                                            usuario y fecha.
                                        </Typography.Text>
                                        <Button
                                            disabled={!comment.trim() || action.isPending}
                                            label="Guardar comentario"
                                            action={() =>
                                                action.mutate({
                                                    kind: 'comment',
                                                    note: comment.trim(),
                                                })
                                            }
                                        />
                                    </div>
                                    <Space wrap>
                                        <Button
                                            disabled={action.isPending}
                                            variant="success"
                                            label="Resolver incidencia"
                                            action={() => setModal('resolve')}
                                        />
                                        <Button
                                            disabled={action.isPending}
                                            variant="danger"
                                            label="Descartar incidencia"
                                            action={() => setModal('dismiss')}
                                        />
                                    </Space>
                                </section>
                            )}
                        </div>
                        <aside className="border-l border-gray-100 pl-0 xl:pl-5">
                            <section>
                                <Typography.Title level={5}>
                                    Historial de seguimiento · solo lectura
                                </Typography.Title>
                                {history.isLoading ? (
                                    <Typography.Text type="secondary">
                                        Cargando historial…
                                    </Typography.Text>
                                ) : history.data?.length ? (
                                    <Timeline
                                        items={history.data.map((event) => ({
                                            children: (
                                                <div className="pb-3">
                                                    <strong>
                                                        {event.action === 'assigned' &&
                                                        event.previous_assigned_to
                                                            ? 'Responsable reasignado'
                                                            : (historyActionLabel[event.action] ??
                                                              'Actualización de seguimiento')}
                                                    </strong>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {event.actor?.name ?? 'Sistema'} ·{' '}
                                                        {formatDate(event.created_at)}
                                                    </div>
                                                    {event.previous_status !== event.new_status && (
                                                        <div className="mt-2 text-sm">
                                                            Estado:{' '}
                                                            {event.previous_status
                                                                ? statusLabel[event.previous_status]
                                                                : '—'}{' '}
                                                            →{' '}
                                                            {event.new_status
                                                                ? statusLabel[event.new_status]
                                                                : '—'}
                                                        </div>
                                                    )}
                                                    {(event.previous_assigned_to ||
                                                        event.new_assigned_to) && (
                                                        <div className="mt-2 text-sm">
                                                            Responsable:{' '}
                                                            {event.previous_assigned_to?.name ??
                                                                'Sin asignar'}{' '}
                                                            →{' '}
                                                            {event.new_assigned_to?.name ??
                                                                'Sin asignar'}
                                                        </div>
                                                    )}
                                                    {event.comment && (
                                                        <div className="mt-2 text-sm text-gray-700">
                                                            {event.comment}
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        }))}
                                    />
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="Todavía no hay acciones de seguimiento."
                                    />
                                )}
                            </section>
                        </aside>
                    </div>
                )
            )}
            <Modal
                open={modal !== null}
                title={modal === 'resolve' ? 'Resolver incidencia' : 'Descartar incidencia'}
                onCancel={() => setModal(null)}
                onOk={() => form.submit()}
                confirmLoading={action.isPending}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) =>
                        action.mutate(
                            modal === 'resolve'
                                ? {
                                      kind: 'resolve',
                                      resolution: values.resolution_type,
                                      note: values.resolution_note,
                                  }
                                : { kind: 'dismiss', note: values.reason }
                        )
                    }
                >
                    {modal === 'resolve' && (
                        <Typography.Paragraph type="secondary">
                            Resolver cierra la investigación administrativa; no modifica los
                            registros económicos originales.
                        </Typography.Paragraph>
                    )}
                    {modal === 'resolve' && (
                        <Form.Item
                            name="resolution_type"
                            label="Resultado"
                            rules={[{ required: true, message: 'Seleccioná un resultado.' }]}
                        >
                            <Select
                                options={[
                                    {
                                        value: 'justified_difference',
                                        label: 'Diferencia justificada',
                                    },
                                    { value: 'regularized', label: 'Regularizada' },
                                    { value: 'confirmed_loss', label: 'Pérdida confirmada' },
                                    { value: 'other', label: 'Otro' },
                                ]}
                            />
                        </Form.Item>
                    )}
                    <Form.Item
                        name={modal === 'resolve' ? 'resolution_note' : 'reason'}
                        label={
                            modal === 'resolve' ? 'Observación de resolución' : 'Motivo de descarte'
                        }
                        rules={[{ required: true, message: 'Este campo es obligatorio.' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </Drawer>
    );
};
