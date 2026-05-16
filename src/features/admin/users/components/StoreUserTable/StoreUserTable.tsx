import { Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { InputSearch } from '@/components/InputSearch';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { useUsers } from '../../hooks/useUsers';
import type { User } from '@/entities/User';
import './StoreUserTable.css';

interface StoreUserTableProps {
    storeId: string;
}

const StoreUserTable: React.FC<StoreUserTableProps> = ({ storeId }) => {
    const { users, loading, pagination, refetch, deleteUser } = useUsers(storeId);

    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
            responsive: ['md'],
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
                <div className="storeUserTableRoles">
                    {record.roles.map((role) => (
                        <Tag key={role} color="blue">
                            {role}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: User) => (
                <div className="storeUserTableActions">
                    <Popconfirm
                        title="¿Eliminar usuario?"
                        description="Esta acción no se puede deshacer."
                        onConfirm={() => deleteUser(record.id)}
                        okText="Eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <AntButton
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="storeUserTable">
            <div className="storeUserTableToolbar">
                <InputSearch
                    placeholder="Buscar por nombre"
                    onSearch={(value) => refetch({ name: value || undefined })}
                    allowClear
                    width={280}
                />
                <Button
                    variant="primary"
                    label="Nuevo Usuario"
                    icon={<PlusOutlined />}
                    action={() => console.log('Nuevo usuario')}
                />
            </div>

            <Table
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                columns={columns as any}
                dataSource={users as unknown as Record<string, unknown>[]}
                loading={loading}
                size="small"
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                }}
                onChange={(pag) => {
                    refetch({ page: pag.current ?? 1, per_page: pag.pageSize ?? 15 });
                }}
                emptyText="No hay usuarios para mostrar"
            />
        </div>
    );
};

export { StoreUserTable };
