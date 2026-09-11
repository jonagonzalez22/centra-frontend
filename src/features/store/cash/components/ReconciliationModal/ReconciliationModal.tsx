import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Col,
    Descriptions,
    Divider,
    Form,
    Input,
    InputNumber,
    Row,
    Spin,
    Statistic,
    Typography,
    message,
} from 'antd';
import { Button } from '@/components/Button';
import Card from '@/components/Card/Card';
import Modal from '@/components/Modal/Modal';
import type { CashPaymentMethodTotal, CashSessionReconciliation } from '@/entities/CashSession';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { formatCurrency, formatDate, formatDateShort } from '@/utils/formatters';
import { CashService } from '../../services/cash.service';
import { ReconciliationPaymentsModal } from '../ReconciliationPaymentsModal';
import './ReconciliationModal.css';

const { TextArea } = Input;

interface ReconciliationModalProps {
    sessionId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const ReconciliationModal = ({
    sessionId,
    onClose,
    onSuccess,
}: ReconciliationModalProps) => {
    const [form] = Form.useForm();
    const [detail, setDetail] = useState<CashSessionReconciliation | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [detailMethod, setDetailMethod] = useState<CashPaymentMethodTotal | null>(null);
    const realAmount = Form.useWatch<number>('real_amount', form);
    const differenceCents = useMemo(() => {
        if (!detail || realAmount === undefined || realAmount === null) return null;
        return Math.round(realAmount * 100) - Math.round(detail.expected_amount * 100);
    }, [detail, realAmount]);

    useEffect(() => {
        if (!sessionId) return;
        setLoading(true);
        setDetail(null);
        form.resetFields();
        CashService.getReconciliation(sessionId)
            .then(setDetail)
            .catch((error: ApiError) =>
                message.error(error.message || 'No se pudo cargar el arqueo.')
            )
            .finally(() => setLoading(false));
    }, [form, sessionId]);

    const handleSubmit = async (values: { real_amount: number; reconciliation_notes?: string }) => {
        if (!sessionId || !detail) return;
        setSubmitting(true);
        try {
            await CashService.close(sessionId, values);
            message.success('Arqueo confirmado y caja cerrada correctamente.');
            onSuccess();
        } catch (error) {
            const apiError = error as ApiError;
            message.error(apiError.message || 'No se pudo cerrar la caja.');
            if (apiError.errors) {
                form.setFields(
                    Object.entries(apiError.errors).map(([name, errors]) => ({ name, errors }))
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const hasDifference = differenceCents !== null && differenceCents !== 0;
    const nonCashMethods = detail?.totals_by_payment_method.filter(
        (method) => method.code !== 'cash'
    );

    return (
        <Modal
            open={Boolean(sessionId)}
            onClose={() => !submitting && onClose()}
            title="Realizar arqueo"
            width={760}
            className="reconciliation-modal"
            loading={submitting}
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        label="Cancelar"
                        variant="default"
                        action={onClose}
                        disabled={submitting}
                    />
                    <Button
                        label="Confirmar arqueo y cerrar"
                        loading={submitting}
                        disabled={!detail || loading}
                        action={() => form.submit()}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            {loading || !detail ? (
                <div className="flex justify-center py-16">
                    <Spin />
                </div>
            ) : (
                <div className="space-y-5">
                    <Descriptions
                        title="Datos de sesión"
                        bordered
                        size="small"
                        column={{ xs: 1, sm: 2 }}
                    >
                        <Descriptions.Item label="Cajero">{detail.cashier.name}</Descriptions.Item>
                        <Descriptions.Item label="Jornada">
                            {formatDateShort(detail.business_date)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Apertura">
                            {formatDate(detail.opened_at)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Envío a control">
                            {formatDate(detail.submitted_at)}
                        </Descriptions.Item>
                    </Descriptions>
                    <section aria-labelledby="cash-summary-title">
                        <Typography.Title id="cash-summary-title" level={5} className="!mb-1">
                            Efectivo
                        </Typography.Title>
                        <Typography.Paragraph type="secondary" className="!mb-3">
                            El efectivo esperado es el importe físico que debería estar disponible
                            para el arqueo.
                        </Typography.Paragraph>
                        <Row gutter={[12, 12]}>
                            {[
                                ['Monto inicial', detail.opening_amount],
                                ['Cobrado en efectivo', detail.cash_income],
                                ['Efectivo esperado', detail.expected_amount],
                                ['Declarado por cajero', detail.declared_amount],
                            ].map(([label, amount]) => (
                                <Col xs={24} sm={12} key={String(label)}>
                                    <Card className="h-full">
                                        <Statistic
                                            title={label}
                                            value={formatCurrency(Number(amount))}
                                            valueStyle={{
                                                whiteSpace: 'nowrap',
                                                fontSize: 22,
                                                color:
                                                    label === 'Efectivo esperado'
                                                        ? '#093764'
                                                        : undefined,
                                            }}
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </section>

                    <section aria-labelledby="other-methods-title">
                        <Typography.Title id="other-methods-title" level={5}>
                            Otros medios de pago
                        </Typography.Title>
                        <Card>
                            {nonCashMethods?.length ? (
                                <div className="divide-y divide-gray-200">
                                    {nonCashMethods.map((method) => (
                                        <div
                                            key={method.store_payment_method_id}
                                            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <div className="font-medium">{method.name}</div>
                                                <Typography.Text type="secondary">
                                                    {method.payment_count}{' '}
                                                    {method.payment_count === 1 ? 'pago' : 'pagos'}
                                                </Typography.Text>
                                                <div className="mt-1">
                                                    <Button
                                                        variant="link"
                                                        size="small"
                                                        label="Ver detalle"
                                                        action={() => setDetailMethod(method)}
                                                    />
                                                </div>
                                            </div>
                                            <strong className="whitespace-nowrap text-base">
                                                {formatCurrency(method.total)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Typography.Text type="secondary">
                                    No se registraron cobros por otros medios.
                                </Typography.Text>
                            )}
                        </Card>
                    </section>

                    <Card>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <Typography.Text type="secondary">Total cobrado</Typography.Text>
                                <div className="text-sm text-gray-500">
                                    Todos los medios registrados durante la sesión
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="whitespace-nowrap text-2xl font-semibold">
                                    {formatCurrency(detail.total_collected)}
                                </div>
                                <Typography.Text type="secondary">
                                    {detail.payment_count} pagos · {detail.operation_count}{' '}
                                    operaciones
                                </Typography.Text>
                            </div>
                        </div>
                    </Card>
                    {detail.declaration_notes && (
                        <Alert
                            message="Observaciones del cajero"
                            description={detail.declaration_notes}
                        />
                    )}
                    <Divider />
                    <section aria-labelledby="physical-count-title">
                        <Typography.Title id="physical-count-title" level={5}>
                            Arqueo físico
                        </Typography.Title>
                        <Form form={form} layout="vertical" onFinish={handleSubmit}>
                            <Form.Item
                                name="real_amount"
                                label="Efectivo contado"
                                rules={[
                                    {
                                        required: true,
                                        message: 'El efectivo contado es obligatorio.',
                                    },
                                    {
                                        type: 'number',
                                        min: 0,
                                        message: 'El importe debe ser mayor o igual a 0.',
                                    },
                                ]}
                            >
                                <InputNumber
                                    className="w-full"
                                    min={0}
                                    precision={2}
                                    prefix="$"
                                    disabled={submitting}
                                />
                            </Form.Item>
                            {differenceCents !== null && (
                                <Alert
                                    className="mb-4"
                                    type={differenceCents === 0 ? 'success' : 'warning'}
                                    message={
                                        differenceCents === 0
                                            ? 'Sin diferencia'
                                            : differenceCents < 0
                                              ? `Faltante: ${formatCurrency(Math.abs(differenceCents) / 100)}`
                                              : `Sobrante: ${formatCurrency(differenceCents / 100)}`
                                    }
                                />
                            )}
                            <Form.Item
                                name="reconciliation_notes"
                                label="Observaciones del arqueo"
                                rules={[
                                    {
                                        validator: (_, value?: string) =>
                                            hasDifference && !value?.trim()
                                                ? Promise.reject(
                                                      new Error(
                                                          'Debe ingresar una observación para registrar una diferencia.'
                                                      )
                                                  )
                                                : Promise.resolve(),
                                    },
                                ]}
                            >
                                <TextArea rows={3} maxLength={1000} disabled={submitting} />
                            </Form.Item>
                        </Form>
                    </section>
                    {detailMethod && (
                        <ReconciliationPaymentsModal
                            sessionId={detail.id}
                            paymentMethod={detailMethod}
                            onClose={() => setDetailMethod(null)}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};
