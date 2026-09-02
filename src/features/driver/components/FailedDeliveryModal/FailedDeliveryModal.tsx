import { useEffect, useState } from 'react';
import { Alert, Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import type { RejectionReason } from '../../services/driver.service';
import type { StopDetailItem } from '../../interfaces/driver.interface';
import './FailedDeliveryModal.css';

interface FailedDeliveryModalProps {
    open: boolean;
    rejectionReasons: RejectionReason[];
    items: StopDetailItem[];
    loading: boolean;
    onConfirm: (rejectionReasonId: string, quantitiesReleased: Record<string, number>) => void;
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
    const [quantitiesReleased, setQuantitiesReleased] = useState<Record<string, number>>({});

    useEffect(() => {
        if (open) {
            form.resetFields();
            setSelectedReasonId(undefined);
            setQuantitiesReleased({});
        }
    }, [open, form]);

    const handleFinish = ({ rejection_reason_id }: { rejection_reason_id: string }) => {
        onConfirm(rejection_reason_id, quantitiesReleased);
    };

    const handleReasonChange = (reasonId: string) => {
        const reason = rejectionReasons.find((candidate) => candidate.id === reasonId);
        setSelectedReasonId(reasonId);
        setQuantitiesReleased(
            Object.fromEntries(
                items.map((item) => [
                    item.id,
                    reason?.suggest_extra_sale ? item.quantity_loaded : 0,
                ])
            )
        );
    };

    const setReleasedQuantity = (item: StopDetailItem, value: number) => {
        setQuantitiesReleased((previous) => ({
            ...previous,
            [item.id]: Math.max(0, Math.min(value, item.quantity_loaded)),
        }));
    };

    const reasonOptions = rejectionReasons.map((r) => ({
        label: r.label,
        value: r.id,
    }));

    const footer = (
        <>
            <Button variant="default" label="Cancelar" action={onClose} disabled={loading} />
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
            onClose={onClose}
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
                                .filter((item) => item.quantity_loaded > 0)
                                .map((item) => {
                                    const released = quantitiesReleased[item.id] ?? 0;
                                    return (
                                        <div className="failedDeliveryProduct" key={item.id}>
                                            <div className="failedDeliveryProductName">
                                                {item.product_name}
                                            </div>
                                            <div className="failedDeliveryProductRemaining">
                                                No entregado: {item.quantity_loaded}
                                            </div>
                                            <div className="failedDeliveryReleaseLabel">
                                                Disponible para Venta Extra
                                            </div>
                                            <div className="failedDeliveryStepper">
                                                <button
                                                    type="button"
                                                    disabled={released === 0 || loading}
                                                    onClick={() =>
                                                        setReleasedQuantity(item, released - 1)
                                                    }
                                                    aria-label={`Reducir disponibilidad de ${item.product_name}`}
                                                >
                                                    −
                                                </button>
                                                <span>{released}</span>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        released === item.quantity_loaded || loading
                                                    }
                                                    onClick={() =>
                                                        setReleasedQuantity(item, released + 1)
                                                    }
                                                    aria-label={`Aumentar disponibilidad de ${item.product_name}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="failedDeliveryProductMaximum">
                                                Máximo: {item.quantity_loaded}
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
