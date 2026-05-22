import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { FeatureForm } from '../FeatureForm';
import { useFeatureForm } from '../../hooks/useFeatureForm';
import type { Feature, CreateFeatureDto, UpdateFeatureDto } from '../../types/feature.types';
import './FeatureModal.css';

interface FeatureModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    feature?: Feature;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({
    open,
    onClose,
    onSuccess,
    feature,
}) => {
    const [form] = Form.useForm();
    const { loading, createFeature, updateFeature } = useFeatureForm({ onSuccess });

    const isEditing = !!feature;
    const title = isEditing ? 'Editar Funcionalidad' : 'Crear Funcionalidad';

    useEffect(() => {
        if (open) {
            if (feature) {
                form.setFieldsValue({
                    code: feature.code,
                    name: feature.name,
                    description: feature.description ?? undefined,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, feature, form]);

    const handleSubmit = async (values: CreateFeatureDto) => {
        if (isEditing && feature) {
            await updateFeature(feature.id, values as UpdateFeatureDto);
        } else {
            await createFeature(values);
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
                <div className="featureModalFooter">
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
                            const formEl = document.getElementById('featureForm') as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <FeatureForm
                formId="featureForm"
                form={form}
                loading={loading}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};