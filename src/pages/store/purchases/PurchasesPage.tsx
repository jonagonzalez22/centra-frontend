import { useCallback, useEffect, useState } from 'react';
import { Breadcrumb, Empty, Input, Select, Table, Tag, message } from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import ActionButton from '@/components/ActionButton/ActionButton';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { formatCurrencyWithCents, formatDate } from '@/utils/formatters';
import { SuppliersService, type Supplier } from '@/features/store/suppliers/suppliers.service';
import {
    PurchasesService,
    purchaseStatusLabel,
    purchaseTypeLabel,
    type PurchaseDocumentsFilter,
    type PurchaseListItem,
    type PurchaseParams,
    type PurchaseStatus,
} from '@/features/store/purchases/purchases.service';

const statusColor: Record<PurchaseStatus, string> = {
    draft: 'default',
    ordered: 'blue',
    partially_received: 'orange',
    received: 'green',
    closed: 'purple',
    cancelled: 'red',
};

const purchaseDetailPath = (purchaseId: string) => `/tienda/compras/${purchaseId}`;

export const PurchasesPage = () => {
    const [result, setResult] = useState<{
        items: PurchaseListItem[];
        total: number;
        current_page: number;
        per_page: number;
    }>({ items: [], total: 0, current_page: 1, per_page: 15 });
    const [filters, setFilters] = useState<PurchaseParams>({ page: 1, per_page: 15 });
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const load = useCallback(async (params: PurchaseParams) => {
        setLoading(true);
        try {
            setResult(await PurchasesService.getAll(params));
        } catch {
            message.error('No se pudieron cargar las compras.');
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void load(filters);
    }, [filters, load]);
    useEffect(() => {
        void SuppliersService.getAll()
            .then(setSuppliers)
            .catch(() => setSuppliers([]));
    }, []);
    const change = (next: Partial<PurchaseParams>) =>
        setFilters((current) => ({ ...current, ...next, page: 1 }));
    const hasActiveFilters = Boolean(
        filters.search || filters.status || filters.purchase_type || filters.supplier_id || filters.documents
    );
    return (
        <div className="w-full">
            <div className="mb-6">
                <Breadcrumb
                    className="mb-2"
                    items={[
                        { title: <Link to="/tienda/dashboard">Tienda</Link> },
                        { title: 'Compras' },
                    ]}
                />
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="m-0 text-2xl font-bold text-centra-primary">Compras</h1>
                        <p className="m-0 mt-1 text-sm text-centra-text/60">
                            Gestiona las compras y órdenes a proveedores de tu tienda
                        </p>
                    </div>
                    <CanDo permission="purchases.create">
                        <Link to="/tienda/compras/nueva">
                            <Button icon={<PlusOutlined />} label="Nueva compra" />
                        </Link>
                    </CanDo>
                </div>
            </div>
            <div className="mb-6">
                <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-centra-text">Búsqueda</span>
                        <Input
                            aria-label="Buscar compras"
                            placeholder="Número o proveedor"
                            allowClear
                            value={filters.search}
                            onChange={(e) => change({ search: e.target.value || undefined })}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-centra-text">Estado</span>
                        <Select
                            aria-label="Estado"
                            className="w-full"
                            placeholder="Todos los estados"
                            allowClear
                            value={filters.status}
                            onChange={(value) => change({ status: value })}
                            options={Object.entries(statusColor).map(([value]) => ({ value, label: purchaseStatusLabel(value as PurchaseStatus) }))}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-centra-text">Tipo</span>
                        <Select
                            aria-label="Tipo"
                            className="w-full"
                            placeholder="Todos los tipos"
                            allowClear
                            value={filters.purchase_type}
                            onChange={(value) => change({ purchase_type: value })}
                            options={[{ value: 'order', label: 'Orden de compra' }, { value: 'direct', label: 'Compra directa' }]}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-centra-text">Proveedor</span>
                        <Select
                            aria-label="Proveedor"
                            className="w-full"
                            placeholder="Todos los proveedores"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={filters.supplier_id}
                            onChange={(value) => change({ supplier_id: value })}
                            options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.business_name }))}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-centra-text">Documentos</span>
                        <Select
                            aria-label="Documentos"
                            className="w-full"
                            value={filters.documents ?? 'all'}
                            onChange={(value: 'all' | PurchaseDocumentsFilter) => change({ documents: value === 'all' ? undefined : value })}
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'with_documents', label: 'Con documentos' },
                                { value: 'without_documents', label: 'Sin documentos' },
                            ]}
                        />
                    </label>
                </div>
                <div className="mt-3 flex items-end gap-2">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={() => setFilters({ page: 1, per_page: 15 })}
                        disabled={!hasActiveFilters}
                    />
                </div>
            </div>
            <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={result.items}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: result.current_page,
                        pageSize: result.per_page,
                        total: result.total,
                        showSizeChanger: true,
                    }}
                    onChange={(pagination) =>
                        setFilters((current) => ({
                            ...current,
                            page: pagination.current,
                            per_page: pagination.pageSize,
                        }))
                    }
                    locale={{
                        emptyText: (
                            <Empty
                                description={
                                    hasActiveFilters
                                        ? 'No encontramos compras con esos filtros.'
                                        : 'No hay compras registradas.'
                                }
                            />
                        ),
                    }}
                    columns={[
                        {
                            title: 'Número',
                            dataIndex: 'purchase_number',
                            render: (purchaseNumber: string, item: PurchaseListItem) => (
                                <Link
                                    to={purchaseDetailPath(item.id)}
                                    className="cursor-pointer text-blue-600 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    {purchaseNumber}
                                </Link>
                            ),
                        },
                        {
                            title: 'Proveedor',
                            render: (_, item: PurchaseListItem) => item.supplier.business_name,
                        },
                        {
                            title: 'Tipo',
                            render: (_, item: PurchaseListItem) =>
                                purchaseTypeLabel(item.purchase_type),
                        },
                        {
                            title: 'Estado',
                            render: (_, item: PurchaseListItem) => (
                                <Tag color={statusColor[item.status]}>
                                    {purchaseStatusLabel(item.status)}
                                </Tag>
                            ),
                        },
                        {
                            title: 'Documentos',
                            render: (_, item: PurchaseListItem) => {
                                if (item.status === 'draft') return '—';
                                const documentsCount = item.documents_count ?? 0;

                                if (documentsCount === 0) return <Tag color="default">Sin documentos</Tag>;

                                return (
                                    <Tag color="blue">
                                        {documentsCount} {documentsCount === 1 ? 'documento' : 'documentos'}
                                    </Tag>
                                );
                            },
                        },
                        {
                            title: 'Total',
                            render: (_, item: PurchaseListItem) =>
                                formatCurrencyWithCents(Number(item.total)),
                        },
                        {
                            title: 'Fecha',
                            render: (_, item: PurchaseListItem) => formatDate(item.created_at),
                        },
                        {
                            title: 'Acciones',
                            render: (_, item: PurchaseListItem) => (
                                <CanDo permission="purchases.view">
                                    <ActionButton
                                        icon={<EyeOutlined />}
                                        label="Ver detalle"
                                        href={purchaseDetailPath(item.id)}
                                    />
                                </CanDo>
                            ),
                        },
                    ]}
            />
        </div>
    );
};
