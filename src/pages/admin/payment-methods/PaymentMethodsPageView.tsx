import { Alert, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import { PaymentMethodSearchBar } from '@/features/admin/payment-methods/components/PaymentMethodSearchBar';
import { PaymentMethodsTable } from '@/features/admin/payment-methods/components/PaymentMethodsTable';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import type { PaymentMethod } from '@/features/admin/payment-methods/types/payment-method.types';

interface PaymentMethodsPageViewProps {
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
    error: string | null;
    onEdit: (paymentMethod: PaymentMethod) => void;
    onCreate: () => void;
}

export const PaymentMethodsPageView = ({
    title,
    description,
    breadcrumbs,
    error,
    onEdit,
    onCreate,
}: PaymentMethodsPageViewProps) => {
    return (
        <div className="w-full">
            <div className="mb-6">
                <Breadcrumb
                    className="mb-2"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-centra-primary m-0">
                            {title.charAt(0).toUpperCase()}
                            {title.slice(1)}
                        </h1>
                        <p className="text-sm text-centra-text/60 m-0">{description}</p>
                    </div>
                    <CanDo permission="settings.edit">
                        <Button
                            variant="primary"
                            label="Nuevo Medio de Pago"
                            icon={<PlusOutlined />}
                            action={onCreate}
                        />
                    </CanDo>
                </div>
            </div>

            <PaymentMethodSearchBar />

            {error && (
                <Alert className="mb-4 py-2 text-sm" type="error" description={error} showIcon />
            )}

            <PaymentMethodsTable onEdit={onEdit} />
        </div>
    );
};
