import { useEffect, useState } from 'react';
import { Alert, Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import type { RejectionReason } from '../../services/driver.service';
import type { StopDetailItem } from '../../interfaces/driver.interface';
import './FailedDeliveryModal.css';
import type { DecimalString } from '@/types/decimal';
import { addDecimalStrings, compareDecimalStrings, minDecimalStrings, normalizeDecimalString } from '@/utils/quantity';
import { formatQuantityForDisplay } from '@/utils/quantity';

interface FailedDeliveryModalProps {
    open: boolean;
    rejectionReasons: RejectionReason[];
    items: StopDetailItem[];
    loading: boolean;
    onConfirm: (rejectionReasonId: string, quantitiesReleased: Record<string, DecimalString>) => void;
    onClose: () => void;
}

export const FailedDeliveryModal: React.FC<FailedDeliveryModalProps> = ({
    open,
    rejectionReasons,
    items,
    loading,
    onConfirm,
    onClose,
}) => {
    const [form] = Form.useForm<{ rejection_reason_id: string }>();
    const [selectedReasonId, setSelectedReasonId] = useState<string>();
    const [quantitiesReleased, setQuantitiesReleased] = useState<Record<string, DecimalString>>({});

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleFinish = ({ rejection_reason_id }: { rejection_reason_id: string }) => {
        onConfirm(rejection_reason_id, quantitiesReleased);
    };

    const handleClose = () => {
        setSelectedReasonId(undefined);
        setQuantitiesReleased({});
        onClose();
    };

    const handleReasonChange = (reasonId: string) => {
        const reason = rejectionReasons.find((candidate) => candidate.id === reasonId);
        setSelectedReasonId(reasonId);
        setQuantitiesReleased(
            Object.fromEntries(
                items.map((item) => [
                    item.id,
                    reason?.suggest_extra_sale ? item.quantity_loaded : '0.0000',
                ])
            )
        );
    };

    const setReleasedQuantity = (item: StopDetailItem, value: DecimalString) => {
        setQuantitiesReleased((previous) => ({
            ...previous,
            [item.id]: minDecimalStrings(
                compareDecimalStrings(value, '0.0000') < 0 ? '0.0000' : normalizeDecimalString(value),
                item.quantity_loaded
            ),
        }));
    };

    const reasonOptions = rejectionReasons.map((r) => ({
        label: r.label,
        value: r.id,
    }));

    const footer = (
        <>
            <Button variant="default" label="Cancelar" action={handleClose} disabled={loading} />
            <Button
                variant="danger"
                label="Confirmar"
                loading={loading}
                action={() => form.submit()}
            />
        </>
    );

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="No se pudo entregar"
            width={400}
            footer={footer}
            loading={loading}
        >
            <div className="space-y-4">
                <Alert
                    message="Se registrarán todos los productos con cantidad entregada cero."
                    type="warning"
                    showIcon
                    className="text-sm"
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
                    id="failedDeliveryForm"
                    onValuesChange={(changedValues) => {
                        if (typeof changedValues.rejection_reason_id === 'string') {
                            handleReasonChange(changedValues.rejection_reason_id);
                        }
                    }}
                >
                    <SelectField
                        name="rejection_reason_id"
                        label="Motivo de rechazo"
                        placeholder="Seleccionar motivo"
                        options={reasonOptions}
                        rules={[{ required: true, message: 'El motivo es obligatorio.' }]}
                        disabled={loading}
                    />

                    {selectedReasonId && (
                        <div className="failedDeliveryAvailability">
                            <div className="failedDeliveryAvailabilityTitle">
                                Disponibilidad para Venta Extra
                            </div>
                            <div className="failedDeliveryAvailabilityHelp">
                                Indicá cuántas unidades pueden reutilizarse.
                            </div>
                            {items
                                .filter((item) => compareDecimalStrings(item.quantity_loaded, '0.0000') > 0)
                                .map((item) => {
                                    const released = quantitiesReleased[item.id] ?? '0.0000';
                                    return (
                                        <div className="failedDeliveryProduct" key={item.id}>
                                            <div className="failedDeliveryProductName">
                                                {item.product_name}
                                            </div>
                                            <div className="failedDeliveryProductRemaining">
                                                No entregado: {formatQuantityForDisplay(item.quantity_loaded)}
                                            </div>
                                            <div className="failedDeliveryReleaseLabel">
                                                Disponible para Venta Extra
                                            </div>
                                            <div className="failedDeliveryStepper">
                                                <button
                                                    type="button"
                                                    disabled={compareDecimalStrings(released, '0.0000') === 0 || loading}
                                                    onClick={() =>
                                                        setReleasedQuantity(item, addDecimalStrings(released, '-1'))
                                                    }
                                                    aria-label={`Reducir disponibilidad de ${item.product_name}`}
                                                >
                                                    −
                                                </button>
                                                <span>{formatQuantityForDisplay(released)}</span>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        compareDecimalStrings(released, item.quantity_loaded) === 0 || loading
                                                    }
                                                    onClick={() =>
                                                        setReleasedQuantity(item, addDecimalStrings(released, '1'))
                                                    }
                                                    aria-label={`Aumentar disponibilidad de ${item.product_name}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="failedDeliveryProductMaximum">
                                                Máximo: {formatQuantityForDisplay(item.quantity_loaded)}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </Form>
            </div>
        </Modal>
    );
};
