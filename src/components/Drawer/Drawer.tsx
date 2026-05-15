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
}

const Drawer: React.FC<DrawerProps> = ({
    open,
    onClose,
    title,
    children,
    width = 480,
    loading = false,
    destroyOnClose = true,
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
        >
            {children}
        </AntDrawer>
    );
};

export default Drawer;