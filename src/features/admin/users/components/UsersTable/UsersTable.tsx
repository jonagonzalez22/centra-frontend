import { Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { useUsersContext } from '../../hooks/useUsersContext';
import type { User } from '@/entities/User';
import './UsersTable.css';

interface UsersTableProps {
    onEdit: (user: User) => void;
    onDelete: (id: number) => Promise<void>;
}

export const UsersTable = ({ onEdit, onDelete }: UsersTableProps) => {
    const { users, loading, pagination, refetch } = useUsersContext();

    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Roles',
            dataIndex: 'roles',
            key: 'roles',
            render: (_: unknown, record: User) => (
                <div className="usersTableRoles">
                    {record.roles.map((role) => (
                        <Tag key={role} color="blue">
                            {role}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: 'Tienda',
            dataIndex: 'store',
            key: 'store',
            responsive: ['md'],
            render: (_: unknown, record: User) => record.store?.name ?? '—',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: User) => (
                <div className="usersTableActions">
                    <Button
                        variant="text"
                        size="small"
                        icon={<EditOutlined />}
                        action={() => onEdit(record)}
                    />
                    <Popconfirm
                        title="¿Eliminar usuario?"
                        description="Esta acción no se puede deshacer."
                        onConfirm={() => onDelete(record.id)}
                        okText="Eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <AntButton type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <Table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            dataSource={users as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => {
                refetch({ page: pag.current ?? 1, per_page: pag.pageSize ?? 15 });
            }}
            emptyText="No hay usuarios para mostrar"
            scroll={{ x: 'max-content' }}
        />
    );
};