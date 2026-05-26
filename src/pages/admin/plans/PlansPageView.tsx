import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { PlansTable } from '@/features/admin/plans/components/PlansTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { Plan } from '@/features/admin/plans/types/plan.types';

interface PlansPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
    onEdit: (plan: Plan) => void;
    onCreate: () => void;
    onManageFeatures: (plan: Plan) => void;
    onDelete: (plan: Plan) => void;
}

export const PlansPageView = ({
    title,
    description,
    breadcrumbs,
    error,
    onEdit,
    onCreate,
    onManageFeatures,
    onDelete,
}: PlansPageViewProps) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Breadcrumb
                    className="text-sm"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h1 className="m-0 text-2xl font-semibold leading-tight">{title}</h1>
                        <p className="mt-1 text-[#666] text-sm">{description}</p>
                    </div>
                    <CanDo permission="plans.create">
                        <Button
                            variant="primary"
                            label="Crear Plan"
                            icon={<PlusOutlined />}
                            action={onCreate}
                        />
                    </CanDo>
                </div>
            </div>

            {error && (
                <Alert className="m-0" type="error" description={error} showIcon />
            )}

            <PlansTable
                onEdit={onEdit}
                onManageFeatures={onManageFeatures}
                onDelete={onDelete}
            />
        </div>
    );
};
