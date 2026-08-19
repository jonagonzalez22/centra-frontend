import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Select, InputNumber, Input, Button, message as antMessage, Alert } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { DriverService } from '../../services/driver.service';
import { formatCurrency } from '@/utils/formatters';
import type { StorePaymentMethod } from '@features/store/payment-methods/interfaces/store-payment-method.interface';
import './StopPaymentModal.css';

interface PaymentRow {
    id: string;
    store_payment_method_id: string | null;
    amount: number | null;
    reference: string;
}

interface StopPaymentModalProps {
    open: boolean;
    pendingAmount: number;
    onClose: () => void;
    onConfirm: (payments: Array<{ store_payment_method_id: string; amount: number; reference?: string }>) => Promise<void>;
}

let rowCounter = 0;

function createRow(): PaymentRow {
    rowCounter += 1;
    return {
        id: `payment-row-${rowCounter}`,
        store_payment_method_id: null,
        amount: null,
        reference: '',
    };
}

function formatInputNumber(value: number | string | undefined): string {
    if (value == null) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return `$ ${num.toLocaleString('es-AR')}`;
}

function parseInputNumber(value: string | undefined): number {
    if (!value) return 0;
    return Number(value.replace(/[^0-9]/g, ''));
}

/**
 * Modal de pago para el conductor.
 * Adaptado de POSPaymentModal pero:
 * - Valida contra pending_amount (no contra total)
 * - Permite confirmar con suma parcial (abono parcial)
 * - Bloquea solo si suma > pending_amount
 * - Label dinámico "Confirmar y Entregar $X"
 */
export const StopPaymentModal: React.FC<StopPaymentModalProps> = ({
    open,
    pendingAmount,
    onClose,
    onConfirm,
}) => {
    const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([]);
    const [rows, setRows] = useState<PaymentRow[]>([createRow()]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPaymentMethods = useCallback(async () => {
        setLoading(true);
        try {
            const methods = await DriverService.getPaymentMethods();
            setPaymentMethods(methods);
        } catch {
            antMessage.error('Error al cargar métodos de pago.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            setRows([createRow()]);
            setError(null);
            loadPaymentMethods();
        }
    }, [open, loadPaymentMethods]);

    const sumPayments = useMemo(
        () =>
            rows.reduce(
                (sum, row) => sum + (row.store_payment_method_id && row.amount ? row.amount : 0),
                0
            ),
        [rows]
    );

    const remaining = pendingAmount - sumPayments;
    const displayRemaining = Math.max(0, remaining);
    const isPartial = sumPayments > 0 && sumPayments < pendingAmount;
    const isExcess = sumPayments > pendingAmount;

    const findMethod = useCallback(
        (pid: string | null): StorePaymentMethod | undefined =>
            pid
                ? paymentMethods.find((m) => (m.store_payment_method_id ?? m.id) === pid)
                : undefined,
        [paymentMethods]
    );

    const hasValidRow = rows.some(
        (r) => r.store_payment_method_id && r.amount && r.amount > 0
    );

    // Calcula el máximo permitido para una fila específica
    const getMaxForRow = useCallback(
        (rowId: string): number => {
            const otherSum = rows
                .filter((r) => r.id !== rowId)
                .reduce(
                    (sum, r) => sum + (r.store_payment_method_id && r.amount ? r.amount : 0),
                    0
                );
            return Math.max(0, pendingAmount - otherSum);
        },
        [rows, pendingAmount]
    );

    // Bloquea si hay exceso (suma > pendingAmount) o si no hay fila válida
    const isValid = useMemo(() => {
        if (!hasValidRow) return false;
        if (isExcess) return false;
        return true;
    }, [hasValidRow, isExcess]);

    const addRow = () => {
        setRows((prev) => [...prev, createRow()]);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1 || id === rows[0].id) return;
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateRow = (id: string, field: keyof PaymentRow, value: string | number | null) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const handleSubmit = async () => {
        if (!isValid) return;

        setSubmitting(true);
        setError(null);

        try {
            const payments = rows
                .filter((r) => r.store_payment_method_id && r.amount && r.amount > 0)
                .map((r) => ({
                    store_payment_method_id: r.store_payment_method_id!,
                    amount: r.amount!,
                    ...(r.reference ? { reference: r.reference } : {}),
                }));

            await onConfirm(payments);
        } catch (err) {
            const apiError = err as { message?: string };
            setError(apiError.message || 'Error al registrar el pago.');
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="stopPaymentModalFooter">
            <div className="stopPaymentModalSummary">
                <div className="stopPaymentModalSummaryRow">
                    <span className="stopPaymentModalSummaryLabel">Saldo pendiente</span>
                    <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--pending">
                        {formatCurrency(pendingAmount)}
                    </span>
                </div>
                {sumPayments > 0 && (
                    <div className="stopPaymentModalSummaryRow">
                        <span className="stopPaymentModalSummaryLabel">Cobrado</span>
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--paid">
                            {formatCurrency(sumPayments)}
                        </span>
                    </div>
                )}
                {isExcess ? (
                    <div className="stopPaymentModalSummaryRow">
                        <span className="stopPaymentModalSummaryLabel">Exceso</span>
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--error">
                            {formatCurrency(sumPayments - pendingAmount)}
                        </span>
                    </div>
                ) : isPartial ? (
                    <div className="stopPaymentModalSummaryRow">
                        <span className="stopPaymentModalSummaryLabel">Queda pendiente</span>
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--pending">
                            {formatCurrency(displayRemaining)}
                        </span>
                    </div>
                ) : sumPayments === pendingAmount && sumPayments > 0 ? (
                    <div className="stopPaymentModalSummaryRow">
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--covered">
                            Total cubierto
                        </span>
                    </div>
                ) : null}
            </div>
            <div className="stopPaymentModalFooterActions">
                <Button onClick={onClose} disabled={submitting}>
                    Cancelar
                </Button>
                <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!isValid}
                >
                    Confirmar y Entregar
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title="Registrar cobro"
            width={520}
            closable={!submitting}
            maskClosable={!submitting}
            keyboard={!submitting}
            footer={footer}
            className="stopPaymentModal"
        >
            <div className="stopPaymentModalBody">
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        showIcon
                        closable
                        className="stopPaymentModalError"
                    />
                )}

                <div className="stopPaymentModalHint">
                    Registrá los medios de pago collected del cliente.
                    {isPartial && (
                        <span className="stopPaymentModalHint--partial">
                            {' '}
                            El saldo restante quedará pendiente.
                        </span>
                    )}
                </div>

                <div className="stopPaymentModalRows">
                    {rows.map((row) => {
                        const method = findMethod(row.store_payment_method_id);

                        let exceedMessage: string | null = null;
                        if (
                            row.store_payment_method_id &&
                            row.amount &&
                            row.amount > 0 &&
                            row.amount > pendingAmount
                        ) {
                            exceedMessage = 'El monto no puede superar el saldo pendiente.';
                        }

                        return (
                            <div key={row.id} className="stopPaymentModalRow">
                                <Select
                                    placeholder="Medio de pago"
                                    value={row.store_payment_method_id}
                                    onChange={(val) =>
                                        updateRow(row.id, 'store_payment_method_id', val)
                                    }
                                    loading={loading}
                                    style={{ width: '100%' }}
                                    options={paymentMethods
                                        .filter((pm) => {
                                            const pid = pm.store_payment_method_id ?? pm.id;
                                            const used = rows.find(
                                                (r) =>
                                                    r.id !== row.id &&
                                                    r.store_payment_method_id === pid
                                            );
                                            return !used;
                                        })
                                        .map((pm) => ({
                                            label: pm.custom_name ?? pm.name,
                                            value: pm.store_payment_method_id ?? pm.id,
                                        }))}
                                />
                                <div className="stopPaymentModalRowFields">
                                    <InputNumber<number>
                                        placeholder="Monto"
                                        value={row.amount}
                                        onChange={(val) =>
                                            updateRow(row.id, 'amount', val)
                                        }
                                        min={0.01}
                                        max={getMaxForRow(row.id)}
                                        formatter={formatInputNumber}
                                        parser={parseInputNumber}
                                        style={{ width: '100%' }}
                                        status={exceedMessage ? 'error' : undefined}
                                    />
                                    {method?.requires_reference && (
                                        <Input
                                            placeholder="Referencia *"
                                            value={row.reference}
                                            onChange={(e) =>
                                                updateRow(row.id, 'reference', e.target.value)
                                            }
                                        />
                                    )}
                                </div>
                                {exceedMessage && (
                                    <div className="stopPaymentModalRowError">
                                        {exceedMessage}
                                    </div>
                                )}
                                {rows.length > 1 && row.id !== rows[0].id && (
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                        onClick={() => removeRow(row.id)}
                                        className="stopPaymentModalRowRemove"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <Button
                    type="dashed"
                    onClick={addRow}
                    icon={<Plus size={14} />}
                    block
                    disabled={paymentMethods.length === 0 || remaining <= 0}
                    className="stopPaymentModalAddBtn"
                >
                    Agregar otro medio de pago
                </Button>
            </div>
        </Modal>
    );
};
