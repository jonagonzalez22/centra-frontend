import { useEffect, useRef, useState } from 'react';
import { DeleteOutlined, EditOutlined, LockOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import {
    Alert,
    Descriptions,
    Empty,
    Grid,
    Input,
    InputNumber,
    Popconfirm,
    Space,
    Spin,
    Tag,
    Tooltip,
} from 'antd';
import { Search } from 'lucide-react';
import { Button } from '@/components/Button';
import Card from '@/components/Card/Card';
import { OrderStatusBadge } from '@/features/store/orders/components/OrderStatusBadge';
import type { OrderProductDraftItem } from '@/features/store/orders/hooks/useOrderProductDraft';
import type {
    CommercialProductDetail,
    CommercialProductSearchItem,
} from '@/features/store/orders/interfaces/commercial-product.interface';
import type { DeliveryDateChangeReason, OrderDetail, OrderEditability } from '@/features/store/orders/interfaces/order.interface';
import { CommercialProductsService } from '@/features/store/orders/services/commercial-products.service';
import { formatCurrency, formatDate, formatDateShort } from '@/utils/formatters';
import { OrderDeliveryDateModal } from './OrderDeliveryDateModal';

interface Props {
    order: OrderDetail;
    editability: OrderEditability;
    draft: OrderProductDraftItem[];
    isDirty: boolean;
    finalItemsCount: number;
    saving: boolean;
    saveError: string | null;
    requestedDeliveryDate: string | null;
    deliveryDateReason: DeliveryDateChangeReason | null;
    deliveryDateObservation: string;
    deliveryDateChanged: boolean;
    canCollect: boolean;
    onQuantityChange: (productId: string, quantity: number | null) => void;
    onAddProduct: (product: CommercialProductDetail) => boolean;
    onRemoveProduct: (productId: string) => void;
    onApplyDeliveryDateChange: (draft: {
        requestedDeliveryDate: string;
        reason: DeliveryDateChangeReason | null;
        observation: string;
    }) => void;
    onOpenPayment: () => void;
    onSave: () => void;
}

export const OrderEditPageView = ({
    order,
    editability,
    draft,
    isDirty,
    finalItemsCount,
    saving,
    saveError,
    requestedDeliveryDate,
    deliveryDateReason,
    deliveryDateObservation,
    deliveryDateChanged,
    canCollect,
    onQuantityChange,
    onAddProduct,
    onRemoveProduct,
    onApplyDeliveryDateChange,
    onOpenPayment,
    onSave,
}: Props) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CommercialProductSearchItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [deliveryDateModalOpen, setDeliveryDateModalOpen] = useState(false);
    const screens = Grid.useBreakpoint();
    const isDesktopLayout = screens.lg === true;
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const editable = editability.editable;
    const pendingAmount = order.pending_amount ?? Math.max(0, order.total - order.paid_amount);

    const searchCatalog = async (term: string): Promise<CommercialProductSearchItem[]> => {
        const isBarcode = /^\d{8,}$/.test(term);
        const params = isBarcode ? { barcode: term } : { q: term };

        setSearchLoading(true);
        setSearchError(null);
        setActiveIndex(-1);
        try {
            const catalogResults = await CommercialProductsService.search(params);
            setResults(catalogResults);
            setShowDropdown(true);
            return catalogResults;
        } catch {
            setResults([]);
            setSearchError('No se pudieron buscar productos. Intentá nuevamente.');
            setShowDropdown(true);
            return [];
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        const term = query.trim();
        if (!editable || term.length < 2) {
            setResults([]);
            setSearchError(null);
            setShowDropdown(false);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => void searchCatalog(term), 300);

        return () => clearTimeout(debounceRef.current);
    }, [editable, query]);

    const selectProduct = async (productId: string) => {
        setDetailLoadingId(productId);
        setSearchError(null);
        try {
            const product = await CommercialProductsService.getById(productId);
            if (!onAddProduct(product)) {
                setSearchError('El producto no tiene stock disponible para agregar.');
                return;
            }
            setQuery('');
            setResults([]);
            setShowDropdown(false);
            setActiveIndex(-1);
        } catch {
            setSearchError('No se pudo obtener el detalle comercial del producto.');
        } finally {
            setDetailLoadingId(null);
        }
    };

    const handlePressEnter = () => {
        const selectedResult = results[activeIndex >= 0 ? activeIndex : 0];
        if (selectedResult) {
            void selectProduct(selectedResult.id);
            return;
        }

        const term = query.trim();
        if (term.length >= 2) {
            clearTimeout(debounceRef.current);
            void searchCatalog(term).then((catalogResults) => {
                if (/^\d{8,}$/.test(term) && catalogResults[0]) {
                    void selectProduct(catalogResults[0].id);
                }
            });
        }
    };

    return (
        <div className={editable ? 'space-y-4 pb-20 lg:pb-0' : 'space-y-4'}>
            <div>
                <h1 className="text-2xl font-bold m-0">Editar pedido {order.operation_number}</h1>
                <p className="text-gray-500 mt-1">Gestioná los productos del pedido.</p>
            </div>

            {!editable && (
                <Alert
                    type="warning"
                    showIcon
                    title="Este pedido no puede editarse."
                    description={editability.block_message || 'El pedido no está disponible para edición.'}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card title="Productos del pedido">
                        {editable && (
                            <div className="mb-4 space-y-3">
                                <div className="relative">
                                    <Spin spinning={searchLoading || detailLoadingId !== null} size="small">
                                        <Input
                                            aria-label="Buscar producto por nombre, SKU o código de barras"
                                            prefix={<Search size={16} className="text-gray-400" />}
                                            placeholder="Buscar producto por nombre, SKU o código de barras..."
                                            size="large"
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    handlePressEnter();
                                                    return;
                                                }

                                                if (!showDropdown || results.length === 0) return;
                                                if (event.key === 'ArrowDown') {
                                                    event.preventDefault();
                                                    setActiveIndex((current) =>
                                                        current < results.length - 1 ? current + 1 : 0
                                                    );
                                                } else if (event.key === 'ArrowUp') {
                                                    event.preventDefault();
                                                    setActiveIndex((current) =>
                                                        current > 0 ? current - 1 : results.length - 1
                                                    );
                                                } else if (event.key === 'Escape') {
                                                    setShowDropdown(false);
                                                    setActiveIndex(-1);
                                                }
                                            }}
                                            onFocus={() => results.length > 0 && setShowDropdown(true)}
                                            onBlur={() =>
                                                setTimeout(() => {
                                                    setShowDropdown(false);
                                                    setActiveIndex(-1);
                                                }, 200)
                                            }
                                            allowClear
                                            onClear={() => {
                                                setQuery('');
                                                setShowDropdown(false);
                                            }}
                                        />
                                    </Spin>

                                    {showDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {results.length > 0 ? (
                                                results.map((product, index) => {
                                                    const draftItem = draft.find(
                                                        (item) => item.product_id === product.id
                                                    );
                                                    const isActive = index === activeIndex;
                                                    const secondary = [product.sku, product.barcode]
                                                        .filter(Boolean)
                                                        .join(' · ');

                                                    return (
                                                        <button
                                                            key={product.id}
                                                            type="button"
                                                            aria-label={'Agregar ' + product.name}
                                                            className={
                                                                'w-full text-left px-4 py-2.5 cursor-pointer flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors ' +
                                                                (isActive
                                                                    ? 'bg-blue-50'
                                                                    : 'hover:bg-gray-50')
                                                            }
                                                            onMouseDown={(event) => {
                                                                event.preventDefault();
                                                                void selectProduct(product.id);
                                                            }}
                                                            onMouseEnter={() => setActiveIndex(index)}
                                                        >
                                                            <span className="flex-1 min-w-0">
                                                                <span
                                                                    className={
                                                                        'block text-sm truncate ' +
                                                                        (isActive
                                                                            ? 'font-semibold'
                                                                            : 'font-medium')
                                                                    }
                                                                >
                                                                    {product.name}
                                                                </span>
                                                                {secondary && (
                                                                    <span className="block text-xs text-gray-400">
                                                                        {secondary}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            {draftItem && draftItem.quantity > 0 && (
                                                                <span className="text-xs text-blue-500 ml-2 whitespace-nowrap">
                                                                    {draftItem.quantity} en pedido
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="py-6">
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description={
                                                            query.trim().length < 2
                                                                ? 'Escribí al menos 2 caracteres'
                                                                : 'Sin resultados'
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {query.trim().length > 0 && query.trim().length < 2 && (
                                    <p className="text-xs text-gray-500 m-0">
                                        Ingresá al menos 2 caracteres para buscar.
                                    </p>
                                )}
                                {searchError && <Alert type="warning" showIcon title={searchError} />}
                            </div>
                        )}

                        {saveError && <Alert className="mb-4" type="error" showIcon title={saveError} />}
                        {isDirty && (
                            <Alert
                                className="mb-4"
                                type="info"
                                showIcon
                                title="El total definitivo se recalculará al guardar."
                            />
                        )}
                        {finalItemsCount === 0 && (
                            <Alert
                                className="mb-4"
                                type="error"
                                showIcon
                                title="El pedido debe conservar al menos un producto."
                            />
                        )}

                        <div className="space-y-3">
                            {draft.filter((item) => item.quantity > 0).map((item) => {
                                const canRemove = editable && item.minimum_quantity === 0;
                                const minimumEditableQuantity = Math.max(item.minimum_quantity, 1);
                                const canIncrease =
                                    editable &&
                                    (!item.is_new || item.quantity < (item.available_stock ?? 0));

                                return (
                                    <div
                                        key={item.product_id}
                                        className="relative border border-gray-200 rounded-lg p-4"
                                    >
                                        {canRemove && (
                                            <div className="absolute top-2 right-2">
                                                <Popconfirm
                                                    title="¿Quitar producto del pedido?"
                                                    okText="Quitar"
                                                    cancelText="Cancelar"
                                                    onConfirm={() => onRemoveProduct(item.product_id)}
                                                >
                                                    <Button
                                                        variant="text"
                                                        danger
                                                        aria-label={'Eliminar ' + item.name}
                                                        icon={<DeleteOutlined />}
                                                    />
                                                </Popconfirm>
                                            </div>
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            <div className={canRemove ? 'pr-10' : undefined}>
                                                <p className="font-semibold mb-1">{item.name}</p>
                                                {item.sku && (
                                                    <p className="text-xs text-gray-500 m-0">SKU: {item.sku}</p>
                                                )}
                                                {item.is_new ? (
                                                    <p className="text-sm text-gray-600 mt-2 mb-0">
                                                        Precio actual: {formatCurrency(item.price ?? 0)} · Stock
                                                        disponible: {item.available_stock ?? 0}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-600 mt-2 mb-0">
                                                        El precio histórico se preservará al guardar.
                                                    </p>
                                                )}
                                            </div>
                                            {editable && (
                                                <div
                                                    className={
                                                        'flex self-center sm:self-auto items-center gap-2' +
                                                        (canRemove ? ' sm:pt-10' : '')
                                                    }
                                                >
                                                    <Space.Compact>
                                                        <Tooltip title="Reducir cantidad">
                                                            <Button
                                                                variant="primary"
                                                                styles={{ root: { boxShadow: 'none' } }}
                                                                aria-label={'Reducir cantidad de ' + item.name}
                                                                icon={<MinusOutlined />}
                                                                disabled={item.quantity <= minimumEditableQuantity}
                                                                action={() =>
                                                                    onQuantityChange(
                                                                        item.product_id,
                                                                        item.quantity - 1
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                        <InputNumber
                                                            aria-label={'Cantidad de ' + item.name}
                                                            className="w-16 [&_.ant-input-number-input]:text-center"
                                                            controls={false}
                                                            variant="outlined"
                                                            styles={{ root: { boxShadow: 'none' } }}
                                                            min={minimumEditableQuantity}
                                                            max={
                                                                item.is_new
                                                                    ? item.available_stock
                                                                    : undefined
                                                            }
                                                            precision={0}
                                                            value={item.quantity}
                                                            onChange={(value) =>
                                                                onQuantityChange(
                                                                    item.product_id,
                                                                    typeof value === 'number' ? value : null
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                onQuantityChange(item.product_id, item.quantity)
                                                            }
                                                            onPressEnter={() =>
                                                                onQuantityChange(item.product_id, item.quantity)
                                                            }
                                                        />
                                                        <Tooltip title="Aumentar cantidad">
                                                            <Button
                                                                variant="primary"
                                                                styles={{ root: { boxShadow: 'none' } }}
                                                                aria-label={'Aumentar cantidad de ' + item.name}
                                                                icon={<PlusOutlined />}
                                                                disabled={!canIncrease}
                                                                action={() =>
                                                                    onQuantityChange(
                                                                        item.product_id,
                                                                        item.quantity + 1
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </Space.Compact>
                                                </div>
                                            )}
                                        </div>

                                        {(item.delivered_quantity > 0 ||
                                            item.active_committed_quantity > 0 ||
                                            item.minimum_quantity > 0) && (
                                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                                {item.delivered_quantity > 0 && (
                                                    <Tag>Entregadas: {item.delivered_quantity}</Tag>
                                                )}
                                                {item.active_committed_quantity > 0 && (
                                                    <Tag color="blue">
                                                        Comprometidas: {item.active_committed_quantity}
                                                    </Tag>
                                                )}
                                                <Tag color="gold">
                                                    Cantidad mínima: {item.minimum_quantity}
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card title="Información del pedido">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Cliente">{order.customer.name}</Descriptions.Item>
                            <Descriptions.Item label="Pedido">{order.operation_number}</Descriptions.Item>
                            <Descriptions.Item label="Estado">
                                <OrderStatusBadge status={order.status} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Creado">
                                {formatDate(order.created_at)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fecha de entrega">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span>{formatDateShort(requestedDeliveryDate)}</span>
                                    {deliveryDateChanged && <Tag color="gold">Pendiente</Tag>}
                                    {editability.delivery_date_editable ? (
                                        <Tooltip title="Reprogramar fecha de entrega">
                                            <Button
                                                variant="primary"
                                                size="small"
                                                shape="square"
                                                aria-label="Reprogramar fecha de entrega"
                                                icon={<EditOutlined />}
                                                disabled={saving}
                                                action={() => setDeliveryDateModalOpen(true)}
                                            />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title={editability.delivery_date_block_message || undefined}>
                                            <LockOutlined className="text-amber-600" />
                                        </Tooltip>
                                    )}
                                </div>
                            </Descriptions.Item>
                        </Descriptions>
                        {!editability.delivery_date_editable &&
                            editability.delivery_date_block_message && (
                                <p className="text-xs text-amber-700 mt-3 mb-0">
                                    {editability.delivery_date_block_message}
                                </p>
                            )}
                    </Card>

                    <Card title="Resumen económico">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-semibold">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pagado</span>
                                <span>{formatCurrency(order.paid_amount)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                                <span>Saldo pendiente</span>
                                <span className={pendingAmount > 0 ? 'text-amber-600' : ''}>
                                    {formatCurrency(pendingAmount)}
                                </span>
                            </div>
                        </div>
                        {canCollect && pendingAmount > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <Tooltip
                                    title={
                                        isDirty
                                            ? 'Guardá los cambios del pedido antes de registrar un pago.'
                                            : undefined
                                    }
                                >
                                    <span className="inline-block w-full">
                                        <Button
                                            variant="default"
                                            className="w-full"
                                            label="Agregar pago"
                                            disabled={isDirty || saving}
                                            action={onOpenPayment}
                                        />
                                    </span>
                                </Tooltip>
                            </div>
                        )}
                    </Card>
                    {editable && isDesktopLayout && (
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                label="Guardar cambios"
                                loading={saving}
                                disabled={!isDirty || finalItemsCount === 0}
                                action={onSave}
                            />
                        </div>
                    )}
                </div>
            </div>

            {editable && !isDesktopLayout && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-end">
                        <Button
                            variant="primary"
                            label="Guardar cambios"
                            loading={saving}
                            disabled={!isDirty || finalItemsCount === 0}
                            action={onSave}
                        />
                    </div>
                </div>
            )}

            {editability.delivery_date_editable && (
                <OrderDeliveryDateModal
                    key={deliveryDateModalOpen ? 'open' : 'closed'}
                    open={deliveryDateModalOpen}
                    originalDate={order.requested_delivery_date}
                    draft={{
                        requestedDeliveryDate,
                        reason: deliveryDateReason,
                        observation: deliveryDateObservation,
                    }}
                    onClose={() => setDeliveryDateModalOpen(false)}
                    onApply={(deliveryDateDraft) => {
                        onApplyDeliveryDateChange(deliveryDateDraft);
                        setDeliveryDateModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};
