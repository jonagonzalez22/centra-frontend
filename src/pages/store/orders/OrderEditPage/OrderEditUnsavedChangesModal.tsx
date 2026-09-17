import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';

interface Props {
    open: boolean;
    onContinueEditing: () => void;
    onLeaveWithoutSaving: () => void;
}

export const OrderEditUnsavedChangesModal = ({
    open,
    onContinueEditing,
    onLeaveWithoutSaving,
}: Props) => {
    const footer = (
        <>
            <Button variant="default" label="Seguir editando" action={onContinueEditing} />
            <Button variant="danger" label="Salir sin guardar" action={onLeaveWithoutSaving} />
        </>
    );

    return (
        <Modal
            open={open}
            onClose={onContinueEditing}
            title="Hay cambios sin guardar"
            width={480}
            footer={footer}
        >
            <p className="mb-0">Si salís ahora, los cambios realizados en el pedido se perderán.</p>
        </Modal>
    );
};
