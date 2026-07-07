import { useState, useEffect } from 'react';
import { Drawer as AntDrawer } from 'antd';

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    width?: number;
    loading?: boolean;
    destroyOnClose?: boolean;
    extra?: React.ReactNode;
    footer?: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({
    open,
    onClose,
    title,
    children,
    width = 480,
    loading = false,
    destroyOnClose = true,
    extra,
    footer,
}) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <AntDrawer
            open={open}
            onClose={onClose}
            title={title}
            width={isMobile ? '100%' : width}
            destroyOnClose={destroyOnClose}
            closable={!loading}
            maskClosable={!loading}
            keyboard={!loading}
            extra={extra}
            footer={footer}
        >
            {children}
        </AntDrawer>
    );
};

export default Drawer;