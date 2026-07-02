import { useEffect, useState } from 'react';
import { Form, Input, Checkbox, message } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import { emailRules } from '@/utils/validationRules';
import type { CustomerContact, CreateCustomerContactDto, UpdateCustomerContactDto } from '../../types/customerContact.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface CustomerContactFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    contact?: CustomerContact;
    onCreate: (dto: CreateCustomerContactDto) => Promise<void>;
    onUpdate: (id: string, dto: UpdateCustomerContactDto) => Promise<void>;
}

export const CustomerContactFormModal: React.FC<CustomerContactFormModalProps> = ({
    open,
    onClose,
    onSuccess,
    contact,
    onCreate,
    onUpdate,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const isEditing = !!contact;
    const title = isEditing ? 'Editar Contacto' : 'Agregar Contacto';

    useEffect(() => {
        if (open) {
            if (contact) {
                form.setFieldsValue({
                    name: contact.name,
                    position: contact.position ?? undefined,
                    email: contact.email ?? undefined,
                    phone: contact.phone ?? undefined,
                    is_main: contact.is_main,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, contact, form]);

    const handleSubmit = async (values: Record<string, unknown>) => {
        setLoading(true);
        try {
            if (isEditing && contact) {
                await onUpdate(contact.id, values as unknown as UpdateCustomerContactDto);
            } else {
                await onCreate(values as unknown as CreateCustomerContactDto);
            }
            onSuccess();
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages,
                }));
                form.setFields(fieldErrors as Parameters<typeof form.setFields>[0]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) onClose();
    };

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
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
                            const formEl = document.getElementById('customerContactForm') as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <Form
                id="customerContactForm"
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onFinishFailed={handleFinishFailed}
                validateTrigger="onBlur"
            >
                <Form.Item
                    name="name"
                    label="Nombre"
                    rules={[{ required: true, message: 'El nombre es obligatorio.' }]}
                >
                    <Input placeholder="Ingresá el nombre del contacto" />
                </Form.Item>

                <Form.Item name="position" label="Cargo">
                    <Input placeholder="Ej: Encargado de Compras" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={emailRules()}
                >
                    <Input placeholder="correo@ejemplo.com" />
                </Form.Item>

                <Form.Item name="phone" label="Teléfono">
                    <Input placeholder="+54 9 11 1234-5678" />
                </Form.Item>

                <Form.Item name="is_main" valuePropName="checked">
                    <Checkbox>Contacto Principal</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};
