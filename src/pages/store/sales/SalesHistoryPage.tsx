import { ClearOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import {
    Alert,
    DatePicker,
    Descriptions,
    Dropdown,
    Empty,
    Select,
    Spin,
    Table as AntTable,
    Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import dayjs from 'dayjs';
import Drawer from '@/components/Drawer/Drawer';
import { Button } from '@/components/Button';
import Input from '@/components/Input/Input';
import { CanDo } from '@/components/auth/CanDo';
import Tag from '@/components/Tag/Tag';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrencyWithCents } from '@/utils/formatters';
import { formatQuantityForDisplay } from '@/utils/quantity';
import { CancelSaleModal } from '@/features/store/sales/components/CancelSaleModal';
import { SaleDetailHistory } from '@/features/store/sales/components/SaleDetailHistory';
import { printTicketReceipt } from '@/features/store/sales/documents/ticket-print.service';
import {
    createA4ReceiptPdf,
    printA4PdfBlob,
} from '@/features/store/sales/documents/a4-pdf.service';
import { SalesService } from '@/features/store/sales/services/sales.service';
import type {
    PaginatedSales,
    ReceiptData,
    SaleDetail,
    SaleListItem,
    SalesFilters,
} from '@/features/store/sales/interfaces/sale.interface';
import './SalesHistoryPage.css';

const initialFilters: SalesFilters = {
    page: 1,
    per_page: 15,
    sort_by: 'created_at',
    sort_direction: 'desc',
};

const statusLabel = (status: string) =>
    status === 'confirmed' ? 'Confirmada' : status === 'cancelled' ? 'Cancelada' : status;
const statusColor = (status: string) =>
    status === 'confirmed' ? 'green' : status === 'cancelled' ? 'red' : 'default';
const formatSaleDateTime = (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm');

export const SalesHistoryPage = () => {
    const { can } = usePermissions();
    const [filters, setFilters] = useState<SalesFilters>(initialFilters);
    const [data, setData] = useState<PaginatedSales>({
        items: [],
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detail, setDetail] = useState<SaleDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [printing, setPrinting] = useState(false);
    const [saleToCancel, setSaleToCancel] = useState<SaleListItem | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setData(await SalesService.getHistory(filters));
        } catch {
            setError('No se pudieron cargar las ventas.');
        } finally {
            setLoading(false);
        }
    }, [filters]);
    useEffect(() => {
        void load();
    }, [load]);
    const getReceipt = async (sale: SaleListItem | SaleDetail) =>
        receipt?.operation.id === sale.id
            ? receipt
            : SalesService.getSalesReceipt(sale.id).then((value) => {
                  setReceipt(value);
                  return value;
              });
    const printTicket = async (sale: SaleListItem | SaleDetail) => {
        setPrinting(true);
        try {
            await printTicketReceipt(await getReceipt(sale));
        } catch {
            setError('No se pudo imprimir el ticket.');
        } finally {
            setPrinting(false);
        }
    };
    const printA4 = async (sale: SaleListItem | SaleDetail) => {
        setPrinting(true);
        try {
            const value = await getReceipt(sale);
            await printA4PdfBlob(await createA4ReceiptPdf(value));
        } catch {
            setError('No se pudo generar el comprobante A4.');
        } finally {
            setPrinting(false);
        }
    };
    const openDetail = async (id: string) => {
        setDetail(null);
        setDetailLoading(true);
        try {
            setDetail(await SalesService.getSaleById(id));
        } catch {
            setError('No se pudo cargar el detalle de la venta.');
        } finally {
            setDetailLoading(false);
        }
    };
    const handleSaleCancelled = async (saleId: string) => {
        setReceipt((current) => (current?.operation.id === saleId ? null : current));
        await load();
        if (detail?.id === saleId) await openDetail(saleId);
    };
    const columns: ColumnsType<SaleListItem> = [
        {
            title: 'Venta',
            dataIndex: 'operation_number',
            key: 'operation_number',
            render: (value, sale) => (
                <Button
                    variant="link"
                    label={value}
                    className="sales-history-operation-link h-auto p-0 font-medium"
                    aria-label={`Ver detalle de ${value}`}
                    action={() => void openDetail(sale.id)}
                />
            ),
        },
        {
            title: 'Fecha',
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: true,
            sortDirections: ['ascend', 'descend', 'ascend'],
            sortOrder: filters.sort_direction === 'asc' ? 'ascend' : 'descend',
            render: (v) => formatSaleDateTime(v),
        },
        {
            title: 'Cliente',
            key: 'customer',
            responsive: ['md'],
            render: (_, sale) => sale.customer_display_name ?? sale.customer?.name ?? '—',
        },
        {
            title: 'Cajero',
            key: 'cashier',
            responsive: ['md'],
            render: (_, sale) => sale.created_by?.name ?? '—',
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (v) => formatCurrencyWithCents(v),
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (v) => <Tag color={statusColor(v)}>{statusLabel(v)}</Tag>,
        },
        ...(can('sales_history.print') || can('sales.cancel')
            ? [
                  {
                      title: 'Acciones',
                      key: 'actions',
                      width: 72,
                      align: 'center' as const,
                      render: (_: unknown, sale: SaleListItem) => {
                          const canPrint = can('sales_history.print');
                          const canCancel = can('sales.cancel') && sale.status === 'confirmed';
                          const items: MenuProps['items'] = [
                              ...(canPrint
                                  ? [
                                        {
                                            key: 'ticket',
                                            label: 'Imprimir ticket',
                                            disabled: printing,
                                            onClick: () => void printTicket(sale),
                                        },
                                        {
                                            key: 'a4',
                                            label: 'Imprimir A4',
                                            disabled: printing,
                                            onClick: () => void printA4(sale),
                                        },
                                    ]
                                  : []),
                              ...(canPrint && canCancel ? [{ type: 'divider' as const }] : []),
                              ...(canCancel
                                  ? [
                                        {
                                            key: 'cancel',
                                            label: 'Cancelar venta',
                                            danger: true,
                                            onClick: () => setSaleToCancel(sale),
                                        },
                                    ]
                                  : []),
                          ];
                          if (items.length === 0) return null;
                          return (
                              <Dropdown
                                  menu={{ items }}
                                  trigger={['click']}
                                  placement="bottomRight"
                              >
                                  <Button
                                      variant="text"
                                      icon={<MoreOutlined />}
                                      aria-label={`Acciones de ${sale.operation_number}`}
                                  />
                              </Dropdown>
                          );
                      },
                  },
              ]
            : []),
    ] as ColumnsType<SaleListItem>;
    const handleTableChange: TableProps<SaleListItem>['onChange'] = (_, __, sorter, extra) => {
        if (extra.action !== 'sort') return;

        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;

        if (activeSorter.field !== 'created_at') return;

        setFilters((current) => ({
            ...current,
            page: 1,
            sort_by: 'created_at',
            sort_direction: activeSorter.order === 'ascend' ? 'asc' : 'desc',
        }));
    };
    const clearFilters = () => setFilters({ ...initialFilters });
    return (
        <>
            <div className="space-y-5">
                <div>
                    <h1 className="m-0 text-2xl font-bold">Historial de ventas</h1>
                    <p className="mt-1 text-gray-500">
                        Consultá ventas y reimprimí sus comprobantes.
                    </p>
                </div>
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        showIcon
                        closable
                        onClose={() => setError(null)}
                    />
                )}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-full sm:w-[220px]">
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Nro. de venta"
                            value={filters.operation_number}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setFilters({
                                    ...filters,
                                    operation_number: e.target.value,
                                    page: 1,
                                })
                            }
                        />
                    </div>
                    <DatePicker
                        className="w-full sm:w-40"
                        format="DD/MM/YYYY"
                        placeholder="Desde"
                        value={filters.date_from ? dayjs(filters.date_from) : null}
                        onChange={(v) =>
                            setFilters({ ...filters, date_from: v?.format('YYYY-MM-DD'), page: 1 })
                        }
                    />
                    <DatePicker
                        className="w-full sm:w-40"
                        format="DD/MM/YYYY"
                        placeholder="Hasta"
                        value={filters.date_to ? dayjs(filters.date_to) : null}
                        onChange={(v) =>
                            setFilters({ ...filters, date_to: v?.format('YYYY-MM-DD'), page: 1 })
                        }
                    />
                    <div className="flex w-full gap-3 sm:w-auto">
                        <Select
                            allowClear
                            placeholder="Estado"
                            className="flex-1 sm:w-40 sm:flex-none"
                            value={filters.status}
                            options={[
                                { value: 'confirmed', label: 'Confirmada' },
                                { value: 'cancelled', label: 'Cancelada' },
                            ]}
                            onChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
                        />
                        <Tooltip title="Limpiar filtros">
                            <Button
                                variant="default"
                                icon={<ClearOutlined />}
                                aria-label="Limpiar filtros"
                                action={clearFilters}
                            />
                        </Tooltip>
                    </div>
                </div>
                <AntTable
                    className="sales-history-table"
                    columns={columns}
                    dataSource={data.items}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description="No se encontraron ventas." /> }}
                    onChange={handleTableChange}
                    pagination={{
                        current: data.current_page,
                        pageSize: data.per_page,
                        total: data.total,
                        onChange: (page) => setFilters({ ...filters, page }),
                    }}
                />
            </div>
            <Drawer
                open={!!detail || detailLoading}
                onClose={() => setDetail(null)}
                title={detail ? `Venta ${detail.operation_number}` : 'Detalle de venta'}
                loading={detailLoading}
                footer={
                    <div className="flex flex-wrap justify-end gap-2">
                        <CanDo permission="sales_history.print">
                            <Button
                                variant="default"
                                label="Imprimir ticket"
                                action={() => detail && void printTicket(detail)}
                                disabled={printing}
                            />
                            <Button
                                variant="default"
                                label="Imprimir A4"
                                action={() => detail && void printA4(detail)}
                                disabled={printing}
                            />
                        </CanDo>
                        <Button variant="default" label="Cerrar" action={() => setDetail(null)} />
                    </div>
                }
            >
                {detailLoading ? (
                    <div className="flex justify-center py-16" data-testid="sale-detail-loading">
                        <Spin size="large" />
                    </div>
                ) : (
                    detail && (
                        <div className="space-y-5">
                            <Descriptions column={1} size="small" bordered>
                                <Descriptions.Item label="Estado">
                                    {statusLabel(detail.status)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Fecha">
                                    {formatSaleDateTime(detail.created_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cliente">
                                    {detail.customer_display_name ?? detail.customer?.name ?? '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cajero">
                                    {detail.created_by?.name ?? '—'}
                                </Descriptions.Item>
                            </Descriptions>
                            <h3 className="m-0 text-sm font-semibold">PRODUCTOS</h3>
                            <AntTable
                                size="small"
                                rowKey="id"
                                pagination={false}
                                dataSource={detail.items}
                                columns={[
                                    { title: 'Producto', dataIndex: 'product_name' },
                                    {
                                        title: 'Cantidad',
                                        dataIndex: 'quantity',
                                        align: 'right',
                                        render: (quantity) => formatQuantityForDisplay(quantity),
                                    },
                                    {
                                        title: 'Precio unitario',
                                        dataIndex: 'price',
                                        align: 'right',
                                        render: formatCurrencyWithCents,
                                    },
                                    {
                                        title: 'Subtotal',
                                        dataIndex: 'subtotal',
                                        align: 'right',
                                        render: formatCurrencyWithCents,
                                    },
                                ]}
                            />
                            <Descriptions column={1} size="small" bordered>
                                <Descriptions.Item label="Subtotal">
                                    {formatCurrencyWithCents(detail.subtotal)}
                                </Descriptions.Item>
                                {detail.discount > 0 && (
                                    <Descriptions.Item label="Descuento">
                                        {formatCurrencyWithCents(detail.discount)}
                                    </Descriptions.Item>
                                )}
                                {detail.tax > 0 && (
                                    <Descriptions.Item label="Impuestos">
                                        {formatCurrencyWithCents(detail.tax)}
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="TOTAL">
                                    <strong>{formatCurrencyWithCents(detail.total)}</strong>
                                </Descriptions.Item>
                            </Descriptions>
                            <h3 className="m-0 text-sm font-semibold">FORMAS DE PAGO</h3>
                            <AntTable
                                size="small"
                                rowKey="id"
                                pagination={false}
                                dataSource={detail.payments}
                                columns={[
                                    {
                                        title: 'Método',
                                        render: (_, p) => p.store_payment_method?.name ?? '—',
                                    },
                                    {
                                        title: 'Importe',
                                        dataIndex: 'amount',
                                        align: 'right',
                                        render: formatCurrencyWithCents,
                                    },
                                ]}
                            />
                            <SaleDetailHistory
                                createdAt={detail.created_at}
                                createdBy={detail.created_by}
                                history={detail.history ?? []}
                            />
                        </div>
                    )
                )}
            </Drawer>
            <CancelSaleModal
                sale={saleToCancel}
                open={!!saleToCancel}
                onClose={() => setSaleToCancel(null)}
                onSuccess={handleSaleCancelled}
            />
        </>
    );
};
