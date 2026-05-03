import { Form, Button, Alert } from 'antd';
import InputField from '../../../components/InputField/InputField';
import { InputPassword } from '@/components/InputPassword';
import { UserOutlined } from '@ant-design/icons';
import { emailRules, passwordRules } from '../../../utils/validationRules';
import { useAuthStore } from '@/store/useAuthStore.store';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginFormValues {
    email: string;
    password: string;
}

const LoginForm = () => {
    const [form] = Form.useForm();
    const { logIn, loading } = useAuthStore();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const emailValidation = emailRules();
    const passwordValidation = passwordRules();

    const handleSubmit = async (values: LoginFormValues) => {
        setErrorMessage(null);

        try {
            await logIn(values.email, values.password);
            navigate(from, { replace: true });
        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrorMessage(error.message || 'Credenciales incorrectas');
            } else {
                setErrorMessage('Credenciales incorrectas');
            }
        }
    };

    return (
        <div className="cardAuthContainer">
            <div className="authHeaderContainer">
                <div className="authAvatar">
                    {/**TODO: cambiar logo de persona por logo CENTRA */}
                    <UserOutlined className="text-white text-xl" />
                </div>

                <h2 className="authTitle">Acceso a plataforma</h2>
                <p className="authSubtitle">Ingresa tus credenciales para acceder</p>
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
                    rules={emailValidation}
                />

                <InputPassword
                    name="password"
                    label="Contraseña"
                    placeholder="Ingresá tu contraseña"
                    rules={passwordValidation}
                />
                {/**TODO: agregar check recordar y olvide contrasena */}
                <Button type="primary" htmlType="submit" block className="mt-4" loading={loading}>
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
