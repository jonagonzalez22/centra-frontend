import { Tag } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import type { OrderAmounts } from '@/features/driver/interfaces/driver.interface';
import './OrderBalanceSummary.css';

interface OrderBalanceSummaryProps {
    order: OrderAmounts | null;
    /** 'compact' renders a single subtle badge for use in stop cards. */
    /** 'full' renders the complete economic breakdown for stop detail. */
    variant?: 'compact' | 'full';
}

export const OrderBalanceSummary = ({ order, variant = 'compact' }: OrderBalanceSummaryProps) => {
    if (!order) return null;

    if (variant === 'compact') {
        if (order.pending_amount === 0) {
            return (
                <Tag className="orderBalanceBadge orderBalanceBadge--paid">
                    Pagado
                </Tag>
            );
        }
        return (
            <Tag className="orderBalanceBadge orderBalanceBadge--pending">
                Cobrar {formatCurrency(order.pending_amount)}
            </Tag>
        );
    }

    // full variant
    const hasPending = order.pending_amount > 0;

    return (
        <div className="orderBalanceFull">
            <div className="orderBalanceFullRow">
                <span className="orderBalanceFullLabel">Total del pedido</span>
                <span className="orderBalanceFullValue">{formatCurrency(order.total)}</span>
            </div>
            <div className="orderBalanceFullRow">
                <span className="orderBalanceFullLabel">Pagado</span>
                <span className="orderBalanceFullValue orderBalanceFullValue--paid">
                    {formatCurrency(order.paid_amount)}
                </span>
            </div>
            <div className="orderBalanceFullDivider" />
            <div className="orderBalanceFullRow">
                <span className="orderBalanceFullLabel">Saldo a cobrar</span>
                <span
                    className={`orderBalanceFullValue ${hasPending ? 'orderBalanceFullValue--pending' : 'orderBalanceFullValue--zero'}`}
                >
                    {formatCurrency(order.pending_amount)}
                </span>
            </div>
        </div>
    );
};
