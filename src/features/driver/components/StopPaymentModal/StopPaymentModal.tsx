import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Select, Input, Button, message as antMessage, Alert } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { DriverService } from '../../services/driver.service';
import { formatCurrencyWithCents } from '@/utils/formatters';
import type { StorePaymentMethod } from '@features/store/payment-methods/interfaces/store-payment-method.interface';
import './StopPaymentModal.css';

interface PaymentRow {
    id: string;
    store_payment_method_id: string | null;
    amountInput: string;
    reference: string;
}

interface StopPaymentModalProps {
    open: boolean;
    amountToCollectNow: number;
    onClose: () => void;
    onConfirm: (
        payments: Array<{ store_payment_method_id: string; amount: number; reference?: string }>
    ) => Promise<void>;
}

let rowCounter = 0;

function createRow(): PaymentRow {
    rowCounter += 1;
    return {
        id: `payment-row-${rowCounter}`,
        store_payment_method_id: null,
        amountInput: '',
        reference: '',
    };
}

function moneyInputToCents(value: string): number {
    const normalized = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return 0;

    const [whole, decimals = ''] = normalized.split('.');
    return Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
}

function isEditableMoneyInput(value: string): boolean {
    return /^\d*(?:[.,]\d{0,2})?$/.test(value);
}

function centsToAmount(cents: number): number {
    return cents / 100;
}

/**
 * Modal de pago para el conductor.
 * Adaptado de POSPaymentModal pero:
 * - Valida contra amount_to_collect_now calculado por backend
 * - Permite confirmar con suma parcial (abono parcial)
 * - Bloquea solo si la suma supera el máximo de esta entrega
 * - Label dinámico "Confirmar y Entregar $X"
 */
export const StopPaymentModal: React.FC<StopPaymentModalProps> = ({
    open,
    amountToCollectNow,
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

    const maximumCents = Math.round(amountToCollectNow * 100);
    const sumPaymentsCents = useMemo(
        () =>
            rows.reduce(
                (sum, row) =>
                    sum + (row.store_payment_method_id ? moneyInputToCents(row.amountInput) : 0),
                0
            ),
        [rows]
    );

    const remainingCents = maximumCents - sumPaymentsCents;
    const displayRemainingCents = Math.max(0, remainingCents);
    const isPartial = sumPaymentsCents > 0 && sumPaymentsCents < maximumCents;
    const isExcess = sumPaymentsCents > maximumCents;

    const findMethod = useCallback(
        (pid: string | null): StorePaymentMethod | undefined =>
            pid
                ? paymentMethods.find((m) => (m.store_payment_method_id ?? m.id) === pid)
                : undefined,
        [paymentMethods]
    );

    const hasValidRow = rows.some(
        (row) => row.store_payment_method_id && moneyInputToCents(row.amountInput) > 0
    );

    // Bloquea si hay exceso o si no hay fila válida
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
                .filter(
                    (row) => row.store_payment_method_id && moneyInputToCents(row.amountInput) > 0
                )
                .map((r) => ({
                    store_payment_method_id: r.store_payment_method_id!,
                    amount: centsToAmount(moneyInputToCents(r.amountInput)),
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
                <div className="stopPaymentModalSummaryTitle">Resumen</div>
                <div className="stopPaymentModalSummaryRow">
                    <span className="stopPaymentModalSummaryLabel">Máximo disponible</span>
                    <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--pending">
                        {formatCurrencyWithCents(amountToCollectNow)}
                    </span>
                </div>
                <div className="stopPaymentModalSummaryRow">
                    <span className="stopPaymentModalSummaryLabel">Cobrado</span>
                    <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--paid">
                        {formatCurrencyWithCents(centsToAmount(sumPaymentsCents))}
                    </span>
                </div>
                {isExcess ? (
                    <div className="stopPaymentModalSummaryRow">
                        <span className="stopPaymentModalSummaryLabel">Exceso</span>
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--error">
                            {formatCurrencyWithCents(
                                centsToAmount(sumPaymentsCents - maximumCents)
                            )}
                        </span>
                    </div>
                ) : (
                    <div className="stopPaymentModalSummaryRow">
                        <span className="stopPaymentModalSummaryLabel">Pendiente</span>
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--pending">
                            {formatCurrencyWithCents(centsToAmount(displayRemainingCents))}
                        </span>
                    </div>
                )}
                {!isExcess && sumPaymentsCents === maximumCents && sumPaymentsCents > 0 && (
                    <div className="stopPaymentModalSummaryCovered">
                        <span className="stopPaymentModalSummaryValue stopPaymentModalSummaryValue--covered">
                            Total cubierto
                        </span>
                    </div>
                )}
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
                            moneyInputToCents(row.amountInput) > maximumCents
                        ) {
                            exceedMessage = 'El monto no puede superar el máximo de esta entrega.';
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
                                    <Input
                                        aria-label={`Monto del cobro ${rows.indexOf(row) + 1}`}
                                        placeholder="Monto"
                                        value={row.amountInput}
                                        inputMode="decimal"
                                        prefix="$"
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            if (isEditableMoneyInput(value)) {
                                                updateRow(row.id, 'amountInput', value);
                                            }
                                        }}
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
                                    <div className="stopPaymentModalRowError">{exceedMessage}</div>
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
                    disabled={paymentMethods.length === 0 || remainingCents <= 0}
                    className="stopPaymentModalAddBtn"
                >
                    Agregar otro medio de pago
                </Button>
            </div>
        </Modal>
    );
};
