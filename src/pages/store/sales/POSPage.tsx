import { useState, useCallback, useEffect, useRef } from 'react';
import { Result, Button, Spin, message as antMessage } from 'antd';
import { useAuthStore } from '@/store/useAuthStore.store';
import { POSPageView } from './POSPageView';
import { POSPaymentModal } from '@features/store/sales/components/POSPaymentModal';
import { SaleSuccessModal } from '@features/store/sales/components/SaleSuccessModal';
import { SalesService } from '@features/store/sales/services/sales.service';
import type { OperationResponse } from '@features/store/sales/interfaces/sale.interface';
import { usePOSStore } from '@features/store/sales/stores/usePOSStore';
import { formatCurrencyWithCents } from '@/utils/formatters';
import { CashService } from '@/features/store/cash/services/cash.service';
import { usePermissions } from '@/hooks/usePermissions';
import { getCurrentSessionGeneration, isCurrentSession } from '@/security/sessionContext';
import { canCreateOrderCheckout, canUsePosCheckout } from '@/utils/operationalAccess';

interface POSPageProps {
    operationMode?: 'auto' | 'pos' | 'orders';
}

export const POSPage: React.FC<POSPageProps> = ({ operationMode = 'auto' }) => {
    const { user, setCashSession } = useAuthStore();
    const { can } = usePermissions();
    const cashSession = user?.cash_session ?? null;
    const [checkingCash, setCheckingCash] = useState(true);
    const [cashError, setCashError] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Pick<OperationResponse, 'id' | 'operation_number'> | null>(null);
    const [registerDepositNow, setRegisterDepositNow] = useState(false);
    const type = usePOSStore((state) => state.type);
    const resetPOS = usePOSStore((state) => state.resetPOS);
    const setType = usePOSStore((state) => state.setType);
    const canUsePos = canUsePosCheckout(user);
    const canCreateOrders = canCreateOrderCheckout(user);
    const canCollectOrders = can('orders.collect');
    const resolvedOperationMode = operationMode === 'auto' ? (canUsePos ? 'pos' : 'orders') : operationMode;
    const lockedType = operationMode === 'orders'
        ? 'order'
        : operationMode === 'pos'
            ? 'sale'
            : canUsePos && canCreateOrders
                ? null
                : canUsePos
                    ? 'sale'
                    : 'order';
    const initialType = lockedType ?? 'sale';
    const initializedRouteRef = useRef<string | null>(null);

    useEffect(() => {
        if (initializedRouteRef.current === operationMode) return;
        initializedRouteRef.current = operationMode;
        resetPOS();
        setType(initialType);
    }, [initialType, operationMode, resetPOS, setType]);

    useEffect(() => {
        let active = true;
        const sessionGeneration = getCurrentSessionGeneration();
        CashService.getCurrent()
            .then((session) => {
                if (!active || !isCurrentSession(sessionGeneration)) return;
                setCashSession(session);
                setCashError(null);
            })
            .catch((error: { message?: string }) => {
                if (active && isCurrentSession(sessionGeneration)) {
                    setCashError(error.message || 'No se pudo validar la caja actual.');
                }
            })
            .finally(() => {
                if (active && isCurrentSession(sessionGeneration)) setCheckingCash(false);
            });
        return () => {
            active = false;
        };
    }, [setCashSession]);

    const handleCheckout = useCallback(() => {
        if (!cashSession || cashSession.status !== 'open') {
            antMessage.warning('Debes abrir una caja antes de registrar cobros.');
            return;
        }
        setPaymentModalOpen(true);
    }, [cashSession]);

    const handleDirectOrder = useCallback(async () => {
        const state = usePOSStore.getState();
        const { type, customer, customer_display_name, requested_delivery_date, items, resetPOS } = state;
        const sessionGeneration = getCurrentSessionGeneration();

        try {
            const operation = await SalesService.createOperation({
                type,
                customer_id: customer?.id ?? null,
                ...(type === 'sale' && customer_display_name?.trim()
                    ? { customer_display_name: customer_display_name.trim() }
                    : {}),
                requested_delivery_date: type === 'order' ? requested_delivery_date : null,
                items: items.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    price: i.price,
                    price_list_id: i.price_list_id,
                })),
                payments: [],
            });

            if (!isCurrentSession(sessionGeneration)) return;

            const pendingAmount = operation.pending_amount ?? operation.total;
            antMessage.success(`Pedido registrado. Saldo pendiente: ${formatCurrencyWithCents(pendingAmount)}`);
            resetPOS();
        } catch (err) {
            if (!isCurrentSession(sessionGeneration)) return;
            const apiError = err as { message?: string };
            antMessage.error(apiError.message || 'Error al registrar el pedido.');
        }
    }, []);

    const handlePaymentSuccess = useCallback((operation: OperationResponse) => {
        setPaymentModalOpen(false);
        if (operation.type === 'sale') {
            setCompletedSale({ id: operation.id, operation_number: operation.operation_number });
        }
    }, []);

    const handlePaymentClose = useCallback(() => {
        setPaymentModalOpen(false);
    }, []);

    if (lockedType && type !== lockedType) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (resolvedOperationMode === 'pos' && checkingCash) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (resolvedOperationMode === 'pos' && cashError) {
        return <Result status="error" title="No se pudo validar la caja" subTitle={cashError} />;
    }

    if (resolvedOperationMode === 'pos' && (!cashSession || cashSession.status !== 'open')) {
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
                canCreateOperations={type === 'order' ? canCreateOrders : canUsePos && can('pos.create')}
                allowOrders={resolvedOperationMode === 'pos' && canCreateOrders}
                lockOrderType={resolvedOperationMode === 'orders'}
                canCollectOrders={canCollectOrders}
                registerDepositNow={registerDepositNow}
                setRegisterDepositNow={setRegisterDepositNow}
            />
            <POSPaymentModal
                open={paymentModalOpen}
                onClose={handlePaymentClose}
                onSuccess={handlePaymentSuccess}
            />
            {completedSale && (
                <SaleSuccessModal sale={completedSale} onClose={() => setCompletedSale(null)} />
            )}
        </>
    );
};
