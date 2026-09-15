import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Result, Skeleton } from 'antd';
import { Button } from '@/components/Button';
import { OrdersService } from '@/features/store/orders/services/orders.service';
import type {
    OrderDetail,
    OrderEditability,
} from '@/features/store/orders/interfaces/order.interface';
import { OrderEditPageView } from './OrderEditPageView';

type LoadError = { status?: number; message?: string; response?: { status?: number } };

export const OrderEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [editability, setEditability] = useState<OrderEditability | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<LoadError | null>(null);

    useEffect(() => {
        if (!id) return;

        let active = true;
        void Promise.resolve()
            .then(() => {
                setLoading(true);
                setError(null);
                return Promise.all([OrdersService.getById(id), OrdersService.getEditability(id)]);
            })
            .then(([loadedOrder, loadedEditability]) => {
                if (!active) return;
                setOrder(loadedOrder);
                setEditability(loadedEditability);
            })
            .catch((loadError: LoadError) => {
                if (active) setError(loadError);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id]);

    const handleBack = () => navigate('/tienda/ventas/pedidos');

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton.Button active size="small" />
                <Skeleton active paragraph={{ rows: 8 }} />
            </div>
        );
    }

    if (error) {
        const status = error.response?.status ?? error.status;
        const notFound = status === 404;

        return (
            <Result
                status={notFound ? '404' : 'error'}
                title={notFound ? 'Pedido no encontrado' : 'No se pudo cargar el pedido'}
                subTitle={error.message || 'Intentá nuevamente desde el listado de pedidos.'}
                extra={<Button variant="primary" label="Volver a pedidos" action={handleBack} />}
            />
        );
    }

    if (!order || !editability) {
        return (
            <Alert
                type="error"
                showIcon
                message="No se pudo obtener la información necesaria para editar el pedido."
                action={<Button variant="default" label="Volver a pedidos" action={handleBack} />}
            />
        );
    }

    return (
        <div className="space-y-4">
            <Button
                variant="default"
                label="Volver a pedidos"
                icon={<ArrowLeftOutlined />}
                action={handleBack}
            />
            <OrderEditPageView order={order} editability={editability} />
        </div>
    );
};
