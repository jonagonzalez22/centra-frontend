import { Alert, Descriptions, Divider } from 'antd';
import { Button } from '@/components/Button';
import Drawer from '@/components/Drawer/Drawer';
import Tag from '@/components/Tag/Tag';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getPaymentOriginLabel } from '@/utils/paymentOrigin';
import { paymentReversalDrawerMessage } from '../constants/payment-reversal-reasons';
import type { ReceivedPayment } from '../interfaces/received-payment.interface';

const value = (content: React.ReactNode) => content || '—';

export const ReceivedPaymentDrawer = ({
    payment,
    open,
    onClose,
    onReverse = () => undefined,
}: {
    payment: ReceivedPayment | null;
    open: boolean;
    onClose: () => void;
    onReverse?: (payment: ReceivedPayment) => void;
}) => {
    const { can } = usePermissions();
    const route = payment?.route;
    const canReverse = can('payments.reverse') && payment?.reversal.allowed === true;
    const showReversalContext =
        can('payments.reverse') &&
        payment?.status !== 'reversed' &&
        payment?.reversal.allowed === false;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Detalle del pago"
            footer={
                canReverse ? (
                    <div className="flex justify-end">
                        <Button
                            variant="danger"
                            label="Anular pago"
                            action={() => payment && onReverse(payment)}
                        />
                    </div>
                ) : undefined
            }
        >
            {payment && (
                <div>
                    <h3 className="text-base font-semibold mt-0">Pago</h3>
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Importe">
                            <strong>{formatCurrency(payment.amount)}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Estado">
                            <Tag color={payment.status === 'active' ? 'green' : 'volcano'}>
                                {payment.status === 'active' ? 'Activo' : 'Revertido'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Fecha y hora">
                            {formatDate(payment.created_at)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Medio">
                            {value(payment.payment_method?.name)}
                        </Descriptions.Item>
                        {payment.reference && (
                            <Descriptions.Item label="Referencia">
                                {payment.reference}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                    <Divider />
                    <h3 className="text-base font-semibold">Operación</h3>
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Origen">
                            {getPaymentOriginLabel(payment.origin)}
                        </Descriptions.Item>
                        {payment.operation && (
                            <Descriptions.Item
                                label={payment.operation.type === 'sale' ? 'Venta' : 'Pedido'}
                            >
                                {payment.operation.operation_number}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Cliente">
                            {value(payment.customer.display_name ?? 'Consumidor final')}
                        </Descriptions.Item>
                    </Descriptions>
                    {payment.registered_by && (
                        <>
                            <Divider />
                            <h3 className="text-base font-semibold">Registro</h3>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Registrado por">
                                    {payment.registered_by.name}
                                </Descriptions.Item>
                            </Descriptions>
                        </>
                    )}
                    {payment.status === 'reversed' && (
                        <>
                            <Divider />
                            <h3 className="text-base font-semibold">Reversión</h3>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Revertido por">
                                    {value(payment.reversed_by?.name)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Fecha de reversión">
                                    {formatDate(payment.reversed_at)}
                                </Descriptions.Item>
                            </Descriptions>
                        </>
                    )}
                    {showReversalContext && (
                        <Alert
                            className="mt-4"
                            type={
                                payment.reversal.reason === 'cash_session_closed' ||
                                payment.reversal.reason === 'cash_session_not_operational'
                                    ? 'warning'
                                    : 'info'
                            }
                            showIcon
                            message={paymentReversalDrawerMessage(payment.reversal.reason)}
                        />
                    )}
                    {payment.origin === 'route_collection' && route && (
                        <>
                            <Divider />
                            <h3 className="text-base font-semibold">Cobranza de ruta</h3>
                            <Descriptions column={1} size="small">
                                {route.driver && (
                                    <Descriptions.Item label="Conductor">
                                        {route.driver.name}
                                    </Descriptions.Item>
                                )}
                                {route.declared_by && (
                                    <Descriptions.Item label="Cobrado/Declarado por">
                                        {route.declared_by.name}
                                    </Descriptions.Item>
                                )}
                                {route.declared_at && (
                                    <Descriptions.Item label="Fecha y hora de declaración">
                                        {formatDate(route.declared_at)}
                                    </Descriptions.Item>
                                )}
                                {route.verified_by && (
                                    <Descriptions.Item label="Conciliado/verificado por">
                                        {route.verified_by.name}
                                    </Descriptions.Item>
                                )}
                                {route.verified_at && (
                                    <Descriptions.Item label="Fecha y hora de conciliación">
                                        {formatDate(route.verified_at)}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                        </>
                    )}
                </div>
            )}
        </Drawer>
    );
};
