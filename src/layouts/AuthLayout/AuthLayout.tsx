import { Layout } from 'antd';
import { ReactNode } from 'react';

const { Content } = Layout;

interface IAuthLayoutProps {
    children: ReactNode;
}

const centerContentStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

export const AuthLayout = ({ children }: IAuthLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content style={ centerContentStyle} >
                {children}
            </Content>
        </Layout>
    );
};