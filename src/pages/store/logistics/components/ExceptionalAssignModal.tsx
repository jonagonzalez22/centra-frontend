import { useState } from 'react';
import { Input } from 'antd';
import Modal from '@/components/Modal/Modal';
import { Button } from '@/components/Button';
import type { EligibleOrder } from '@/features/store/logistics/interfaces/route.interface';
import { formatDateShort } from '@/utils/formatters';

interface ExceptionalAssignModalProps {
    open: boolean;
    order: EligibleOrder | null;
    routeOperationalDate: string;
    loading: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export const ExceptionalAssignModal = ({
    open,
    order,
    routeOperationalDate,
    loading,
    onClose,
    onConfirm,
}: ExceptionalAssignModalProps) => {
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState<string | null>(null);

    const handleConfirm = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setReasonError('El motivo es obligatorio.');
            return;
        }
        setReasonError(null);
        await onConfirm(trimmed);
        setReason('');
    };

    const handleClose = () => {
        if (!loading) {
            setReason('');
            setReasonError(null);
            onClose();
        }
    };

    if (!order) return null;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Asignación Excepcional"
            width={480}
            destroyOnClose
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label="Confirmar"
                        loading={loading}
                        action={handleConfirm}
                    />
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p>
                    Estás asignando el pedido <strong>{order.operation_number}</strong> a esta ruta
                    de forma excepcional.
                </p>
                <div>
                    <p style={{ margin: 0, color: '#666' }}>
                        Fecha pactada del pedido:{' '}
                        {order.requested_delivery_date
                            ? formatDateShort(order.requested_delivery_date)
                            : 'Sin fecha pactada'}
                    </p>
                    <p style={{ margin: 0, color: '#666' }}>
                        Fecha operativa de la ruta: {formatDateShort(routeOperationalDate)}
                    </p>
                </div>
                <p style={{ margin: 0 }}>
                    Esta asignación se registrará como excepcional. Por favor, indicá el motivo:
                </p>
                <div>
                    <Input.TextArea
                        placeholder="Motivo de la asignación excepcional"
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (reasonError) setReasonError(null);
                        }}
                        disabled={loading}
                        status={reasonError ? 'error' : undefined}
                    />
                    {reasonError && (
                        <div style={{ color: '#ff4d4f', fontSize: '0.875rem', marginTop: 4 }}>
                            {reasonError}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
