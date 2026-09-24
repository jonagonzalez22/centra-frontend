import { Alert, Form, Input, message, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { cancellationReasons } from '../../constants/cancellation-reasons';
import type { CancelSaleDTO, SaleListItem } from '../../interfaces/sale.interface';
import { SalesService } from '../../services/sales.service';

type CancellationApiError = Partial<ApiError> & {
    response?: {
        status?: number;
        data?: Partial<ApiError>;
    };
};

const isMeaningfulMessage = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0 && value !== 'Error inesperado';

const errorDetails = (error: CancellationApiError) => {
    const data = error.response?.data;
    return {
        status: error.status ?? error.response?.status ?? 0,
        message: data?.message ?? error.message,
        errors: data?.errors ?? error.errors,
    };
};

const businessErrorMessage = (error: CancellationApiError): string => {
    const { message: apiMessage, errors } = errorDetails(error);
    const firstFieldMessage = errors && Object.values(errors).flat()[0];

    if (isMeaningfulMessage(apiMessage)) return apiMessage;
    if (firstFieldMessage) return firstFieldMessage;

    return 'No se pudo cancelar la venta.';
};

const isBusinessCancellationError = (error: CancellationApiError): boolean => {
    const { status, errors } = errorDetails(error);

    if (status === 422) return true;

    // SaleHistoryController identifies a scoped, missing sale with an `id` field error.
    // A generic 404 (route/resource unavailable) does not have that functional payload.
    return status === 404 && Boolean(errors?.id?.length);
};

export interface CancelSaleModalProps {
    sale: SaleListItem | null;
    open: boolean;
    onClose: () => void;
    onSuccess: (saleId: string) => void | Promise<void>;
}

const resetCancellationForm = (form: FormInstance<CancelSaleDTO>, setBusinessError: (value: string | null) => void) => {
    form.resetFields();
    setBusinessError(null);
};

export const CancelSaleModal = ({ sale, open, onClose, onSuccess }: CancelSaleModalProps) => {
    const [form] = Form.useForm<CancelSaleDTO>();
    const [submitting, setSubmitting] = useState(false);
    const [businessError, setBusinessError] = useState<string | null>(null);

    useEffect(() => {
        if (open) resetCancellationForm(form, setBusinessError);
    }, [form, open, sale?.id]);

    const close = () => {
        if (submitting) return;

        resetCancellationForm(form, setBusinessError);
        onClose();
    };

    const submit = async () => {
        if (!sale || submitting) return;

        setBusinessError(null);

        try {
            await form.validateFields();
        } catch {
            return;
        }

        setSubmitting(true);

        try {
            await SalesService.cancelSale(sale.id, form.getFieldsValue());
            resetCancellationForm(form, setBusinessError);
            await onSuccess(sale.id);
            message.success('Venta cancelada exitosamente.');
            onClose();
        } catch (error) {
            const cancellationError = error as CancellationApiError;

            if (isBusinessCancellationError(cancellationError)) {
                setBusinessError(businessErrorMessage(cancellationError));
            } else {
                message.error('No se pudo completar la cancelación. Intentá nuevamente.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={close}
            title={sale ? `Cancelar venta ${sale.operation_number}` : 'Cancelar venta'}
            loading={submitting}
            width={520}
            footer={
                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="default" label="Volver" action={close} disabled={submitting} />
                    <Button
                        variant="danger"
                        label="Cancelar venta"
                        action={() => void submit()}
                        loading={submitting}
                    />
                </div>
            }
        >
            <p className="mb-5 text-gray-600">
                Esta acción restaurará el stock y anulará los pagos asociados a la venta. No se puede
                deshacer desde esta pantalla.
            </p>
            {businessError && (
                <Alert className="mb-5" type="error" message={businessError} showIcon />
            )}
            <Form form={form} layout="vertical">
                <Form.Item
                    name="reason_code"
                    label="Motivo"
                    rules={[
                        { required: true, message: 'El motivo de cancelación es obligatorio.' },
                    ]}
                >
                    <Select placeholder="Seleccioná un motivo" options={cancellationReasons} />
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(previous, current) => previous.reason_code !== current.reason_code}
                >
                    {({ getFieldValue }) => (
                        <Form.Item
                            name="reason_note"
                            label="Detalle"
                            rules={[
                                {
                                    required: getFieldValue('reason_code') === 'other',
                                    message:
                                        'El detalle es obligatorio cuando el motivo es Otro.',
                                },
                                {
                                    max: 1000,
                                    message: 'El detalle no puede superar los 1000 caracteres.',
                                },
                            ]}
                        >
                            <Input.TextArea rows={3} maxLength={1000} />
                        </Form.Item>
                    )}
                </Form.Item>
            </Form>
        </Modal>
    );
};
