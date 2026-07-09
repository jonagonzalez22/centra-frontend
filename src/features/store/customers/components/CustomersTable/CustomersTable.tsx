import { Popconfirm, Button as AntButton, Tooltip } from 'antd';
import { DeleteOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useNavigate } from 'react-router-dom';
import type { Customer } from '../../types/customer.types';

interface CustomersTableProps {
    customers: Customer[];
    loading: boolean;
    pagination: { current: number; total: number; pageSize: number };
    onPageChange: (page: number, pageSize: number) => void;
    onDelete: (id: string) => Promise<void>;
}

export const CustomersTable = ({
    customers,
    loading,
    pagination,
    onPageChange,
    onDelete,
}: CustomersTableProps) => {
    const navigate = useNavigate();

    const columns = [
        {
            title: 'Código',
            dataIndex: 'customer_code',
            key: 'customer_code',
            render: (code: string) => <Tag color="blue">{code}</Tag>,
        },
        {
            title: 'Nombre',
            dataIndex: 'display_name',
            key: 'display_name',
        },
        {
            title: 'Documento',
            key: 'document',
            render: (_: unknown, record: Customer) => {
                return `${record.document_type.name}: ${record.document_number}`;
            },
        },
        {
            title: 'Grupo Comercial',
            key: 'commercial_group',
            responsive: ['md'] as ('md' | 'lg' | 'xl' | 'sm' | 'xs' | 'xxl' | 'xxxl')[],
            render: (_: unknown, record: Customer) =>
                record.commercial_group?.name ? (
                    <Tag color="geekblue">{record.commercial_group.name}</Tag>
                ) : (
                    '—'
                ),
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? 'Activo' : 'Inactivo'}
                </Tag>
            ),
        },
        {
            title: 'Ubicación',
            key: 'location',
            render: (_: unknown, record: Customer) => (
                <Tooltip
                    title={record.has_location ? 'Ubicación confirmada' : 'Sin ubicación geográfica'}
                >
                    <EnvironmentOutlined
                        style={{
                            fontSize: 18,
                            color: record.has_location ? '#093764' : '#d9d9d9',
                        }}
                    />
                </Tooltip>
            ),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Customer) => (
                <div className="flex items-center gap-1">
                    <CanDo permission="customers.view">
                        <AntButton
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/tienda/clientes/${record.id}`)}
                        />
                    </CanDo>
                    <CanDo permission="customers.delete">
                        <Popconfirm
                            title="¿Eliminar cliente?"
                            description="Esta acción no se puede deshacer."
                            onConfirm={() => onDelete(record.id)}
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
            dataSource={customers as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => onPageChange(pag.current ?? 1, pag.pageSize ?? 15)}
            emptyText="No hay clientes para mostrar"
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};
