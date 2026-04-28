import { Layout } from 'antd';
import { ReactNode } from 'react';
import './AuthLayout.css';

const { Content, Header, Sider } = Layout;

interface IAuthLayoutProps {
    children: ReactNode;
    sider?: ReactNode;
    header?: ReactNode;
}

export const AuthLayout = ({ children, sider, header }: IAuthLayoutProps) => {
    return (
        <Layout className='min-h-screen'>
            {sider && <Sider className='layoutSider'>{sider}</Sider>}

            <Layout>
                {header && <Header className='layoutHeader'>
                    {header}
                    </Header>}
                <Content className="authMainContent w-full">
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};
