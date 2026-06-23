import { useEffect, useState, useCallback } from 'react';
import { Spin, message } from 'antd';
import { Package, DollarSign, Tag as TagIcon, AlertTriangle, Settings } from 'lucide-react';
import Drawer from '@/components/Drawer/Drawer';
import Tabs from '@/components/Tabs/Tabs';
import { Button } from '@/components/Button';
import { ProductsService } from '../../services/products.service';
import { formatDate, formatCurrency } from '@/utils/formatters';
import type { Product } from '../../interfaces/product.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { StockHistoryTab } from '@/features/store/inventory/components/StockHistoryTab';
import { StockAdjustmentModal } from '@/features/store/inventory/components/StockAdjustmentModal';
import { CanDo } from '@/components/auth/CanDo';
import './ProductDrawer.css';

interface ProductDrawerProps {
    open: boolean;
    onClose: () => void;
    productId?: string;
}

interface FieldProps {
    label: string;
    value: string | number | null | undefined;
}

const Field = ({ label, value }: FieldProps) => (
    <div className="productDrawerField">
        <span className="productDrawerFieldLabel">{label}</span>
        <span className="productDrawerFieldValue">{value ?? '—'}</span>
    </div>
);

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    variant?: 'default' | 'danger';
}

const Section = ({ icon, title, children, variant = 'default' }: SectionProps) => (
    <div className={`productDrawerSection ${variant === 'danger' ? 'productDrawerSectionDanger' : ''}`}>
        <h3 className="productDrawerSectionTitle">
            {icon}
            {title}
        </h3>
        <div className="productDrawerSectionContent">{children}</div>
    </div>
);

export const ProductDrawer = ({ open, onClose, productId }: ProductDrawerProps) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [stockHistoryKey, setStockHistoryKey] = useState(0);

    const loadProduct = useCallback(async () => {
        if (!productId) return;

        setLoading(true);
        try {
            const data = await ProductsService.getById(productId);
            setProduct(data);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'No se pudo cargar el producto.');
            onClose();
        } finally {
            setLoading(false);
        }
    }, [productId, onClose]);

    useEffect(() => {
        if (!open || !productId) {
            return;
        }

        loadProduct();

        return () => {
            setProduct(null);
        };
    }, [open, productId, loadProduct]);

    const handleOpenAdjustModal = () => {
        setAdjustModalOpen(true);
    };

    const handleCloseAdjustModal = () => {
        setAdjustModalOpen(false);
    };

    const handleAdjustSuccess = () => {
        setAdjustModalOpen(false);
        loadProduct();
        setStockHistoryKey((prev) => prev + 1);
    };

    const isLowStock = product ? product.available_stock <= product.stock_min : false;

    return (
        <>
            <Drawer
                open={open}
                onClose={onClose}
                title={
                    <span className="productDrawerTitle">
                        <Package size={18} />
                        Detalle de Producto
                    </span>
                }
                extra={
                    <CanDo permission="inventory.adjust">
                        <Button
                            variant="primary"
                            label="Ajustar Stock"
                            icon={<Settings size={14} />}
                            action={handleOpenAdjustModal}
                        />
                    </CanDo>
                }
                loading={loading}
                destroyOnClose={false}
                width={520}
            >
                {loading ? (
                    <div className="productDrawerLoading">
                        <Spin size="large" />
                    </div>
                ) : product ? (
                    <Tabs
                        items={[
                            {
                                key: 'info',
                                label: 'Información',
                                children: (
                                    <div className="productDrawerContent">
                                        <Section icon={<Package size={16} />} title="Información">
                                            <Field label="Nombre" value={product.name} />
                                            <Field label="SKU" value={product.sku} />
                                            <Field label="Código de Barras" value={product.barcode} />
                                            <Field label="Descripción" value={product.description} />
                                        </Section>

                                        <Section icon={<DollarSign size={16} />} title="Precio">
                                            <Field
                                                label="Precio"
                                                value={formatCurrency(typeof product.price === 'string' ? parseFloat(product.price) : product.price)}
                                            />
                                            {product.cost !== null && (
                                                <Field
                                                    label="Costo"
                                                    value={formatCurrency(typeof product.cost === 'string' ? parseFloat(product.cost) : (product.cost ?? 0))}
                                                />
                                            )}
                                        </Section>

                                        <Section icon={<TagIcon size={16} />} title="Categoría">
                                            <Field label="Categoría" value={product.category?.name} />
                                        </Section>

                                        <Section
                                            icon={<AlertTriangle size={16} />}
                                            title="Stock"
                                            variant={isLowStock ? 'danger' : 'default'}
                                        >
                                            <Field label="Stock Físico" value={product.stock} />
                                            <Field label="Stock Reservado" value={product.stock_reserved} />
                                            <div className="productDrawerStockAvailable">
                                                <span className="productDrawerFieldLabel">Stock Disponible</span>
                                                <span className={`productDrawerStockTag ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                                    {product.available_stock}
                                                </span>
                                            </div>
                                            <Field label="Stock Mínimo" value={product.stock_min} />
                                            {isLowStock && (
                                                <span className="text-red-600 text-sm font-medium">Stock bajo</span>
                                            )}
                                        </Section>

                                        <Section icon={<TagIcon size={16} />} title="Estado">
                                            <span className={product.is_active ? 'text-green-600' : 'text-red-600'}>
                                                {product.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </Section>

                                        <Section icon={<Package size={16} />} title="Metadatos">
                                            <Field label="Creado" value={formatDate(product.created_at)} />
                                            <Field label="Actualizado" value={formatDate(product.updated_at)} />
                                        </Section>
                                    </div>
                                ),
                            },
                            {
                                key: 'stock-history',
                                label: 'Historial de Stock',
                                children: <StockHistoryTab key={stockHistoryKey} productId={product.id} />,
                            },
                        ]}
                    />
                ) : null}
            </Drawer>

            {product && (
                <StockAdjustmentModal
                    open={adjustModalOpen}
                    onClose={handleCloseAdjustModal}
                    onSuccess={handleAdjustSuccess}
                    product={product}
                />
            )}
        </>
    );
};
