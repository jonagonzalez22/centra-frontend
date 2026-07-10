import { Empty, Descriptions, Tag, Spin } from 'antd';
import { Button } from '@/components/Button';
import Card from '@/components/Card/Card';
import type { CashSession } from '@/entities/CashSession';

interface CashPageViewProps {
    loading: boolean;
    cashSession: CashSession | null;
    canOpen: boolean;
    canClose: boolean;
    onOpenCash: () => void;
    onCloseCash: () => void;
}

export const CashPageView: React.FC<CashPageViewProps> = ({
    loading,
    cashSession,
    canOpen,
    canClose,
    onOpenCash,
    onCloseCash,
}) => {
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!cashSession) {
        return (
            <div
                style={{
                    padding: 48,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Empty
                    description="No hay una caja abierta"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    {canOpen && (
                        <Button variant="primary" label="Abrir Caja" action={onOpenCash} />
                    )}
                </Empty>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Card
                title="Resumen de Caja"
                extra={
                    cashSession.status === 'open' && canClose ? (
                        <Button variant="primary" label="Cerrar Caja" action={onCloseCash} />
                    ) : null
                }
            >
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Estado">
                        <Tag color={cashSession.status === 'open' ? 'green' : 'red'}>
                            {cashSession.status === 'open' ? 'Abierta' : 'Cerrada'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Monto inicial">
                        ${Number(cashSession.opening_amount).toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                        })}
                    </Descriptions.Item>
                    {cashSession.expected_amount !== undefined && (
                        <Descriptions.Item label="Monto esperado">
                            ${Number(cashSession.expected_amount).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                            })}
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Apertura">
                        {new Date(cashSession.opened_at).toLocaleString('es-AR')}
                    </Descriptions.Item>
                    {cashSession.notes && (
                        <Descriptions.Item label="Notas">
                            {cashSession.notes}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>
        </div>
    );
};
