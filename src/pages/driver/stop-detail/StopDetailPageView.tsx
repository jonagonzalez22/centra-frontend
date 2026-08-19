import { useState } from 'react';
import { Alert, Spin, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined, FileTextOutlined, CheckOutlined } from '@ant-design/icons';
import type { StopDetail, RouteStopStatus } from '@/features/driver/interfaces/driver.interface';
import { OrderBalanceSummary } from '@/components/driver';
import { formatCurrency } from '@/utils/formatters';
import './StopDetailPage.css';

const STOP_STATUS_COLORS: Record<RouteStopStatus, string> = {
    pending: 'warning',
    arrived: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'default',
};

const STOP_STATUS_LABELS: Record<RouteStopStatus, string> = {
    pending: 'Pendiente',
    arrived: 'Llegó',
    completed: 'Entregado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
};

interface StopDetailPageViewProps {
    stop: StopDetail | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}

export const StopDetailPageView = ({
    stop,
    loading,
    error,
    onRefresh,
}: StopDetailPageViewProps) => {
    const navigate = useNavigate();
    const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(new Set());

    const toggleItem = (itemId: string) => {
        setCheckedItemIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert
                    type="error"
                    message={error}
                    showIcon
                    action={
                        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                            Reintentar
                        </Button>
                    }
                />
            </div>
        );
    }

    if (!stop) {
        return (
            <div className="p-4">
                <Alert type="warning" message="Parada no encontrada." showIcon />
            </div>
        );
    }

    const hasPendingCollections = stop.collections.some((c) => c.status !== 'completed');

    return (
        <div className="stopDetailPage">
            {/* Header */}
            <div className="stopDetailHeader">
                <button
                    className="stopDetailBackBtn"
                    onClick={() => navigate(-1)}
                >
                    ← Volver
                </button>
            </div>

            {/* Context row */}
            <div className="stopDetailContext">
                <div className="stopDetailContextName">
                    {stop.contact_name ?? 'Cliente'}
                </div>
                <div className="stopDetailContextMeta">
                    <span className="stopDetailContextSequence">
                        Parada #{stop.sequence}
                    </span>
                    <Tag color={STOP_STATUS_COLORS[stop.status]}>
                        {STOP_STATUS_LABELS[stop.status]}
                    </Tag>
                </div>
            </div>

            <div className="stopDetailPageContent pb-28">
                {/* Order economic summary */}
                <div className="stopDetailPaymentLabel">Información de pago</div>
                <OrderBalanceSummary order={stop.order} variant="full" />

                {/* Observations */}
                {stop.notes && (
                    <div className="stopDetailNotes">
                        <FileTextOutlined className="stopDetailNotesIcon" />
                        <div className="stopDetailNotesContent">
                            <div className="stopDetailNotesLabel">Observaciones</div>
                            <div className="stopDetailNotesText">{stop.notes}</div>
                        </div>
                    </div>
                )}

                {/* Products */}
                <div className="stopDetailProductsLabel">
                    Productos a entregar ({stop.items.length})
                </div>
                <div className="stopDetailSection">
                    {stop.items.length === 0 ? (
                        <div className="text-sm text-gray-400 py-4 text-center">
                            Sin productos cargados
                        </div>
                    ) : (
                        <div className="stopDetailProductsList">
                            {stop.items.map((item) => {
                                const qty =
                                    item.quantity_loaded > 0
                                        ? item.quantity_loaded
                                        : item.quantity_planned;
                                const isChecked = checkedItemIds.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`stopDetailProductRow${isChecked ? ' stopDetailProductRow--checked' : ''}`}
                                        onClick={() => toggleItem(item.id)}
                                    >
                                        {/* Light qty badge */}
                                        <div className="stopDetailProductQty">
                                            {qty}
                                        </div>

                                        {/* Product info */}
                                        <div className="stopDetailProductInfo">
                                            <div className="stopDetailProductName">
                                                {item.product_name}
                                            </div>
                                            <div className="stopDetailProductMeta">
                                                {item.sku && (
                                                    <span className="stopDetailProductSku">
                                                        {item.sku}
                                                    </span>
                                                )}
                                                {item.is_extra && (
                                                    <Tag
                                                        color="orange"
                                                        className="stopDetailExtraTag"
                                                    >
                                                        Extra
                                                    </Tag>
                                                )}
                                            </div>
                                        </div>

                                        {/* Check indicator */}
                                        {isChecked && (
                                            <CheckOutlined className="stopDetailProductCheck" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Collections */}
                {stop.collections.length > 0 && (
                    <div className="stopDetailSection">
                        <div className="stopDetailSectionTitle">
                            Cobros declarados ({stop.collections.length})
                        </div>
                        {hasPendingCollections && (
                            <Alert
                                message="Los cobros declarados se encuentran pendientes de verificación y no están descontados del saldo a cobrar."
                                type="info"
                                showIcon
                                className="stopDetailCollectionsNotice"
                            />
                        )}
                        <div className="stopDetailCollectionsList">
                            {stop.collections.map((col) => (
                                <div
                                    key={col.id}
                                    className="stopDetailCollectionRow"
                                >
                                    <div>
                                        <div className="stopDetailCollectionMethod">
                                            {col.method}
                                        </div>
                                        <div className="stopDetailCollectionStatus">
                                            {col.status}
                                        </div>
                                    </div>
                                    <div className="stopDetailCollectionAmount">
                                        {formatCurrency(col.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sticky Bottom Bar */}
                <div className="stopDetailBottomBar">
                    <Button block size="large" disabled style={{ flex: 1 }}>
                        Entregar Pedido
                    </Button>
                    <Button block size="large" disabled style={{ flex: 1 }}>
                        Venta Extra
                    </Button>
                </div>
            </div>
        </div>
    );
};
