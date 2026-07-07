import { useState, useMemo, useCallback } from 'react';
import { Popconfirm, Button as AntButton, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useCustomerAddresses } from '../../hooks/useCustomerAddresses';
import { AddressFormDrawer } from '../AddressFormDrawer';
import type { CustomerAddress } from '../../types/customerAddress.types';

interface AddressesTabProps {
    customerId: string;
}

const ADDRESS_TYPE_LABELS: Record<string, string> = {
    delivery: 'Entrega',
    billing: 'Cobranza',
    other: 'Otro',
};

const ADDRESS_TYPE_COLORS: Record<string, string> = {
    delivery: 'blue',
    billing: 'green',
    other: 'default',
};

export const AddressesTab: React.FC<AddressesTabProps> = ({ customerId }) => {
    const { addresses, loading, createAddress, updateAddress, deleteAddress } =
        useCustomerAddresses(customerId);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | undefined>(undefined);

    const handleCreate = () => {
        setSelectedAddress(undefined);
        setDrawerOpen(true);
    };

    const handleEdit = useCallback((address: CustomerAddress) => {
        setSelectedAddress(address);
        setDrawerOpen(true);
    }, []);

    const handleClose = () => {
        setDrawerOpen(false);
        setSelectedAddress(undefined);
    };

    const handleSuccess = () => {
        setDrawerOpen(false);
        setSelectedAddress(undefined);
    };

    const columns = useMemo(() => [
        {
            title: 'Domicilio',
            key: 'address',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const addr = record as unknown as CustomerAddress;
                return `${addr.street} ${addr.number}${addr.floor ? `, Piso ${addr.floor}` : ''}${addr.apartment ? `, Depto ${addr.apartment}` : ''}`;
            },
        },
        {
            title: 'Localidad',
            key: 'locality',
            responsive: ['md'] as ('xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const addr = record as unknown as CustomerAddress;
                return addr.locality?.name ?? '—';
            },
        },
        {
            title: 'Provincia',
            key: 'province',
            responsive: ['md'] as ('xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const addr = record as unknown as CustomerAddress;
                return addr.locality?.province?.name ?? '—';
            },
        },
        {
            title: 'Tipo',
            key: 'address_type',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const addr = record as unknown as CustomerAddress;
                return (
                    <Tag color={ADDRESS_TYPE_COLORS[addr.type]}>
                        {ADDRESS_TYPE_LABELS[addr.type]}
                    </Tag>
                );
            },
        },
        {
            title: '¿Principal?',
            key: 'is_main',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const addr = record as unknown as CustomerAddress;
                return addr.is_main ? <Tag color="blue">Sí</Tag> : '—';
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const addr = record as unknown as CustomerAddress;
                return (
                    <Space size="small">
                        <CanDo permission="customer_addresses.edit">
                            <Button
                                variant="text"
                                size="small"
                                icon={<EditOutlined />}
                                action={() => handleEdit(addr)}
                            />
                        </CanDo>
                        <CanDo permission="customer_addresses.delete">
                            <Popconfirm
                                title="¿Eliminar domicilio?"
                                description="Esta acción no se puede deshacer."
                                onConfirm={() => deleteAddress(addr.id)}
                                okText="Eliminar"
                                cancelText="Cancelar"
                                okButtonProps={{ danger: true }}
                            >
                                <AntButton type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </CanDo>
                    </Space>
                );
            },
        },
    ], [handleEdit, deleteAddress]);

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
                <CanDo permission="customer_addresses.create">
                    <Button
                        variant="primary"
                        label="Agregar Domicilio"
                        icon={<PlusOutlined />}
                        action={handleCreate}
                    />
                </CanDo>
            </div>

            <Table
                columns={columns}
                dataSource={addresses as unknown as Record<string, unknown>[]}
                loading={loading}
                emptyText="No hay domicilios para mostrar"
                scroll={{ x: 'max-content' }}
                size="small"
            />

            <AddressFormDrawer
                open={drawerOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
                address={selectedAddress}
                onCreate={createAddress}
                onUpdate={updateAddress}
            />
        </div>
    );
};
