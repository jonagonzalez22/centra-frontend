import { Popconfirm, Button as AntButton } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import type { Category } from '../../interfaces/category.interface';
import './CategoriesTable.css';

interface CategoriesTableProps {
    categories: Category[];
    loading: boolean;
    pagination: { current: number; total: number; pageSize: number };
    onChange: (pagination: { current?: number; pageSize?: number }) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => Promise<void>;
}

export const CategoriesTable: React.FC<CategoriesTableProps> = ({
    categories,
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
            render: (_: unknown, record: Category) => record.description ?? '—',
        },
        {
            title: 'Estado',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (_: unknown, record: Category) => (
                <Tag color={record.is_active ? 'green' : 'red'}>
                    {record.is_active ? 'Activo' : 'Inactivo'}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Category) => (
                <div className="categoriesTableActions">
                    <CanDo permission="categories.edit">
                        <Button
                            variant="text"
                            size="small"
                            icon={<EditOutlined />}
                            action={() => onEdit(record)}
                        />
                    </CanDo>
                    <CanDo permission="categories.delete">
                        <Popconfirm
                            title="¿Eliminar categoría?"
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
            dataSource={categories as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => onChange({ current: pag.current ?? 1, pageSize: pag.pageSize ?? 15 })}
            emptyText="No hay categorías para mostrar"
            scroll={{ x: 'max-content' }}
        />
    );
};