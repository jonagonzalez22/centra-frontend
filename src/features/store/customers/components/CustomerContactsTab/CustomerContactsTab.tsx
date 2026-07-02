import { useState } from 'react';
import { Popconfirm, Button as AntButton, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useCustomerContacts } from '../../hooks/useCustomerContacts';
import { CustomerContactFormModal } from '../CustomerContactFormModal';
import type { CustomerContact } from '../../types/customerContact.types';

interface CustomerContactsTabProps {
    customerId: string;
}

export const CustomerContactsTab: React.FC<CustomerContactsTabProps> = ({ customerId }) => {
    const { contacts, loading, createContact, updateContact, deleteContact } =
        useCustomerContacts(customerId);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<CustomerContact | undefined>(undefined);

    const handleCreate = () => {
        setSelectedContact(undefined);
        setModalOpen(true);
    };

    const handleEdit = (contact: CustomerContact) => {
        setSelectedContact(contact);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedContact(undefined);
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setSelectedContact(undefined);
    };

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        {
            title: 'Cargo',
            dataIndex: 'position',
            key: 'position',
            responsive: ['md'] as ('md' | 'lg' | 'xl' | 'xxl' | 'sm' | 'xs' | 'xxxl')[],
            render: (_: unknown, record: CustomerContact) => record.position ?? '—',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (_: unknown, record: CustomerContact) => record.email ?? '—',
        },
        {
            title: 'Teléfono',
            dataIndex: 'phone',
            key: 'phone',
            render: (_: unknown, record: CustomerContact) => record.phone ?? '—',
        },
        {
            title: '¿Es Principal?',
            key: 'is_main',
            render: (_: unknown, record: CustomerContact) =>
                record.is_main ? <Tag color="blue">Sí</Tag> : '—',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: CustomerContact) => (
                <Space size="small">
                    <CanDo permission="customer_contacts.edit">
                        <Button
                            variant="text"
                            size="small"
                            icon={<EditOutlined />}
                            action={() => handleEdit(record)}
                        />
                    </CanDo>
                    <CanDo permission="customer_contacts.delete">
                        <Popconfirm
                            title="¿Eliminar contacto?"
                            description="Esta acción no se puede deshacer."
                            onConfirm={() => deleteContact(record.id)}
                            okText="Eliminar"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true }}
                        >
                            <AntButton type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </CanDo>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
                <CanDo permission="customer_contacts.create">
                    <Button
                        variant="primary"
                        label="Agregar Contacto"
                        icon={<PlusOutlined />}
                        action={handleCreate}
                    />
                </CanDo>
            </div>

            <Table
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                columns={columns as any}
                dataSource={contacts as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyText="No hay contactos para mostrar"
                scroll={{ x: 'max-content' }}
                size="small"
            />

            <CustomerContactFormModal
                open={modalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                contact={selectedContact}
                onCreate={createContact}
                onUpdate={updateContact}
            />
        </div>
    );
};
