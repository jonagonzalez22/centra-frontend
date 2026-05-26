import { Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { useFeaturesContext } from '../../hooks/useFeaturesContext';
import type { Feature } from '../../types/feature.types';
import './FeaturesTable.css';

interface FeaturesTableProps {
    onEdit: (feature: Feature) => void;
}

export const FeaturesTable = ({ onEdit }: FeaturesTableProps) => {
    const { features, loading, pagination, refetch, deleteFeature } = useFeaturesContext();

    const columns = [
        {
            title: 'Código',
            dataIndex: 'code',
            key: 'code',
            render: (_: unknown, record: Feature) => (
                <Tag color="blue" className="font-mono">{record.code}</Tag>
            ),
        },
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        {
            title: 'Descripción',
            dataIndex: 'description',
            key: 'description',
            responsive: ['md'],
            render: (_: unknown, record: Feature) => record.description ?? '—',
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Feature) => (
                <div className="featuresTableActions">
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
                            title="¿Eliminar funcionalidad?"
                            description="Esta acción no se puede deshacer."
                            onConfirm={() => deleteFeature(record.id)}
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
            dataSource={features as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => {
                refetch({ page: pag.current ?? 1, per_page: pag.pageSize ?? 15 });
            }}
            emptyText="No hay funcionalidades para mostrar"
            scroll={{ x: 'max-content' }}
        />
    );
};