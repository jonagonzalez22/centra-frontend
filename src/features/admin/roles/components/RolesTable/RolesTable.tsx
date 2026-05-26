import { EditOutlined } from '@ant-design/icons';
import { Tooltip, Space } from 'antd';
import Table from '@/components/Table/Table';
import Tag from '@/components/Tag/Tag';
import { ActionButton } from '@/components/ActionButton';
import { CanDo } from '@/components/auth/CanDo';
import type { Role } from '../../types/role.types';
import './RolesTable.css';

interface RolesTableProps {
    roles: Role[];
    loading: boolean;
    onEditPermissions: (role: Role) => void;
}

const MAX_VISIBLE_PERMISSIONS = 4;

const renderPermissions = (permissions: string[]) => {
    if (!permissions || permissions.length === 0) return '—';

    const visible = permissions.slice(0, MAX_VISIBLE_PERMISSIONS);
    const overflow = permissions.slice(MAX_VISIBLE_PERMISSIONS);

    const tagElements = visible.map((p) => (
        <Tag key={p} className="rolesTablePermissionTag">
            {p}
        </Tag>
    ));

    if (overflow.length > 0) {
        const overflowContent = (
            <Space direction="vertical" size={4}>
                {overflow.map((p) => (
                    <span key={p}>{p}</span>
                ))}
            </Space>
        );

        tagElements.push(
            <Tooltip
                key="overflow"
                title={<div style={{ maxWidth: 280 }}>{overflowContent}</div>}
            >
                <span>
                    <Tag color="default" className="rolesTableOverflowTag">
                        +{overflow.length} más
                    </Tag>
                </span>
            </Tooltip>
        );
    }

    return <Space wrap size={4}>{tagElements}</Space>;
};

export const RolesTable = ({
    roles,
    loading,
    onEditPermissions,
}: RolesTableProps) => {
    const columns = [
        {
            title: 'Rol',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Usuarios',
            key: 'users_count',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record: Role) =>
                record.users_count > 0 ? (
                    <Tag color="blue">{record.users_count}</Tag>
                ) : (
                    '0'
                ),
        },
        {
            title: 'Permisos',
            key: 'permissions',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record: Role) => renderPermissions(record.permissions),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Role) => (
                <div className="rolesTableActions">
                    <CanDo permission="roles.edit">
                        <ActionButton
                            icon={<EditOutlined />}
                            label="Editar permisos"
                            action={() => onEditPermissions(record)}
                        />
                    </CanDo>
                </div>
            ),
        },
    ];

    return (
        <Table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            dataSource={roles as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyText="No hay roles para mostrar"
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};