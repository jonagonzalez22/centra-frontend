import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { FeatureSearchBar } from '@/features/admin/features/components/FeatureSearchBar';
import { FeaturesTable } from '@/features/admin/features/components/FeaturesTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { Feature } from '@/features/admin/features/types/feature.types';
import './FeaturesPage.css';

interface FeaturesPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
    onEdit: (feature: Feature) => void;
    onCreate: () => void;
}

export const FeaturesPageView = ({
    title,
    description,
    breadcrumbs,
    error,
    onEdit,
    onCreate,
}: FeaturesPageViewProps) => {
    return (
        <div className="featuresPage">
            <div className="featuresPageHeader">
                <Breadcrumb
                    className="featuresPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="featuresPageHeaderTop">
                    <div className="featuresPageHeaderText">
                        <h1 className="featuresPageTitle">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="featuresPageDescription">{description}</p>
                    </div>
                    <Button
                        variant="primary"
                        label="Nueva Funcionalidad"
                        icon={<PlusOutlined />}
                        action={onCreate}
                    />
                </div>
            </div>

            <FeatureSearchBar />

            {error && (
                <Alert className="featuresPageAlert" type="error" description={error} showIcon />
            )}

            <FeaturesTable onEdit={onEdit} />
        </div>
    );
};