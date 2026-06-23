import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { MovementsSearchBar } from '@/features/store/inventory/components/MovementsSearchBar';
import { MovementsTable } from '@/features/store/inventory/components/MovementsTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import './InventoryMovementsPage.css';

interface InventoryMovementsPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
}

export const InventoryMovementsPageView = ({
    title,
    description,
    breadcrumbs,
    error,
}: InventoryMovementsPageViewProps) => {
    return (
        <div className="inventoryMovementsPage">
            <div className="inventoryMovementsPageHeader">
                <Breadcrumb
                    className="inventoryMovementsPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="inventoryMovementsPageHeaderTop">
                    <div className="inventoryMovementsPageHeaderText">
                        <h1 className="inventoryMovementsPageTitle">{title}</h1>
                        <p className="inventoryMovementsPageDescription">{description}</p>
                    </div>
                </div>
            </div>

            <MovementsSearchBar />

            {error && (
                <Alert className="inventoryMovementsPageAlert" type="error" description={error} showIcon />
            )}

            <MovementsTable />
        </div>
    );
};
