import { Modal as AntModal } from 'antd';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: number;
    footer?: React.ReactNode | null;
    loading?: boolean;
    destroyOnClose?: boolean;
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
        >
            {children}
        </AntModal>
    );
};

export default Modal;