import { useCallback } from 'react';
import { Empty, Popconfirm, Tag, Button as AntButton } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import ActionButton from '@/components/ActionButton/ActionButton';
import { formatCurrency } from '@/utils/formatters';
import { compareDecimalStrings, formatQuantityWithUnit } from '@/utils/quantity';
import { useProductsContext } from '../../context/ProductsContext';
import type { Product } from '../../interfaces/product.interface';
import './ProductsTable.css';

interface ProductsTableProps {
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onView: (product: Product) => void;
}
type ResponsiveList = ('md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'sm' | 'xs')[];

export const ProductsTable = ({ onEdit, onDelete, onView }: ProductsTableProps) => {
    const { items, loading, pagination, setPage, setPerPage } = useProductsContext();
    const handlePageChange = useCallback(
        (page: number, pageSize: number) => {
            if (pageSize !== pagination.pageSize) setPerPage(pageSize);
            else setPage(page);
        },
        [pagination.pageSize, setPage, setPerPage]
    );
    const isOwnStock = (product: Product) => !product.stock_source_product;
    const isOutOfStock = (product: Product) =>
        isOwnStock(product) && compareDecimalStrings(product.available_stock, '0') <= 0;
    const isLowStock = (product: Product) =>
        isOwnStock(product) &&
        !isOutOfStock(product) &&
        compareDecimalStrings(product.available_stock, product.stock_min) <= 0;

    const columns = [
        {
            title: 'Producto',
            key: 'product',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <div className="productsTableProduct">
                        <button
                            type="button"
                            onClick={() => onView(product)}
                            className="productsTableNameLink"
                        >
                            {product.name}
                        </button>
                        <span className="productsTableSecondary">{product.sku}</span>
                    </div>
                );
            },
        },
        {
            title: 'Precio',
            key: 'price',
            responsive: ['sm'] as ResponsiveList,
            align: 'right' as const,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <span className="productsTablePrice">
                        {formatCurrency(
                            typeof product.price === 'string'
                                ? parseFloat(product.price)
                                : product.price
                        )}
                    </span>
                );
            },
        },
        {
            title: 'Inventario',
            key: 'inventory',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                if (!isOwnStock(product))
                    return (
                        <div className="productsTableInventory">
                            <span className="productsTableSharedStock">Stock compartido</span>
                            <span className="productsTableSecondary">
                                {product.stock_source_product?.name ?? 'Producto fuente'}
                            </span>
                        </div>
                    );
                return (
                    <div className="productsTableInventory">
                        <span className="productsTableQuantity">
                            {formatQuantityWithUnit(
                                product.commercial_available_quantity,
                                product.stock_measurement_unit?.symbol
                            )}
                        </span>
                        <span className="productsTableSecondary">
                            Total:{' '}
                            {formatQuantityWithUnit(
                                product.stock,
                                product.stock_measurement_unit?.symbol
                            )}{' '}
                            · Reservado:{' '}
                            {formatQuantityWithUnit(
                                product.stock_reserved,
                                product.stock_measurement_unit?.symbol
                            )}
                        </span>
                        {isOutOfStock(product) && (
                            <Tag color="error" className="productsTableTag !m-0">
                                Sin stock
                            </Tag>
                        )}
                        {isLowStock(product) && (
                            <Tag color="warning" className="productsTableTag !m-0">
                                Stock bajo
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Estado',
            key: 'status',
            responsive: ['sm'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <div className="productsTableStatus">
                        <Tag
                            color={product.is_active ? 'success' : 'error'}
                            className="productsTableTag !m-0"
                        >
                            {product.is_active ? 'Activo' : 'Inactivo'}
                        </Tag>
                        {!product.is_sellable && (
                            <Tag className="productsTableTag productsTableTagNeutral !m-0">
                                Venta deshabilitada
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 130,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <div className="productsTableActions">
                        <CanDo permission="inventory.view">
                            <ActionButton
                                icon={<EyeOutlined />}
                                label="Ver detalle"
                                action={() => onView(product)}
                            />
                        </CanDo>
                        <CanDo permission="inventory.edit">
                            <ActionButton
                                icon={<EditOutlined />}
                                label="Editar"
                                action={() => onEdit(product)}
                            />
                        </CanDo>
                        <CanDo permission="inventory.delete">
                            <Popconfirm
                                title="¿Eliminar producto?"
                                description="Esta acción no se puede deshacer."
                                onConfirm={() => onDelete(product.id)}
                                okText="Eliminar"
                                cancelText="Cancelar"
                                okButtonProps={{ danger: true }}
                            >
                                <AntButton
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    aria-label="Eliminar"
                                />
                            </Popconfirm>
                        </CanDo>
                    </div>
                );
            },
        },
    ];
    return (
        <Table
            columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
            dataSource={items as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ['10', '15', '25', '50'],
                showTotal: (total, range) => `${range[0]} - ${range[1]} de ${total}`,
            }}
            onChange={(config) => handlePageChange(config.current ?? 1, config.pageSize ?? 15)}
            emptyText={<Empty description="No hay productos para mostrar" />}
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};
