import { useCallback, useEffect, useState } from 'react';
import { Alert, Empty, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { ProductsService } from '../../services/products.service';
import { formatCurrencyWithCents, formatDateShort } from '@/utils/formatters';
import type { ProductPurchasePriceHistory } from '../../interfaces/product.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { Button } from '@/components/Button';
import './PurchasePriceHistoryTab.css';

interface PurchasePriceHistoryTabProps {
    productId: string;
}

export const PurchasePriceHistoryTab = ({ productId }: PurchasePriceHistoryTabProps) => {
    const [history, setHistory] = useState<ProductPurchasePriceHistory[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            setHistory(await ProductsService.getPurchasePriceHistory(productId));
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'No se pudo cargar el historial de precios.');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    if (loading) {
        return <div className="purchasePriceHistoryTabLoading"><Spin size="small" /></div>;
    }

    if (error) {
        return (
            <Alert
                type="error"
                showIcon
                message={error}
                action={<Button variant="default" size="small" label="Reintentar" action={() => void loadHistory()} />}
            />
        );
    }

    if (!history?.length) {
        return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Este producto todavía no tiene precios de compra registrados." />;
    }

    return (
        <div className="purchasePriceHistoryTab">
            {history.map((supplierHistory) => (
                <section key={supplierHistory.supplier.id} className="purchasePriceHistorySupplier">
                    <header className="purchasePriceHistorySupplierHeader">
                        <h3>{supplierHistory.supplier.business_name}</h3>
                        <span>Última compra: {formatDateShort(supplierHistory.prices[0]?.date ?? null)}</span>
                    </header>
                    <div className="purchasePriceHistoryRows">
                        {supplierHistory.prices.map((price) => (
                            <div key={price.purchase_id} className="purchasePriceHistoryRow">
                                <div>
                                    <Link to={`/tienda/compras/${price.purchase_id}`} className="purchasePriceHistoryPurchaseLink">
                                        {price.purchase_number}
                                    </Link>
                                    <span className="purchasePriceHistoryDate">{formatDateShort(price.date)}</span>
                                </div>
                                <strong>{formatCurrencyWithCents(Number(price.unit_price))}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};
