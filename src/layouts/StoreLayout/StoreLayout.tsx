import { Layout } from 'antd';
import { ReactNode } from 'react';
import { siderStyle, headerStyle, contentStyle } from './StoreLayout.style';

const { Header, Sider, Content } = Layout;

interface IStoreLayoutProps {
    children: ReactNode;
    sider?: ReactNode;
    header?: ReactNode;
}

export const StoreLayout = ({ children , sider, header }: IStoreLayoutProps) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            { sider && (
                <Sider style={siderStyle}>
                    {sider}
                </Sider>
            )}

            <Layout>
            { header && (
                <Header style={headerStyle}>
                    {header}
                </Header>
            )}
                <Content style={contentStyle}>{children}</Content>
            </Layout>
        </Layout>
    );
};
