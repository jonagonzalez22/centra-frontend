import { useState, useCallback, useEffect } from 'react';
import { Result, Button, Spin, message as antMessage } from 'antd';
import { useAuthStore } from '@/store/useAuthStore.store';
import { POSPageView } from './POSPageView';
import { POSPaymentModal } from '@features/store/sales/components/POSPaymentModal';
import { SalesService } from '@features/store/sales/services/sales.service';
import { usePOSStore } from '@features/store/sales/stores/usePOSStore';
import { formatCurrency } from '@/utils/formatters';
import { CashService } from '@/features/store/cash/services/cash.service';

export const POSPage: React.FC = () => {
    const { user, setCashSession } = useAuthStore();
    const cashSession = user?.cash_session ?? null;
    const [checkingCash, setCheckingCash] = useState(true);
    const [cashError, setCashError] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [registerDepositNow, setRegisterDepositNow] = useState(false);

    useEffect(() => {
        let active = true;
        CashService.getCurrent()
            .then((session) => {
                if (!active) return;
                setCashSession(session);
                setCashError(null);
            })
            .catch((error: { message?: string }) => {
                if (active) setCashError(error.message || 'No se pudo validar la caja actual.');
            })
            .finally(() => {
                if (active) setCheckingCash(false);
            });
        return () => {
            active = false;
        };
    }, [setCashSession]);

    const handleCheckout = useCallback(() => {
        setPaymentModalOpen(true);
    }, []);

    const handleDirectOrder = useCallback(async () => {
        const state = usePOSStore.getState();
        const { type, customer, requested_delivery_date, items, resetPOS } = state;

        try {
            await SalesService.createOperation({
                type,
                customer_id: customer?.id ?? null,
                requested_delivery_date: type === 'order' ? requested_delivery_date : null,
                items: items.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    price: i.price,
                })),
                payments: [],
            });

            const total = items.reduce((sum, item) => sum + item.subtotal, 0);
            antMessage.success(`Pedido registrado. Saldo pendiente: ${formatCurrency(total)}`);
            resetPOS();
        } catch (err) {
            const apiError = err as { message?: string };
            antMessage.error(apiError.message || 'Error al registrar el pedido.');
        }
    }, []);

    const handlePaymentSuccess = useCallback(() => {
        setPaymentModalOpen(false);
    }, []);

    const handlePaymentClose = useCallback(() => {
        setPaymentModalOpen(false);
    }, []);

    if (checkingCash) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (cashError) {
        return <Result status="error" title="No se pudo validar la caja" subTitle={cashError} />;
    }

    if (!cashSession || cashSession.status !== 'open') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Result
                    status="403"
                    title="Caja cerrada"
                    subTitle="No hay una caja abierta para la jornada actual."
                    extra={
                        <Button type="primary" onClick={() => window.history.back()}>
                            Volver
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <>
            <POSPageView
                onCheckout={handleCheckout}
                onRegisterOrder={handleDirectOrder}
                registerDepositNow={registerDepositNow}
                setRegisterDepositNow={setRegisterDepositNow}
            />
            <POSPaymentModal
                open={paymentModalOpen}
                onClose={handlePaymentClose}
                onSuccess={handlePaymentSuccess}
            />
        </>
    );
};
