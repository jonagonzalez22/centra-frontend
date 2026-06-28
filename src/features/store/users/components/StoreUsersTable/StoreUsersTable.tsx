import { Popconfirm, Button as AntButton, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useStoreUsersContext } from '../../hooks/useStoreUsersContext';
import { useAuthStore } from '@/store/useAuthStore.store';
import type { User } from '@/entities/User';
import './StoreUsersTable.css';

interface StoreUsersTableProps {
    onEdit: (user: User) => void;
    onDelete: (id: number) => Promise<void>;
    onToggleActive: (id: number, isActive: boolean) => Promise<void>;
    onManagePermissions: (user: User) => void;
}

export const StoreUsersTable = ({ onEdit, onDelete, onToggleActive, onManagePermissions }: StoreUsersTableProps) => {
    const { users, loading, pagination, refetch } = useStoreUsersContext();
    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = currentUser?.id;

    const isSelf = (record: User) => record.id === currentUserId;

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
            title: 'Rol',
            dataIndex: 'roles',
            key: 'roles',
            render: (_: unknown, record: User) => (
                <div className="storeUsersTableRoles">
                    {record.roles.map((role) => (
                        <Tag key={role} color="blue">
                            {role}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: 'Estado',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <span
                    className={
                        isActive ? 'storeUsersTableStatusActive' : 'storeUsersTableStatusInactive'
                    }
                >
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
            ),
        },
        {
            title: 'Fecha de creación',
            dataIndex: 'created_at',
            key: 'created_at',
            responsive: ['md'],
            render: (createdAt: string | undefined) =>
                createdAt
                    ? new Date(createdAt).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                      })
                    : '—',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: User) => (
                <div className="storeUsersTableActions">
                    <CanDo permission="store_users.edit">
                        {isSelf(record) ? (
                            <Tooltip title="No podés modificar tus propios permisos">
                                <AntButton
                                    type="text"
                                    size="small"
                                    icon={<SafetyCertificateOutlined />}
                                    disabled
                                />
                            </Tooltip>
                        ) : (
                            <AntButton
                                type="text"
                                size="small"
                                icon={<SafetyCertificateOutlined />}
                                onClick={() => onManagePermissions(record)}
                            />
                        )}
                    </CanDo>

                    <CanDo permission="store_users.edit">
                        <Button
                            variant="text"
                            size="small"
                            icon={<EditOutlined />}
                            action={() => onEdit(record)}
                        />
                    </CanDo>

                    {!isSelf(record) && (
                        <CanDo permission="store_users.edit">
                            {record.is_active ? (
                                <Popconfirm
                                    title="¿Desactivar usuario?"
                                    description="El usuario no podrá acceder al sistema."
                                    onConfirm={() => onToggleActive(record.id, true)}
                                    okText="Desactivar"
                                    cancelText="Cancelar"
                                    okButtonProps={{ danger: true }}
                                >
                                    <AntButton type="text" size="small" icon={<StopOutlined />} />
                                </Popconfirm>
                            ) : (
                                <AntButton
                                    type="text"
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => onToggleActive(record.id, false)}
                                />
                            )}
                        </CanDo>
                    )}

                    {!isSelf(record) && (
                        <CanDo permission="store_users.delete">
                            <Popconfirm
                                title="¿Eliminar usuario?"
                                description="Esta acción no se puede deshacer."
                                onConfirm={() => onDelete(record.id)}
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
                        </CanDo>
                    )}
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
