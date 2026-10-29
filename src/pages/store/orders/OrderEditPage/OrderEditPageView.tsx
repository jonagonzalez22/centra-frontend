import { useEffect, useRef, useState } from 'react';
import { DeleteOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import {
    Alert,
    Descriptions,
    Empty,
    Input,
    message,
    Popconfirm,
    Select,
    Spin,
    Tag,
    Tooltip,
} from 'antd';
import { Search } from 'lucide-react';
import { Button } from '@/components/Button';
import Card from '@/components/Card/Card';
import { QuantityInput } from '@/components/QuantityInput';
import { OrderStatusBadge } from '@/features/store/orders/components/OrderStatusBadge';
import type { OrderProductDraftItem } from '@/features/store/orders/hooks/useOrderProductDraft';
import type {
    CommercialProductDetail,
    CommercialProductSearchItem,
} from '@/features/store/orders/interfaces/commercial-product.interface';
import type {
    DeliveryDateChangeReason,
    OrderDetail,
    OrderEditability,
} from '@/features/store/orders/interfaces/order.interface';
import { CommercialProductsService } from '@/features/store/orders/services/commercial-products.service';
import { formatCurrency, formatDate, formatDateShort } from '@/utils/formatters';
import {
    addDecimalStrings,
    compareDecimalStrings,
    formatQuantityForDisplay,
    formatQuantityWithUnit,
    isMultipleOfDecimalStrings,
    maxDecimalStrings,
} from '@/utils/quantity';
import type { DecimalString } from '@/types/decimal';
import type { PriceList } from '@/features/store/price-lists/types/priceList.types';
import { formatDiscountPercentage } from '@/features/store/price-lists/types/priceList.types';
import { OrderDeliveryDateModal } from './OrderDeliveryDateModal';

interface Props {
    order: OrderDetail;
    editability: OrderEditability;
    draft: OrderProductDraftItem[];
    saving: boolean;
    busyItemIds: Record<string, boolean>;
    saveError: string | null;
    requestedDeliveryDate: string | null;
    deliveryDateReason: DeliveryDateChangeReason | null;
    deliveryDateObservation: string;
    canCollect: boolean;
    availablePriceLists: PriceList[];
    selectedPriceListId: string | null;
    onSelectedPriceListChange: (id: string | null) => void;
    onQuantityChange: (operationItemId: string, quantity: DecimalString | null) => Promise<boolean>;
    onAddProduct: (product: CommercialProductDetail) => Promise<boolean>;
    onRemoveProduct: (operationItemId: string) => Promise<boolean>;
    onChangeItemPriceList: (
        operationItemId: string,
        priceListId: string | null
    ) => Promise<boolean>;
    onApplyDeliveryDateChange: (draft: {
        requestedDeliveryDate: string;
        reason: DeliveryDateChangeReason | null;
        observation: string;
    }) => Promise<boolean>;
    onOpenPayment: () => void;
}

export const OrderEditPageView = ({
    order,
    editability,
    draft,
    saving,
    busyItemIds,
    saveError,
    requestedDeliveryDate,
    deliveryDateReason,
    deliveryDateObservation,
    canCollect,
    availablePriceLists,
    selectedPriceListId,
    onSelectedPriceListChange,
    onQuantityChange,
    onAddProduct,
    onRemoveProduct,
    onChangeItemPriceList,
    onApplyDeliveryDateChange,
    onOpenPayment,
}: Props) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CommercialProductSearchItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [deliveryDateModalOpen, setDeliveryDateModalOpen] = useState(false);
    const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const editable = editability.editable;
    const pendingAmount = order.pending_amount ?? Math.max(0, order.total - order.paid_amount);
    const activePriceListOptions = [
        { value: '__common__', label: 'Común' },
        ...availablePriceLists.map((list) => ({
            value: list.id,
            label: `${list.name} · ${formatDiscountPercentage(list.discount_percentage)}`,
        })),
    ];

    const changeQuantity = async (item: OrderProductDraftItem, value: DecimalString | null) => {
        if (value === null) return;
        try {
            if (!isMultipleOfDecimalStrings(value, item.sale_quantity_step)) {
                message.error(
                    item.sale_quantity_step === '1.0000'
                        ? 'Este producto se vende por unidad.'
                        : `Este producto se vende en cantidades de ${formatQuantityWithUnit(item.sale_quantity_step, item.stock_measurement_unit_symbol)}.`
                );
                return;
            }
            const maximum = item.maximum_editable_quantity;
            if (compareDecimalStrings(value, maximum) > 0) {
                message.error(
                    `Disponible: ${formatQuantityWithUnit(maximum, item.stock_measurement_unit_symbol)}.`
                );
                return;
            }
            await onQuantityChange(item.operation_item_id, value);
        } catch {
            message.error('Ingresá una cantidad válida.');
        }
    };

    const commitQuantityInput = async (item: OrderProductDraftItem) => {
        await changeQuantity(item, quantityInputs[item.operation_item_id] ?? item.quantity);
        setQuantityInputs((current) => {
            const next = { ...current };
            delete next[item.operation_item_id];
            return next;
        });
    };

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
            if (!(await onAddProduct(product))) {
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
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold m-0">Editar pedido {order.operation_number}</h1>
                <p className="text-gray-500 mt-1">Gestioná los productos del pedido.</p>
            </div>

            {!editable && (
                <Alert
                    type="warning"
                    showIcon
                    title="Este pedido no puede editarse."
                    description={
                        editability.block_message || 'El pedido no está disponible para edición.'
                    }
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card title="Productos del pedido">
                        {editable && (
                            <div className="mb-4 space-y-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                    <div className="relative min-w-0 lg:flex-[3]">
                                        <label
                                            htmlFor="order-product-search"
                                            className="mb-1 block text-sm font-medium"
                                        >
                                            Buscar producto
                                        </label>
                                        <Spin
                                            spinning={searchLoading || detailLoadingId !== null}
                                            size="small"
                                        >
                                            <Input
                                                id="order-product-search"
                                                aria-label="Buscar producto por nombre, SKU o código de barras"
                                                prefix={
                                                    <Search size={16} className="text-gray-400" />
                                                }
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

                                                    if (!showDropdown || results.length === 0)
                                                        return;
                                                    if (event.key === 'ArrowDown') {
                                                        event.preventDefault();
                                                        setActiveIndex((current) =>
                                                            current < results.length - 1
                                                                ? current + 1
                                                                : 0
                                                        );
                                                    } else if (event.key === 'ArrowUp') {
                                                        event.preventDefault();
                                                        setActiveIndex((current) =>
                                                            current > 0
                                                                ? current - 1
                                                                : results.length - 1
                                                        );
                                                    } else if (event.key === 'Escape') {
                                                        setShowDropdown(false);
                                                        setActiveIndex(-1);
                                                    }
                                                }}
                                                onFocus={() =>
                                                    results.length > 0 && setShowDropdown(true)
                                                }
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
                                            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {results.length > 0 ? (
                                                    results.map((product, index) => {
                                                        const productLinesCount = draft.filter(
                                                            (item) => item.product_id === product.id
                                                        ).length;
                                                        const isActive = index === activeIndex;
                                                        const secondary = [
                                                            product.sku,
                                                            product.barcode,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ');

                                                        return (
                                                            <button
                                                                key={product.id}
                                                                type="button"
                                                                aria-label={
                                                                    'Agregar ' + product.name
                                                                }
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
                                                                onMouseEnter={() =>
                                                                    setActiveIndex(index)
                                                                }
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
                                                                {productLinesCount > 0 && (
                                                                    <span className="text-xs text-blue-500 ml-2 whitespace-nowrap">
                                                                        {productLinesCount}{' '}
                                                                        {productLinesCount === 1
                                                                            ? 'línea'
                                                                            : 'líneas'}{' '}
                                                                        en pedido
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
                                    <div className="min-w-0 lg:flex-1">
                                        <label
                                            htmlFor="order-next-price-list"
                                            className="mb-1 block text-sm font-medium"
                                        >
                                            Lista para agregar
                                        </label>
                                        <Select
                                            id="order-next-price-list"
                                            aria-label="Lista para agregar"
                                            className="w-full"
                                            value={selectedPriceListId ?? '__common__'}
                                            options={activePriceListOptions}
                                            onChange={(value) =>
                                                onSelectedPriceListChange(
                                                    value === '__common__' ? null : value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                {query.trim().length > 0 && query.trim().length < 2 && (
                                    <p className="text-xs text-gray-500 m-0">
                                        Ingresá al menos 2 caracteres para buscar.
                                    </p>
                                )}
                                {searchError && (
                                    <Alert type="warning" showIcon title={searchError} />
                                )}
                            </div>
                        )}

                        {saveError && (
                            <Alert className="mb-4" type="error" showIcon title={saveError} />
                        )}
                        <div className="space-y-3">
                            {draft.map((item) => {
                                const isBusy = Boolean(busyItemIds[item.operation_item_id]);
                                const canRemove =
                                    editable &&
                                    compareDecimalStrings(item.minimum_quantity, '0.0000') === 0;
                                const minimumEditableQuantity = maxDecimalStrings(
                                    item.minimum_quantity,
                                    item.sale_quantity_step
                                );
                                const canIncrease =
                                    editable &&
                                    compareDecimalStrings(
                                        addDecimalStrings(item.quantity, item.sale_quantity_step),
                                        item.maximum_editable_quantity
                                    ) <= 0;
                                const listLabel =
                                    item.price_list_id === null
                                        ? 'Común'
                                        : `${item.price_list_name ?? 'Lista de precios'} · ${formatDiscountPercentage(String(item.discount_percentage))}`;
                                const linePriceListOptions =
                                    item.price_list_id &&
                                    !availablePriceLists.some(
                                        (list) => list.id === item.price_list_id
                                    )
                                        ? [
                                              ...activePriceListOptions,
                                              {
                                                  value: item.price_list_id,
                                                  label: `${listLabel} · Inactiva`,
                                                  disabled: true,
                                              },
                                          ]
                                        : activePriceListOptions;
                                const netSubtotal = Math.max(
                                    0,
                                    item.subtotal - item.discount_amount
                                );

                                return (
                                    <div
                                        key={item.operation_item_id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                                            <div className="min-w-0">
                                                <p className="font-semibold mb-1">{item.name}</p>
                                                {item.sku && (
                                                    <p className="text-xs text-gray-500 m-0">
                                                        SKU: {item.sku}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                    <span>
                                                        Precio: {formatCurrency(item.price)}
                                                        {item.stock_measurement_unit_symbol
                                                            ? `/${item.stock_measurement_unit_symbol}`
                                                            : ''}
                                                    </span>
                                                    {item.discount_amount > 0 && (
                                                        <span className="text-emerald-700">
                                                            Descuento: -
                                                            {formatCurrency(item.discount_amount)}
                                                        </span>
                                                    )}
                                                    <span className="font-medium text-gray-900">
                                                        Subtotal: {formatCurrency(netSubtotal)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                                                {editable ? (
                                                    <Select
                                                        aria-label={`Lista de precios de ${item.name} · ${listLabel}`}
                                                        className="w-full min-w-48 sm:w-56"
                                                        value={item.price_list_id ?? '__common__'}
                                                        options={linePriceListOptions}
                                                        disabled={isBusy}
                                                        onChange={(value) =>
                                                            void onChangeItemPriceList(
                                                                item.operation_item_id,
                                                                value === '__common__'
                                                                    ? null
                                                                    : value
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        {listLabel}
                                                    </span>
                                                )}
                                                {editable && (
                                                    <QuantityInput
                                                        ariaLabel={`Cantidad de ${item.name} · ${listLabel}`}
                                                        value={
                                                            quantityInputs[
                                                                item.operation_item_id
                                                            ] ?? item.quantity
                                                        }
                                                        min={minimumEditableQuantity}
                                                        max={item.maximum_editable_quantity}
                                                        step={item.sale_quantity_step}
                                                        onChange={(value) =>
                                                            setQuantityInputs((current) => ({
                                                                ...current,
                                                                [item.operation_item_id]:
                                                                    value ?? '',
                                                            }))
                                                        }
                                                        onCommit={() =>
                                                            void commitQuantityInput(item)
                                                        }
                                                        onDecrease={() =>
                                                            void onQuantityChange(
                                                                item.operation_item_id,
                                                                addDecimalStrings(
                                                                    item.quantity,
                                                                    `-${item.sale_quantity_step}`
                                                                )
                                                            )
                                                        }
                                                        onIncrease={() =>
                                                            void changeQuantity(
                                                                item,
                                                                addDecimalStrings(
                                                                    item.quantity,
                                                                    item.sale_quantity_step
                                                                )
                                                            )
                                                        }
                                                        decreaseAriaLabel={`Reducir cantidad de ${item.name} · ${listLabel}`}
                                                        increaseAriaLabel={`Aumentar cantidad de ${item.name} · ${listLabel}`}
                                                        decreaseDisabled={
                                                            isBusy ||
                                                            compareDecimalStrings(
                                                                addDecimalStrings(
                                                                    item.quantity,
                                                                    `-${item.sale_quantity_step}`
                                                                ),
                                                                minimumEditableQuantity
                                                            ) < 0
                                                        }
                                                        increaseDisabled={isBusy || !canIncrease}
                                                        disabled={isBusy}
                                                        unitSymbol={
                                                            item.stock_measurement_unit_symbol
                                                        }
                                                    />
                                                )}
                                                {canRemove && (
                                                    <Popconfirm
                                                        title="¿Quitar línea del pedido?"
                                                        okText="Quitar"
                                                        cancelText="Cancelar"
                                                        onConfirm={() =>
                                                            onRemoveProduct(item.operation_item_id)
                                                        }
                                                    >
                                                        <Button
                                                            variant="text"
                                                            danger
                                                            disabled={isBusy}
                                                            aria-label={`Eliminar ${item.name} · ${listLabel}`}
                                                            icon={<DeleteOutlined />}
                                                        />
                                                    </Popconfirm>
                                                )}
                                            </div>
                                        </div>

                                        {(compareDecimalStrings(item.delivered_quantity, '0.0000') >
                                            0 ||
                                            compareDecimalStrings(
                                                item.active_committed_quantity,
                                                '0.0000'
                                            ) > 0 ||
                                            compareDecimalStrings(item.minimum_quantity, '0.0000') >
                                                0) && (
                                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                                {compareDecimalStrings(
                                                    item.delivered_quantity,
                                                    '0.0000'
                                                ) > 0 && (
                                                    <Tag>
                                                        Entregadas:{' '}
                                                        {formatQuantityForDisplay(
                                                            item.delivered_quantity
                                                        )}
                                                    </Tag>
                                                )}
                                                {compareDecimalStrings(
                                                    item.active_committed_quantity,
                                                    '0.0000'
                                                ) > 0 && (
                                                    <Tag color="blue">
                                                        Comprometidas:{' '}
                                                        {formatQuantityForDisplay(
                                                            item.active_committed_quantity
                                                        )}
                                                    </Tag>
                                                )}
                                                <Tag color="gold">
                                                    Cantidad mínima:{' '}
                                                    {formatQuantityForDisplay(
                                                        item.minimum_quantity
                                                    )}
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
                            <Descriptions.Item label="Cliente">
                                {order.customer.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Pedido">
                                {order.operation_number}
                            </Descriptions.Item>
                            <Descriptions.Item label="Estado">
                                <OrderStatusBadge status={order.status} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Creado">
                                {formatDate(order.created_at)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Fecha de entrega">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span>{formatDateShort(requestedDeliveryDate)}</span>
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
                                        <Tooltip
                                            title={
                                                editability.delivery_date_block_message || undefined
                                            }
                                        >
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
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                    <span>Descuentos</span>
                                    <span>-{formatCurrency(order.discount)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{formatCurrency(order.total)}</span>
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
                                        saving || Object.values(busyItemIds).some(Boolean)
                                            ? 'Esperá a que termine la actualización actual.'
                                            : undefined
                                    }
                                >
                                    <span className="inline-block w-full">
                                        <Button
                                            variant="default"
                                            className="w-full"
                                            label="Agregar pago"
                                            disabled={
                                                saving || Object.values(busyItemIds).some(Boolean)
                                            }
                                            action={onOpenPayment}
                                        />
                                    </span>
                                </Tooltip>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

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
                    saving={saving}
                    onClose={() => setDeliveryDateModalOpen(false)}
                    onApply={async (deliveryDateDraft) => {
                        if (await onApplyDeliveryDateChange(deliveryDateDraft)) {
                            setDeliveryDateModalOpen(false);
                        }
                    }}
                />
            )}
        </div>
    );
};
