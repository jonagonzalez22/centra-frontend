import { useCallback } from 'react';
import { Popconfirm, Tag, Button as AntButton } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import ActionButton from '@/components/ActionButton/ActionButton';
import { formatCurrency } from '@/utils/formatters';
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

    const handlePageChange = useCallback((page: number, pageSize: number) => {
        if (pageSize !== pagination.pageSize) {
            setPerPage(pageSize);
        } else {
            setPage(page);
        }
    }, [pagination.pageSize, setPage, setPerPage]);

    const isLowStock = (product: Product) => {
        return product.available_stock <= product.stock_min;
    };

    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <a onClick={() => onView(product)} className="productsTableNameLink">
                        {product.name}
                    </a>
                );
            },
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            responsive: ['md'] as ResponsiveList,
        },
        {
            title: 'Categoría',
            key: 'category',
            responsive: ['lg'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return product.category?.name ?? '—';
            },
        },
        {
            title: 'Precio',
            key: 'price',
            responsive: ['md'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
                return formatCurrency(price);
            },
        },
        {
            title: 'Stock Disp.',
            key: 'available_stock',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <Tag color={isLowStock(product) ? 'red' : 'green'}>
                        {product.available_stock}
                    </Tag>
                );
            },
        },
        {
            title: 'Stock Res.',
            dataIndex: 'stock_reserved',
            key: 'stock_reserved',
            responsive: ['lg'] as ResponsiveList,
        },
        {
            title: 'Stock Mín.',
            dataIndex: 'stock_min',
            key: 'stock_min',
            responsive: ['lg'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                if (isLowStock(product)) {
                    return <Tag color="red">Stock bajo</Tag>;
                }
                return product.stock_min;
            },
        },
        {
            title: 'Estado',
            key: 'is_active',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const product = record as unknown as Product;
                return (
                    <Tag color={product.is_active ? 'green' : 'red'}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                    </Tag>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 150,
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
            onChange={(paginationConfig) => {
                handlePageChange(paginationConfig.current ?? 1, paginationConfig.pageSize ?? 15);
            }}
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};
