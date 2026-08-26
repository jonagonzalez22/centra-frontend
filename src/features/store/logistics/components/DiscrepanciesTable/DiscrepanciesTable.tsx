import { useState } from 'react';
import { Tag, Popconfirm, Empty, Tooltip } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { Button as AntButton } from 'antd';
import Table from '@/components/Table/Table';
import { ResolveDiscrepancyModal } from './ResolveDiscrepancyModal';
import type { RouteReconciliationStopItem, DiscrepancyResolutionType } from '../../interfaces/reconciliation.interface';

const resolutionLabels: Record<string, { label: string; color: string }> = {
    returned: { label: 'Devuelto a depósito', color: 'success' },
    rejected_by_customer: { label: 'Rechazado por cliente', color: 'processing' },
    missing: { label: 'Faltante / extraviado', color: 'warning' },
    damaged: { label: 'Dañado / merma', color: 'error' },
    pending_redelivery: { label: 'Pendiente de reenvío', color: 'purple' },
    other: { label: 'Otro', color: 'default' },
};

interface DiscrepanciesTableProps {
    discrepancies: RouteReconciliationStopItem[];
    loading: boolean;
    actionLoading: string | false;
    onResolve: (discrepancyId: string, resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => Promise<void>;
    readOnly: boolean;
}

export const DiscrepanciesTable = ({
    discrepancies,
    loading,
    actionLoading,
    onResolve,
    readOnly,
}: DiscrepanciesTableProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RouteReconciliationStopItem | null>(null);

    const handleResolve = async (resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => {
        if (selectedItem) {
            await onResolve(selectedItem.route_stop_item_id, resolutionType, quantityToResolve, notes);
            setModalOpen(false);
            setSelectedItem(null);
        }
    };

    const openResolveModal = (item: RouteReconciliationStopItem) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedItem(null);
    };

    const getDifferenceTag = (difference: number) => {
        if (difference > 0) {
            return <Tag color="error">+{difference}</Tag>;
        } else if (difference < 0) {
            return <Tag color="warning">{difference}</Tag>;
        }
        return <Tag color="default">0</Tag>;
    };

    const getResolutionTag = (item: RouteReconciliationStopItem) => {
        if (!item.discrepancy?.resolution_type) {
            return <Tag color="warning">Sin resolver</Tag>;
        }
        const resolution = resolutionLabels[item.discrepancy.resolution_type] || { label: item.discrepancy.resolution_type, color: 'default' };
        return <Tag color={resolution.color}>{resolution.label}</Tag>;
    };

    const columns = [
        {
            title: 'Producto',
            key: 'product',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const item = record as unknown as RouteReconciliationStopItem;
                return <div className="font-medium">{item.product_name}</div>;
            },
        },
        {
            title: 'Cargado',
            key: 'quantity_loaded',
            width: 90,
            align: 'center' as const,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const item = record as unknown as RouteReconciliationStopItem;
                return item.quantity_loaded;
            },
        },
        {
            title: 'Entregado',
            key: 'quantity_delivered',
            width: 90,
            align: 'center' as const,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const item = record as unknown as RouteReconciliationStopItem;
                return item.quantity_delivered;
            },
        },
        {
            title: 'Diferencia',
            key: 'difference',
            width: 100,
            align: 'center' as const,
            render: (_: unknown, record?: Record<string, unknown>) => {
                const item = record as unknown as RouteReconciliationStopItem;
                return getDifferenceTag(item.difference);
            },
        },
        {
            title: 'Resolución',
            key: 'resolution',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const item = record as unknown as RouteReconciliationStopItem;
                return getResolutionTag(item);
            },
        },
        {
            title: 'Notas',
            key: 'resolution_notes',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const item = record as unknown as RouteReconciliationStopItem;
                if (!item.discrepancy?.notes) {
                    return <span className="text-gray-400">—</span>;
                }
                return (
                    <Tooltip title={item.discrepancy.notes}>
                        <span className="truncate max-w-[150px] inline-block">
                            {item.discrepancy.notes}
                        </span>
                    </Tooltip>
                );
            },
        },
        ...(readOnly
            ? []
            : [
                  {
                      title: 'Acciones',
                      key: 'actions',
                      width: 100,
                      render: (_: unknown, record?: Record<string, unknown>) => {
                          const item = record as unknown as RouteReconciliationStopItem;
                          const isLoading = actionLoading === item.route_stop_item_id;

                          if (item.discrepancy?.resolution_type) {
                              return null;
                          }

                          return (
                              <Popconfirm
                                  title="¿Resolver esta discrepancia?"
                                  description="Se abrirá un formulario para indicar la resolución."
                                  onConfirm={() => openResolveModal(item)}
                                  okText="Resolver"
                                  cancelText="Cancelar"
                              >
                                  <AntButton
                                      type="primary"
                                      size="small"
                                      icon={<CheckOutlined />}
                                      loading={isLoading}
                                  >
                                      Resolver
                                  </AntButton>
                              </Popconfirm>
                          );
                      },
                  },
              ]),
    ];

    if ((!discrepancies || discrepancies.length === 0) && !loading) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No se registraron diferencias de stock en esta ruta."
            />
        );
    }

    return (
        <>
            <Table
                columns={columns}
                dataSource={discrepancies as unknown as Record<string, unknown>[]}
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
            />

            {selectedItem && (
                <ResolveDiscrepancyModal
                    open={modalOpen}
                    item={selectedItem}
                    loading={actionLoading === selectedItem.route_stop_item_id}
                    onClose={closeModal}
                    onConfirm={handleResolve}
                />
            )}
        </>
    );
};
