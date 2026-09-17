import { useMemo, useState } from 'react';
import { DatePicker, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import type { DeliveryDateChangeReason } from '@/features/store/orders/interfaces/order.interface';

interface DeliveryDateDraft {
    requestedDeliveryDate: string | null;
    reason: DeliveryDateChangeReason | null;
    observation: string;
}

interface AppliedDeliveryDateDraft {
    requestedDeliveryDate: string;
    reason: DeliveryDateChangeReason | null;
    observation: string;
}

interface Props {
    open: boolean;
    originalDate: string | null;
    draft: DeliveryDateDraft;
    onApply: (draft: AppliedDeliveryDateDraft) => void;
    onClose: () => void;
}

const reasonOptions: { label: string; value: DeliveryDateChangeReason }[] = [
    { label: 'Solicitud del cliente', value: 'customer_requested_reschedule' },
    { label: 'Cliente ausente', value: 'customer_absent' },
    { label: 'Domicilio cerrado', value: 'address_closed' },
    { label: 'Condiciones climáticas', value: 'weather_conditions' },
    { label: 'Inconveniente operativo', value: 'operational_issue' },
    { label: 'Otro', value: 'other' },
];

export const OrderDeliveryDateModal = ({ open, originalDate, draft, onApply, onClose }: Props) => {
    const [requestedDeliveryDate, setRequestedDeliveryDate] = useState<string | null>(
        draft.requestedDeliveryDate
    );
    const [reason, setReason] = useState<DeliveryDateChangeReason | null>(draft.reason);
    const [observation, setObservation] = useState(draft.observation);
    const [submitted, setSubmitted] = useState(false);

    const clearsPendingChange =
        requestedDeliveryDate === originalDate && draft.requestedDeliveryDate !== originalDate;

    const validationMessage = useMemo(() => {
        if (!requestedDeliveryDate) return 'La nueva fecha es obligatoria.';
        if (requestedDeliveryDate === originalDate && !clearsPendingChange) {
            return 'La nueva fecha debe ser diferente a la actual.';
        }
        if (!reason) return 'Seleccioná un motivo para reprogramar la fecha.';
        if (reason === 'other' && !observation.trim()) {
            return 'La observación es obligatoria cuando el motivo es otro.';
        }

        return null;
    }, [clearsPendingChange, observation, originalDate, reason, requestedDeliveryDate]);

    const handleApply = () => {
        setSubmitted(true);
        if (validationMessage || !requestedDeliveryDate || (!reason && !clearsPendingChange)) return;

        onApply({
            requestedDeliveryDate,
            reason: clearsPendingChange ? null : reason,
            observation: clearsPendingChange || reason !== 'other' ? '' : observation.trim(),
        });
    };

    const footer = (
        <>
            <Button variant="default" label="Cancelar" action={onClose} />
            <Button variant="primary" label="Aplicar cambio" action={handleApply} />
        </>
    );

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Reprogramar fecha de entrega"
            width={480}
            footer={footer}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Nueva fecha</label>
                    <DatePicker
                        aria-label="Nueva fecha de entrega"
                        value={requestedDeliveryDate ? dayjs(requestedDeliveryDate) : null}
                        onChange={(date) =>
                            setRequestedDeliveryDate(date ? date.format('YYYY-MM-DD') : null)
                        }
                        format="DD/MM/YYYY"
                        className="w-full"
                        disabledDate={(current) => current.isBefore(dayjs().startOf('day'))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Motivo <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <Select
                        aria-label="Motivo de reprogramación"
                        value={reason ?? undefined}
                        placeholder="Seleccionar motivo"
                        options={reasonOptions}
                        className="w-full"
                        onChange={(value: DeliveryDateChangeReason) => setReason(value)}
                    />
                </div>
                {reason === 'other' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Observación</label>
                        <Input.TextArea
                            aria-label="Observación de reprogramación"
                            value={observation}
                            onChange={(event) => setObservation(event.target.value)}
                            placeholder="Detalle del motivo"
                            rows={3}
                            maxLength={1000}
                            showCount
                        />
                    </div>
                )}
                {submitted && validationMessage && (
                    <p className="text-xs text-red-600 m-0" role="alert">
                        {validationMessage}
                    </p>
                )}
            </div>
        </Modal>
    );
};
