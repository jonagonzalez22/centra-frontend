import { Button as AntButton, Empty, Pagination, Popconfirm, Skeleton } from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import ActionButton from '@/components/ActionButton/ActionButton';
import { Button } from '@/components/Button';
import { CanDo } from '@/components/auth/CanDo';
import Table from '@/components/Table/Table';
import Tag from '@/components/Tag/Tag';
import type { Vehicle } from '../interfaces/vehicle.interface';
import './VehiclesTable.css';

interface VehiclesTableProps {
    items: Vehicle[];
    loading: boolean;
    current: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number, pageSize: number) => void;
    onEdit: (vehicle: Vehicle) => void;
    onDeactivate: (vehicle: Vehicle) => void;
    onActivate: (vehicle: Vehicle) => void;
    onDelete: (vehicle: Vehicle) => void;
    actionLoadingId?: string;
}

const typeLabels: Record<string, string> = {
    auto: 'Auto',
    moto: 'Moto',
    bicicleta: 'Bicicleta',
    camioneta: 'Camioneta',
    camion: 'Camión',
};
type ResponsiveList = ('md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'sm' | 'xs')[];

export const VehiclesTable = ({
    items,
    loading,
    current,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDeactivate,
    onActivate,
    onDelete,
    actionLoadingId,
}: VehiclesTableProps) => {
    const actions = (vehicle: Vehicle, variant: 'table' | 'card') => {
        const processing = actionLoadingId === vehicle.id;
        const edit = () => onEdit(vehicle);
        const deactivate = () => onDeactivate(vehicle);
        const activate = () => onActivate(vehicle);
        const remove = () => onDelete(vehicle);

        if (variant === 'card') {
            return (
                <div className="vehiclesCardActions">
                    <CanDo permission="vehicles.edit">
                        <Button
                            className="vehiclesCardAction"
                            variant="default"
                            label="Editar"
                            aria-label="Editar"
                            icon={<EditOutlined />}
                            action={edit}
                            disabled={processing}
                        />
                    </CanDo>
                    <CanDo permission="vehicles.edit">
                        {vehicle.is_active ? (
                            <Button
                                className="vehiclesCardAction"
                                variant="default"
                                label="Desactivar"
                                aria-label="Desactivar"
                                icon={<PauseCircleOutlined />}
                                action={deactivate}
                                disabled={processing}
                            />
                        ) : (
                            <Popconfirm
                                title="¿Reactivar vehículo?"
                                description="Podrá asignarse a nuevas rutas."
                                onConfirm={activate}
                                okText="Reactivar"
                                cancelText="Cancelar"
                            >
                                <AntButton
                                    className="vehiclesCardAction"
                                    aria-label="Reactivar"
                                    icon={<PlayCircleOutlined />}
                                    loading={processing}
                                >
                                    Reactivar
                                </AntButton>
                            </Popconfirm>
                        )}
                    </CanDo>
                    <CanDo permission="vehicles.delete">
                        <Popconfirm
                            title="¿Eliminar vehículo?"
                            description="Solo se eliminarán vehículos sin rutas asociadas."
                            onConfirm={remove}
                            okText="Eliminar"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true }}
                        >
                            <AntButton
                                className="vehiclesCardAction"
                                aria-label="Eliminar"
                                danger
                                icon={<DeleteOutlined />}
                                loading={processing}
                            >
                                Eliminar
                            </AntButton>
                        </Popconfirm>
                    </CanDo>
                </div>
            );
        }

        return (
            <div className="flex gap-1">
                <CanDo permission="vehicles.edit">
                    <ActionButton
                        icon={<EditOutlined />}
                        label="Editar vehículo"
                        action={edit}
                        disabled={processing}
                    />
                </CanDo>
                <CanDo permission="vehicles.edit">
                    {vehicle.is_active ? (
                        <ActionButton
                            icon={<PauseCircleOutlined />}
                            label="Desactivar vehículo"
                            action={deactivate}
                            disabled={processing}
                        />
                    ) : (
                        <Popconfirm
                            title="¿Reactivar vehículo?"
                            description="Podrá asignarse a nuevas rutas."
                            onConfirm={activate}
                            okText="Reactivar"
                            cancelText="Cancelar"
                        >
                            <AntButton
                                type="text"
                                icon={<PlayCircleOutlined />}
                                aria-label="Reactivar vehículo"
                                loading={processing}
                            />
                        </Popconfirm>
                    )}
                </CanDo>
                <CanDo permission="vehicles.delete">
                    <Popconfirm
                        title="¿Eliminar vehículo?"
                        description="Solo se eliminarán vehículos sin rutas asociadas."
                        onConfirm={remove}
                        okText="Eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }}
                    >
                        <AntButton
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label="Eliminar vehículo"
                            loading={processing}
                        />
                    </Popconfirm>
                </CanDo>
            </div>
        );
    };
    const columns = [
        {
            title: 'Vehículo',
            key: 'name',
            render: (_: unknown, record?: Record<string, unknown>) => (
                <strong>{(record as unknown as Vehicle).name}</strong>
            ),
        },
        { title: 'Patente', dataIndex: 'plate', key: 'plate' },
        {
            title: 'Tipo',
            key: 'type',
            responsive: ['md'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) =>
                typeLabels[(record as unknown as Vehicle).type],
        },
        {
            title: 'Capacidad',
            key: 'capacity',
            responsive: ['lg'] as ResponsiveList,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const capacity = (record as unknown as Vehicle).capacity_kg;
                return capacity ? `${capacity} kg` : '—';
            },
        },
        {
            title: 'Estado',
            key: 'status',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const vehicle = record as unknown as Vehicle;
                return (
                    <Tag color={vehicle.is_active ? 'green' : 'default'}>
                        {vehicle.is_active ? 'Activo' : 'Inactivo'}
                    </Tag>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            width: 150,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const vehicle = record as unknown as Vehicle;
                return actions(vehicle, 'table');
            },
        },
    ];
    return (
        <>
            <div className="vehiclesTableDesktop">
                <Table
                    columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
                    dataSource={items as unknown as Record<string, unknown>[]}
                    loading={loading}
                    pagination={{
                        current,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '15', '25', '50'],
                        showTotal: (count, range) => `${range[0]} - ${range[1]} de ${count}`,
                    }}
                    onChange={(pagination) =>
                        onPageChange(pagination.current ?? 1, pagination.pageSize ?? pageSize)
                    }
                    emptyText={<Empty description="No hay vehículos para mostrar" />}
                    scroll={{ x: 'max-content' }}
                    size="small"
                />
            </div>
            <div className="vehiclesMobileList" data-testid="vehicles-mobile-list">
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div className="vehiclesCard" key={index}>
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <div className="vehiclesMobileEmpty">
                        <Empty description="No hay vehículos para mostrar" />
                    </div>
                ) : (
                    items.map((vehicle) => (
                        <article className="vehiclesCard" key={vehicle.id}>
                            <header className="vehiclesCardHeader">
                                <div className="min-w-0">
                                    <h2 className="vehiclesCardName">{vehicle.name}</h2>
                                    <p className="vehiclesCardPlate">{vehicle.plate}</p>
                                </div>
                                <Tag color={vehicle.is_active ? 'green' : 'default'}>
                                    {vehicle.is_active ? 'Activo' : 'Inactivo'}
                                </Tag>
                            </header>
                            <dl className="vehiclesCardDetails">
                                <div>
                                    <dt>Tipo</dt>
                                    <dd>{typeLabels[vehicle.type]}</dd>
                                </div>
                                <div>
                                    <dt>Capacidad</dt>
                                    <dd>
                                        {vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : '—'}
                                    </dd>
                                </div>
                            </dl>
                            {actions(vehicle, 'card')}
                        </article>
                    ))
                )}
                {!loading && total > pageSize && (
                    <div className="vehiclesMobilePagination">
                        <Pagination
                            current={current}
                            total={total}
                            pageSize={pageSize}
                            showSizeChanger={false}
                            onChange={(page) => onPageChange(page, pageSize)}
                        />
                    </div>
                )}
            </div>
        </>
    );
};
