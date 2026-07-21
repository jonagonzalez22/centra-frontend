import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Select, InputNumber, Input, Button, message as antMessage, Alert } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { SalesService } from '../../services/sales.service';
import { usePOSStore } from '../../stores/usePOSStore';
import { formatCurrency } from '@/utils/formatters';
import type { StorePaymentMethod } from '@features/store/payment-methods/interfaces/store-payment-method.interface';

const CASH_CODE = 'cash';

interface PaymentRow {
  id: string;
  store_payment_method_id: string | null;
  amount: number | null;
  reference: string;
}

interface POSPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({ open, onClose, onSuccess }) => {
  const items = usePOSStore((s) => s.items);
  const type = usePOSStore((s) => s.type);
  const customer = usePOSStore((s) => s.customer);
  const requested_delivery_date = usePOSStore((s) => s.requested_delivery_date);
  const resetPOS = usePOSStore((s) => s.resetPOS);

  const [paymentMethods, setPaymentMethods] = useState<StorePaymentMethod[]>([]);
  const [rows, setRows] = useState<PaymentRow[]>([createRow()]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const methods = await SalesService.getPaymentMethods();
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

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const sumPayments = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (row.store_payment_method_id && row.amount ? row.amount : 0),
        0
      ),
    [rows]
  );

  const remaining = total - sumPayments;
  const change = sumPayments > total ? sumPayments - total : 0;
  const displayRemaining = Math.max(0, remaining);

  const findMethod = useCallback(
    (pid: string | null): StorePaymentMethod | undefined =>
      pid
        ? paymentMethods.find((m) => (m.store_payment_method_id ?? m.id) === pid)
        : undefined,
    [paymentMethods]
  );

  const isExceedError = useMemo(
    () =>
      rows.some((row) => {
        if (!row.store_payment_method_id || !row.amount) return false;
        const method = findMethod(row.store_payment_method_id);
        if (method?.code === CASH_CODE) return false;
        const otherSum = rows
          .filter((r) => r.id !== row.id)
          .reduce(
            (sum, r) => sum + (r.store_payment_method_id && r.amount ? r.amount : 0),
            0
          );
        const maxAllowed = Math.max(0, total - otherSum);
        return row.amount > maxAllowed;
      }),
    [rows, findMethod, total]
  );

  const hasValidRow = rows.some(
    (r) => r.store_payment_method_id && r.amount && r.amount > 0
  );

  const isValid = useMemo(() => {
    if (!hasValidRow || isExceedError) return false;
    if (type === 'order') return true;
    return sumPayments >= total;
  }, [hasValidRow, isExceedError, type, sumPayments, total]);

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

      await SalesService.createOperation({
        type,
        customer_id: customer?.id ?? null,
        requested_delivery_date: type === 'order' ? requested_delivery_date : null,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price,
        })),
        payments,
      });

      if (type === 'order') {
        const finalRemaining = Math.max(0, total - sumPayments);
        if (finalRemaining > 0) {
          antMessage.success(
            `Seña registrada correctamente. Saldo pendiente: ${formatCurrency(finalRemaining)}`
          );
        } else {
          antMessage.success('Pedido registrado correctamente.');
        }
      } else {
        antMessage.success('Operación creada correctamente.');
      }

      resetPOS();
      onSuccess();
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Error al crear la operación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={type === 'order' ? 'Registrar seña' : 'Registrar pago'}
      width={520}
      closable={!submitting}
      maskClosable={!submitting}
      keyboard={!submitting}
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm space-y-0.5">
            <div>
              <span className="text-gray-500">Total: </span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
            {type === 'order' && sumPayments > 0 ? (
              change > 0 ? (
                <div className="text-green-600 font-medium">
                  Vuelto: {formatCurrency(change)}
                </div>
              ) : displayRemaining > 0 ? (
                <div className="text-blue-600">
                  Seña: {formatCurrency(sumPayments)} · Restante:{' '}
                  {formatCurrency(displayRemaining)}
                </div>
              ) : (
                <div className="text-green-600">Total cubierto</div>
              )
            ) : type === 'sale' ? (
              change > 0 ? (
                <div className="text-green-600 font-medium">
                  Vuelto: {formatCurrency(change)}
                </div>
              ) : displayRemaining > 0 ? (
                <div className="text-red-500">
                  Falta: {formatCurrency(displayRemaining)}
                </div>
              ) : (
                <div className="text-green-600">Cubierto</div>
              )
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!isValid}
            >
              {type === 'order' ? 'Registrar seña' : `Cobrar ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {error && <Alert type="error" message={error} showIcon closable />}

        <div className="text-sm text-gray-500 mb-1">
          {items.length} producto{items.length !== 1 && 's'} ·{' '}
          {type === 'order' ? 'Total del pedido' : 'Total a cobrar'}:{' '}
          <span className="font-bold">{formatCurrency(total)}</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {rows.map((row) => {
            const method = findMethod(row.store_payment_method_id);
            const isCash = !!method && method.code === CASH_CODE;

            let exceedMessage: string | null = null;
            if (!isCash && row.store_payment_method_id && row.amount && row.amount > 0) {
              const otherSum = rows
                .filter((r) => r.id !== row.id)
                .reduce(
                  (sum, r) =>
                    sum + (r.store_payment_method_id && r.amount ? r.amount : 0),
                  0
                );
              const maxAllowed = Math.max(0, total - otherSum);
              if (row.amount > maxAllowed) {
                exceedMessage =
                  'El importe no puede superar el saldo pendiente para este medio de pago.';
              }
            }

            return (
              <div key={row.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <div className="flex-1 space-y-1">
                  <Select
                    placeholder="Medio de pago"
                    value={row.store_payment_method_id}
                    onChange={(val) => updateRow(row.id, 'store_payment_method_id', val)}
                    loading={loading}
                    style={{ width: '100%' }}
                    options={paymentMethods
                      .filter((pm) => {
                        const pid = pm.store_payment_method_id ?? pm.id;
                        const used = rows.find(
                          (r) => r.id !== row.id && r.store_payment_method_id === pid
                        );
                        return !used;
                      })
                      .map((pm) => ({
                        label: pm.custom_name ?? pm.name,
                        value: pm.store_payment_method_id ?? pm.id,
                      }))}
                  />
                  <div className="flex gap-2">
                    <InputNumber<number>
                      placeholder="Monto"
                      value={row.amount}
                      onChange={(val) => updateRow(row.id, 'amount', val)}
                      min={0.01}
                      formatter={formatInputNumber}
                      parser={parseInputNumber}
                      style={{ width: '100%' }}
                      status={exceedMessage ? 'error' : undefined}
                    />
                    {method?.requires_reference ? (
                      <Input
                        placeholder="Referencia"
                        value={row.reference}
                        onChange={(e) => updateRow(row.id, 'reference', e.target.value)}
                        style={{ width: 140 }}
                      />
                    ) : null}
                  </div>
                  {exceedMessage && (
                    <div className="text-xs text-red-500 mt-0.5">{exceedMessage}</div>
                  )}
                </div>
                {rows.length > 1 && row.id !== rows[0].id && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<Trash2 size={14} />}
                    onClick={() => removeRow(row.id)}
                    className="mt-1"
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
        >
          Agregar otro medio de pago
        </Button>
      </div>
    </Modal>
  );
};
