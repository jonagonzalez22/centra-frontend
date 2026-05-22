import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import { requiredStringRules, featureCodeRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateFeatureDto } from '../../types/feature.types';
import './FeatureForm.css';

interface FeatureFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    onSubmit: (values: CreateFeatureDto) => Promise<void>;
}

interface FeatureFormValues {
    code: string;
    name: string;
    description?: string;
}

export const FeatureForm: React.FC<FeatureFormProps> = ({
    formId,
    form: externalForm,
    loading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<FeatureFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: FeatureFormValues) => {
        try {
            await onSubmit(values);
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
                name="code"
                label="Código"
                placeholder="Ingresá el código (ej: punto_venta)"
                rules={featureCodeRules()}
                disabled={loading}
            />
            <InputField
                name="name"
                label="Nombre"
                placeholder="Ingresá el nombre de la funcionalidad"
                rules={requiredStringRules('El nombre', 1, 100)}
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