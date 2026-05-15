import { Result, Button } from 'antd';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore.store';
import { AuthLayout } from '@/layouts/AuthLayout';

const NotFoundPage = () => {
    const { isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <AuthLayout>
            <Result
                status="404"
                title="Página no encontrada"
                subTitle="La página que buscas no existe o ha sido movida."
                extra={
                    <Button type="primary" onClick={() => navigate(-1)}>
                        Volver atrás
                    </Button>
                }
            />
        </AuthLayout>
    );
};

export default NotFoundPage;