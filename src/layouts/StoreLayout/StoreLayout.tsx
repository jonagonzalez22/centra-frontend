import { Layout } from 'antd';
import { ReactNode } from 'react';

const { Header, Sider, Content } = Layout;

interface IStoreLayoutProps {
    children: ReactNode;
}

const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    height: 64,
    paddingInline: 48,
    lineHeight: '64px',
};

const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const siderStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: '120px',
    color: '#fff',
    width: 250,
};


export const StoreLayout = ({ children }: IStoreLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider style={siderStyle} >
                Sider
            </Sider>
            <Layout style={{ display: 'flex', flexDirection: 'column' }}>
                <Header style={headerStyle}>Header</Header>
                <Content style={contentStyle}>{children}</Content>
            </Layout>
        </Layout>
    );
};
