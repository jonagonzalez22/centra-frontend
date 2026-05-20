import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { BusinessTypeForm } from '../BusinessTypeForm';
import { useBusinessTypeForm } from '../../hooks/useBusinessTypeForm';
import type { BusinessType, CreateBusinessTypeDto, UpdateBusinessTypeDto } from '../../types/business-type.types';
import './BusinessTypeModal.css';

interface BusinessTypeModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    businessType?: BusinessType;
}

export const BusinessTypeModal: React.FC<BusinessTypeModalProps> = ({
    open,
    onClose,
    onSuccess,
    businessType,
}) => {
    const [form] = Form.useForm();
    const { loading, createBusinessType, updateBusinessType } = useBusinessTypeForm({ onSuccess });

    const isEditing = !!businessType;
    const title = isEditing ? 'Editar Tipo de Negocio' : 'Crear Tipo de Negocio';

    useEffect(() => {
        if (open) {
            if (businessType) {
                form.setFieldsValue({
                    name: businessType.name,
                    description: businessType.description ?? undefined,
                    status: businessType.status === 'active',
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, businessType, form]);

    const handleSubmit = async (values: CreateBusinessTypeDto) => {
        if (isEditing && businessType) {
            await updateBusinessType(businessType.id, values as UpdateBusinessTypeDto);
        } else {
            await createBusinessType(values);
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
                <div className="businessTypeModalFooter">
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
                            const formEl = document.getElementById('businessTypeForm') as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <BusinessTypeForm
                formId="businessTypeForm"
                form={form}
                loading={loading}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};