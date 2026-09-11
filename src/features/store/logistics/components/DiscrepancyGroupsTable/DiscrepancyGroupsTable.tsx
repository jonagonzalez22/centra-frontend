import { useMemo, useState } from 'react';
import { Drawer, Empty, Form, Input, Select, Space, Tag, Typography } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import Table from '@/components/Table/Table';
import { DiscrepanciesTable } from '../DiscrepanciesTable';
import type {
    BatchDiscrepancyResolutionType,
    DiscrepancyResolutionType,
    ResolveDiscrepanciesBatchPayload,
    RouteReconciliationDetailItem,
    RouteReconciliationProductGroup,
} from '../../interfaces/reconciliation.interface';

const statusConfig = {
    pending: { label: 'Pendiente', color: 'warning' },
    resolved: { label: 'Resuelto', color: 'success' },
    partial: { label: 'Parcial', color: 'processing' },
    mixed: { label: 'Mixto', color: 'purple' },
};

const batchResolutionOptions: Array<{ value: BatchDiscrepancyResolutionType; label: string }> = [
    { value: 'returned', label: 'Devuelto a depósito' },
    { value: 'rejected_by_customer', label: 'Rechazado por cliente' },
    { value: 'missing', label: 'Faltante / extraviado' },
    { value: 'damaged', label: 'Dañado / merma' },
    { value: 'pending_redelivery', label: 'Pendiente de reenvío' },
];

interface Props {
    groups: RouteReconciliationProductGroup[];
    loading: boolean;
    actionLoading: string | false;
    onResolve: (
        discrepancyId: string,
        resolutionType: DiscrepancyResolutionType,
        quantityToResolve: number,
        notes?: string
    ) => Promise<void>;
    onResolveBatch: (payload: ResolveDiscrepanciesBatchPayload) => Promise<void>;
    readOnly: boolean;
}

export const DiscrepancyGroupsTable = ({
    groups,
    loading,
    actionLoading,
    onResolve,
    onResolveBatch,
    readOnly,
}: Props) => {
    const [detailProductId, setDetailProductId] = useState<string | null>(null);
    const [batchProductId, setBatchProductId] = useState<string | null>(null);
    const [form] = Form.useForm<{ resolution_type: BatchDiscrepancyResolutionType; notes?: string }>();
    const detailGroup = useMemo(
        () => groups.find((group) => group.product_id === detailProductId) ?? null,
        [detailProductId, groups]
    );
    const batchGroup = useMemo(
        () => groups.find((group) => group.product_id === batchProductId) ?? null,
        [batchProductId, groups]
    );

    const openBatchModal = (group: RouteReconciliationProductGroup) => {
        form.resetFields();
        setBatchProductId(group.product_id);
    };

    const submitBatch = async () => {
        const values = await form.validateFields();
        if (!batchGroup) return;

        await onResolveBatch({
            items: batchGroup.items
                .filter((item) => item.difference > 0 && !item.discrepancy?.resolution_type)
                .map((item) => ({
                    route_stop_item_id: item.route_stop_item_id,
                    resolution_type: values.resolution_type,
                    quantity_to_resolve: item.difference,
                    notes: values.notes,
                })),
        });
        setBatchProductId(null);
    };

    const columns = [
        { title: 'Producto', dataIndex: 'product_name', key: 'product_name' },
        {
            title: 'Diferencia',
            dataIndex: 'total_difference',
            key: 'total_difference',
            align: 'center' as const,
            width: 110,
        },
        {
            title: 'Pedidos',
            dataIndex: 'affected_orders_count',
            key: 'affected_orders_count',
            align: 'center' as const,
            width: 90,
        },
        {
            title: 'Estado',
            key: 'status',
            width: 120,
            render: (_: unknown, row?: Record<string, unknown>) => {
                const group = row as unknown as RouteReconciliationProductGroup;
                const status = statusConfig[group.status];
                return <Tag color={status.color}>{status.label}</Tag>;
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 190,
            render: (_: unknown, row?: Record<string, unknown>) => {
                const group = row as unknown as RouteReconciliationProductGroup;
                return (
                    <Space>
                        <Button
                            size="small"
                            variant="default"
                            label="Ver detalle"
                            icon={<EyeOutlined />}
                            aria-label="Ver detalle"
                            action={() => setDetailProductId(group.product_id)}
                        />
                        {!readOnly && group.can_batch_resolve && (
                            <Button
                                size="small"
                                label="Conciliar producto"
                                icon={<CheckOutlined />}
                                aria-label="Conciliar producto"
                                loading={actionLoading === 'resolve-discrepancies-batch'}
                                action={() => openBatchModal(group)}
                            />
                        )}
                    </Space>
                );
            },
        },
    ];

    if (!groups.length && !loading) {
        return <Empty description="No se registraron diferencias de stock en esta ruta." />;
    }

    return (
        <>
            <Table
                columns={columns}
                dataSource={groups.map((group) => ({ ...group, id: group.product_id })) as unknown as Record<string, unknown>[]}
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
            />

            <Drawer
                title={detailGroup?.product_name ?? 'Detalle de discrepancias'}
                open={Boolean(detailGroup)}
                onClose={() => setDetailProductId(null)}
                width="min(1080px, 100vw)"
            >
                {detailGroup && (
                    <>
                        {detailGroup.contains_extra_sale && (
                            <Tag color="blue" className="mb-4">
                                Contiene Venta Extra
                            </Tag>
                        )}
                        <DiscrepanciesTable
                            discrepancies={detailGroup.items as RouteReconciliationDetailItem[]}
                            loading={loading}
                            actionLoading={actionLoading}
                            onResolve={onResolve}
                            readOnly={readOnly}
                        />
                    </>
                )}
            </Drawer>

            <Modal
                open={Boolean(batchGroup)}
                onClose={() => setBatchProductId(null)}
                title={batchGroup ? `Conciliar ${batchGroup.product_name}` : 'Conciliar producto'}
                loading={actionLoading === 'resolve-discrepancies-batch'}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="default"
                            label="Cancelar"
                            action={() => setBatchProductId(null)}
                            disabled={actionLoading === 'resolve-discrepancies-batch'}
                        />
                        <Button
                            label="Aplicar a todos"
                            loading={actionLoading === 'resolve-discrepancies-batch'}
                            action={() => void submitBatch()}
                        />
                    </div>
                }
            >
                {batchGroup && (
                    <>
                        <Typography.Paragraph>
                            Se aplicará la misma resolución a {batchGroup.total_difference} unidades
                            distribuidas en {batchGroup.affected_orders_count} pedidos.
                        </Typography.Paragraph>
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="resolution_type"
                                label="Resolución"
                                rules={[{ required: true, message: 'Seleccione una resolución.' }]}
                            >
                                <Select options={batchResolutionOptions} placeholder="Seleccione una opción" />
                            </Form.Item>
                            <Form.Item name="notes" label="Notas">
                                <Input.TextArea rows={3} maxLength={500} showCount />
                            </Form.Item>
                        </Form>
                    </>
                )}
            </Modal>
        </>
    );
};
