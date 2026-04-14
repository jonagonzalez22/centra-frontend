import { Layout } from 'antd';
import { ReactNode } from 'react';
import { siderStyle, headerStyle, contentStyle } from './AdminLayout.style';

const { Content, Header, Sider } = Layout;

interface IAdminLayoutProps {
    children: ReactNode;
    sider?: ReactNode;
    header?: ReactNode;
}

export const AdminLayout = ({ children, sider, header }: IAdminLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {sider && <Sider style={siderStyle}>{sider}</Sider>}

            <Layout>
                {header && <Header style={headerStyle}>{header}</Header>}
                <Content style={contentStyle}>{children}</Content>
            </Layout>
        </Layout>
    );
};
