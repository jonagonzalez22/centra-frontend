import { useParams, useNavigate } from 'react-router-dom';
import { Form, Spin, message } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';
import { useCustomer } from '@/features/store/customers/hooks/useCustomer';
import { useCommercialGroups } from '@/features/store/commercial-groups/hooks/useCommercialGroups';
import { useDocumentTypes } from '@/features/store/document-types/hooks/useDocumentTypes';
import { CustomersService } from '@/features/store/customers/services/customers.service';
import { CustomerShowPageView } from './CustomerShowPageView';
import type { UpdateCustomerDto } from '@/features/store/customers/types/customer.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './CustomerShowPage.css';

const buildGroupOptions = (
    groups: { id: string; name: string }[]
): { label: string; value: string }[] =>
    groups.map((g) => ({ label: g.name, value: g.id }));

export const CustomerShowPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { can } = usePermissions();
    const { customer, loading, error, refetch } = useCustomer(id);
    const { groups, loading: groupsLoading } = useCommercialGroups();
    const { documentTypes, loading: documentTypesLoading } = useDocumentTypes();
    const [form] = Form.useForm();

    const canEdit = can('customers.edit');
    const commercialGroupOptions = buildGroupOptions(groups);
    const documentTypeOptions = documentTypes.map((dt) => ({
        label: dt.name,
        value: dt.id,
    }));

    const handleSubmit = async (values: UpdateCustomerDto) => {
        if (!id) return;
        try {
            await CustomersService.update(id, values);
            message.success('Cliente actualizado correctamente.');
            refetch();
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages,
                }));
                form.setFields(fieldErrors as Parameters<typeof form.setFields>[0]);
                throw err;
            }
            message.error(apiError.message || 'Error al actualizar el cliente.');
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="customerShowPageLoading">
                <Spin size="large" />
            </div>
        );
    }

    if (error || !customer || !id) {
        navigate('/tienda/clientes', { replace: true });
        return null;
    }

    const routeMetadata = {
        title: customer.display_name,
        breadcrumbs: [
            { label: 'Tienda', path: '/tienda/dashboard' },
            { label: 'Clientes', path: '/tienda/clientes' },
            { label: customer.display_name },
        ],
    };

    return (
        <CustomerShowPageView
            customer={customer}
            form={form}
            loading={loading}
            commercialGroupOptions={commercialGroupOptions}
            groupsLoading={groupsLoading}
            documentTypeOptions={documentTypeOptions}
            documentTypesLoading={documentTypesLoading}
            breadcrumbs={routeMetadata.breadcrumbs}
            onSubmit={handleSubmit}
            onBack={() => navigate('/tienda/clientes')}
            canEdit={canEdit}
        />
    );
};
