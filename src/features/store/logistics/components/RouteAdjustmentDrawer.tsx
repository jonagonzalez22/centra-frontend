import { useState, useEffect, useMemo } from 'react';
import { Drawer, Select, InputNumber, Card, Alert, Spin, Typography, message } from 'antd';
import { Button } from '@/components/Button';
import { RoutesService } from '../services/routes.service';
import type { LoadSheetData, AdjustItemsPayload } from '../interfaces/loadSheet.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

const { Text } = Typography;

interface RouteAdjustmentDrawerProps {
    open: boolean;
    routeId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const RouteAdjustmentDrawer = ({
    open,
    routeId,
    onClose,
    onSuccess,
}: RouteAdjustmentDrawerProps) => {
    const [loadSheet, setLoadSheet] = useState<LoadSheetData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [reasons, setReasons] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoading(true);
            try {
                const data = await RoutesService.getLoadSheet(routeId);
                setLoadSheet(data);
            } catch {
                message.error('Error al cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, routeId]);

    useEffect(() => {
        if (!selectedProductId || !loadSheet) return;
        const qty: Record<string, number> = {};
        const rsn: Record<string, string> = {};
        for (const stop of loadSheet.by_stop) {
            for (const item of stop.items) {
                if (item.product_id === selectedProductId) {
                    qty[item.route_stop_item_id] = item.quantity_loaded;
                    rsn[item.route_stop_item_id] = '';
                }
            }
        }
        setQuantities(qty);
        setReasons(rsn);
    }, [selectedProductId, loadSheet]);

    const totals = useMemo(() => {
        if (!selectedProductId || !loadSheet) return { totalOnTruck: 0, assigned: 0, remaining: 0 };
        const product = loadSheet.by_product.find(p => p.product_id === selectedProductId);
        const totalOnTruck = product?.total_loaded ?? 0;
        const assigned = Object.values(quantities).reduce((sum, q) => sum + q, 0);
        return { totalOnTruck, assigned, remaining: totalOnTruck - assigned };
    }, [selectedProductId, loadSheet, quantities]);

    const canSave = totals.remaining === 0 && totals.assigned > 0;

    const productOptions = (loadSheet?.by_product ?? [])
        .filter(p => p.total_loaded > 0)
        .map(p => ({
            label: `${p.product_name} (${p.total_loaded} unid.)`,
            value: p.product_id,
        }));

    const stopCards = useMemo(() => {
        if (!selectedProductId || !loadSheet) return [];
        return loadSheet.by_stop
            .filter(stop => stop.items.some(item => item.product_id === selectedProductId))
            .map(stop => {
                const item = stop.items.find(i => i.product_id === selectedProductId)!;
                return { stop, item };
            });
    }, [selectedProductId, loadSheet]);

    const handleSave = async () => {
        if (!selectedProductId || !canSave) return;
        const payload: AdjustItemsPayload = {
            product_id: selectedProductId,
            items: Object.entries(quantities).map(([routeStopItemId, qty]) => ({
                route_stop_item_id: routeStopItemId,
                quantity_loaded: qty,
                ...(reasons[routeStopItemId] ? { reason: reasons[routeStopItemId] } : {}),
            })),
        };
        setSaving(true);
        try {
            await RoutesService.adjustItems(routeId, payload);
            message.success('Ajustes guardados correctamente.');
            onSuccess();
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al guardar los ajustes.');
        } finally {
            setSaving(false);
        }
    };

    const updateQuantity = (routeStopItemId: string, val: number | null) => {
        setQuantities(prev => ({ ...prev, [routeStopItemId]: val ?? 0 }));
    };

    const handleClose = () => {
        setSelectedProductId(null);
        onClose();
    };

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            title="Productos por Parada"
            width={480}
            destroyOnClose
            styles={{ body: { padding: 20, background: '#f5f5f5' } }}
            footer={
                <Button
                    variant="primary"
                    label={canSave ? 'Guardar Cambios' : `Faltante por asignar: ${totals.remaining}`}
                    loading={saving}
                    disabled={!canSave}
                    action={handleSave}
                    block
                />
            }
        >
            {loading ? (
                <Spin />
            ) : !loadSheet ? (
                <Alert type="error" message="No se pudieron cargar los datos." />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Select
                        showSearch
                        placeholder="Buscar producto..."
                        options={productOptions}
                        value={selectedProductId}
                        onChange={setSelectedProductId}
                        style={{ width: '100%' }}
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                    />

                    {selectedProductId && (
                        <>
                            <Card
                                size="small"
                                style={{
                                    borderRadius: 10,
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                            Total en Camión
                                        </Text>
                                        <Text strong style={{ fontSize: 20, color: '#093764' }}>
                                            {totals.totalOnTruck}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                            Asignado
                                        </Text>
                                        <Text strong style={{ fontSize: 20, color: '#52c41a' }}>
                                            {totals.assigned}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                            Faltante
                                        </Text>
                                        <Text strong style={{ fontSize: 20, color: totals.remaining > 0 ? '#faad14' : '#52c41a' }}>
                                            {totals.remaining}
                                        </Text>
                                    </div>
                                </div>
                            </Card>

                            {stopCards.map(({ stop, item }) => (
                                <Card
                                    key={item.route_stop_item_id}
                                    size="small"
                                    style={{
                                        borderRadius: 10,
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    }}
                                    title={
                                        <Text strong style={{ color: '#093764' }}>
                                            {stop.order_number || `Parada ${stop.sequence}`}
                                            {stop.customer_name ? ` — ${stop.customer_name}` : ''}
                                        </Text>
                                    }
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Planificado
                                            </Text>
                                            <Text strong style={{ fontSize: 18, color: '#093764' }}>
                                                {item.quantity_planned}
                                            </Text>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Cargado
                                            </Text>
                                            <InputNumber
                                                min={0}
                                                value={quantities[item.route_stop_item_id]}
                                                onChange={(val) => updateQuantity(item.route_stop_item_id, val)}
                                                style={{ width: 80 }}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </>
                    )}
                </div>
            )}
        </Drawer>
    );
};
