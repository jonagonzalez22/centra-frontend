import { useEffect } from 'react';
import { Form } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { UserForm } from '../UserForm';
import { useUserForm } from '../../hooks/useUserForm';
import type { UsersFilterOptions } from '../../types/user.types';
import type { User } from '@/entities/User';
import './UserModal.css';

interface UserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeId?: string;
    user?: User;
    filterOptions?: UsersFilterOptions | null;
    filterOptionsLoading?: boolean;
}

const defaultRoleOptions = [
    { label: 'STORE_ADMIN', value: 'STORE_ADMIN' },
    { label: 'STORE_USER', value: 'STORE_USER' },
];

export const UserModal: React.FC<UserModalProps> = ({
    open,
    onClose,
    onSuccess,
    storeId,
    user,
    filterOptions = null,
    filterOptionsLoading = false,
}) => {
    const [form] = Form.useForm();
    const { loading, createUser, updateUser } = useUserForm({ onSuccess });

    const isEditing = !!user;
    const isGlobalMode = !storeId;
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

    const handleSubmit = async (values: { name: string; email: string; password?: string; password_confirmation?: string; role: string; store_id?: string }) => {
        if (isEditing && user) {
            const payload: { name: string; email: string; role: string; store_id?: string | null } = {
                name: values.name,
                email: values.email,
                role: values.role,
            };
            if (values.store_id !== undefined) {
                payload.store_id = values.store_id || null;
            }
            await updateUser(user.id, payload);
        } else {
            const payload: { name: string; email: string; password: string; password_confirmation: string; role: string; store_id?: string } = {
                name: values.name,
                email: values.email,
                password: values.password!,
                password_confirmation: values.password_confirmation!,
                role: values.role,
            };
            if (values.store_id) {
                payload.store_id = values.store_id;
            }
            await createUser(payload as Parameters<typeof createUser>[0]);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const roleOptions = isGlobalMode && filterOptions
        ? filterOptions.roles.map((r) => ({ label: r.name, value: r.name }))
        : defaultRoleOptions;

    const storeOptions = filterOptions
        ? filterOptions.stores.map((s) => ({ label: s.name, value: s.id }))
        : [];

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
                isGlobalMode={isGlobalMode}
                roleOptions={roleOptions}
                storeOptions={storeOptions}
                storesLoading={filterOptionsLoading}
            />
        </Modal>
    );
};