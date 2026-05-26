import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { BusinessTypeSearchBar } from '@/features/admin/business-types/components/BusinessTypeSearchBar';
import { BusinessTypesTable } from '@/features/admin/business-types/components/BusinessTypesTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { BusinessType } from '@/features/admin/business-types/types/business-type.types';
import './BusinessTypePage.css';

interface BusinessTypesPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
    onEdit: (businessType: BusinessType) => void;
    onCreate: () => void;
}

export const BusinessTypesPageView = ({
    title,
    description,
    breadcrumbs,
    error,
    onEdit,
    onCreate,
}: BusinessTypesPageViewProps) => {
    return (
        <div className="businessTypesPage">
            <div className="businessTypesPageHeader">
                <Breadcrumb
                    className="businessTypesPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="businessTypesPageHeaderTop">
                    <div className="businessTypesPageHeaderText">
                        <h1 className="businessTypesPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="businessTypesPageDescription">{description}</p>
                    </div>
                    <CanDo permission="settings.edit">
                        <Button
                            variant="primary"
                            label="Nuevo Tipo de Negocio"
                            icon={<PlusOutlined />}
                            action={onCreate}
                        />
                    </CanDo>
                </div>
            </div>

            <BusinessTypeSearchBar />

            {error && (
                <Alert className="businessTypesPageAlert" type="error" description={error} showIcon />
            )}

            <BusinessTypesTable onEdit={onEdit} />
        </div>
    );
};