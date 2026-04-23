import { Layout } from 'antd';
import '../../layouts/AuthLayout/AuthLayout.css';
import { ReactNode } from 'react';

const { Content, Header, Sider } = Layout;

interface IAuthLayoutProps {
    children: ReactNode;
    sider?: ReactNode;
    header?: ReactNode;
}

export const AuthLayout = ({ children, sider, header }: IAuthLayoutProps) => {
    return (
        <Layout className='min-h-screen'>
            {sider && <Sider className='text-center w-[250px]'>{sider}</Sider>}

            <Layout>
                {header && <Header className="text-center text-white h-16 px-12 leading-[64px]">
                    {header}
                    </Header>}
                <Content className="authMainContent">
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};
