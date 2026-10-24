import { useCallback, useEffect, useRef, useState } from 'react';
import { Breadcrumb, Collapse, Empty, Grid, Popconfirm, Spin, Table, Tag, message } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { formatCurrencyWithCents, formatDate } from '@/utils/formatters';
import { compareDecimalStrings, formatQuantityForDisplay } from '@/utils/quantity';
import {
    PurchasesService,
    purchaseStatusLabel,
    purchaseTypeLabel,
    type PurchaseDetail,
    type PurchaseItem,
    type PurchaseReceipt,
    type PurchaseStatus,
} from '@/features/store/purchases/purchases.service';
import { PurchaseDocumentsSection } from './PurchaseDocumentsSection';

const statusColor: Record<PurchaseStatus, string> = {
    draft: 'default',
    ordered: 'blue',
    partially_received: 'orange',
    received: 'green',
    closed: 'purple',
    cancelled: 'red',
};

const apiMessage = (error: unknown, fallback: string) => {
    const response = error as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
    };
    return (
        Object.values(response.response?.data?.errors ?? {})[0]?.[0] ||
        response.response?.data?.message ||
        fallback
    );
};

export const PurchaseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const closingRef = useRef(false);
    const screens = Grid.useBreakpoint();
    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            setPurchase(await PurchasesService.getById(id));
        } catch {
            message.error('No se pudo cargar la compra.');
            navigate('/tienda/compras');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);
    useEffect(() => {
        void load();
    }, [load]);
    if (loading || !purchase)
        return (
            <div className="flex justify-center py-20" data-testid="purchase-page-loading">
                <Spin size="large" />
            </div>
        );
    const canOrder = purchase.purchase_type === 'order' && purchase.status === 'draft';
    const canCancel = purchase.status === 'draft' || purchase.status === 'ordered';
    const canEdit = purchase.status === 'draft';
    const canReceive =
        (purchase.purchase_type === 'order' &&
            ['ordered', 'partially_received'].includes(purchase.status)) ||
        (purchase.purchase_type === 'direct' &&
            ['draft', 'partially_received'].includes(purchase.status));
    const canClose = purchase.status === 'partially_received';
    const pendingItemCount = purchase.items.filter(
        (item) => compareDecimalStrings(item.quantity_pending, '0.0000') > 0
    ).length;
    const receipts = [...(purchase.receipts ?? [])].sort((left, right) =>
        (right.received_at ?? '').localeCompare(left.received_at ?? '')
    );
    const isMobile = !screens.md;
    const closeDescription = (
        <div className="max-w-full whitespace-normal text-sm leading-6">
            <p className="m-0">
                Quedan cantidades pendientes de recibir. Al cerrar la compra, esas cantidades se
                conservarán como pendientes históricos y ya no podrán registrarse nuevas recepciones
                para esta orden.
            </p>
            {pendingItemCount > 0 && (
                <p className="mb-0 mt-3">
                    Hay {pendingItemCount} {pendingItemCount === 1 ? 'producto' : 'productos'} con
                    cantidades pendientes.
                </p>
            )}
        </div>
    );
    const order = async () => {
        setSaving(true);
        try {
            setPurchase(await PurchasesService.order(purchase.id));
            message.success('Orden de compra emitida correctamente.');
        } catch {
            message.error('No se pudo emitir la orden de compra.');
        } finally {
            setSaving(false);
        }
    };
    const cancel = async () => {
        setSaving(true);
        try {
            setPurchase(await PurchasesService.cancel(purchase.id));
            message.success('Compra cancelada correctamente.');
        } catch {
            message.error('No se pudo cancelar la compra.');
        } finally {
            setSaving(false);
        }
    };
    const close = async () => {
        if (closingRef.current) return;
        closingRef.current = true;
        setSaving(true);
        try {
            setPurchase(await PurchasesService.close(purchase.id));
            message.success('Compra cerrada correctamente.');
        } catch (error) {
            message.error(
                apiMessage(
                    error,
                    'No se pudo cerrar la compra. Actualizá el detalle e intentá nuevamente.'
                )
            );
        } finally {
            closingRef.current = false;
            setSaving(false);
        }
    };
    return (
        <div className="w-full">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Breadcrumb
                        className="mb-2"
                        items={[
                            { title: <Link to="/tienda/dashboard">Tienda</Link> },
                            { title: <Link to="/tienda/compras">Compras</Link> },
                            { title: purchase.purchase_number },
                        ]}
                    />
                    <h1 className="m-0 text-2xl font-bold text-centra-primary">
                        {purchase.purchase_number}
                    </h1>
                    <p className="m-0 mt-1 text-sm text-centra-text/60">
                        {purchaseTypeLabel(purchase.purchase_type)} ·{' '}
                        {purchaseStatusLabel(purchase.status)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <CanDo permission="purchases.receive">
                        {canReceive && (
                            <Button
                                label="Registrar recepción"
                                action={() => navigate(`/tienda/compras/${purchase.id}/recibir`)}
                            />
                        )}
                    </CanDo>
                    <CanDo permission="purchases.close">
                        {canClose && (
                            <Popconfirm
                                title="¿Cerrar esta compra?"
                                description={closeDescription}
                                placement="bottomRight"
                                styles={{
                                    root: {
                                        width: 'min(520px, calc(100vw - 32px))',
                                        maxWidth: 'calc(100vw - 32px)',
                                    },
                                    content: { whiteSpace: 'normal' },
                                }}
                                okText="Cerrar compra"
                                cancelText="Volver"
                                onConfirm={() => void close()}
                                okButtonProps={{ loading: saving }}
                            >
                                <Button
                                    variant="warning"
                                    label="Cerrar compra"
                                    loading={saving}
                                    disabled={saving}
                                />
                            </Popconfirm>
                        )}
                    </CanDo>
                    <CanDo permission="purchases.edit">
                        {canEdit && (
                            <Button
                                variant="default"
                                label="Editar"
                                action={() => navigate(`/tienda/compras/${purchase.id}/editar`)}
                            />
                        )}
                        {canOrder && (
                            <Popconfirm
                                title="¿Emitir esta orden de compra?"
                                description="Una vez emitida, ya no podrás modificar proveedor, productos, cantidades ni precios."
                                okText="Emitir orden"
                                cancelText="Cancelar"
                                onConfirm={() => void order()}
                            >
                                <Button label="Emitir orden" loading={saving} />
                            </Popconfirm>
                        )}
                    </CanDo>
                    <CanDo permission="purchases.cancel">
                        {canCancel && (
                            <Popconfirm
                                title="¿Cancelar esta compra?"
                                description="La compra quedará registrada como cancelada y no podrá continuar."
                                okText="Cancelar compra"
                                cancelText="Volver"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => void cancel()}
                            >
                                <Button variant="danger" label="Cancelar compra" loading={saving} />
                            </Popconfirm>
                        )}
                    </CanDo>
                </div>
            </div>
            <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                    <span className="text-sm text-gray-500">Proveedor</span>
                    <p className="m-0 font-medium">{purchase.supplier.business_name}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Tipo</span>
                    <p className="m-0 font-medium">{purchaseTypeLabel(purchase.purchase_type)}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Estado</span>
                    <p className="m-0">
                        <Tag color={statusColor[purchase.status]}>
                            {purchaseStatusLabel(purchase.status)}
                        </Tag>
                    </p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Fecha</span>
                    <p className="m-0 font-medium">{formatDate(purchase.created_at)}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Total</span>
                    <p className="m-0 font-semibold">
                        {formatCurrencyWithCents(Number(purchase.total))}
                    </p>
                </div>
                {purchase.notes && (
                    <div className="sm:col-span-2 lg:col-span-5">
                        <span className="text-sm text-gray-500">Notas</span>
                        <p className="m-0">{purchase.notes}</p>
                    </div>
                )}
            </div>
            {isMobile ? (
                <div className="space-y-4" data-testid="purchase-detail-mobile-items">
                    {purchase.items.map((item: PurchaseItem) => (
                        <article
                            key={item.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <h2 className="m-0 break-words text-base font-semibold text-gray-900">
                                {item.product_name}
                            </h2>
                            <p className="mb-0 mt-1 text-sm text-gray-500">{item.product_sku}</p>
                            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div>
                                    <dt className="text-gray-500">Código proveedor</dt>
                                    <dd className="m-0 mt-1 font-medium">
                                        {item.supplier_code || '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Unidad</dt>
                                    <dd className="m-0 mt-1 font-medium">
                                        {item.measurement_unit_symbol}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Comprado</dt>
                                    <dd className="m-0 mt-1 font-medium">
                                        {formatQuantityForDisplay(item.quantity_ordered)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Recibido</dt>
                                    <dd className="m-0 mt-1 font-medium">
                                        {formatQuantityForDisplay(item.quantity_received)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Pendiente</dt>
                                    <dd className="m-0 mt-1 font-medium">
                                        {formatQuantityForDisplay(item.quantity_pending)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Precio unitario</dt>
                                    <dd className="m-0 mt-1 font-medium">
                                        {formatCurrencyWithCents(Number(item.unit_price))}
                                    </dd>
                                </div>
                            </dl>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                                <span className="text-sm text-gray-500">Subtotal</span>
                                <strong>{formatCurrencyWithCents(Number(item.subtotal))}</strong>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <Table
                    rowKey="id"
                    dataSource={purchase.items}
                    scroll={{ x: 'max-content' }}
                    pagination={false}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={8}>
                                <strong>Total de la compra</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={8}>
                                <strong>{formatCurrencyWithCents(Number(purchase.total))}</strong>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                    columns={[
                        { title: 'Producto', dataIndex: 'product_name' },
                        { title: 'Código', dataIndex: 'product_sku' },
                        {
                            title: 'Código proveedor',
                            render: (_, item: PurchaseItem) => item.supplier_code || '—',
                        },
                        {
                            title: 'Comprado',
                            render: (_, item: PurchaseItem) =>
                                formatQuantityForDisplay(item.quantity_ordered),
                        },
                        {
                            title: 'Recibido',
                            render: (_, item: PurchaseItem) =>
                                formatQuantityForDisplay(item.quantity_received),
                        },
                        {
                            title: 'Pendiente',
                            render: (_, item: PurchaseItem) =>
                                formatQuantityForDisplay(item.quantity_pending),
                        },
                        { title: 'Unidad', dataIndex: 'measurement_unit_symbol' },
                        {
                            title: 'Precio unitario',
                            render: (_, item: PurchaseItem) =>
                                formatCurrencyWithCents(Number(item.unit_price)),
                        },
                        {
                            title: 'Subtotal',
                            render: (_, item: PurchaseItem) =>
                                formatCurrencyWithCents(Number(item.subtotal)),
                        },
                    ]}
                />
            )}
            <PurchaseDocumentsSection
                purchaseId={purchase.id}
                status={purchase.status}
                initialDocuments={purchase.documents}
            />
            <section className="mt-8">
                <h2 className="mb-3 text-xl font-semibold text-centra-primary">Recepciones</h2>
                {!receipts.length ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No hay recepciones registradas."
                    />
                ) : (
                    <Collapse
                        items={receipts.map((receipt: PurchaseReceipt) => ({
                            key: receipt.id,
                            label: (
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <strong>{receipt.receipt_number}</strong>
                                    <span>
                                        {receipt.received_at
                                            ? formatDate(receipt.received_at)
                                            : '—'}
                                    </span>
                                    <span>{receipt.created_by?.name ?? '—'}</span>
                                </div>
                            ),
                            children: (
                                <div>
                                    {receipt.notes && (
                                        <p className="mb-3 text-sm text-gray-600">
                                            {receipt.notes}
                                        </p>
                                    )}
                                    <Table
                                        rowKey="id"
                                        size="small"
                                        pagination={false}
                                        scroll={{ x: 'max-content' }}
                                        dataSource={receipt.items}
                                        columns={[
                                            { title: 'Producto', dataIndex: 'product_name' },
                                            { title: 'Código', dataIndex: 'product_sku' },
                                            {
                                                title: 'Cantidad recibida',
                                                render: (_, item) =>
                                                    formatQuantityForDisplay(
                                                        item.quantity_received
                                                    ),
                                            },
                                            {
                                                title: 'Unidad',
                                                dataIndex: 'measurement_unit_symbol',
                                            },
                                        ]}
                                    />
                                </div>
                            ),
                        }))}
                    />
                )}
            </section>
        </div>
    );
};
