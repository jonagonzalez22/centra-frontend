import { Form, Alert } from 'antd';
import InputField from '../../../components/InputField/InputField';
import { InputPassword } from '@/components/InputPassword';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { TextLink } from '@/components/TextLink';
import { UserOutlined } from '@ant-design/icons';
import { emailRules, passwordRules } from '../../../utils/validationRules';
import { useAuthStore } from '@/store/useAuthStore.store';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiError } from '@/interfaces/ApiErrors.interface';
import './LoginForm.css';

interface LoginFormValues {
    email: string;
    password: string;
    remember?: boolean;
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
            const apiError = error as ApiError;
            setErrorMessage(apiError?.message || 'Credenciales incorrectas');
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

                <div className="loginFormOptions">
                    <Form.Item
                        name="remember"
                        valuePropName="checked"
                        className="loginFormRememberItem"
                    >
                        <Checkbox className="loginFormRememberCheckbox">Recordarme</Checkbox>
                    </Form.Item>

                    <TextLink to="/" className="loginFormForgotPasswordLink">
                        Olvidé contraseña
                    </TextLink>
                </div>

                <Button
                    variant="primary"
                    htmlType="submit"
                    block
                    className="loginFormSubmitButton"
                    loading={loading}
                >
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
