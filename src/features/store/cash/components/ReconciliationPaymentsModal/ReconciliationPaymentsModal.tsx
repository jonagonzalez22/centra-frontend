import { useCallback, useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import Table from '@/components/Table/Table';
import type { CashPaymentMethodTotal, CashReconciliationPaymentPage } from '@/entities/CashSession';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getPaymentOriginLabel } from '@/utils/paymentOrigin';
import { CashService } from '../../services/cash.service';

interface ReconciliationPaymentsModalProps {
    sessionId: string;
    paymentMethod: CashPaymentMethodTotal | null;
    onClose: () => void;
}

export const ReconciliationPaymentsModal = ({
    sessionId,
    paymentMethod,
    onClose,
}: ReconciliationPaymentsModalProps) => {
    const [page, setPage] = useState<CashReconciliationPaymentPage | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (nextPage = 1) => {
            if (!paymentMethod) return;
            setLoading(true);
            setError(null);
            try {
                setPage(
                    await CashService.getReconciliationPayments(
                        sessionId,
                        paymentMethod.store_payment_method_id,
                        nextPage,
                        10
                    )
                );
            } catch (caught) {
                setError(
                    (caught as ApiError).message || 'No se pudieron cargar los pagos de este medio.'
                );
            } finally {
                setLoading(false);
            }
        },
        [paymentMethod, sessionId]
    );

    useEffect(() => {
        setPage(null);
        if (paymentMethod) void load(1);
    }, [load, paymentMethod]);

    return (
        <Modal
            open={Boolean(paymentMethod)}
            onClose={onClose}
            title={paymentMethod ? `Detalle de ${paymentMethod.name}` : 'Detalle de pagos'}
            width={900}
            footer={<Button variant="default" label="Cerrar" action={onClose} />}
        >
            {error && (
                <Alert
                    className="mb-4"
                    type="error"
                    showIcon
                    message="No se pudo cargar el detalle"
                    description={error}
                    action={
                        <Button
                            size="small"
                            variant="default"
                            label="Reintentar"
                            action={() => void load(page?.current_page ?? 1)}
                        />
                    }
                />
            )}
            {loading && !page ? (
                <div className="flex justify-center py-12" aria-label="Cargando detalle de pagos">
                    <Spin />
                </div>
            ) : (
                <Table
                    size="small"
                    loading={loading}
                    emptyText="No hay pagos registrados para este medio."
                    dataSource={(page?.items ?? []) as unknown as Record<string, unknown>[]}
                    columns={[
                        {
                            title: 'Operación',
                            key: 'operation',
                            render: (_, row) =>
                                (row?.operation as { operation_number?: string } | null)
                                    ?.operation_number ?? '—',
                        },
                        {
                            title: 'Importe',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (value) => (
                                <span className="whitespace-nowrap font-medium">
                                    {formatCurrency(Number(value))}
                                </span>
                            ),
                        },
                        {
                            title: 'Referencia',
                            dataIndex: 'reference',
                            key: 'reference',
                            render: (value) => String(value || '—'),
                        },
                        {
                            title: 'Fecha',
                            dataIndex: 'created_at',
                            key: 'created_at',
                            render: (value) => formatDate((value as string | null) ?? null),
                        },
                        {
                            title: 'Origen',
                            dataIndex: 'origin',
                            key: 'origin',
                            render: (value) => getPaymentOriginLabel(value as string | null),
                        },
                        {
                            title: 'Registrado por',
                            key: 'registered_by',
                            render: (_, row) =>
                                (row?.registered_by as { name?: string } | null)?.name ??
                                'No informado',
                        },
                    ]}
                    pagination={
                        page
                            ? {
                                  current: page.current_page,
                                  pageSize: page.per_page,
                                  total: page.total,
                                  showSizeChanger: false,
                                  onChange: (nextPage) => void load(nextPage),
                              }
                            : false
                    }
                    scroll={{ x: 'max-content' }}
                />
            )}
        </Modal>
    );
};
