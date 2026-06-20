import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { ProductsSearchBar } from '@/features/store/products/components/ProductsSearchBar';
import { ProductsTable } from '@/features/store/products/components/ProductsTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { Product } from '@/features/store/products/interfaces/product.interface';
import './ProductsPage.css';

interface ProductsPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    canCreateProduct: boolean;
    error: string | null;
    onEdit: (product: Product) => void;
    onView: (product: Product) => void;
    onCreate: () => void;
    onDelete: (id: string) => Promise<void>;
}

export const ProductsPageView = ({
    title,
    description,
    breadcrumbs,
    canCreateProduct,
    error,
    onEdit,
    onView,
    onCreate,
    onDelete,
}: ProductsPageViewProps) => {
    return (
        <div className="productsPage">
            <div className="productsPageHeader">
                <Breadcrumb
                    className="productsPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="productsPageHeaderTop">
                    <div className="productsPageHeaderText">
                        <h1 className="productsPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="productsPageDescription">{description}</p>
                    </div>
                    {canCreateProduct && (
                        <CanDo permission="inventory.create">
                            <Button
                                variant="primary"
                                label="Nuevo Producto"
                                icon={<PlusOutlined />}
                                action={onCreate}
                            />
                        </CanDo>
                    )}
                </div>
            </div>

            <ProductsSearchBar />

            {error && (
                <Alert className="productsPageAlert" type="error" description={error} showIcon />
            )}

            <ProductsTable onEdit={onEdit} onView={onView} onDelete={onDelete} />
        </div>
    );
};
