import { Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { usePaymentMethodsContext } from '../../hooks/usePaymentMethodsContext';
import type { PaymentMethod } from '../../types/payment-method.types';

interface PaymentMethodsTableProps {
    onEdit: (paymentMethod: PaymentMethod) => void;
}

export const PaymentMethodsTable = ({ onEdit }: PaymentMethodsTableProps) => {
    const { paymentMethods, loading, pagination, refetch, deletePaymentMethod } = usePaymentMethodsContext();

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Código', dataIndex: 'code', key: 'code', responsive: ['md'] as const },
        {
            title: 'Estado',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (_: unknown, record: PaymentMethod) => (
                <Tag color={record.is_active ? 'green' : 'red'}>
                    {record.is_active ? 'Activo' : 'Inactivo'}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: PaymentMethod) => (
                <div className="flex items-center gap-1">
                    <CanDo permission="settings.edit">
                        <Button
                            variant="text"
                            size="small"
                            icon={<EditOutlined />}
                            action={() => onEdit(record)}
                        />
                    </CanDo>
                    <CanDo permission="settings.edit">
                        <Popconfirm
                            title="¿Eliminar medio de pago?"
                            description="Esta acción no se puede deshacer."
                            onConfirm={() => deletePaymentMethod(record.id)}
                            okText="Eliminar"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true }}
                        >
                            <AntButton type="text" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </CanDo>
                </div>
            ),
        },
    ];

    return (
        <Table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            dataSource={paymentMethods as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => {
                refetch({ page: pag.current ?? 1, per_page: pag.pageSize ?? 15 });
            }}
            emptyText="No hay medios de pago para mostrar"
            scroll={{ x: 'max-content' }}
        />
    );
};
