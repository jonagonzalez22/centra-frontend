import { useState, useEffect, useMemo } from 'react';
import { Drawer, Card, InputNumber, Select, Input, Spin, Alert, Typography } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { useLoadSheet } from '../hooks/useLoadSheet';
import type { BulkLoadPayload } from '../interfaces/loadSheet.interface';

const { Text } = Typography;

interface RouteLoadDrawerProps {
    open: boolean;
    routeId: string;
    isLoaded: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const REASON_OPTIONS = [
    { label: 'Sin stock', value: 'no_stock' },
    { label: 'Producto dañado', value: 'product_damaged' },
    { label: 'Producto no encontrado', value: 'product_not_found' },
    { label: 'Límite de espacio', value: 'space_limit' },
    { label: 'Otro', value: 'other' },
];

interface ProductEdit {
    quantity_loaded: number;
    reason?: string;
    notes?: string;
}

export const RouteLoadDrawer = ({
    open,
    routeId,
    isLoaded,
    onClose,
    onSuccess,
}: RouteLoadDrawerProps) => {
    const { loadSheet, loading, bulkLoading, load, bulkLoad } = useLoadSheet(routeId);
    const [userEdits, setUserEdits] = useState<Record<string, Partial<ProductEdit>>>({});
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [confirmedProducts, setConfirmedProducts] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            load();
        }
    }, [open, load]);

    const productEdits = useMemo((): Record<string, ProductEdit> => {
        if (!loadSheet) return {};
        const edits: Record<string, ProductEdit> = {};
        for (const p of loadSheet.by_product) {
            const overrides = userEdits[p.product_id] || {};
            edits[p.product_id] = {
                quantity_loaded: overrides.quantity_loaded ?? p.total_loaded,
                reason: overrides.reason,
                notes: overrides.notes,
            };
        }
        return edits;
    }, [loadSheet, userEdits]);

    const handleConfirmAll = (productId: string, totalPlanned: number) => {
        setUserEdits((prev) => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                quantity_loaded: totalPlanned,
                reason: undefined,
                notes: undefined,
            },
        }));
        setConfirmedProducts((prev) => new Set(prev).add(productId));
    };

    const buildPayload = (): BulkLoadPayload => ({
        products: Object.entries(productEdits).map(([productId, edit]) => ({
            product_id: productId,
            quantity_loaded: edit.quantity_loaded,
            ...(edit.reason ? { reason: edit.reason } : {}),
            ...(edit.notes ? { notes: edit.notes } : {}),
        })),
    });

    const handleConfirm = async () => {
        try {
            await bulkLoad(buildPayload());
            onSuccess();
        } catch {
            // Error already shown by hook
        }
    };

    const renderProductCard = (product: {
        product_id: string;
        product_name: string;
        total_planned: number;
        total_loaded: number;
    }) => {
        const productId = product.product_id;
        const edit = productEdits[productId];
        const isEditing = editingProduct === productId;

        // Hide cards explicitly confirmed
        if (confirmedProducts.has(productId) && !isLoaded) return null;

        return (
            <Card
                key={productId}
                size="small"
                style={{
                    marginBottom: 12,
                    borderRadius: 10,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    ...(isEditing ? { borderLeft: '5px solid #faad14', padding: 16 } : {}),
                }}
                title={
                    <Text strong style={{ color: '#093764', fontSize: 16, fontWeight: 600 }}>
                        {product.product_name}
                    </Text>
                }
                extra={null}
            >
                <div style={{ marginBottom: 12 }}>
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            display: 'block',
                            marginBottom: 2,
                        }}
                    >
                        Planificado
                    </Text>
                    <Text strong style={{ fontSize: 24, fontWeight: 'bold', color: '#093764' }}>
                        {product.total_planned}
                        <Text style={{ fontSize: 14, fontWeight: 400, color: '#999', marginLeft: 6 }}>
                            unid.
                        </Text>
                    </Text>
                    {edit && edit.quantity_loaded > 0 && (
                        <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Cargado:{' '}
                            </Text>
                            <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                                {edit.quantity_loaded}
                            </Text>
                        </div>
                    )}
                </div>

                        {isEditing ? (
                    (() => {
                        const qty = edit?.quantity_loaded ?? 0;
                        const needsReason = qty < product.total_planned;
                        const reasonMissing = needsReason && !edit?.reason;
                        const needsNotes = edit?.reason === 'other';
                        const notesMissing = needsNotes && !edit?.notes?.trim();
                        const canSave = !reasonMissing && !notesMissing;

                        return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                            <Text
                                type="secondary"
                                style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                            >
                                Cantidad a cargar en esta ruta
                            </Text>
                            <InputNumber
                                min={0}
                                max={product.total_planned}
                                value={edit?.quantity_loaded}
                                onChange={(val) => {
                                    const clamped = Math.min(val ?? 0, product.total_planned);
                                    setUserEdits((prev) => ({
                                        ...prev,
                                        [productId]: {
                                            ...prev[productId],
                                            quantity_loaded: clamped,
                                        },
                                    }));
                                }}
                                style={{ width: '100%' }}
                            />
                            {(edit?.quantity_loaded ?? 0) === 0 && (
                                <Text
                                    style={{
                                        color: '#faad14',
                                        fontSize: 12,
                                        display: 'block',
                                        marginTop: 4,
                                    }}
                                >
                                    Aviso: Cantidad 0 generará un faltante total. Se requiere motivo.
                                </Text>
                            )}
                        </div>
                        {(edit?.quantity_loaded ?? 0) < product.total_planned && (
                            <>
                                <Select
                                    placeholder="Motivo (obligatorio)"
                                    options={REASON_OPTIONS}
                                    value={edit?.reason}
                                    onChange={(val) =>
                                        setUserEdits((prev) => ({
                                            ...prev,
                                            [productId]: { ...prev[productId], reason: val },
                                        }))
                                    }
                                    style={{ width: '100%' }}
                                />
                                <Input
                                    placeholder={needsNotes ? 'Notas (obligatorio para "Otro")' : 'Notas (opcional)'}
                                    value={edit?.notes}
                                    onChange={(e) =>
                                        setUserEdits((prev) => ({
                                            ...prev,
                                            [productId]: {
                                                ...prev[productId],
                                                notes: e.target.value,
                                            },
                                        }))
                                    }
                                />
                                {notesMissing && (
                                    <Text style={{ color: '#ff4d4f', fontSize: 12, display: 'block', marginTop: -4 }}>
                                        Las notas son obligatorias cuando el motivo es &ldquo;Otro&rdquo;.
                                    </Text>
                                )}
                            </>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <div style={{ flex: 1 }}>
                                <Button
                                    size="small"
                                    variant="primary"
                                    label="Guardar ajuste"
                                    disabled={!canSave}
                                    action={() => {
                                        setConfirmedProducts(
                                            (prev) => new Set(prev).add(productId)
                                        );
                                        setEditingProduct(null);
                                    }}
                                    block
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Button
                                    size="small"
                                    variant="default"
                                    label="Cancelar"
                                    action={() => setEditingProduct(null)}
                                    block
                                />
                            </div>
                        </div>
                    </div>
                        );
                    })()
                ) : isLoaded ? null : (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            size="small"
                            label="Confirmar Todo"
                            icon={<CheckOutlined />}
                            action={() =>
                                handleConfirmAll(productId, product.total_planned)
                            }
                            style={{
                                background: '#52c41a',
                                borderColor: '#52c41a',
                                color: '#fff',
                            }}
                        />
                        <Button
                            size="small"
                            variant="default"
                            label="Editar"
                            icon={<EditOutlined />}
                            action={() => setEditingProduct(productId)}
                        />
                    </div>
                )}
            </Card>
        );
    };

    const processedCount = loadSheet
        ? loadSheet.by_product.filter((p) => confirmedProducts.has(p.product_id)).length
        : 0;
    const totalCount = loadSheet?.by_product.length ?? 0;
    const pendingCount = totalCount - processedCount;
    const allProcessed = processedCount === totalCount && totalCount > 0;

    const drawerTitle = isLoaded
        ? 'Hoja de Carga'
        : `Gestionar Carga${totalCount > 0 ? ` — Pendientes: ${pendingCount} / ${totalCount}` : ''}`;

    const footerLabel = allProcessed
        ? 'Confirmar Despacho de Carga'
        : `Faltan ${pendingCount} productos por procesar`;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={drawerTitle}
            width={480}
            destroyOnClose
            styles={{ body: { padding: 20, background: '#f5f5f5' } }}
            footer={
                isLoaded ? null : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="primary"
                            label={footerLabel}
                            loading={bulkLoading}
                            disabled={!allProcessed}
                            action={handleConfirm}
                            block
                        />
                    </div>
                )
            }
        >
            {loading ? (
                <Spin />
            ) : !loadSheet || loadSheet.by_product.length === 0 ? (
                <Alert
                    type="info"
                    message="No hay productos para cargar en esta ruta."
                />
            ) : allProcessed ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: '#52c41a',
                    }}
                >
                    <CheckOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>
                        ¡Todo listo!
                    </Text>
                    <Text type="secondary">
                        Todos los productos han sido procesados. Presioná &ldquo;Confirmar Despacho de
                        Carga&rdquo; para finalizar.
                    </Text>
                </div>
            ) : (
                loadSheet.by_product.map((product) => renderProductCard(product))
            )}
        </Drawer>
    );
};
