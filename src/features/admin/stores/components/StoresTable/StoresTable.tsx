import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Table from '@/components/Table/Table';
import { ActionButton } from '@/components/ActionButton';
import { CanDo } from '@/components/auth/CanDo';
import { useStoresContext } from '@/features/admin/stores/hooks/useStoresContext';
import { formatDate } from '@/utils/formatDate';
import type { Store } from '@/features/admin/stores/types/store.types';
import './StoresTable.css';

interface StoresTableProps {
    onEdit: (store: Store) => void;
}

export const StoresTable = ({ onEdit }: StoresTableProps) => {
    const { stores, loading, pagination, refetch } = useStoresContext();
    const navigate = useNavigate();

    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Tipo de negocio',
            dataIndex: 'business_type',
            key: 'business_type',
            responsive: ['md'],
            render: (_: unknown, record: Store) => record.business_type?.name ?? '—',
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
            responsive: ['md'],
            render: (_: unknown, record: Store) => record.plan?.name ?? '—',
        },
        {
            title: 'Estado',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => (
                <span className={isActive ? 'storesTableStatusActive' : 'storesTableStatusInactive'}>
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
            ),
        },
        {
            title: 'Fecha de creación',
            dataIndex: 'created_at',
            key: 'created_at',
            responsive: ['md'],
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Fecha de inactividad',
            dataIndex: 'inactive_at',
            key: 'inactive_at',
            responsive: ['md'],
            render: (date: string | null) => formatDate(date),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Store) => (
                <div className="storesTableActions">
                    <CanDo permission="stores.view">
                        <ActionButton
                            icon={<EyeOutlined />}
                            label="Ver"
                            action={() => navigate(`/admin/tiendas/${record.id}`)}
                        />
                    </CanDo>
                    <CanDo permission="stores.edit">
                        <ActionButton
                            icon={<EditOutlined />}
                            label="Editar"
                            action={() => onEdit(record)}
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
            dataSource={stores as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            onChange={(pag) => {
                refetch({ page: pag.current ?? 1, per_page: pag.pageSize ?? 15 });
            }}
            emptyText="No hay tiendas para mostrar"
            scroll={{ x: 'max-content' }}
        />
    );
};