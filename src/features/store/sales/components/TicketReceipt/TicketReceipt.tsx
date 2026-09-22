import { formatCurrencyWithCents } from '@/utils/formatters';
import type { ReceiptData } from '../../interfaces/sale.interface';
import { formatCuit, formatReceiptOccurredAt } from '../../utils/receipt-formatters';
import './TicketReceipt.css';

interface TicketReceiptProps {
    receipt: ReceiptData;
}

export const TicketReceipt: React.FC<TicketReceiptProps> = ({ receipt }) => {
    const { store, operation, customer, items, totals, payments } = receipt;
    const [date, time] = formatReceiptOccurredAt(operation.occurred_at).split(' ');

    return (
        <div className="ticket-receipt-print-root" aria-hidden="true">
            <article className="ticket-receipt" data-testid="ticket-receipt">
                <header className="ticket-receipt__header">
                    <strong className="ticket-receipt__store-name">{store.name}</strong>
                    {store.cuit && <span>CUIT {formatCuit(store.cuit)}</span>}
                    {store.address && <span>{store.address}</span>}
                </header>

                <section className="ticket-receipt__section ticket-receipt__metadata">
                    <div className="ticket-receipt__metadata-row">
                        <span className="ticket-receipt__metadata-label">Venta:</span>
                        <span className="ticket-receipt__metadata-value">
                            {operation.operation_number}
                        </span>
                    </div>
                    <div className="ticket-receipt__metadata-row">
                        <span className="ticket-receipt__metadata-label">Fecha:</span>
                        <span className="ticket-receipt__metadata-value">{date}</span>
                    </div>
                    {time && (
                        <div className="ticket-receipt__metadata-row">
                            <span className="ticket-receipt__metadata-label">Hora:</span>
                            <span className="ticket-receipt__metadata-value">{time}</span>
                        </div>
                    )}
                    {operation.cashier && (
                        <div className="ticket-receipt__metadata-row">
                            <span className="ticket-receipt__metadata-label">Cajero:</span>
                            <span className="ticket-receipt__metadata-value">
                                {operation.cashier.name}
                            </span>
                        </div>
                    )}
                    {customer && (
                        <div className="ticket-receipt__metadata-row">
                            <span className="ticket-receipt__metadata-label">Cliente:</span>
                            <span className="ticket-receipt__metadata-value">
                                {customer.display_name}
                            </span>
                        </div>
                    )}
                </section>

                <section className="ticket-receipt__section">
                    {items.map((item, index) => (
                        <div className="ticket-receipt__item" key={`${item.product_name}-${index}`}>
                            <div className="ticket-receipt__item-name">{item.product_name}</div>
                            <div className="ticket-receipt__item-line">
                                <span className="ticket-receipt__item-meta">
                                    {item.quantity} x {formatCurrencyWithCents(item.unit_price)}
                                </span>
                                <span className="ticket-receipt__item-subtotal">
                                    {formatCurrencyWithCents(item.subtotal)}
                                </span>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="ticket-receipt__section ticket-receipt__totals">
                    <div className="ticket-receipt__row">
                        <span>Subtotal</span>
                        <span>{formatCurrencyWithCents(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                        <div className="ticket-receipt__row">
                            <span>Descuento</span>
                            <span>-{formatCurrencyWithCents(totals.discount)}</span>
                        </div>
                    )}
                    {totals.tax > 0 && (
                        <div className="ticket-receipt__row">
                            <span>Impuestos</span>
                            <span>{formatCurrencyWithCents(totals.tax)}</span>
                        </div>
                    )}
                    <div className="ticket-receipt__row ticket-receipt__total">
                        <strong>TOTAL</strong>
                        <strong>{formatCurrencyWithCents(totals.total)}</strong>
                    </div>
                </section>

                {payments.length > 0 && (
                    <section className="ticket-receipt__section">
                        <strong className="ticket-receipt__section-title">PAGOS</strong>
                        {payments.map((payment, index) => (
                            <div
                                className="ticket-receipt__row ticket-receipt__payment-row"
                                key={`${payment.method_name}-${index}`}
                            >
                                <span className="ticket-receipt__payment-method">
                                    {payment.method_name ?? 'Medio de pago'}
                                </span>
                                <span className="ticket-receipt__payment-amount">
                                    {formatCurrencyWithCents(payment.amount)}
                                </span>
                            </div>
                        ))}
                    </section>
                )}

                <footer className="ticket-receipt__footer">Gracias por su compra</footer>
            </article>
        </div>
    );
};
