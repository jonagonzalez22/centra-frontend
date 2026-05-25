import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import './RolesPage.css';

interface RolesPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
}

export const RolesPageView = ({
    title,
    description,
    breadcrumbs,
    error,
}: RolesPageViewProps) => {
    return (
        <div className="rolesPage">
            <div className="rolesPageHeader">
                <Breadcrumb
                    className="rolesPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="rolesPageHeaderTop">
                    <div className="rolesPageHeaderText">
                        <h1 className="rolesPageTitle">{title}</h1>
                        <p className="rolesPageDescription">{description}</p>
                    </div>
                </div>
            </div>

            {error && (
                <Alert className="rolesPageAlert" type="error" description={error} showIcon />
            )}
        </div>
    );
};