import Table from '@/components/Table/Table';
import type { Store } from '@/features/store/types/store.types';
import './StoresTable.css';

interface StoresTableProps {
    stores: Store[];
    loading: boolean;
}

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
        render: (email?: unknown) => (email ? String(email) : 'Sin email'),
    },
    {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        render: (status?: unknown) => {
            const isActive = status === 'active';

            return (
                <span
                    className={isActive ? 'storesTableStatusActive' : 'storesTableStatusInactive'}
                >
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
            );
        },
    },
    {
        title: 'Acciones',
        key: 'actions',
        render: () => <span className="storesTablePendingAction">Pendiente</span>,
    },
];

export const StoresTable = ({ stores, loading }: StoresTableProps) => {
    return (
        <Table
            columns={columns}
            dataSource={stores as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{ pageSize: 10 }}
            emptyText="No hay tiendas para mostrar"
        />
    );
};
