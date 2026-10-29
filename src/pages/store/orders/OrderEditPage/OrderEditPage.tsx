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
import { PriceListsService } from '@/features/store/price-lists/services/priceLists.service';
import type { PriceList } from '@/features/store/price-lists/types/priceList.types';
import type { DecimalString } from '@/types/decimal';
import { compareDecimalStrings } from '@/utils/quantity';
import type {
    DeliveryDateChangeReason,
    OrderDetail,
    OrderEditability,
} from '@/features/store/orders/interfaces/order.interface';
import type { CommercialProductDetail } from '@/features/store/orders/interfaces/commercial-product.interface';
import { OrderEditPageView } from './OrderEditPageView';

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
    const [busyItemIds, setBusyItemIds] = useState<Record<string, boolean>>({});
    const [availablePriceLists, setAvailablePriceLists] = useState<PriceList[]>([]);
    const [selectedPriceListId, setSelectedPriceListId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [requestedDeliveryDate, setRequestedDeliveryDate] = useState<string | null>(null);
    const [deliveryDateReason, setDeliveryDateReason] = useState<DeliveryDateChangeReason | null>(
        null
    );
    const [deliveryDateObservation, setDeliveryDateObservation] = useState('');
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

    const refreshEditability = useCallback(async (orderId: string) => {
        try {
            setEditability(await OrdersService.getEditability(orderId));
        } catch (refreshError) {
            const apiError = refreshError as LoadError;
            message.error(
                apiError.message ||
                    'El pedido se actualizó, pero no se pudieron refrescar sus límites de edición.'
            );
        }
    }, []);

    const refreshOrderAfterItemMutation = useCallback(
        async (orderId: string, mutationResponse: OrderDetail) => {
            setOrder(mutationResponse);
            try {
                setOrder(await OrdersService.getById(orderId));
            } catch {
                message.error('El pedido se actualizó, pero no se pudo refrescar el detalle.');
            }
        },
        []
    );

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

    useEffect(() => {
        let active = true;
        PriceListsService.getActive()
            .then((lists) => {
                if (active) setAvailablePriceLists(lists);
            })
            .catch(() => {
                if (active) setAvailablePriceLists([]);
            });
        return () => {
            active = false;
        };
    }, []);

    const productDraft = useOrderProductDraft(order, editability);
    const isMutatingItems = Object.values(busyItemIds).some(Boolean);
    const handleApplyDeliveryDateChange = useCallback(
        async ({
            requestedDeliveryDate: date,
            reason,
            observation,
        }: {
            requestedDeliveryDate: string;
            reason: DeliveryDateChangeReason | null;
            observation: string;
        }): Promise<boolean> => {
            if (
                !id ||
                !order ||
                !editability?.editable ||
                saving ||
                isMutatingItems ||
                date === order.requested_delivery_date ||
                !reason
            ) {
                return false;
            }

            setSaving(true);
            setSaveError(null);
            try {
                const updatedOrder = await OrdersService.update(id, {
                    requested_delivery_date: date,
                    reason,
                    ...(reason === 'other' ? { observation } : {}),
                });
                setOrder(updatedOrder);
                setRequestedDeliveryDate(updatedOrder.requested_delivery_date);
                setDeliveryDateReason(null);
                setDeliveryDateObservation('');
                await refreshOrderAfterItemMutation(id, updatedOrder);
                await refreshEditability(id);
                message.success('Fecha de entrega actualizada.');
                return true;
            } catch (requestError) {
                const apiError = requestError as SaveError & {
                    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
                };
                const errors = apiError.response?.data?.errors ?? apiError.errors;
                const errorMessage =
                    Object.values(errors ?? {})
                        .flat()
                        .join(' ') ||
                    apiError.response?.data?.message ||
                    apiError.message ||
                    'No se pudo actualizar la fecha de entrega.';
                setRequestedDeliveryDate(order.requested_delivery_date);
                setDeliveryDateReason(null);
                setDeliveryDateObservation('');
                setSaveError(errorMessage);
                message.error(errorMessage);
                return false;
            } finally {
                setSaving(false);
            }
        },
        [
            editability?.editable,
            id,
            isMutatingItems,
            order,
            refreshEditability,
            refreshOrderAfterItemMutation,
            saving,
        ]
    );
    const performItemMutation = useCallback(
        async (
            key: string,
            mutation: () => Promise<OrderDetail>,
            successMessage: string
        ): Promise<boolean> => {
            if (!id || !editability?.editable) return false;
            setBusyItemIds((current) => ({ ...current, [key]: true }));
            setSaveError(null);
            try {
                const updatedOrder = await mutation();
                await refreshOrderAfterItemMutation(id, updatedOrder);
                await refreshEditability(id);
                message.success(successMessage);
                return true;
            } catch (requestError) {
                const apiError = requestError as SaveError & {
                    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
                };
                const errors = apiError.response?.data?.errors ?? apiError.errors;
                const errorMessage =
                    Object.values(errors ?? {})
                        .flat()
                        .join(' ') ||
                    apiError.response?.data?.message ||
                    apiError.message ||
                    'No se pudo actualizar el ítem del pedido.';
                setSaveError(errorMessage);
                message.error(errorMessage);
                return false;
            } finally {
                setBusyItemIds((current) => {
                    const next = { ...current };
                    delete next[key];
                    return next;
                });
            }
        },
        [editability?.editable, id, refreshEditability, refreshOrderAfterItemMutation]
    );

    const handleAddProduct = useCallback(
        async (product: CommercialProductDetail): Promise<boolean> => {
            if (!order) return false;
            if (
                compareDecimalStrings(
                    product.commercial_available_quantity,
                    product.sale_quantity_step
                ) < 0
            ) {
                message.error('El producto no tiene stock disponible para agregar.');
                return false;
            }
            return performItemMutation(
                `add:${product.id}`,
                () =>
                    OrdersService.addItem(order.id, {
                        product_id: product.id,
                        quantity: product.sale_quantity_step,
                        price_list_id: selectedPriceListId,
                    }),
                'Producto agregado al pedido.'
            );
        },
        [order, performItemMutation, selectedPriceListId]
    );

    const handleQuantityChange = useCallback(
        (itemId: string, quantity: DecimalString | null) => {
            if (quantity === null || !order) return Promise.resolve(false);
            return performItemMutation(
                itemId,
                () => OrdersService.updateItemQuantity(order.id, itemId, quantity),
                'Cantidad actualizada.'
            );
        },
        [order, performItemMutation]
    );

    const handleDeleteItem = useCallback(
        (itemId: string) => {
            if (!order) return Promise.resolve(false);
            return performItemMutation(
                itemId,
                () => OrdersService.deleteItem(order.id, itemId),
                'Ítem eliminado del pedido.'
            );
        },
        [order, performItemMutation]
    );

    const handleChangeItemPriceList = useCallback(
        (itemId: string, priceListId: string | null) => {
            if (!order) return Promise.resolve(false);
            return performItemMutation(
                itemId,
                () => OrdersService.changeItemPriceList(order.id, itemId, priceListId),
                'Lista de precios actualizada.'
            );
        },
        [order, performItemMutation]
    );

    const handleBack = useCallback(() => navigate('/tienda/ventas/pedidos'), [navigate]);

    const openPayment = useCallback(() => {
        if (saving || isMutatingItems) return;

        if (!cashSession || cashSession.status !== 'open') {
            message.warning('Debes abrir una caja antes de registrar cobros.');
            return;
        }

        setPaymentOpen(true);
    }, [cashSession, isMutatingItems, saving]);

    const registerPayment = useCallback(
        async (payload: {
            store_payment_method_id: string;
            amount: number;
            reference?: string;
        }) => {
            if (!id || !order || saving || isMutatingItems) return;

            await OrdersService.registerPayment(order.id, payload);
            setCashSession(await CashService.getCurrent());
            await loadOrder();
            message.success('Pago registrado exitosamente.');
        },
        [id, isMutatingItems, loadOrder, order, saving, setCashSession]
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
                draft={productDraft}
                saving={saving}
                busyItemIds={busyItemIds}
                saveError={saveError}
                requestedDeliveryDate={requestedDeliveryDate}
                deliveryDateReason={deliveryDateReason}
                deliveryDateObservation={deliveryDateObservation}
                canCollect={canCollect}
                availablePriceLists={availablePriceLists}
                selectedPriceListId={selectedPriceListId}
                onSelectedPriceListChange={setSelectedPriceListId}
                onQuantityChange={handleQuantityChange}
                onAddProduct={handleAddProduct}
                onRemoveProduct={handleDeleteItem}
                onChangeItemPriceList={handleChangeItemPriceList}
                onApplyDeliveryDateChange={handleApplyDeliveryDateChange}
                onOpenPayment={openPayment}
            />
            <RegisterOrderPaymentModal
                open={paymentOpen}
                pendingAmount={order.pending_amount ?? Math.max(0, order.total - order.paid_amount)}
                onClose={() => setPaymentOpen(false)}
                onSubmit={registerPayment}
            />
        </div>
    );
};
