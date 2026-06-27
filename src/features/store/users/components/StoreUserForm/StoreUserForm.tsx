import { Form, Switch, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import InputPassword from '@/components/InputPassword/InputPassword';
import SelectField from '@/components/SelectField/SelectField';
import { emailRules, requiredStringRules, passwordRules, confirmPasswordRules, roleRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './StoreUserForm.css';

interface StoreUserFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    isEditing: boolean;
    onSubmit: (values: { name: string; email: string; password?: string; password_confirmation?: string; role: string; is_active?: boolean }) => Promise<void>;
    roleOptions?: { label: string; value: string }[];
}

interface StoreUserFormValues {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role: string;
    is_active?: boolean;
}

export const StoreUserForm: React.FC<StoreUserFormProps> = ({
    formId,
    form: externalForm,
    loading,
    isEditing,
    onSubmit,
    roleOptions = [],
}) => {
    const [internalForm] = Form.useForm<StoreUserFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: StoreUserFormValues) => {
        try {
            const payload: { name: string; email: string; password?: string; password_confirmation?: string; role: string; is_active?: boolean } = {
                name: values.name,
                email: values.email,
                role: values.role,
            };
            if (!isEditing) {
                payload.password = values.password;
                payload.password_confirmation = values.password_confirmation;
            }
            if (values.is_active !== undefined) {
                payload.is_active = values.is_active;
            }
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
            <div className="storeUserFormRow">
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

            <div className="storeUserFormRow">
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

            <div className="storeUserFormRow">
                <SelectField
                    name="role"
                    label="Rol"
                    placeholder="Seleccionar"
                    options={roleOptions}
                    rules={roleRules()}
                    disabled={loading}
                />
            </div>

            <div className="storeUserFormRow">
                <Form.Item name="is_active" label="Estado del Usuario" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" disabled={loading} />
                </Form.Item>
            </div>
        </Form>
    );
};
