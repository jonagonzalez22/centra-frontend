import { useMemo, useState } from 'react';
import { ReceivedPaymentDrawer } from '@/features/store/received-payments/components/ReceivedPaymentDrawer';
import { ReceivedPaymentFilters } from '@/features/store/received-payments/components/ReceivedPaymentFilters';
import { ReceivedPaymentsList } from '@/features/store/received-payments/components/ReceivedPaymentsList';
import { useReceivedPayments } from '@/features/store/received-payments/hooks/useReceivedPayments';
import type { ReceivedPayment } from '@/features/store/received-payments/interfaces/received-payment.interface';

export const ReceivedPaymentsPage = () => {
    const { payments, filters, loading, pagination, setFilters, resetFilters } =
        useReceivedPayments();
    const [selectedPayment, setSelectedPayment] = useState<ReceivedPayment | null>(null);
    const hasFilters = useMemo(
        () =>
            Object.entries(filters).some(
                ([key, value]) => !['page', 'per_page'].includes(key) && Boolean(value)
            ),
        [filters]
    );

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold m-0">Pagos recibidos</h1>
                <p className="text-gray-500 mt-1">
                    Consultá y auditá los pagos registrados en la tienda.
                </p>
            </div>
            <ReceivedPaymentFilters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
            />
            <ReceivedPaymentsList
                payments={payments}
                loading={loading}
                page={pagination.current}
                total={pagination.total}
                perPage={pagination.perPage}
                hasFilters={hasFilters}
                onPageChange={(page) => setFilters({ page })}
                onOpen={setSelectedPayment}
            />
            <ReceivedPaymentDrawer
                payment={selectedPayment}
                open={selectedPayment !== null}
                onClose={() => setSelectedPayment(null)}
            />
        </div>
    );
};
