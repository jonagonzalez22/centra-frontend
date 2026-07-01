import { Popconfirm, Button as AntButton, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import type { CommercialGroup } from '../../types/commercialGroup.types';

interface CommercialGroupsTableProps {
    groups: CommercialGroup[];
    loading: boolean;
    pagination: { current: number; total: number; pageSize: number };
    onChange: (pagination: { current?: number; pageSize?: number }) => void;
    onEdit: (group: CommercialGroup) => void;
    onDelete: (id: string) => Promise<void>;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const CommercialGroupsTable: React.FC<CommercialGroupsTableProps> = ({
    groups,
    loading,
    pagination,
    onChange,
    onEdit,
    onDelete,
}) => {
    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        {
            title: 'Descripción',
            dataIndex: 'description',
            key: 'description',
            responsive: ['md'],
            width: 250,
            onCell: () => ({
                style: {
                    maxWidth: 450,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                },
            }),
            render: (_: unknown, record: CommercialGroup) => {
                const text = record.description ?? '—';

                return (
                    <Tooltip title={text}>
                        <div
                            style={{
                                maxWidth: 450,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {text}
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Creado el',
            dataIndex: 'created_at',
            key: 'created_at',
            responsive: ['md'],
            render: (_: unknown, record: CommercialGroup) => formatDate(record.created_at),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: CommercialGroup) => (
                <div className="flex items-center gap-1">
                    <CanDo permission="commercial_groups.edit">
                        <Button
                            variant="text"
                            size="small"
                            icon={<EditOutlined />}
                            action={() => onEdit(record)}
                        />
                    </CanDo>
                    <CanDo permission="commercial_groups.delete">
                        <Popconfirm
                            title="¿Eliminar grupo comercial?"
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
            dataSource={groups as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) =>
                onChange({ current: pag.current ?? 1, pageSize: pag.pageSize ?? 15 })
            }
            emptyText="No hay grupos comerciales para mostrar"
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};
