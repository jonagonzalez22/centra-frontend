import { Breadcrumb } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tabs } from '@/components/Tabs';
import { CustomerInfoForm } from '@/features/store/customers/components/CustomerInfoForm';
import type { FormInstance } from 'antd';
import type { Customer, UpdateCustomerDto } from '@/features/store/customers/types/customer.types';

interface CustomerShowPageViewProps {
    customer: Customer;
    form: FormInstance;
    loading: boolean;
    commercialGroupOptions: { label: string; value: string }[];
    groupsLoading: boolean;
    documentTypeOptions: { label: string; value: string }[];
    documentTypesLoading: boolean;
    breadcrumbs: { label: string; path?: string }[];
    onSubmit: (values: UpdateCustomerDto) => Promise<void>;
    onBack: () => void;
    canEdit: boolean;
}

export const CustomerShowPageView = ({
    customer,
    form,
    loading,
    commercialGroupOptions,
    groupsLoading,
    documentTypeOptions,
    documentTypesLoading,
    breadcrumbs,
    onSubmit,
    onBack,
    canEdit,
}: CustomerShowPageViewProps) => {
    const tabItems = [
        {
            key: 'general',
            label: 'Información General',
            children: (
                <CustomerInfoForm
                    form={form}
                    customer={customer}
                    loading={loading}
                    commercialGroupOptions={commercialGroupOptions}
                    groupsLoading={groupsLoading}
                    documentTypeOptions={documentTypeOptions}
                    documentTypesLoading={documentTypesLoading}
                    onSubmit={onSubmit}
                    canEdit={canEdit}
                />
            ),
        },
        {
            key: 'addresses',
            label: 'Domicilios',
            children: <div className="p-4 text-centra-text/60">Próximamente</div>,
        },
        {
            key: 'contacts',
            label: 'Contactos',
            children: <div className="p-4 text-centra-text/60">Próximamente</div>,
        },
    ];

    return (
        <div className="customerShowPage">
            <div className="customerShowPageHeader">
                <Breadcrumb
                    className="customerShowPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />
                <div className="customerShowPageHeaderTop">
                    <Button
                        variant="default"
                        label="Volver"
                        icon={<ArrowLeftOutlined />}
                        action={onBack}
                    />
                </div>
            </div>

            <Card>
                <Tabs items={tabItems} defaultActiveKey="general" />
            </Card>
        </div>
    );
};
