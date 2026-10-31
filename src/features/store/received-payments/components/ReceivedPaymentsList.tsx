import { Empty, Pagination, Skeleton, Table, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Tag from '@/components/Tag/Tag';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getPaymentOriginLabel } from '@/utils/paymentOrigin';
import type { ReceivedPayment } from '../interfaces/received-payment.interface';
import './ReceivedPaymentsList.css';

const customerName = (payment: ReceivedPayment) =>
    payment.customer.display_name ?? 'Consumidor final';
const receivedPaymentCollectorName = (payment: ReceivedPayment) =>
    payment.origin === 'route_collection'
        ? (payment.route?.declared_by?.name ?? '—')
        : (payment.registered_by?.name ?? '—');
const statusTag = (status: ReceivedPayment['status']) => (
    <Tag color={status === 'active' ? 'green' : 'volcano'}>
        {status === 'active' ? 'Activo' : 'Revertido'}
    </Tag>
);

export const ReceivedPaymentsList = ({
    payments,
    loading,
    page,
    total,
    perPage,
    hasFilters,
    onPageChange,
    onOpen,
}: {
    payments: ReceivedPayment[];
    loading: boolean;
    page: number;
    total: number;
    perPage: number;
    hasFilters: boolean;
    onPageChange: (page: number) => void;
    onOpen: (payment: ReceivedPayment) => void;
}) => {
    const { token } = theme.useToken();
    const columns: ColumnsType<ReceivedPayment> = [
        {
            title: 'Fecha y hora',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => formatDate(date),
        },
        { title: 'Cliente', key: 'customer', render: (_, payment) => customerName(payment) },
        {
            title: 'Referencia',
            key: 'operation',
            render: (_, payment) => payment.operation?.operation_number ?? '—',
        },
        {
            title: 'Medio',
            key: 'payment_method',
            render: (_, payment) => payment.payment_method?.name ?? '—',
        },
        {
            title: 'Origen',
            dataIndex: 'origin',
            key: 'origin',
            render: (origin) => getPaymentOriginLabel(origin),
        },
        {
            title: 'Importe',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (amount) => <strong className="tabular-nums">{formatCurrency(amount)}</strong>,
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => statusTag(status),
        },
        {
            title: 'Cobrado por',
            key: 'responsible',
            render: (_, payment) => receivedPaymentCollectorName(payment),
        },
    ];
    const empty = (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                hasFilters
                    ? 'No hay pagos que coincidan con los filtros seleccionados.'
                    : 'Todavía no hay pagos registrados.'
            }
        />
    );
    return (
        <>
            <div
                className="received-payments-table hidden md:block"
                style={
                    { '--received-payments-layout-bg': token.colorBgLayout } as React.CSSProperties
                }
            >
                <Table
                    columns={columns}
                    dataSource={payments}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    sticky={{ offsetHeader: 0 }}
                    locale={{ emptyText: empty }}
                    onRow={(payment) => ({
                        onClick: () => onOpen(payment),
                        tabIndex: 0,
                        onKeyDown: (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onOpen(payment);
                            }
                        },
                        className:
                            'cursor-pointer hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-centra-primary',
                    })}
                />
            </div>
            <div className="md:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="border rounded-lg p-4">
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </div>
                    ))
                ) : payments.length === 0 ? (
                    <div className="py-12">{empty}</div>
                ) : (
                    payments.map((payment) => (
                        <button
                            key={payment.id}
                            type="button"
                            onClick={() => onOpen(payment)}
                            className="w-full text-left border rounded-lg bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-centra-primary"
                        >
                            <div className="flex justify-between gap-3 text-sm text-gray-500">
                                <span>{formatDate(payment.created_at)}</span>
                                {statusTag(payment.status)}
                            </div>
                            <div className="mt-3 font-semibold text-base">
                                {customerName(payment)}
                            </div>
                            <div className="text-gray-600">
                                {payment.operation?.operation_number ?? '—'}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-gray-500">Origen</div>
                                    <div>{getPaymentOriginLabel(payment.origin)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Medio</div>
                                    <div>{payment.payment_method?.name ?? '—'}</div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <div className="text-sm">
                                    <div className="text-gray-500">Cobrado por</div>
                                    <div>{receivedPaymentCollectorName(payment)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Importe</div>
                                    <strong className="text-lg">
                                        {formatCurrency(payment.amount)}
                                    </strong>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
            {total > perPage && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        current={page}
                        total={total}
                        pageSize={perPage}
                        showSizeChanger={false}
                        onChange={onPageChange}
                    />
                </div>
            )}
        </>
    );
};
