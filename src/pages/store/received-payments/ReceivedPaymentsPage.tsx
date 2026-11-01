import { useMemo, useState } from 'react';
import { ReceivedPaymentDrawer } from '@/features/store/received-payments/components/ReceivedPaymentDrawer';
import { ReceivedPaymentFilters } from '@/features/store/received-payments/components/ReceivedPaymentFilters';
import { ReceivedPaymentsList } from '@/features/store/received-payments/components/ReceivedPaymentsList';
import { ReversePaymentModal } from '@/features/store/received-payments/components/ReversePaymentModal';
import { useReceivedPayments } from '@/features/store/received-payments/hooks/useReceivedPayments';
import type { ReceivedPayment } from '@/features/store/received-payments/interfaces/received-payment.interface';

export const ReceivedPaymentsPage = () => {
    const { payments, filters, loading, pagination, setFilters, resetFilters, refreshPayments } =
        useReceivedPayments();
    const [selectedPayment, setSelectedPayment] = useState<ReceivedPayment | null>(null);
    const [paymentToReverse, setPaymentToReverse] = useState<ReceivedPayment | null>(null);
    const hasFilters = useMemo(
        () =>
            Object.entries(filters).some(
                ([key, value]) => !['page', 'per_page'].includes(key) && Boolean(value)
            ),
        [filters]
    );

    const handlePaymentReversed = async (payment: ReceivedPayment) => {
        setSelectedPayment((current) => (current?.id === payment.id ? payment : current));
        await refreshPayments();
    };

    const refreshAfterEligibilityError = async () => {
        const result = await refreshPayments();
        const refreshedPayment = result?.items.find(
            (payment) => payment.id === selectedPayment?.id
        );

        setSelectedPayment(refreshedPayment ?? null);
    };

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
                onReverse={setPaymentToReverse}
            />
            <ReceivedPaymentDrawer
                payment={selectedPayment}
                open={selectedPayment !== null}
                onClose={() => setSelectedPayment(null)}
                onReverse={setPaymentToReverse}
            />
            <ReversePaymentModal
                payment={paymentToReverse}
                open={paymentToReverse !== null}
                onClose={() => setPaymentToReverse(null)}
                onSuccess={handlePaymentReversed}
                onEligibilityError={refreshAfterEligibilityError}
            />
        </div>
    );
};
