import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import InputPassword from '@/components/InputPassword/InputPassword';
import SelectField from '@/components/SelectField/SelectField';
import { emailRules, requiredStringRules, passwordRules, confirmPasswordRules, roleRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './UserForm.css';

interface UserFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    isEditing: boolean;
    onSubmit: (values: { name: string; email: string; password: string; password_confirmation: string; role: string; store_id?: string }) => Promise<void>;
}

interface UserFormValues {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role: string;
}

const roleOptions = [
    { label: 'STORE_ADMIN', value: 'STORE_ADMIN' },
    { label: 'STORE_USER', value: 'STORE_USER' },
];

export const UserForm: React.FC<UserFormProps> = ({
    formId,
    form: externalForm,
    loading,
    isEditing,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<UserFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: UserFormValues) => {
        try {
            const payload = {
                name: values.name,
                email: values.email,
                password: values.password!,
                password_confirmation: values.password_confirmation!,
                role: values.role,
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

    const passwordFieldRules = isEditing ? [] : passwordRules();
    const confirmFieldRules = isEditing ? [] : confirmPasswordRules();

    return (
        <Form
            form={form}
            id={formId}
            layout="vertical"
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <div className="userFormRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Ingresá el nombre"
                    rules={requiredStringRules('El nombre')}
                    disabled={loading}
                />
                <InputField
                    name="email"
                    label="Email"
                    placeholder="ejemplo@email.com"
                    rules={emailRules()}
                    disabled={loading}
                />
            </div>

            <div className="userFormRow">
                <InputPassword
                    name="password"
                    label="Contraseña"
                    placeholder="Mínimo 8 caracteres"
                    rules={passwordFieldRules}
                    disabled={loading}
                />
                <InputPassword
                    name="password_confirmation"
                    label="Confirmar Contraseña"
                    placeholder="Repetí la contraseña"
                    rules={confirmFieldRules}
                    disabled={loading}
                />
            </div>

            <div className="userFormRow">
                <SelectField
                    name="role"
                    label="Rol"
                    placeholder="Seleccionar"
                    options={roleOptions}
                    rules={roleRules()}
                    disabled={loading}
                />
            </div>
        </Form>
    );
};