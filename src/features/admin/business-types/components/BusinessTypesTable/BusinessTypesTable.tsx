import { Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useBusinessTypesContext } from '../../hooks/useBusinessTypesContext';
import type { BusinessType } from '../../types/business-type.types';
import './BusinessTypesTable.css';

interface BusinessTypesTableProps {
    onEdit: (businessType: BusinessType) => void;
}

export const BusinessTypesTable = ({ onEdit }: BusinessTypesTableProps) => {
    const { businessTypes, loading, pagination, refetch, deleteBusinessType } = useBusinessTypesContext();

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        {
            title: 'Descripción',
            dataIndex: 'description',
            key: 'description',
            responsive: ['md'],
            render: (_: unknown, record: BusinessType) => record.description ?? '—',
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (_: unknown, record: BusinessType) => (
                <Tag color={record.status === 'active' ? 'green' : 'red'}>
                    {record.status === 'active' ? 'Activo' : 'Inactivo'}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: BusinessType) => (
                <div className="businessTypesTableActions">
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
                            title="¿Eliminar tipo de negocio?"
                            description="Esta acción no se puede deshacer."
                            onConfirm={() => deleteBusinessType(record.id)}
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
            dataSource={businessTypes as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => {
                refetch({ page: pag.current ?? 1, per_page: pag.pageSize ?? 15 });
            }}
            emptyText="No hay tipos de negocio para mostrar"
            scroll={{ x: 'max-content' }}
        />
    );
};