import { Form, Button } from 'antd';
import InputField from '../../components/InputField/InputField';
import InputPassword from '../../components/InputPassword/InputPassword';
import {
    cardStyle,
    headerContainerStyle,
    avatarStyle,
    titleStyle,
    subtitleStyle,
} from '../../layouts/AuthLayout/AuthLayout.style';
import { UserOutlined } from '@ant-design/icons';

interface LoginFormValues {
    email: string;
    password: string;
}

const LoginForm = () => {
    const [form] = Form.useForm();

    const handleSubmit = (values: LoginFormValues) => {
        console.log(values);
    };

    return (
        <div style={cardStyle}>
            <div style={headerContainerStyle}>
                <div style={avatarStyle}>
                    {/*TODO: el logo de la personita se cambiara por el logo de la app */}
                    <UserOutlined style={{ color: '#fff', fontSize: 24 }} />
                </div>

                <h2 style={titleStyle}>Acceso a plataforma</h2>
                <p style={subtitleStyle}>Ingresa tus credenciales para acceder</p>
            </div>
            <Form form={form} layout="vertical" size='large' onFinish={handleSubmit} >
                <InputField 
                    name="email" 
                    label="Email" 
                    required 
                    placeholder="Ingresá tu email"
                    size='large'
                    />
                <InputPassword
                    name="password"
                    label="Password"
                    required
                    placeholder="Ingresá tu contraseña"
                />
                {/*TODO: agregar check de "recordarme" y link de olvide contrasena */}
                <Button type="primary" htmlType="submit" block>
                    Ingresar
                </Button>
            </Form>
        </div>
    );
};

export default LoginForm;
