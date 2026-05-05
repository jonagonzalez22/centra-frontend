import { Breadcrumb, Button, Form, Input, Select } from 'antd';
import { Link } from 'react-router-dom';

import Table from '@/components/Table/Table';
import { useStores } from '@/features/store/hooks/useStores';
import type { Store } from '@/features/store/types/store.types';

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
                    className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                        isActive
                            ? 'bg-centra-success/10 text-centra-success'
                            : 'bg-centra-error/10 text-centra-error'
                    }`}
                >
                    {isActive ? 'Activo' : 'Inactivo'}
                </span>
            );
        },
    },
    {
        title: 'Acciones',
        key: 'actions',
        render: () => <span className="text-centra-text/40">Pendiente</span>,
    },
];

interface StoresPageViewProps {
    stores: Store[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const StoresPageView = ({ stores, loading, error, refetch }: StoresPageViewProps) => {
    const [form] = Form.useForm();

    const handleFilter = () => {
        refetch();
    };

    const handleReset = () => {
        form.resetFields();
        refetch();
    };

    return (
        <div className="w-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Gestión de Tiendas</h1>

                <Breadcrumb
                    items={[
                        {
                            title: <Link to="/admin/dashboard">Admin</Link>,
                        },
                        {
                            title: 'Tiendas',
                        },
                    ]}
                />
            </div>

            <Form
                form={form}
                layout="vertical"
                className="mb-6 flex flex-wrap items-end gap-3"
                onFinish={handleFilter}
            >
                <Form.Item name="name" label="Nombre" className="mb-0 min-w-[220px] flex-1">
                    <Input placeholder="Buscar por nombre" allowClear />
                </Form.Item>

                <Form.Item name="status" label="Estado" className="mb-0 min-w-[180px]">
                    <Select
                        placeholder="Estado"
                        allowClear
                        options={[
                            { label: 'Activo', value: 'active' },
                            { label: 'Inactivo', value: 'inactive' },
                        ]}
                    />
                </Form.Item>

                <Form.Item className="mb-0">
                    <Button type="primary" htmlType="submit">
                        Filtrar
                    </Button>
                </Form.Item>

                <Form.Item className="mb-0">
                    <Button onClick={handleReset}>Limpiar</Button>
                </Form.Item>
            </Form>

            {error && <div className="mb-4 text-centra-error">{error}</div>}

            <Table
                columns={columns}
                dataSource={stores as unknown as Record<string, unknown>[]}
                loading={loading}
                pagination={{ pageSize: 10 }}
                emptyText="No hay tiendas para mostrar"
            />
        </div>
    );
};

export const StoresPage = () => {
    const { stores, loading, error, refetch } = useStores();

    return <StoresPageView stores={stores} loading={loading} error={error} refetch={refetch} />;
};
