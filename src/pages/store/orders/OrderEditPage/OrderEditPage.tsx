import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, message, Result, Skeleton } from 'antd';
import { Button } from '@/components/Button';
import { RegisterOrderPaymentModal } from '@/features/store/orders/components/RegisterOrderPaymentModal';
import { CashService } from '@/features/store/cash/services/cash.service';
import { useOrderProductDraft } from '@/features/store/orders/hooks/useOrderProductDraft';
import { OrdersService } from '@/features/store/orders/services/orders.service';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/useAuthStore.store';
import type {
    DeliveryDateChangeReason,
    OrderDetail,
    OrderEditability,
    UpdateOrderPayload,
} from '@/features/store/orders/interfaces/order.interface';
import { OrderEditPageView } from './OrderEditPageView';
import { OrderEditUnsavedChangesModal } from './OrderEditUnsavedChangesModal';

type LoadError = { status?: number; message?: string; response?: { status?: number } };
type SaveError = LoadError & { errors?: Record<string, string[]> };

export const OrderEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { can } = usePermissions();
    const canCollect = can('orders.collect');
    const cashSession = useAuthStore((state) => state.user?.cash_session ?? null);
    const setCashSession = useAuthStore((state) => state.setCashSession);
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [editability, setEditability] = useState<OrderEditability | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<LoadError | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [requestedDeliveryDate, setRequestedDeliveryDate] = useState<string | null>(null);
    const [deliveryDateReason, setDeliveryDateReason] = useState<DeliveryDateChangeReason | null>(null);
    const [deliveryDateObservation, setDeliveryDateObservation] = useState('');
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const loadOrder = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        setError(null);
        const [loadedOrder, loadedEditability] = await Promise.all([
            OrdersService.getById(id),
            OrdersService.getEditability(id),
        ]);
        setOrder(loadedOrder);
        setEditability(loadedEditability);
        setRequestedDeliveryDate(loadedOrder.requested_delivery_date);
        setDeliveryDateReason(null);
        setDeliveryDateObservation('');
        setLoading(false);
    }, [id]);

    useEffect(() => {
        let active = true;

        void loadOrder().catch((loadError: LoadError) => {
            if (active) {
                setError(loadError);
                setLoading(false);
            }
        });

        return () => {
            active = false;
        };
    }, [loadOrder]);

    const productDraft = useOrderProductDraft(editability);
    const handleRequestedDeliveryDateChange = useCallback(
        (date: string | null) => {
            setRequestedDeliveryDate(date);

            if (date === order?.requested_delivery_date) {
                setDeliveryDateReason(null);
                setDeliveryDateObservation('');
            }
        },
        [order?.requested_delivery_date]
    );
    const handleApplyDeliveryDateChange = useCallback(
        ({
            requestedDeliveryDate: date,
            reason,
            observation,
        }: {
            requestedDeliveryDate: string;
            reason: DeliveryDateChangeReason | null;
            observation: string;
        }) => {
            handleRequestedDeliveryDateChange(date);
            if (date === order?.requested_delivery_date || !reason) return;

            setDeliveryDateReason(reason);
            setDeliveryDateObservation(observation);
        },
        [handleRequestedDeliveryDateChange, order?.requested_delivery_date]
    );
    const deliveryDateChanged = requestedDeliveryDate !== order?.requested_delivery_date;
    const deliveryDateValidationMessage = !deliveryDateChanged
        ? null
        : !requestedDeliveryDate
          ? 'La fecha de entrega es obligatoria.'
          : !deliveryDateReason
            ? 'Seleccioná un motivo para reprogramar la fecha.'
            : deliveryDateReason === 'other' && !deliveryDateObservation.trim()
              ? 'La observación es obligatoria cuando el motivo es otro.'
              : null;
    const isDirty = productDraft.isDirty || deliveryDateChanged;

    useEffect(() => {
        if (!isDirty) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const requestNavigation = useCallback(
        (navigation: () => void) => {
            if (isDirty) {
                setPendingNavigation(() => navigation);
                return;
            }

            navigation();
        },
        [isDirty]
    );
    const handleBack = useCallback(
        () => requestNavigation(() => navigate('/tienda/ventas/pedidos')),
        [navigate, requestNavigation]
    );
    const handleContinueEditing = useCallback(() => {
        setPendingNavigation(null);
    }, []);
    const handleLeaveWithoutSaving = useCallback(() => {
        if (pendingNavigation) {
            pendingNavigation();
        }
        setPendingNavigation(null);
    }, [pendingNavigation]);

    const handleSave = async () => {
        if (
            !id ||
            !editability?.editable ||
            !isDirty ||
            productDraft.finalItems.length === 0 ||
            deliveryDateValidationMessage
        ) {
            return;
        }

        const payload: UpdateOrderPayload = {};
        if (productDraft.isDirty) {
            payload.items = productDraft.finalItems;
        }
        if (deliveryDateChanged && requestedDeliveryDate && deliveryDateReason) {
            payload.requested_delivery_date = requestedDeliveryDate;
            payload.reason = deliveryDateReason;
            if (deliveryDateReason === 'other') {
                payload.observation = deliveryDateObservation.trim();
            }
        }

        setSaving(true);
        setSaveError(null);
        try {
            await OrdersService.update(id, payload);
            await loadOrder();
            message.success('Cambios del pedido guardados correctamente.');
        } catch (requestError) {
            const apiError = requestError as SaveError;
            const errors = apiError.errors ? Object.values(apiError.errors).flat().join(' ') : '';
            setSaveError(errors || apiError.message || 'No se pudieron guardar los cambios del pedido.');
        } finally {
            setSaving(false);
        }
    };

    const openPayment = useCallback(() => {
        if (isDirty || saving) return;

        if (!cashSession || cashSession.status !== 'open') {
            message.warning('Debes abrir una caja antes de registrar cobros.');
            return;
        }

        setPaymentOpen(true);
    }, [cashSession, isDirty, saving]);

    const registerPayment = useCallback(
        async (payload: { store_payment_method_id: string; amount: number; reference?: string }) => {
            if (!id || !order || isDirty || saving) return;

            await OrdersService.registerPayment(order.id, payload);
            setCashSession(await CashService.getCurrent());
            await loadOrder();
            message.success('Pago registrado exitosamente.');
        },
        [id, isDirty, loadOrder, order, saving, setCashSession]
    );

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton.Button active size="small" />
                <Skeleton active paragraph={{ rows: 8 }} />
            </div>
        );
    }

    if (error) {
        const status = error.response?.status ?? error.status;
        const notFound = status === 404;

        return (
            <Result
                status={notFound ? '404' : 'error'}
                title={notFound ? 'Pedido no encontrado' : 'No se pudo cargar el pedido'}
                subTitle={error.message || 'Intentá nuevamente desde el listado de pedidos.'}
                extra={<Button variant="primary" label="Volver a pedidos" action={handleBack} />}
            />
        );
    }

    if (!order || !editability) {
        return (
            <Alert
                type="error"
                showIcon
                title="No se pudo obtener la información necesaria para editar el pedido."
                action={<Button variant="default" label="Volver a pedidos" action={handleBack} />}
            />
        );
    }

    return (
        <div className="space-y-4">
            <Button
                variant="default"
                label="Volver a pedidos"
                icon={<ArrowLeftOutlined />}
                action={handleBack}
            />
            <OrderEditPageView
                order={order}
                editability={editability}
                draft={productDraft.draft}
                isDirty={isDirty}
                finalItemsCount={productDraft.finalItems.length}
                saving={saving}
                saveError={saveError}
                requestedDeliveryDate={requestedDeliveryDate}
                deliveryDateReason={deliveryDateReason}
                deliveryDateObservation={deliveryDateObservation}
                deliveryDateChanged={deliveryDateChanged}
                canCollect={canCollect}
                onQuantityChange={productDraft.updateQuantity}
                onAddProduct={productDraft.addProduct}
                onRemoveProduct={productDraft.removeProduct}
                onApplyDeliveryDateChange={handleApplyDeliveryDateChange}
                onOpenPayment={openPayment}
                onSave={handleSave}
            />
            <RegisterOrderPaymentModal
                open={paymentOpen}
                pendingAmount={order.pending_amount ?? Math.max(0, order.total - order.paid_amount)}
                onClose={() => setPaymentOpen(false)}
                onSubmit={registerPayment}
            />
            <OrderEditUnsavedChangesModal
                open={pendingNavigation !== null}
                onContinueEditing={handleContinueEditing}
                onLeaveWithoutSaving={handleLeaveWithoutSaving}
            />
        </div>
    );
};
