import { Form, message, Switch } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateBusinessTypeDto } from '../../types/business-type.types';
import './BusinessTypeForm.css';

interface BusinessTypeFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    onSubmit: (values: CreateBusinessTypeDto) => Promise<void>;
}

interface BusinessTypeFormValues {
    name: string;
    description?: string;
    status: boolean;
}

export const BusinessTypeForm: React.FC<BusinessTypeFormProps> = ({
    formId,
    form: externalForm,
    loading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<BusinessTypeFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: BusinessTypeFormValues) => {
        try {
            const payload: CreateBusinessTypeDto = {
                name: values.name,
                description: values.description,
                status: values.status ? 'active' : 'inactive',
            };
            await onSubmit(payload);
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages,
                }));
                form.setFields(fieldErrors as Parameters<FormInstance['setFields']>[0]);
            }
        }
    };

    return (
        <Form
            form={form}
            id={formId}
            layout="vertical"
            initialValues={{ status: true }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <InputField
                name="name"
                label="Nombre"
                placeholder="Ingresá el nombre del tipo de negocio"
                rules={requiredStringRules('El nombre', 1, 100)}
                disabled={loading}
            />
            <InputField
                name="description"
                label="Descripción"
                placeholder="Ingresá una descripción (opcional)"
                disabled={loading}
            />
            <Form.Item name="status" label="Estado" valuePropName="checked">
                <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" disabled={loading} />
            </Form.Item>
        </Form>
    );
};