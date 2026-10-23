import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Breadcrumb,
    Empty,
    Grid,
    Input,
    InputNumber,
    Modal,
    Pagination,
    Segmented,
    Select,
    Spin,
    Table,
    Tag,
    message,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import { QuantityInput } from '@/components/QuantityInput';
import { usePermissions } from '@/hooks/usePermissions';
import { addDecimalStrings, compareDecimalStrings } from '@/utils/quantity';
import { SuppliersService, type Supplier } from '@/features/store/suppliers/suppliers.service';
import {
    SupplierProductsService,
    type SupplierProductCandidate,
    type SupplierProduct,
} from '@/features/store/suppliers/supplierProducts.service';
import {
    PurchasesService,
    type PurchaseDraftPayload,
    type PurchaseType,
} from '@/features/store/purchases/purchases.service';
import { SupplierCodeEditor } from './SupplierCodeEditor';
import './PurchaseFormPage.css';

type SupplierOption = Pick<Supplier, 'id' | 'business_name' | 'tax_id' | 'is_active'>;

type DraftLine = {
    productId: string;
    productName: string;
    productSku: string;
    supplierCode: string | null;
    supplierProductName: string | null;
    unit: string;
    quantity: string;
    unitPrice: string;
};

type CatalogProduct = {
    id: string;
    name: string;
    sku: string;
    unit: string;
    supplierCode: string | null;
    supplierProductName: string | null;
    isAssociated: boolean;
    isActive: boolean;
};

type CatalogResult = {
    items: CatalogProduct[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
};

const emptyCatalogResult: CatalogResult = { items: [], total: 0, current_page: 1, per_page: 20, last_page: 1 };


const parseScaled = (value: string, scale: number): bigint | null => {
    const normalized = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
    const [integer, fraction = ''] = normalized.split('.');
    if (fraction.length > scale) return null;
    return BigInt(`${integer}${fraction.padEnd(scale, '0')}`);
};

const toQuantity = (value: string) => {
    const scaled = parseScaled(value, 4);
    if (scaled === null || scaled <= 0n) return null;
    return `${scaled / 10000n}.${(scaled % 10000n).toString().padStart(4, '0')}`;
};

const toMoney = (value: string) => {
    const scaled = parseScaled(value, 2);
    if (scaled === null) return null;
    return `${scaled / 100n}.${(scaled % 100n).toString().padStart(2, '0')}`;
};

const subtotal = (quantity: string, unitPrice: string) => {
    const quantityScaled = parseScaled(quantity, 4);
    const priceCents = parseScaled(unitPrice, 2);
    if (quantityScaled === null || priceCents === null) return null;
    const product = quantityScaled * priceCents;
    const cents = (product + 5000n) / 10000n;
    return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
};

const total = (items: DraftLine[]) => {
    const cents = items.reduce((sum, item) => {
        const lineSubtotal = subtotal(item.quantity, item.unitPrice);
        const value = lineSubtotal ? parseScaled(lineSubtotal, 2) : null;
        return sum + (value ?? 0n);
    }, 0n);
    return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
};

const formatMoney = (value: string) => {
    const [integer, fraction = '00'] = value.split('.');
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$ ${grouped},${fraction.padEnd(2, '0')}`;
};

const formatMoneyInput = (value: string | number | undefined) => {
    if (value === undefined || value === '') return '';
    const rawValue = String(value);
    // Do not rewrite incomplete input such as "4," while the user is typing.
    if (!/^\d+(?:\.\d{1,2})?$/.test(rawValue)) return rawValue;
    const normalized = toMoney(rawValue);
    return normalized ? formatMoney(normalized).replace(/^\$\s/, '') : rawValue;
};

const parseMoneyInput = (value: string | undefined) => {
    const rawValue = value?.replace(/[^\d,.-]/g, '') ?? '';
    return rawValue.includes(',')
        ? rawValue.replace(/\./g, '').replace(',', '.')
        : rawValue;
};

const catalogFromAssociation = (association: SupplierProduct): CatalogProduct => ({
    id: association.product.id,
    name: association.product.name,
    sku: association.product.sku,
    unit: association.product.stock_measurement_unit?.symbol ?? '—',
    supplierCode: association.supplier_code,
    supplierProductName: association.supplier_product_name,
    isAssociated: true,
    isActive: association.product.is_active,
});

const catalogFromCandidate = (product: SupplierProductCandidate): CatalogProduct => {
    // Supplier-product metadata belongs only to the current supplier relation.
    // An unassociated candidate always starts a new relation with empty metadata.
    const supplierProduct = product.is_associated ? product.supplier_product : null;

    return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.stock_measurement_unit?.symbol ?? '—',
        supplierCode: supplierProduct?.supplier_code ?? null,
        supplierProductName: supplierProduct?.supplier_product_name ?? null,
        isAssociated: product.is_associated,
        isActive: product.is_active,
    };
};

const emptySignature = JSON.stringify({ supplierId: '', purchaseType: 'order', notes: '', items: [] });

const apiMessage = (error: unknown, fallback: string) => {
    const response = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
    return response.response?.data?.errors?.supplier_id?.[0]
        || response.response?.data?.errors?.items?.[0]
        || response.response?.data?.message
        || fallback;
};

export const PurchaseFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const editing = Boolean(id);
    const { can } = usePermissions();
    const screens = Grid.useBreakpoint();
    const [purchaseType, setPurchaseType] = useState<PurchaseType>('order');
    const [supplierId, setSupplierId] = useState<string>();
    const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [productScope, setProductScope] = useState<'supplier' | 'all'>('supplier');
    const [productOptions, setProductOptions] = useState<SupplierProduct[]>([]);
    const [globalProductOptions, setGlobalProductOptions] = useState<CatalogProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [items, setItems] = useState<DraftLine[]>([]);
    const [priceErrors, setPriceErrors] = useState<Record<string, boolean>>({});
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkScope, setBulkScope] = useState<'supplier' | 'all'>('supplier');
    const [bulkResult, setBulkResult] = useState<CatalogResult>(emptyCatalogResult);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkSearch, setBulkSearch] = useState('');
    const [bulkPage, setBulkPage] = useState(1);
    const [bulkPerPage, setBulkPerPage] = useState(20);
    const [bulkSelection, setBulkSelection] = useState<Record<string, CatalogProduct>>({});
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(editing);
    const [purchaseNumber, setPurchaseNumber] = useState<string>();
    const [saving, setSaving] = useState(false);
    const [pendingSupplierChange, setPendingSupplierChange] = useState<{ id?: string } | null>(null);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [initialSignature, setInitialSignature] = useState(emptySignature);

    const signature = useMemo(
        () => JSON.stringify({ supplierId: supplierId ?? '', purchaseType, notes, items }),
        [supplierId, purchaseType, notes, items]
    );
    const hasChanges = signature !== initialSignature;

    const searchSuppliers = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSupplierOptions((current) => current.filter((supplier) => supplier.id === supplierId));
            return;
        }
        setSuppliersLoading(true);
        try {
            const result = await SuppliersService.getAll({ search: query, is_active: true });
            setSupplierOptions(result.filter((supplier) => supplier.is_active));
        } catch {
            setSupplierOptions([]);
        } finally {
            setSuppliersLoading(false);
        }
    }, [supplierId]);
    const debouncedSupplierSearch = useMemo(() => debounce((query: string) => void searchSuppliers(query), 300), [searchSuppliers]);
    useEffect(() => () => debouncedSupplierSearch.cancel(), [debouncedSupplierSearch]);

    const searchProducts = useCallback(async (currentSupplierId: string, query: string) => {
        setProductsLoading(true);
        try {
            const result = await SupplierProductsService.getAll(currentSupplierId, {
                search: query || undefined,
                page: 1,
                per_page: 20,
            });
            setProductOptions(
                result.items.filter(
                    (association) => association.product.is_active
                        && !items.some((item) => item.productId === association.product.id)
                )
            );
        } catch {
            setProductOptions([]);
        } finally {
            setProductsLoading(false);
        }
    }, [items]);
    const debouncedProductSearch = useMemo(
        () => debounce((currentSupplierId: string, query: string) => void searchProducts(currentSupplierId, query), 300),
        [searchProducts]
    );
    useEffect(() => () => debouncedProductSearch.cancel(), [debouncedProductSearch]);

    const searchAllProducts = useCallback(async (currentSupplierId: string, query: string) => {
        setProductsLoading(true);
        try {
            const result = await SupplierProductsService.getCandidates(currentSupplierId, {
                search: query || undefined,
                include_associated: 1,
                page: 1,
                per_page: 20,
            });
            setGlobalProductOptions(result.items
                .map(catalogFromCandidate)
                .filter((product) => !items.some((item) => item.productId === product.id)));
        } catch {
            setGlobalProductOptions([]);
        } finally {
            setProductsLoading(false);
        }
    }, [items]);
    const debouncedGlobalProductSearch = useMemo(
        () => debounce((currentSupplierId: string, query: string) => void searchAllProducts(currentSupplierId, query), 300),
        [searchAllProducts]
    );
    useEffect(() => () => debouncedGlobalProductSearch.cancel(), [debouncedGlobalProductSearch]);

    const loadBulkProducts = useCallback(async (page = 1, query = '', perPage = 20, scope = bulkScope) => {
        if (!supplierId) return;
        setBulkLoading(true);
        try {
            if (scope === 'supplier') {
                const result = await SupplierProductsService.getAll(supplierId, { search: query || undefined, page, per_page: perPage });
                setBulkResult({ ...result, items: result.items.map(catalogFromAssociation) });
            } else {
                const result = await SupplierProductsService.getCandidates(supplierId, {
                    search: query || undefined,
                    include_associated: 1,
                    page,
                    per_page: perPage,
                });
                setBulkResult({ ...result, items: result.items.map(catalogFromCandidate) });
            }
        } catch {
            setBulkResult({ ...emptyCatalogResult, current_page: page, per_page: perPage });
            message.error(scope === 'supplier' ? 'No se pudieron cargar los productos del proveedor.' : 'No se pudieron cargar los productos.');
        } finally {
            setBulkLoading(false);
        }
    }, [bulkScope, supplierId]);
    const debouncedBulkSearch = useMemo(
        () => debounce((query: string) => void loadBulkProducts(1, query, bulkPerPage), 300),
        [loadBulkProducts, bulkPerPage]
    );
    useEffect(() => () => debouncedBulkSearch.cancel(), [debouncedBulkSearch]);

    const resetBulk = () => {
        setBulkOpen(false);
        setBulkSelection({});
        setBulkSearch('');
        setBulkPage(1);
        setBulkPerPage(20);
        setBulkScope('supplier');
        setBulkResult(emptyCatalogResult);
        debouncedBulkSearch.cancel();
    };

    const openBulk = () => {
        setBulkSelection({});
        setBulkSearch('');
        setBulkPage(1);
        setBulkPerPage(20);
        setBulkOpen(true);
        void loadBulkProducts(1, '', 20, 'supplier');
    };

    useEffect(() => {
        if (!id) return;
        let active = true;
        void PurchasesService.getById(id).then((purchase) => {
            if (!active) return;
            if (purchase.status !== 'draft') {
                message.error('Solo se pueden editar compras en borrador.');
                navigate(`/tienda/compras/${purchase.id}`, { replace: true });
                return;
            }
            const nextItems = purchase.items.map((item) => ({
                productId: item.product_id,
                productName: item.product_name,
                productSku: item.product_sku,
                supplierCode: item.supplier_code,
                supplierProductName: item.supplier_product_name,
                unit: item.measurement_unit_symbol,
                quantity: item.quantity_ordered,
                unitPrice: item.unit_price,
            }));
            setPurchaseType(purchase.purchase_type);
            setPurchaseNumber(purchase.purchase_number);
            setSupplierId(purchase.supplier.id);
            setSupplierOptions([{ ...purchase.supplier, is_active: true }]);
            setNotes(purchase.notes ?? '');
            setItems(nextItems);
            setInitialSignature(JSON.stringify({ supplierId: purchase.supplier.id, purchaseType: purchase.purchase_type, notes: purchase.notes ?? '', items: nextItems }));
        }).catch(() => {
            message.error('No se pudo cargar la compra.');
            navigate('/tienda/compras', { replace: true });
        }).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [id, navigate]);

    const chooseSupplier = (nextId?: string) => {
        if (nextId === supplierId) return;
        if (items.length) {
            setPendingSupplierChange({ id: nextId });
            return;
        }
        setSupplierId(nextId);
        setProductSearch('');
        setProductScope('supplier');
        setProductOptions([]);
        setGlobalProductOptions([]);
        resetBulk();
    };

    const createDraftLine = (product: CatalogProduct): DraftLine => ({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        supplierCode: product.supplierCode,
        supplierProductName: product.supplierProductName,
        unit: product.unit,
        quantity: '1.0000',
        unitPrice: '',
    });

    const addProduct = (associationId: string) => {
        const association = productOptions.find((item) => item.id === associationId);
        if (!association || items.some((item) => item.productId === association.product.id)) return;
        setItems((current) => current.some((line) => line.productId === association.product.id)
            ? current
            : [...current, createDraftLine(catalogFromAssociation(association))]);
        setProductSearch('');
        setProductOptions([]);
    };

    const addGlobalProduct = async (productId: string) => {
        const product = globalProductOptions.find((candidate) => candidate.id === productId);
        if (!product || items.some((item) => item.productId === product.id)) return;
        if (!product.isAssociated && !can('suppliers.edit')) {
            message.error('No tenés permiso para vincular productos a este proveedor.');
            return;
        }
        try {
            if (!product.isAssociated && supplierId) {
                await SupplierProductsService.bulkCreate(supplierId, [product.id]);
            }
            setItems((current) => current.some((line) => line.productId === product.id) ? current : [...current, createDraftLine(product)]);
            setProductSearch('');
            setGlobalProductOptions([]);
        } catch {
            message.error('No se pudo vincular el producto al proveedor.');
        }
    };

    const addBulkProducts = async () => {
        const selected = Object.values(bulkSelection).filter((product) => !items.some((item) => item.productId === product.id));
        const missingAssociationIds = selected.filter((product) => !product.isAssociated).map((product) => product.id);
        if (missingAssociationIds.length && !can('suppliers.edit')) {
            message.error('No tenés permiso para vincular productos a este proveedor.');
            return;
        }
        try {
            if (missingAssociationIds.length && supplierId) await SupplierProductsService.bulkCreate(supplierId, missingAssociationIds);
        } catch {
            message.error('No se pudieron vincular los productos al proveedor.');
            return;
        }
        setItems((current) => {
            const currentIds = new Set(current.map((item) => item.productId));
            return [...current, ...selected.filter((product) => !currentIds.has(product.id)).map(createDraftLine)];
        });
        resetBulk();
    };

    const updateItem = (productId: string, field: 'quantity' | 'unitPrice', value: string | null) =>
        setItems((current) => current.map((item) => item.productId === productId ? { ...item, [field]: value ?? '' } : item));

    const updateUnitPrice = (productId: string, value: string | null) => {
        updateItem(productId, 'unitPrice', value);
        setPriceErrors((current) => ({ ...current, [productId]: false }));
    };

    const updateSupplierCode = async (item: DraftLine, supplierCode: string | null) => {
        if (!supplierId) return;

        try {
            const associations = await SupplierProductsService.getAll(supplierId, {
                search: item.productSku,
                page: 1,
                per_page: 20,
            });
            const association = associations.items.find((candidate) => candidate.product.id === item.productId);
            if (!association) {
                throw new Error('La relación entre el producto y el proveedor ya no existe.');
            }

            const updated = await SupplierProductsService.update(supplierId, association.id, {
                supplier_code: supplierCode,
            });
            setItems((current) => current.map((line) => line.productId === item.productId
                ? { ...line, supplierCode: updated.supplier_code }
                : line));
            message.success('Código de proveedor actualizado.');
        } catch (error) {
            message.error(apiMessage(error, 'No se pudo actualizar el código de proveedor.'));
            throw error;
        }
    };

    const commitPurchaseQuantity = (productId: string, value: string) => {
        const normalized = toQuantity(value);
        if (normalized) updateItem(productId, 'quantity', normalized);
    };

    const changePurchaseQuantity = (item: DraftLine, direction: 1 | -1) => {
        const normalized = toQuantity(item.quantity);
        if (!normalized) return;
        const next = addDecimalStrings(normalized, direction === 1 ? '1.0000' : '-1.0000');
        if (compareDecimalStrings(next, '0.0000') > 0) updateItem(item.productId, 'quantity', next);
    };

    const save = async () => {
        const payloadItems = items.map((item) => ({
            product_id: item.productId,
            quantity: toQuantity(item.quantity),
            unit_price: toMoney(item.unitPrice),
        }));
        const missingPriceIds = payloadItems
            .filter((item) => !item.unit_price)
            .map((item) => item.product_id);
        if (missingPriceIds.length) {
            setPriceErrors(Object.fromEntries(missingPriceIds.map((productId) => [productId, true])));
            message.error('Ingresa el precio unitario.');
            return;
        }
        if (!supplierId || !payloadItems.length || payloadItems.some((item) => !item.quantity)) {
            message.error('Completá el proveedor, los productos y las cantidades.');
            return;
        }
        const payload: PurchaseDraftPayload = {
            supplier_id: supplierId,
            purchase_type: purchaseType,
            notes: notes.trim() || null,
            items: payloadItems as PurchaseDraftPayload['items'],
        };
        setSaving(true);
        try {
            const purchase = editing && id
                ? await PurchasesService.update(id, payload)
                : await PurchasesService.create(payload);
            message.success(editing ? 'Compra actualizada correctamente.' : 'Compra guardada correctamente.');
            navigate(`/tienda/compras/${purchase.id}`);
        } catch (error) {
            message.error(apiMessage(error, editing ? 'No se pudo actualizar la compra.' : 'No se pudo guardar la compra.'));
        } finally {
            setSaving(false);
        }
    };

    const leave = () => {
        if (hasChanges) setDiscardOpen(true);
        else navigate('/tienda/compras');
    };

    if (loading) return <div className="flex justify-center py-20" data-testid="purchase-page-loading"><Spin size="large" /></div>;

    const hasUnpricedItems = items.some((item) => !toMoney(item.unitPrice));
    const isMobile = !screens.md;
    const supplierCodeControl = (item: DraftLine) => can('suppliers.edit') && supplierId
        ? <SupplierCodeEditor
            supplierName={supplierOptions.find((supplier) => supplier.id === supplierId)?.business_name ?? 'este proveedor'}
            productName={item.productName}
            value={item.supplierCode}
            onSave={(supplierCode) => updateSupplierCode(item, supplierCode)}
        />
        : item.supplierCode || '—';
    const quantityControl = (item: DraftLine) => {
        const normalized = toQuantity(item.quantity);
        return <QuantityInput
            ariaLabel={`Cantidad de ${item.productName}`}
            value={item.quantity}
            min="0.0001"
            step="1.0000"
            onChange={(value) => updateItem(item.productId, 'quantity', value)}
            onCommit={() => commitPurchaseQuantity(item.productId, item.quantity)}
            onDecrease={() => changePurchaseQuantity(item, -1)}
            onIncrease={() => changePurchaseQuantity(item, 1)}
            decreaseAriaLabel={`Reducir cantidad de ${item.productName}`}
            increaseAriaLabel={`Aumentar cantidad de ${item.productName}`}
            decreaseDisabled={!normalized || compareDecimalStrings(normalized, '1.0000') <= 0}
        />;
    };
    const priceControl = (item: DraftLine) => <div>
        <InputNumber<string>
            stringMode
            aria-label={`Precio de ${item.productName}`}
            className="w-full"
            min="0"
            precision={2}
            prefix="$"
            placeholder="Precio"
            status={priceErrors[item.productId] ? 'error' : undefined}
            value={item.unitPrice}
            formatter={formatMoneyInput}
            parser={parseMoneyInput}
            onChange={(value) => updateUnitPrice(item.productId, value)}
        />
        {priceErrors[item.productId] && <div className="mt-1 text-xs text-red-600">Ingresa el precio unitario.</div>}
    </div>;
    const removeItem = (item: DraftLine) => setItems((current) => current.filter((line) => line.productId !== item.productId));

    return <div className="w-full">
        <div className="mb-6">
            <Breadcrumb className="mb-2" items={editing && purchaseNumber ? [
                { title: <Link to="/tienda/dashboard">Tienda</Link> },
                { title: <Link to="/tienda/compras">Compras</Link> },
                { title: <Link to={`/tienda/compras/${id}`}>{purchaseNumber}</Link> },
                { title: 'Editar' },
            ] : [
                { title: <Link to="/tienda/dashboard">Tienda</Link> },
                { title: <Link to="/tienda/compras">Compras</Link> },
                { title: 'Nueva compra' },
            ]} />
            <h1 className="m-0 text-2xl font-bold text-centra-primary">{editing ? 'Editar compra' : 'Nueva compra'}</h1>
            <p className="m-0 mt-1 text-sm text-centra-text/60">Registra una compra u orden a un proveedor</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <label className="mb-1 block text-sm font-medium">Tipo de compra</label>
                <Select value={purchaseType} className="w-full" onChange={setPurchaseType} options={[
                    { value: 'order', label: 'Orden de compra' },
                    { value: 'direct', label: 'Compra directa' },
                ]} />
                <p className="mb-0 mt-1 text-xs text-gray-500">{purchaseType === 'order' ? 'El pedido se enviará al proveedor y se recibirá posteriormente.' : 'El stock se actualizará cuando se confirme la recepción.'}</p>
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Proveedor</label>
                <Select
                    aria-label="Proveedor"
                    className="w-full"
                    showSearch
                    allowClear
                    filterOption={false}
                    value={supplierId}
                    searchValue={supplierSearch}
                    onSearch={(value) => { setSupplierSearch(value); debouncedSupplierSearch(value); }}
                    onChange={(value) => { setSupplierSearch(''); chooseSupplier(value); }}
                    notFoundContent={suppliersLoading ? <Spin size="small" /> : 'Buscá un proveedor activo'}
                    options={supplierOptions.map((supplier) => ({ value: supplier.id, label: <span>{supplier.business_name}{supplier.tax_id ? <span className="text-gray-500"> · CUIT {supplier.tax_id}</span> : null}</span> }))}
                />
            </div>
        </div>

        <div className="mt-8">
            <div className="mb-4 grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-[minmax(0,1fr)_auto] md:gap-y-1">
                <label className="block text-sm font-medium md:col-span-2 md:row-start-1">
                    Buscar producto
                </label>
                <Select<string | null>
                    aria-label="Buscar producto"
                    className="w-full md:col-start-1 md:row-start-2"
                    showSearch
                    disabled={!supplierId}
                    filterOption={false}
                    // This Select is a product search/command, not a persistent
                    // selection. Keep its value explicitly empty after each add.
                    value={null}
                    searchValue={productSearch}
                    placeholder={supplierId ? 'Buscar producto por nombre o código' : 'Selecciona un proveedor para agregar productos'}
                    onFocus={() => supplierId && void (productScope === 'supplier'
                        ? searchProducts(supplierId, productSearch)
                        : searchAllProducts(supplierId, productSearch))}
                    onSearch={(value) => {
                        setProductSearch(value);
                        if (!supplierId) return;
                        if (productScope === 'supplier') debouncedProductSearch(supplierId, value);
                        else debouncedGlobalProductSearch(supplierId, value);
                    }}
                    onSelect={(value) => {
                        if (productScope === 'supplier') addProduct(value as string);
                        else void addGlobalProduct(value as string);
                    }}
                    notFoundContent={productsLoading ? <Spin size="small" /> : supplierId
                        ? productScope === 'all'
                            ? <div className="p-2 text-center text-sm text-gray-500">No encontramos productos con esa búsqueda.<br />El producto todavía no existe en Centra. Créalo desde Inventario → Productos.</div>
                            : 'No hay productos de este proveedor disponibles para agregar.'
                        : null}
                    options={productScope === 'supplier'
                        ? productOptions.map((association) => ({
                            value: association.id,
                            label: <div><div>{association.product.name}</div><div className="text-xs text-gray-500">{association.product.sku}{association.supplier_code ? ` · Código proveedor ${association.supplier_code}` : ''} · {association.product.stock_measurement_unit?.symbol ?? '—'}</div></div>,
                        }))
                        : globalProductOptions.map((product) => ({
                            value: product.id,
                            disabled: !product.isAssociated && !can('suppliers.edit'),
                            label: <div>
                                <div>{product.name} <Tag color={product.isAssociated ? 'success' : 'default'}>{product.isAssociated ? 'Asociado' : 'No asociado'}</Tag></div>
                                <div className="text-xs text-gray-500">{product.sku} · {product.unit}{product.isAssociated ? ' · Agregar' : can('suppliers.edit') ? ' · Asociar y agregar' : ' · Sin permiso para vincular'}</div>
                            </div>,
                        }))}
                />
                {supplierId && <Button
                    variant="text"
                    aria-label="Buscar en todos los productos"
                    icon={<SearchOutlined />}
                    label={productScope === 'supplier' ? 'Buscar en todos los productos' : 'Ver productos del proveedor'}
                    action={() => {
                        const nextScope = productScope === 'supplier' ? 'all' : 'supplier';
                        setProductScope(nextScope);
                        setProductSearch('');
                        setProductOptions([]);
                        setGlobalProductOptions([]);
                        void (nextScope === 'all' ? searchAllProducts(supplierId, '') : searchProducts(supplierId, ''));
                    }}
                    className="purchaseGlobalSearchAction justify-self-start md:col-start-1 md:row-start-3"
                />}
                <Button
                    variant="default"
                    icon={<PlusOutlined />}
                    label="Agregar varios"
                    action={openBulk}
                    disabled={!supplierId}
                    className="w-full md:col-start-2 md:row-start-2 md:w-auto"
                />
            </div>
            {!items.length ? <Empty description={supplierId ? 'No hay productos agregados a la compra.' : 'Selecciona un proveedor para comenzar a agregar productos.'} /> : isMobile ? (
                <div className="space-y-4" data-testid="purchase-mobile-lines">
                    {items.map((item) => {
                        const lineSubtotal = subtotal(item.quantity, item.unitPrice);
                        return <article key={item.productId} data-testid={`purchase-mobile-line-${item.productId}`} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="m-0 break-words text-base font-semibold text-gray-900">{item.productName}</h2>
                                    <p className="mb-0 mt-1 text-sm text-gray-500">{item.productSku}{item.supplierProductName ? ` · ${item.supplierProductName}` : ''}</p>
                                </div>
                                <Button variant="text" danger aria-label={`Eliminar ${item.productName}`} icon={<DeleteOutlined />} action={() => removeItem(item)} />
                            </div>
                            <div className="mt-3 space-y-4">
                                <div><span className="text-sm text-gray-500">Código proveedor</span><div className="mt-1">{supplierCodeControl(item)}</div></div>
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-5 gap-y-3">
                                    <div><span className="text-sm text-gray-500">Cantidad</span><div className="mt-1">{quantityControl(item)}</div></div>
                                    <div><span className="text-sm text-gray-500">Unidad</span><p className="mb-0 mt-1 min-w-10 font-medium">{item.unit}</p></div>
                                </div>
                                <div><span className="text-sm text-gray-500">Precio unitario</span><div className="mt-1">{priceControl(item)}</div></div>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base"><span className="font-medium text-gray-700">Subtotal</span><strong>{lineSubtotal ? formatMoney(lineSubtotal) : '—'}</strong></div>
                            </div>
                        </article>;
                    })}
                </div>
            ) : <Table
                rowKey="productId"
                dataSource={items}
                scroll={{ x: 'max-content' }}
                pagination={false}
                columns={[
                    { title: 'Producto', render: (_, item: DraftLine) => <div><div>{item.productName}</div><div className="text-xs text-gray-500">{item.productSku}{item.supplierProductName ? ` · ${item.supplierProductName}` : ''}</div></div> },
                    { title: 'Código proveedor', render: (_, item: DraftLine) => supplierCodeControl(item) },
                    { title: 'Cantidad', render: (_, item: DraftLine) => quantityControl(item) },
                    { title: 'Unidad', dataIndex: 'unit' },
                    { title: 'Precio unitario', width: 160, render: (_, item: DraftLine) => priceControl(item) },
                    { title: 'Subtotal', width: 150, render: (_, item: DraftLine) => subtotal(item.quantity, item.unitPrice) ? formatMoney(subtotal(item.quantity, item.unitPrice)!) : '—' },
                    { title: 'Acciones', render: (_, item: DraftLine) => <Button variant="text" danger aria-label={`Eliminar ${item.productName}`} icon={<DeleteOutlined />} action={() => removeItem(item)} /> },
                ]}
            />}
            <div className="mt-4 flex justify-end border-t pt-4 text-lg font-semibold">{hasUnpricedItems ? 'Total parcial' : 'Total de la compra'}&nbsp;&nbsp;{hasUnpricedItems ? '—' : formatMoney(total(items))}</div>
        </div>

        <div className="mt-6">
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <Input.TextArea aria-label="Notas" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="default" label="Cancelar" action={leave} disabled={saving} />
            <Button label="Guardar borrador" action={() => void save()} loading={saving} />
        </div>

        <Modal
            className="purchaseBulkProductsModal"
            open={bulkOpen}
            onCancel={resetBulk}
            width="90vw"
            style={{ maxWidth: 1120, top: 24 }}
            styles={{ body: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' } }}
            title={<div className="purchaseBulkProductsHeader">
                <div>Agregar productos a la compra</div>
                <div className="purchaseBulkProductsSubtitle">
                    Selecciona los productos que deseas incluir en la compra a {supplierOptions.find((supplier) => supplier.id === supplierId)?.business_name ?? 'este proveedor'}
                </div>
            </div>}
            footer={[
                <Button key="cancel" variant="default" label="Cancelar" action={resetBulk} />,
                <Button
                    key="add"
                    label={`Agregar ${Object.keys(bulkSelection).length} ${Object.keys(bulkSelection).length === 1 ? 'producto' : 'productos'}`}
                    action={addBulkProducts}
                    disabled={Object.keys(bulkSelection).length === 0}
                />,
            ]}
        >
            <div className="purchaseBulkProductsControls">
                <label className="block min-w-0 flex-1 text-sm font-medium">
                    Buscar productos
                    <Input
                        className="mt-1 w-full font-normal"
                        aria-label="Buscar productos"
                        placeholder={bulkScope === 'supplier' ? 'Nombre, código interno o código proveedor' : 'Nombre o código interno'}
                        allowClear
                        value={bulkSearch}
                        onChange={(event) => {
                            const query = event.target.value;
                            setBulkSearch(query);
                            setBulkPage(1);
                            debouncedBulkSearch(query);
                        }}
                    />
                </label>
                <div className="min-w-0">
                    <label className="mb-1 block text-sm font-medium">Productos a mostrar</label>
                    <Segmented
                        className="purchaseBulkScope"
                        value={bulkScope}
                        options={[{ label: 'Del proveedor', value: 'supplier' }, { label: 'Todos los productos', value: 'all' }]}
                        onChange={(value) => {
                            const nextScope = value as 'supplier' | 'all';
                            setBulkScope(nextScope);
                            setBulkSelection({});
                            setBulkSearch('');
                            setBulkPage(1);
                            setBulkResult(emptyCatalogResult);
                            void loadBulkProducts(1, '', bulkPerPage, nextScope);
                        }}
                    />
                </div>
            </div>
            <div className="mb-3 text-sm text-gray-500" aria-live="polite">
                {Object.keys(bulkSelection).length}{' '}
                {Object.keys(bulkSelection).length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
            </div>
            {bulkScope === 'all' && Object.values(bulkSelection).some((product) => !product.isAssociated) && (
                <div className="mb-3 text-sm text-gray-500">Los productos no asociados se vincularán automáticamente a este proveedor.</div>
            )}
            <div className="purchaseBulkProductsTableRegion">
                {bulkResult.items.length === 0 && !bulkLoading ? (
                    <Empty description={bulkScope === 'supplier'
                        ? 'No hay productos de este proveedor disponibles para agregar.'
                        : bulkSearch ? 'No encontramos productos con esa búsqueda.' : 'No encontramos productos con esa búsqueda.'} />
                ) : (
                    <Table<CatalogProduct>
                        rowKey={(product) => product.id}
                        loading={bulkLoading}
                        dataSource={bulkResult.items}
                        scroll={{ x: 720 }}
                        rowSelection={{
                            selectedRowKeys: Object.keys(bulkSelection),
                            preserveSelectedRowKeys: true,
                            getCheckboxProps: (product) => ({
                                disabled: !product.isActive || items.some((item) => item.productId === product.id),
                                'aria-label': items.some((item) => item.productId === product.id)
                                    ? `Ya agregado: ${product.name}`
                                    : `${product.name}`,
                            }),
                            onChange: (keys) => {
                                const selectedVisibleKeys = new Set(keys.map(String));
                                setBulkSelection((current) => {
                                    const next = { ...current };
                                    bulkResult.items.forEach((product) => {
                                        const productId = product.id;
                                        const disabled = !product.isActive || items.some((item) => item.productId === productId);
                                        if (disabled || !selectedVisibleKeys.has(productId)) delete next[productId];
                                        else next[productId] = product;
                                    });
                                    return next;
                                });
                            },
                        }}
                        pagination={false}
                        columns={[
                            {
                                title: 'Producto',
                                render: (_, product) => <div>
                                    <div>{product.name}</div>
                                    {!product.isActive && <Tag>Inactivo</Tag>}
                                    {items.some((item) => item.productId === product.id) && <Tag>Ya agregado</Tag>}
                                </div>,
                            },
                            { title: 'Código interno', width: 150, render: (_, product) => product.sku },
                            { title: 'Unidad', width: 100, render: (_, product) => product.unit },
                            { title: 'Relación', render: (_, product) => items.some((item) => item.productId === product.id) ? <Tag>Ya agregado</Tag> : <Tag color={product.isAssociated ? 'success' : 'default'}>{product.isAssociated ? 'Proveedor actual' : 'No asociado'}</Tag> },
                        ]}
                    />
                )}
            </div>
            <Pagination
                className="purchaseBulkProductsPagination"
                current={bulkResult.current_page || bulkPage}
                pageSize={bulkResult.per_page || bulkPerPage}
                total={bulkResult.total}
                showSizeChanger
                pageSizeOptions={['20', '50', '100']}
                showTotal={(count, range) => `${range[0]} - ${range[1]} de ${count}`}
                onChange={(nextPage, nextPerPage) => {
                    setBulkPage(nextPage);
                    setBulkPerPage(nextPerPage);
                    void loadBulkProducts(nextPage, bulkSearch, nextPerPage, bulkScope);
                }}
            />
        </Modal>

        <Modal open={Boolean(pendingSupplierChange)} title="¿Cambiar proveedor?" onCancel={() => setPendingSupplierChange(null)} footer={<div className="flex justify-end gap-2"><Button variant="default" label="Cancelar" action={() => setPendingSupplierChange(null)} /><Button label="Cambiar proveedor" action={() => { setSupplierId(pendingSupplierChange?.id); setPendingSupplierChange(null); setItems([]); setProductSearch(''); setProductScope('supplier'); setProductOptions([]); setGlobalProductOptions([]); resetBulk(); }} /></div>}>
            Los productos cargados serán eliminados porque las asociaciones dependen del proveedor seleccionado.
        </Modal>
        <Modal open={discardOpen} title="¿Descartar los cambios?" onCancel={() => setDiscardOpen(false)} footer={<div className="flex justify-end gap-2"><Button variant="default" label="Permanecer" action={() => setDiscardOpen(false)} /><Button variant="danger" label="Descartar" action={() => navigate('/tienda/compras')} /></div>}>
            Los datos ingresados no se guardarán.
        </Modal>
    </div>;
};
