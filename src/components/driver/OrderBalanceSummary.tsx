import { useState } from 'react';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Alert, Button, Spin, Tag } from 'antd';
import { formatCurrency, formatCurrencyWithCents } from '@/utils/formatters';
import type {
    CollectionPreview,
    OrderAmounts,
} from '@/features/driver/interfaces/driver.interface';
import './OrderBalanceSummary.css';

interface OrderBalanceSummaryProps {
    order: OrderAmounts | null;
    /** 'compact' renders a single subtle badge for use in stop cards. */
    /** 'full' renders the complete economic breakdown for stop detail. */
    variant?: 'compact' | 'full';
    collectionPreview?: CollectionPreview | null;
    previewLoading?: boolean;
    previewError?: string | null;
    onRetryPreview?: () => void;
}

export const OrderBalanceSummary = ({
    order,
    variant = 'compact',
    collectionPreview,
    previewLoading = false,
    previewError,
    onRetryPreview,
}: OrderBalanceSummaryProps) => {
    const [expanded, setExpanded] = useState(false);

    if (!order) return null;

    if (variant === 'compact') {
        if (order.pending_amount === 0) {
            return <Tag className="orderBalanceBadge orderBalanceBadge--paid">Pagado</Tag>;
        }
        return (
            <Tag className="orderBalanceBadge orderBalanceBadge--pending">
                Saldo pedido {formatCurrency(order.pending_amount)}
            </Tag>
        );
    }

    return (
        <div className="orderBalanceFull">
            {previewLoading && (
                <div className="orderBalanceFullLoading">
                    <Spin size="small" /> Actualizando importe…
                </div>
            )}
            {previewError && !previewLoading && (
                <Alert
                    type="warning"
                    showIcon
                    message={previewError}
                    action={
                        onRetryPreview ? (
                            <Button size="small" onClick={onRetryPreview}>
                                Reintentar
                            </Button>
                        ) : null
                    }
                />
            )}
            {collectionPreview && !previewLoading && (
                <>
                    <div className="orderBalanceCompactRow">
                        <div>
                            <div className="orderBalanceFullCollectLabel">A cobrar ahora</div>
                            <div className="orderBalanceFullCollectValue">
                                {formatCurrencyWithCents(collectionPreview.amount_to_collect_now)}
                            </div>
                        </div>
                        <Button
                            type="link"
                            size="small"
                            aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'}
                            aria-expanded={expanded}
                            onClick={() => setExpanded((value) => !value)}
                            icon={expanded ? <UpOutlined /> : <DownOutlined />}
                            iconPlacement="end"
                            className="orderBalanceDetailButton"
                        >
                            {expanded ? 'Ocultar detalle' : 'Ver detalle'}
                        </Button>
                    </div>
                    {expanded && (
                        <div className="orderBalanceDetails">
                            <div className="orderBalanceFullRow">
                                <span className="orderBalanceFullLabel">
                                    Total actual del pedido
                                </span>
                                <span className="orderBalanceFullValue">
                                    {formatCurrencyWithCents(collectionPreview.order_total)}
                                </span>
                            </div>
                            <div className="orderBalanceFullRow">
                                <span className="orderBalanceFullLabel">
                                    Entregado en esta visita
                                </span>
                                <span className="orderBalanceFullValue">
                                    {formatCurrencyWithCents(
                                        collectionPreview.delivered_value_current_stop
                                    )}
                                </span>
                            </div>
                            <div className="orderBalanceFullRow">
                                <span className="orderBalanceFullLabel">Entregado acumulado</span>
                                <span className="orderBalanceFullValue">
                                    {formatCurrencyWithCents(
                                        collectionPreview.delivered_value_cumulative
                                    )}
                                </span>
                            </div>
                            <div className="orderBalanceFullRow">
                                <span className="orderBalanceFullLabel">Pagado confirmado</span>
                                <span className="orderBalanceFullValue orderBalanceFullValue--paid">
                                    {formatCurrencyWithCents(
                                        collectionPreview.verified_paid_amount
                                    )}
                                </span>
                            </div>
                            <div className="orderBalanceFullRow">
                                <span className="orderBalanceFullLabel">
                                    Cobros en verificación
                                    {collectionPreview.pending_declared_amount > 0 && (
                                        <small className="orderBalanceFullHint">
                                            Pendientes de verificación.
                                        </small>
                                    )}
                                </span>
                                <span className="orderBalanceFullValue">
                                    {formatCurrencyWithCents(
                                        collectionPreview.pending_declared_amount
                                    )}
                                </span>
                            </div>
                            <div className="orderBalanceFullDivider" />
                            <div className="orderBalanceFullRow">
                                <span className="orderBalanceFullCollectLabel">A cobrar ahora</span>
                                <span className="orderBalanceFullValue orderBalanceFullValue--pending">
                                    {formatCurrencyWithCents(
                                        collectionPreview.amount_to_collect_now
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}
            {!collectionPreview && !previewLoading && !previewError && (
                <div className="orderBalanceFullRow">
                    <span className="orderBalanceFullLabel">Pagado confirmado</span>
                    <span className="orderBalanceFullValue orderBalanceFullValue--paid">
                        {formatCurrencyWithCents(order.paid_amount)}
                    </span>
                </div>
            )}
        </div>
    );
};
