import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateCommercialGroupDto } from '../../types/commercialGroup.types';

interface CommercialGroupFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    onSubmit: (values: CreateCommercialGroupDto) => Promise<void>;
}

interface CommercialGroupFormValues {
    name: string;
    description?: string;
}

export const CommercialGroupForm: React.FC<CommercialGroupFormProps> = ({
    formId,
    form: externalForm,
    loading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<CommercialGroupFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: CommercialGroupFormValues) => {
        try {
            const payload: CreateCommercialGroupDto = {
                name: values.name,
                description: values.description,
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
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <InputField
                name="name"
                label="Nombre"
                placeholder="Ingresá el nombre del grupo comercial"
                rules={requiredStringRules('El nombre', 1, 255)}
                disabled={loading}
            />
            <InputField
                name="description"
                label="Descripción"
                placeholder="Ingresá una descripción (opcional)"
                disabled={loading}
            />
        </Form>
    );
};
