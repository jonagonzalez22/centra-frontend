import { Form, message, Switch } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateCategoryDto } from '../../interfaces/category.interface';
import './CategoryForm.css';

interface CategoryFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    onSubmit: (values: CreateCategoryDto) => Promise<void>;
}

interface CategoryFormValues {
    name: string;
    description?: string;
    is_active: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
    formId,
    form: externalForm,
    loading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<CategoryFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: CategoryFormValues) => {
        try {
            const payload: CreateCategoryDto = {
                name: values.name,
                description: values.description,
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
                placeholder="Ingresá el nombre de la categoría"
                rules={requiredStringRules('El nombre', 1, 100)}
                disabled={loading}
            />
            <InputField
                name="description"
                label="Descripción"
                placeholder="Ingresá una descripción (opcional)"
                disabled={loading}
            />
            <Form.Item name="is_active" label="Estado" valuePropName="checked">
                <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" disabled={loading} />
            </Form.Item>
        </Form>
    );
};