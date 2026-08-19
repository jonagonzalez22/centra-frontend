import { Modal, Button } from 'antd';
import { formatCurrency } from '@/utils/formatters';
import './DeliveryDecisionModal.css';

interface DeliveryDecisionModalProps {
    open: boolean;
    pendingAmount: number;
    onDeliver: () => void;
    onCollect: () => void;
    onCancel: () => void;
    loading?: boolean;
}

/**
 * Modal de decisión que se muestra cuando el pedido tiene saldo pendiente.
 * - "Entregar": completa sin cobro (saldo queda pendiente)
 * - "Cobrar": abre el modal de pago
 * - "Cancelar": cierra sin acción
 */
export const DeliveryDecisionModal: React.FC<DeliveryDecisionModalProps> = ({
    open,
    pendingAmount,
    onDeliver,
    onCollect,
    onCancel,
    loading = false,
}) => {
    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title="Saldo pendiente"
            footer={null}
            closable={!loading}
            centered
            width={360}
            className="deliveryDecisionModal"
        >
            <div className="deliveryDecisionModalContent">
                <div className="deliveryDecisionModalIcon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <circle cx="24" cy="24" r="24" fill="#fff7e6" />
                        <path
                            d="M24 14v12M24 30v2"
                            stroke="#d46b00"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="24"
                            cy="24"
                            r="10"
                            stroke="#d46b00"
                            strokeWidth="2"
                            fill="none"
                        />
                    </svg>
                </div>

                <p className="deliveryDecisionModalText">
                    Este pedido tiene un saldo pendiente de{' '}
                    <strong>{formatCurrency(pendingAmount)}</strong>.
                </p>

                <p className="deliveryDecisionModalSubtext">
                    ¿Qué deseás hacer?
                </p>

                <div className="deliveryDecisionModalActions">
                    <Button
                        block
                        size="large"
                        onClick={onDeliver}
                        loading={loading}
                        className="deliveryDecisionBtn deliveryDecisionBtn--deliver"
                    >
                        Entregar
                    </Button>

                    <Button
                        block
                        size="large"
                        onClick={onCollect}
                        loading={loading}
                        className="deliveryDecisionBtn deliveryDecisionBtn--collect"
                    >
                        Cobrar {formatCurrency(pendingAmount)}
                    </Button>

                    <Button
                        block
                        size="large"
                        onClick={onCancel}
                        disabled={loading}
                        className="deliveryDecisionBtn deliveryDecisionBtn--cancel"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
