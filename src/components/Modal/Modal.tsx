import { Modal as AntModal } from 'antd';
import type { ModalProps as AntModalProps } from 'antd';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: number;
    footer?: React.ReactNode | null;
    loading?: boolean;
    destroyOnClose?: boolean;
    className?: string;
    styles?: AntModalProps['styles'];
}

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    children,
    width = 720,
    footer,
    loading = false,
    destroyOnClose = true,
    className,
    styles,
}) => {
    return (
        <AntModal
            open={open}
            onCancel={onClose}
            title={title}
            width={width}
            footer={footer}
            destroyOnClose={destroyOnClose}
            closable={!loading}
            maskClosable={!loading}
            keyboard={!loading}
            centered
            rootClassName={className}
            styles={styles}
        >
            {children}
        </AntModal>
    );
};

export default Modal;