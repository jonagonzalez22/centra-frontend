import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { StoreForm } from '../StoreForm';
import { useStoreForm, buildInitialValuesFromStore } from '../../hooks/useStoreForm';
import type { Store, FilterOptions, CreateStoreDto } from '../../types/store.types';
import './StoreModal.css';

interface StoreModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    store?: Store;
    filterOptions: FilterOptions | null;
    filterOptionsLoading: boolean;
}

export const StoreModal: React.FC<StoreModalProps> = ({
    open,
    onClose,
    onSuccess,
    store,
    filterOptions,
    filterOptionsLoading,
}) => {
    const [form] = Form.useForm();
    const { loading, createStore, updateStore } = useStoreForm({ onSuccess });

    const isEditing = !!store;
    const title = isEditing ? 'Editar Tienda' : 'Crear Tienda';

    useEffect(() => {
        if (open) {
            if (store) {
                form.setFieldsValue(buildInitialValuesFromStore(store));
            } else {
                form.resetFields();
            }
        }
    }, [open, store, form]);

    const handleSubmit = async (values: CreateStoreDto) => {
        if (isEditing && store) {
            await updateStore(store.id, values);
        } else {
            await createStore(values);
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
            width={720}
            footer={
                <div className="storeModalFooter">
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
                            const formEl = document.getElementById(
                                'storeForm'
                            ) as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(
                                    new Event('submit', { cancelable: true, bubbles: true })
                                );
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <StoreForm
                formId="storeForm"
                form={form}
                loading={loading}
                filterOptions={filterOptions}
                filterOptionsLoading={filterOptionsLoading}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};