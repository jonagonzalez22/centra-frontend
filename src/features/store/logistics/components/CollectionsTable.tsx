import { useMemo, useState } from 'react';
import { Button, Drawer, Empty, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import Table from '@/components/Table/Table';
import { RejectCollectionModal } from './RejectCollectionModal';
import type { RouteReconciliationCollection, RouteReconciliationCollectionGroup } from '../interfaces/reconciliation.interface';
import { formatDateShort } from '@/utils/formatters';

const labels = { declared: 'Pendiente', pending: 'Pendiente', verified: 'Verificado', rejected: 'Rechazado', partial: 'Parcial' };
const colors = { declared: 'warning', pending: 'warning', verified: 'success', rejected: 'error', partial: 'blue' };
const money = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

interface Props {
    groups: RouteReconciliationCollectionGroup[];
    loading: boolean;
    actionLoading: string | false;
    onVerify: (id: string) => Promise<void>;
    onVerifyGroup: (methodId: string) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
    readOnly: boolean;
}

export const CollectionsTable = ({ groups, loading, actionLoading, onVerify, onVerifyGroup, onReject, readOnly }: Props) => {
    const [methodId, setMethodId] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const group = useMemo(() => groups.find((item) => item.store_payment_method_id === methodId) ?? null, [groups, methodId]);
    const groupDeclarant = useMemo(() => {
        if (!group) return null;
        const declarants = [...new Set(group.collections.map((item) => item.declared_by?.trim()).filter(Boolean))];
        if (declarants.length === 1) return declarants[0];
        return declarants.length > 1 ? 'Múltiples declarantes' : null;
    }, [group]);
    const groupDate = useMemo(() => {
        if (!group) return null;
        const dates = [...new Set(group.collections.map((item) => formatDateShort(item.declared_at)).filter((date) => date !== '—'))];
        if (dates.length === 1) return dates[0];
        return dates.length > 1 ? 'Múltiples fechas' : null;
    }, [group]);
    const groupColumns = [
        { title: 'Medio de pago', dataIndex: 'payment_method_name', key: 'payment_method_name' },
        { title: 'Cobranzas', dataIndex: 'collection_count', key: 'collection_count', align: 'right' as const },
        { title: 'Total declarado', key: 'total', align: 'right' as const, render: (_: unknown, row?: Record<string, unknown>) => money((row as unknown as RouteReconciliationCollectionGroup).total_amount) },
        { title: 'Pendiente', key: 'pending', align: 'right' as const, render: (_: unknown, row?: Record<string, unknown>) => money((row as unknown as RouteReconciliationCollectionGroup).declared_amount) },
        { title: 'Estado', key: 'status', render: (_: unknown, row?: Record<string, unknown>) => { const item = row as unknown as RouteReconciliationCollectionGroup; return <Tag color={colors[item.status]}>{labels[item.status]}</Tag>; } },
        { title: 'Acciones', key: 'actions', render: (_: unknown, row?: Record<string, unknown>) => {
            const item = row as unknown as RouteReconciliationCollectionGroup;
            return <Space>
                <Button size="small" icon={<EyeOutlined />} aria-label={`Ver detalle de ${item.payment_method_name}`} onClick={() => setMethodId(item.store_payment_method_id)} />
                {!readOnly && item.has_pending_collections && <Popconfirm title={`Verificar cobranzas de ${item.payment_method_name}`} description={`Se verificarán ${item.declared_count} cobranzas pendientes por ${money(item.declared_amount)}.`} okText="Verificar" cancelText="Cancelar" onConfirm={() => onVerifyGroup(item.store_payment_method_id)}>
                    <Button type="primary" size="small" icon={<CheckOutlined />} loading={actionLoading === `group-${item.store_payment_method_id}`} aria-label={`Verificar ${item.payment_method_name}`} />
                </Popconfirm>}
            </Space>;
        } },
    ];
    const detailColumns = [
        { title: 'Pedido', dataIndex: 'order_number', key: 'order_number', width: 82 },
        { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name', width: 126, responsive: ['md'] as ('md')[], render: (value: unknown) => { const text = String(value || '—'); return <Tooltip title={text}><span className="block max-w-[118px] truncate">{text}</span></Tooltip>; } },
        { title: 'Importe', key: 'amount', width: 102, align: 'right' as const, render: (_: unknown, row?: Record<string, unknown>) => money((row as unknown as RouteReconciliationCollection).amount) },
        { title: 'Estado', key: 'status', width: 92, render: (_: unknown, row?: Record<string, unknown>) => { const item = row as unknown as RouteReconciliationCollection; return <Tag color={colors[item.status]}>{labels[item.status]}</Tag>; } },
        { title: 'Referencia', dataIndex: 'reference', key: 'reference', width: 105, render: (value: unknown) => { const text = String(value || '—'); return <Tooltip title={text === '—' ? undefined : text}><span className="block max-w-[96px] truncate">{text}</span></Tooltip>; } },
        { title: 'Fecha', key: 'date', width: 92, render: (_: unknown, row?: Record<string, unknown>) => formatDateShort((row as unknown as RouteReconciliationCollection).declared_at) },
        ...(!readOnly ? [{ title: 'Acciones', key: 'actions', width: 82, render: (_: unknown, row?: Record<string, unknown>) => {
            const item = row as unknown as RouteReconciliationCollection;
            if (item.status !== 'declared') return null;
            return <Space>
                <Popconfirm title="¿Confirmar verificación del cobro?" okText="Verificar" cancelText="Cancelar" onConfirm={() => onVerify(item.id)}><Button size="small" type="primary" icon={<CheckOutlined />} loading={actionLoading === item.id} aria-label="Verificar cobro" /></Popconfirm>
                <Button size="small" danger icon={<CloseOutlined />} loading={actionLoading === item.id} onClick={() => setRejectId(item.id)} aria-label="Rechazar cobro" />
            </Space>;
        } }] : []),
    ];

    if (!groups.length && !loading) return <Empty description="No hay cobranzas declaradas para esta ruta." />;
    return <>
        <Table columns={groupColumns} dataSource={groups.map((item) => ({ ...item, id: item.store_payment_method_id })) as unknown as Record<string, unknown>[]} loading={loading} pagination={false} scroll={{ x: 'max-content' }} size="small" />
        <Drawer title={group?.payment_method_name} open={!!group} onClose={() => setMethodId(null)} width="min(720px, 100vw)">
            {group && <><div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <Typography.Text>Total declarado: {money(group.total_amount)}</Typography.Text><Typography.Text>Verificado: {money(group.verified_amount)}</Typography.Text>
                <Typography.Text>Rechazado: {money(group.rejected_amount)}</Typography.Text><Typography.Text>Pendiente: {money(group.declared_amount)}</Typography.Text>
                {groupDeclarant && <Typography.Text>Declarado por: {groupDeclarant}</Typography.Text>}
                {groupDate && <Typography.Text>Fecha: {groupDate}</Typography.Text>}
            </div><Table columns={detailColumns} dataSource={group.collections as unknown as Record<string, unknown>[]} pagination={false} scroll={{ x: 635 }} size="small" /></>}
        </Drawer>
        <RejectCollectionModal open={!!rejectId} loading={actionLoading === rejectId} onClose={() => setRejectId(null)} onConfirm={async (reason) => { if (!rejectId) return; await onReject(rejectId, reason); setRejectId(null); }} />
    </>;
};
