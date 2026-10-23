import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Breadcrumb, Input, InputNumber, Popconfirm, Table, message } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { formatQuantityForDisplay, compareDecimalStrings, isPositiveDecimal, normalizeDecimalString } from '@/utils/quantity';
import { PurchasesService, purchaseTypeLabel, type PurchaseDetail, type PurchaseItem } from '@/features/store/purchases/purchases.service';

const apiMessage = (error: unknown, fallback: string) => {
    const response = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
    return Object.values(response.response?.data?.errors ?? {})[0]?.[0] || response.response?.data?.message || fallback;
};

const isReceivable = (purchase: PurchaseDetail) =>
    (purchase.purchase_type === 'order' && ['ordered', 'partially_received'].includes(purchase.status))
    || (purchase.purchase_type === 'direct' && ['draft', 'partially_received'].includes(purchase.status));

export const PurchaseReceiptPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const detail = await PurchasesService.getById(id);
            if (!isReceivable(detail)) {
                message.error('Esta compra no está disponible para registrar una recepción.');
                navigate(`/tienda/compras/${id}`, { replace: true });
                return;
            }
            setPurchase(detail);
        } catch (error) {
            message.error(apiMessage(error, 'No se pudo cargar la compra.'));
            navigate('/tienda/compras', { replace: true });
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { void load(); }, [load]);

    const pendingItems = useMemo(() => purchase?.items.filter((item) => compareDecimalStrings(item.quantity_pending, '0.0000') > 0) ?? [], [purchase]);
    const suppliedItems = pendingItems.filter((item) => {
        const value = quantities[item.id];
        try { return Boolean(value) && isPositiveDecimal(value); } catch { return false; }
    });
    const hasInvalidInput = pendingItems.some((item) => {
        const value = quantities[item.id];
        if (!value) return false;
        try {
            return !isPositiveDecimal(value) || compareDecimalStrings(value, item.quantity_pending) > 0;
        } catch { return true; }
    });
    const canConfirm = suppliedItems.length > 0 && !hasInvalidInput && !submitting;

    const validate = () => {
        const nextErrors: Record<string, string> = {};
        pendingItems.forEach((item) => {
            const value = quantities[item.id];
            if (!value) return;
            try {
                if (!isPositiveDecimal(value)) nextErrors[item.id] = 'Ingresá una cantidad mayor a cero.';
                else if (compareDecimalStrings(value, item.quantity_pending) > 0) nextErrors[item.id] = `Máximo: ${formatQuantityForDisplay(item.quantity_pending)} ${item.measurement_unit_symbol}.`;
            } catch { nextErrors[item.id] = 'Ingresá una cantidad válida de hasta 4 decimales.'; }
        });
        setErrors(nextErrors);
        return nextErrors;
    };

    const setQuantity = (itemId: string, value: string | null) => {
        setQuantities((current) => ({ ...current, [itemId]: value ?? '' }));
        setErrors((current) => ({ ...current, [itemId]: '' }));
    };
    const normalizeInput = (itemId: string) => {
        const value = quantities[itemId];
        if (!value) return;
        try { setQuantities((current) => ({ ...current, [itemId]: normalizeDecimalString(value) })); } catch { /* the validation below preserves the entered value and explains it */ }
        void validate();
    };
    const receiveAll = () => setQuantities(Object.fromEntries(pendingItems.map((item) => [item.id, item.quantity_pending])));
    const clearQuantities = () => { setQuantities({}); setErrors({}); };
    const hasValues = Object.values(quantities).some(Boolean);

    const submit = async () => {
        if (!purchase || submittingRef.current) return;
        const validationErrors = validate();
        if (Object.keys(validationErrors).length || !suppliedItems.length) {
            if (!suppliedItems.length) message.error('Ingresá al menos una cantidad para recibir.');
            return;
        }
        submittingRef.current = true;
        setSubmitting(true);
        try {
            await PurchasesService.createReceipt(purchase.id, {
                notes: notes.trim() || null,
                items: suppliedItems.map((item) => ({ purchase_item_id: item.id, quantity: normalizeDecimalString(quantities[item.id]) })),
            });
            message.success('Recepción registrada correctamente.');
            navigate(`/tienda/compras/${purchase.id}`, { replace: true });
        } catch (error) {
            message.error(apiMessage(error, 'No se pudo registrar la recepción. Actualizá las cantidades e intentá nuevamente.'));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    if (loading || !purchase) return <div className="py-12 text-center text-gray-500">Cargando compra...</div>;

    return <div className="w-full">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
                <Breadcrumb className="mb-2" items={[{ title: <Link to="/tienda/dashboard">Tienda</Link> }, { title: <Link to="/tienda/compras">Compras</Link> }, { title: <Link to={`/tienda/compras/${purchase.id}`}>{purchase.purchase_number}</Link> }, { title: 'Registrar recepción' }]} />
                <h1 className="m-0 text-2xl font-bold text-centra-primary">Registrar recepción</h1>
                <p className="m-0 mt-1 text-sm text-centra-text/60">Registrá la mercadería que ingresó físicamente al inventario.</p>
            </div>
            <Button variant="default" label="Volver a la compra" action={() => navigate(`/tienda/compras/${purchase.id}`)} />
        </div>
        <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
            <div><span className="text-sm text-gray-500">Compra</span><p className="m-0 font-medium">{purchase.purchase_number}</p></div>
            <div><span className="text-sm text-gray-500">Proveedor</span><p className="m-0 font-medium">{purchase.supplier.business_name}</p></div>
            <div><span className="text-sm text-gray-500">Tipo</span><p className="m-0 font-medium">{purchaseTypeLabel(purchase.purchase_type)}</p></div>
        </div>
        <Alert className="mb-5" type="info" showIcon title="La recepción confirmada ingresará mercadería al inventario y no podrá editarse ni eliminarse." />
        {purchase.purchase_type === 'direct' && purchase.status === 'draft' && <Alert className="mb-5" type="warning" showIcon title="Al confirmar la primera recepción, esta compra dejará de ser editable." />}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 text-sm text-gray-600">{suppliedItems.length} {suppliedItems.length === 1 ? 'producto con cantidad informada' : 'productos con cantidad informada'}</p>
            <div className="flex flex-wrap gap-2">
                <Button variant="default" label="Recibir todo pendiente" action={receiveAll} disabled={!pendingItems.length || submitting} />
                {hasValues && <Button variant="text" label="Limpiar cantidades" action={clearQuantities} disabled={submitting} />}
            </div>
        </div>
        <Table<PurchaseItem>
            rowKey="id"
            dataSource={pendingItems}
            scroll={{ x: 'max-content' }}
            pagination={false}
            columns={[
                { title: 'Producto', render: (_, item) => <div><div>{item.product_name}</div>{item.supplier_code && <div className="text-xs text-gray-500">Código proveedor: {item.supplier_code}</div>}</div> },
                { title: 'Código interno', dataIndex: 'product_sku' },
                { title: 'Unidad', dataIndex: 'measurement_unit_symbol' },
                { title: 'Comprado', render: (_, item) => formatQuantityForDisplay(item.quantity_ordered) },
                { title: 'Recibido', render: (_, item) => formatQuantityForDisplay(item.quantity_received) },
                { title: 'Pendiente', render: (_, item) => <span className="font-medium">{formatQuantityForDisplay(item.quantity_pending)}</span> },
                { title: 'Recibir ahora', render: (_, item) => <div><InputNumber<string> stringMode controls={false} aria-label={`Recibir ahora ${item.product_name}`} className="w-32" min="0.0001" max={item.quantity_pending} precision={4} value={quantities[item.id] ?? ''} formatter={(value) => value ? formatQuantityForDisplay(value) : ''} parser={(value) => value?.replace(',', '.') ?? ''} onChange={(value) => setQuantity(item.id, value)} onBlur={() => normalizeInput(item.id)} onPressEnter={() => normalizeInput(item.id)} status={errors[item.id] ? 'error' : undefined} disabled={submitting} /><span className="ml-2 text-sm text-gray-500">{item.measurement_unit_symbol}</span>{errors[item.id] && <div className="mt-1 text-xs text-red-600">{errors[item.id]}</div>}</div> },
            ]}
        />
        <div className="mt-5 max-w-2xl"><label htmlFor="receipt-notes" className="mb-1 block text-sm font-medium">Notas de recepción <span className="font-normal text-gray-500">(opcional)</span></label><Input.TextArea id="receipt-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} disabled={submitting} /></div>
        <div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="default" label="Cancelar" action={() => navigate(`/tienda/compras/${purchase.id}`)} disabled={submitting} /><Popconfirm title="¿Confirmar recepción?" description="Esta operación ingresará físicamente los productos al inventario y generará movimientos de stock. La recepción no podrá editarse ni eliminarse." okText="Confirmar recepción" cancelText="Cancelar" onConfirm={() => void submit()} okButtonProps={{ loading: submitting, disabled: !canConfirm }}><Button label="Confirmar recepción" loading={submitting} disabled={!canConfirm} /></Popconfirm></div>
    </div>;
};
