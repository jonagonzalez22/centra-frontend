import { Layout } from 'antd';
import { ReactNode } from 'react';
import { siderStyle, headerStyle, centerContentStyle } from './AuthLayout.style';

const { Content, Header, Sider } = Layout;

interface IAuthLayoutProps {
    children: ReactNode;
    sider?: ReactNode;
    header?: ReactNode;
}

export const AuthLayout = ({ children, sider, header }: IAuthLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {sider && <Sider style={siderStyle}>{sider}</Sider>}

            <Layout>
                {header && <Header style={headerStyle}>{header}</Header>}
                <Content style={centerContentStyle}>{children}</Content>
            </Layout>
        </Layout>
    );
};
