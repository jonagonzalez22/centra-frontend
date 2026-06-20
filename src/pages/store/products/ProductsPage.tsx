import { useState } from 'react';
import { ProductsPageView } from './ProductsPageView';
import { ProductFormModal } from '@/features/store/products/components/ProductFormModal';
import { ProductDrawer } from '@/features/store/products/components/ProductDrawer';
import { ProductsProvider } from '@/features/store/products/context/ProductsProvider';
import { useProducts } from '@/features/store/products/hooks/useProducts';
import type { Product } from '@/features/store/products/interfaces/product.interface';
import { usePermissions } from '@/hooks/usePermissions';

const routeMetadata = {
    title: 'Productos',
    description: 'Gestiona los productos de tu tienda',
    breadcrumbs: [
        { label: 'Tienda', path: '/tienda/dashboard' },
        { label: 'Productos' },
    ],
};

export const ProductsPage = () => {
    const productsState = useProducts();
    const { can } = usePermissions();
    const canCreateProduct = can('inventory.create');

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerProductId, setDrawerProductId] = useState<string | undefined>(undefined);

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setDrawerOpen(false);
        setModalOpen(true);
    };

    const handleView = (product: Product) => {
        setDrawerProductId(product.id);
        setDrawerOpen(true);
    };

    const handleCreate = () => {
        setSelectedProduct(undefined);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedProduct(undefined);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setDrawerProductId(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedProduct(undefined);
        productsState.refresh();
    };

    return (
        <ProductsProvider value={productsState}>
            <ProductsPageView
                title={routeMetadata.title}
                description={routeMetadata.description}
                breadcrumbs={routeMetadata.breadcrumbs}
                canCreateProduct={canCreateProduct}
                error={productsState.error}
                onEdit={handleEdit}
                onView={handleView}
                onCreate={handleCreate}
                onDelete={productsState.deleteProduct}
            />
            <ProductDrawer
                open={drawerOpen}
                onClose={handleCloseDrawer}
                productId={drawerProductId}
            />
            <ProductFormModal
                open={modalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                product={selectedProduct}
            />
        </ProductsProvider>
    );
};
