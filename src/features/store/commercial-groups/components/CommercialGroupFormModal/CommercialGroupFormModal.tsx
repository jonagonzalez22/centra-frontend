import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { CommercialGroupForm } from '../CommercialGroupForm';
import { useCommercialGroupForm } from '../../hooks/useCommercialGroupForm';
import type { CommercialGroup, CreateCommercialGroupDto, UpdateCommercialGroupDto } from '../../types/commercialGroup.types';

interface CommercialGroupFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    group?: CommercialGroup;
}

export const CommercialGroupFormModal: React.FC<CommercialGroupFormModalProps> = ({
    open,
    onClose,
    onSuccess,
    group,
}) => {
    const [form] = Form.useForm();
    const { loading, createGroup, updateGroup } = useCommercialGroupForm({ onSuccess });

    const isEditing = !!group;
    const title = isEditing ? 'Editar Grupo Comercial' : 'Crear Grupo Comercial';

    useEffect(() => {
        if (open) {
            if (group) {
                form.setFieldsValue({
                    name: group.name,
                    description: group.description ?? undefined,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, group, form]);

    const handleSubmit = async (values: CreateCommercialGroupDto) => {
        if (isEditing && group) {
            await updateGroup(group.id, values as UpdateCommercialGroupDto);
        } else {
            await createGroup(values);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={title}
            width={560}
            footer={
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label={isEditing ? 'Actualizar' : 'Crear'}
                        loading={loading}
                        htmlType="button"
                        action={() => {
                            const formEl = document.getElementById('commercialGroupForm') as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <CommercialGroupForm
                formId="commercialGroupForm"
                form={form}
                loading={loading}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};
