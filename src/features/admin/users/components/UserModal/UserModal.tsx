import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { UserForm } from '../UserForm';
import { useUserForm } from '../../hooks/useUserForm';
import type { User } from '@/entities/User';
import './UserModal.css';

interface UserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId: string;
    user?: User;
}

export const UserModal: React.FC<UserModalProps> = ({
    open,
    onClose,
    onSuccess,
    storeId,
    user,
}) => {
    const [form] = Form.useForm();
    const { loading, createUser, updateUser } = useUserForm({ onSuccess });

    const isEditing = !!user;
    const title = isEditing ? 'Editar Usuario' : 'Crear Usuario';

    useEffect(() => {
        if (open) {
            if (user) {
                form.setFieldsValue({
                    name: user.name,
                    email: user.email,
                    role: user.roles[0] ?? undefined,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, user, form]);

    const handleSubmit = async (values: { name: string; email: string; password: string; password_confirmation: string; role: string; store_id?: string }) => {
        if (isEditing && user) {
            const payload = {
                name: values.name,
                email: values.email,
                role: values.role,
            };
            await updateUser(user.id, payload);
        } else {
            const payload = {
                name: values.name,
                email: values.email,
                password: values.password,
                password_confirmation: values.password_confirmation,
                role: values.role,
                store_id: storeId,
            };
            await createUser(payload as Parameters<typeof createUser>[0]);
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
                <div className="userModalFooter">
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
                                'userForm'
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
            <UserForm
                formId="userForm"
                form={form}
                loading={loading}
                isEditing={isEditing}
                onSubmit={handleSubmit}
            />
        </Modal>
    );
};