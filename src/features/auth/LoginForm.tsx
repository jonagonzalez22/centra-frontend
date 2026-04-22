import { Form, Button, Alert } from 'antd';
import InputField from '../../components/InputField/InputField';
import InputPassword from '../../components/InputPassword/InputPassword';
import {
    headerContainerStyle,
    avatarStyle,
    titleStyle,
    subtitleStyle,
} from '../../layouts/AuthLayout/AuthLayout.style';
import { UserOutlined } from '@ant-design/icons';
import { emailRules, passwordRules } from '../../utils/validationRules';
import { useAuthStore } from '../../store/useAuthStore.store';
import { useState } from 'react';
import { ApiError } from '@/interfaces/ApiErrors.interface';

interface LoginFormValues {
    email: string;
    password: string;
}

const LoginForm = () => {
    const [form] = Form.useForm();
    const { logIn, loading } = useAuthStore();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (values: LoginFormValues) => {
        setErrorMessage(null);
        try {
            await logIn(values.email, values.password);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            setErrorMessage(apiError.message);
        }
    };

    return (
        <div className="centra-card">
            <div style={headerContainerStyle}>
                <div style={avatarStyle}>
                    {/*TODO: el logo de la personita se cambiara por el logo de la app */}
                    <UserOutlined style={{ color: '#fff', fontSize: 24 }} />
                </div>

                <h2 style={titleStyle}>Acceso a plataforma</h2>
                <p style={subtitleStyle}>Ingresa tus credenciales para acceder</p>
            </div>
            <Form
                form={form}
                layout="vertical"
                size="large"
                onFinish={handleSubmit}
                validateTrigger="onBlur"
            >
                <InputField
                    name="email"
                    label="Email"
                    placeholder="Ingresá tu email"
                    size="large"
                    rules={emailRules()}
                />
                <InputPassword
                    name="password"
                    label="Password"
                    placeholder="Ingresá tu contraseña"
                    rules={passwordRules()}
                />
                {/*TODO: agregar check de "recordarme" y link de olvide contrasena */}
                <Button type="primary" htmlType="submit" block loading={loading}>
                    Ingresar
                </Button>
                {errorMessage && (
                    <Alert
                        description={errorMessage}
                        type="error"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                )}
            </Form>
        </div>
    );
};

export default LoginForm;
