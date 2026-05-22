import { EditOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { Popconfirm, Button as AntButton, Tooltip, Space } from 'antd';
import Table from '@/components/Table/Table';
import Tag from '@/components/Tag/Tag';
import { ActionButton } from '@/components/ActionButton';
import { usePlansContext } from '../../hooks/usePlansContext';
import type { Plan, PlanFeature } from '../../types/plan.types';

interface PlansTableProps {
    onEdit: (plan: Plan) => void;
    onManageFeatures: (plan: Plan) => void;
    onDelete: (plan: Plan) => void;
}

const formatPrice = (price: number): string =>
    `$ ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MAX_VISIBLE_FEATURES = 3;

const renderFeatures = (features: PlanFeature[]) => {
    if (!features || features.length === 0) return '—';

    const visible = features.slice(0, MAX_VISIBLE_FEATURES);
    const overflow = features.slice(MAX_VISIBLE_FEATURES);

    const tagElements = visible.map((f) => (
        <Tag key={f.id}>
            {f.limit_value !== null && f.limit_value !== undefined
                ? `${f.name}: ${f.limit_value}`
                : f.name}
        </Tag>
    ));

    if (overflow.length > 0) {
        const overflowContent = (
            <Space direction="vertical" size={4}>
                {overflow.map((f) => (
                    <span key={f.id}>
                        {f.name}
                        {f.limit_value !== null && f.limit_value !== undefined
                            ? `: ${f.limit_value}`
                            : ''}
                    </span>
                ))}
            </Space>
        );

        tagElements.push(
            <Tooltip
                key="overflow"
                title={<div style={{ maxWidth: 280 }}>{overflowContent}</div>}
            >
                <span>
                    <Tag color="default">+{overflow.length} más</Tag>
                </span>
            </Tooltip>
        );
    }

    return <Space wrap size={4}>{tagElements}</Space>;
};

export const PlansTable = ({ onEdit, onManageFeatures, onDelete }: PlansTableProps) => {
    const { plans, loading, pagination } = usePlansContext();

    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Precio',
            dataIndex: 'price',
            key: 'price',
            render: (_: unknown, record: Plan) => formatPrice(record.price),
        },
        {
            title: 'Ciclo',
            dataIndex: 'billing_cycle',
            key: 'billing_cycle',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record: Plan) => (
                <Tag color={record.billing_cycle === 'monthly' ? 'blue' : 'purple'}>
                    {record.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                </Tag>
            ),
        },
        {
            title: 'Trial',
            dataIndex: 'is_trial',
            key: 'is_trial',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record: Plan) =>
                record.is_trial ? <Tag color="orange">Trial</Tag> : '—',
        },
        {
            title: 'Estado',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (_: unknown, record: Plan) =>
                record.is_active ? (
                    <Tag color="green">Activo</Tag>
                ) : (
                    <Tag color="red">Inactivo</Tag>
                ),
        },
        {
            title: 'Funcionalidades',
            dataIndex: 'features',
            key: 'features',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record: Plan) => renderFeatures(record.features),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record: Plan) => (
                <div className="flex items-center gap-1">
                    <ActionButton
                        icon={<EditOutlined />}
                        label="Editar"
                        action={() => onEdit(record)}
                    />
                    <ActionButton
                        icon={<SettingOutlined />}
                        label="Gestionar funcionalidades"
                        action={() => onManageFeatures(record)}
                    />
                    <Popconfirm
                        title="¿Eliminar plan?"
                        description={`¿Estás seguro de eliminar "${record.name}"?`}
                        onConfirm={() => onDelete(record)}
                        okText="Eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <AntButton
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label="Eliminar"
                        />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <Table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
            dataSource={plans as unknown as Record<string, unknown>[]}
            loading={loading}
            pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            }}
            emptyText="No hay planes para mostrar"
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};
