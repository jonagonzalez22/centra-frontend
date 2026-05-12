import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import Table from '@/components/Table/Table';
import { ActionButton } from '@/components/ActionButton';
import { useStoresContext } from '@/features/admin/stores/hooks/useStoresContext';
import { formatDate } from '@/utils/formatDate';
import type { Store } from '@/features/admin/stores/types/store.types';
import './StoresTable.css';

export const StoresTable = () => {
    const { stores, loading, pagination, refetch } = useStoresContext();

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
            render: (_: unknown, record: Store) => record.business_type?.name ?? '—',
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
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
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Fecha de inactividad',
            dataIndex: 'inactive_at',
            key: 'inactive_at',
            render: (date: string | null) => formatDate(date),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Store) => (
                <div className="storesTableActions">
                    <ActionButton
                        icon={<EyeOutlined />}
                        label="Ver"
                        href={`/admin/tiendas/${record.id}`}
                    />
                    <ActionButton
                        icon={<EditOutlined />}
                        label="Editar"
                        href={`/admin/tiendas/${record.id}/editar`}
                    />
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
        />
    );
};