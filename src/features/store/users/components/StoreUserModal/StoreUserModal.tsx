import { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { StoreUserForm } from '../StoreUserForm';
import { useStoreUserForm } from '../../hooks/useStoreUserForm';
import { StoreUsersService } from '../../services/storeUsers.service';
import type { User } from '@/entities/User';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './StoreUserModal.css';

interface StoreUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: User;
}

export const StoreUserModal: React.FC<StoreUserModalProps> = ({
    open,
    onClose,
    onSuccess,
    user,
}) => {
    const [form] = Form.useForm();
    const { loading, createUser, updateUser } = useStoreUserForm({ onSuccess });
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);

    const isEditing = !!user;
    const title = isEditing ? 'Editar Usuario' : 'Crear Usuario';

    useEffect(() => {
        if (open) {
            if (user) {
                form.setFieldsValue({
                    name: user.name,
                    email: user.email,
                    role: user.roles[0] ?? undefined,
                    is_active: user.is_active,
                });
            } else {
                form.resetFields();
            }

            StoreUsersService.getFilterOptions()
                .then((options) => {
                    setRoleOptions(options.roles.map((r) => ({ label: r.name, value: r.name })));
                })
                .catch((err) => {
                    const apiError = err as ApiError;
                    message.error(apiError.message || 'Error al cargar los roles.');
                });
        }
    }, [open, user, form]);

    const handleSubmit = async (values: {
        name: string;
        email: string;
        password?: string;
        password_confirmation?: string;
        role: string;
        is_active?: boolean;
    }) => {
        if (isEditing && user) {
            const payload: { name: string; email: string; role: string; is_active?: boolean } = {
                name: values.name,
                email: values.email,
                role: values.role,
            };
            if (values.is_active !== undefined) {
                payload.is_active = values.is_active;
            }
            await updateUser(user.id, payload);
        } else {
            const payload: {
                name: string;
                email: string;
                password: string;
                password_confirmation: string;
                role: string;
                is_active?: boolean;
            } = {
                name: values.name,
                email: values.email,
                password: values.password!,
                password_confirmation: values.password_confirmation!,
                role: values.role,
            };
            if (values.is_active !== undefined) {
                payload.is_active = values.is_active;
            }
            await createUser(payload);
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
                <div className="storeUserModalFooter">
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
                                'storeUserForm'
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
            <StoreUserForm
                formId="storeUserForm"
                form={form}
                loading={loading}
                isEditing={isEditing}
                onSubmit={handleSubmit}
                roleOptions={roleOptions}
            />
        </Modal>
    );
};
