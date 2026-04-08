import { Layout } from 'antd';
import { ReactNode } from 'react';
import { siderStyle, headerStyle, contentStyle } from './admin.style';

const { Content, Header, Sider } = Layout;

interface IAdminLayoutProps {
    children: ReactNode;
    sider?: ReactNode;
    header?: ReactNode;
    
}

export const AdminLayout = ({ children , sider, header }: IAdminLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider style={siderStyle} >
                {sider}
            </Sider>
            <Layout>
                <Header style={headerStyle}>{header}</Header>
                <Content style={contentStyle}>{children}</Content>
            </Layout>
        </Layout>
    );
};
