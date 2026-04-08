import { Layout } from 'antd';
import { ReactNode } from 'react';
import { centerContentStyle } from './auth.style';

const { Content } = Layout;

interface IAuthLayoutProps {
    children: ReactNode;
}

export const AuthLayout = ({ children }: IAuthLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content style={ centerContentStyle } >
                {children}
            </Content>
        </Layout>
    );
};