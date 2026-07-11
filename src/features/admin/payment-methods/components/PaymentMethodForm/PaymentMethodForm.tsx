import { Form, message, Switch } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreatePaymentMethodDto } from '../../types/payment-method.types';

interface PaymentMethodFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    onSubmit: (values: CreatePaymentMethodDto) => Promise<void>;
}

interface PaymentMethodFormValues {
    name: string;
    code: string;
    icon?: string;
    is_active: boolean;
}

const codePatternRule = {
    pattern: /^[a-z][a-z0-9_]*$/,
    message: 'Formato snake_case requerido (ej: efectivo).',
};

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
    formId,
    form: externalForm,
    loading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<PaymentMethodFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: PaymentMethodFormValues) => {
        try {
            const payload: CreatePaymentMethodDto = {
                name: values.name,
                code: values.code,
                icon: values.icon || undefined,
                is_active: values.is_active,
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
            initialValues={{ is_active: true }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <InputField
                name="name"
                label="Nombre"
                placeholder="Ingresá el nombre del medio de pago"
                rules={requiredStringRules('El nombre', 1, 255)}
                disabled={loading}
            />
            <InputField
                name="code"
                label="Código"
                placeholder="Ingresá el código (snake_case)"
                rules={[
                    ...requiredStringRules('El código', 1, 50),
                    codePatternRule,
                ]}
                disabled={loading}
            />
            <InputField
                name="icon"
                label="Ícono"
                placeholder="Ingresá el nombre del ícono (opcional)"
                disabled={loading}
            />
            <Form.Item name="is_active" label="Estado" valuePropName="checked">
                <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" disabled={loading} />
            </Form.Item>
        </Form>
    );
};
