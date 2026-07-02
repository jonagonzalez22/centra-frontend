import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, message } from 'antd';
import { useCommercialGroups } from '@/features/store/commercial-groups/hooks/useCommercialGroups';
import { useDocumentTypes } from '@/features/store/document-types/hooks/useDocumentTypes';
import { CustomersService } from '@/features/store/customers/services/customers.service';
import { CustomersCreatePageView } from './CustomersCreatePageView';
import type { CreateCustomerDto } from '@/features/store/customers/types/customer.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export const CustomersCreatePage = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const { groups, loading: groupsLoading } = useCommercialGroups();
    const { documentTypes, loading: documentTypesLoading } = useDocumentTypes();

    useEffect(() => {
        form.resetFields();
    }, [form]);

    const commercialGroupOptions = groups.map((g) => ({
        label: g.name,
        value: g.id,
    }));

    const documentTypeOptions = documentTypes.map((dt) => ({
        label: dt.name,
        value: dt.id,
    }));

    const handleSubmit = async (values: Record<string, unknown>) => {
        const normalizedDocNumber = (values.document_number as string).replace(/[.-]/g, '');
        const payload: CreateCustomerDto = {
            display_name: values.display_name as string,
            first_name: (values.first_name as string) || null,
            last_name: (values.last_name as string) || null,
            company_name: (values.company_name as string) || null,
            document_type_id: values.document_type_id as string,
            document_number: normalizedDocNumber,
            commercial_group_id: (values.commercial_group_id as string) || null,
            status: values.status ? 'active' : 'inactive',
            notes: (values.notes as string) || null,
        };

        setSubmitting(true);
        try {
            const created = await CustomersService.create(payload);
            message.success('Cliente creado correctamente.');
            navigate(`/tienda/clientes/${created.id}`);
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
            message.error(apiError.message || 'Error al crear el cliente.');
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const loading = documentTypesLoading || groupsLoading || submitting;

    return (
        <CustomersCreatePageView
            form={form}
            loading={loading}
            commercialGroupOptions={commercialGroupOptions}
            groupsLoading={groupsLoading}
            documentTypeOptions={documentTypeOptions}
            documentTypesLoading={documentTypesLoading}
            onSubmit={handleSubmit}
            onBack={() => navigate('/tienda/clientes')}
        />
    );
};
