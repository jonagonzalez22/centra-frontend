import { Form, Button } from 'antd';
import InputField from '../../../components/InputField/InputField';
import { InputPassword } from '@/components/InputPassword';
import { UserOutlined } from '@ant-design/icons';
import { emailRules, passwordRules } from '../../../utils/validationRules';

interface LoginFormValues {
    email: string;
    password: string;
}

const LoginForm = () => {
    const [form] = Form.useForm();
    const emailValidation = emailRules();
    const passwordValidation = passwordRules();

    const handleSubmit = (values: LoginFormValues) => {
        //TODO: integrar con store/api
        console.log(values);
    };

    return (
        <div className="cardAuthContainer">
            <div className="authHeaderContainer">
                <div className="authAvatar">
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
                    label="Password"
                    placeholder="Ingresá tu contraseña"
                    rules={passwordValidation}
                />
                <Button type="primary" htmlType="submit" block className="mt-4">
                    Ingresar
                </Button>
            </Form>
        </div>
    );
};

export default LoginForm;
