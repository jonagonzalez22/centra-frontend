import { useState, useMemo } from 'react';
import { Tag, Popconfirm, Empty, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button as AntButton } from 'antd';
import Table from '@/components/Table/Table';
import { RejectCollectionModal } from './RejectCollectionModal';
import type { RouteReconciliationCollection, RouteReconciliationStop } from '../interfaces/reconciliation.interface';
import { formatDateShort } from '@/utils/formatters';

const statusColors: Record<string, string> = {
    declared: 'warning',
    verified: 'success',
    rejected: 'error',
};

const statusLabels: Record<string, string> = {
    declared: 'Declarado',
    verified: 'Verificado',
    rejected: 'Rechazado',
};

interface CollectionsTableProps {
    collections: RouteReconciliationCollection[];
    stops: RouteReconciliationStop[];
    loading: boolean;
    actionLoading: string | false;
    onVerify: (collectionId: string) => Promise<void>;
    onReject: (collectionId: string, reason: string) => Promise<void>;
    readOnly: boolean;
}

export const CollectionsTable = ({
    collections,
    stops,
    loading,
    actionLoading,
    onVerify,
    onReject,
    readOnly,
}: CollectionsTableProps) => {
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

    const stopMap = useMemo(() => {
        const map = new Map<string, RouteReconciliationStop>();
        stops.forEach((stop) => {
            stop.collections.forEach((col) => {
                map.set(col.id, stop);
            });
        });
        return map;
    }, [stops]);

    const handleVerify = async (collectionId: string) => {
        await onVerify(collectionId);
    };

    const handleReject = async (reason: string) => {
        if (selectedCollectionId) {
            await onReject(selectedCollectionId, reason);
            setRejectModalOpen(false);
            setSelectedCollectionId(null);
        }
    };

    const openRejectModal = (collectionId: string) => {
        setSelectedCollectionId(collectionId);
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSelectedCollectionId(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(amount);
    };

    const columns = [
        {
            title: 'N° Pedido',
            key: 'operation_number',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const collection = record as unknown as RouteReconciliationCollection;
                const stop = stopMap.get(collection.id);
                return stop?.order?.operation_number || '—';
            },
        },
        {
            title: 'Cliente',
            key: 'customer_name',
            responsive: ['md'] as ('md')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const collection = record as unknown as RouteReconciliationCollection;
                const stop = stopMap.get(collection.id);
                return stop?.order?.customer_name || '—';
            },
        },
        {
            title: 'Monto Declarado',
            key: 'amount',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const collection = record as unknown as RouteReconciliationCollection;
                return formatCurrency(collection.amount);
            },
        },
        {
            title: 'Medio de Pago',
            key: 'payment_method',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const collection = record as unknown as RouteReconciliationCollection;
                return collection.payment_method || '—';
            },
        },
        {
            title: 'Estado',
            key: 'status',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const collection = record as unknown as RouteReconciliationCollection;
                return (
                    <Tag color={statusColors[collection.status] || 'default'}>
                        {statusLabels[collection.status] || collection.status}
                    </Tag>
                );
            },
        },
        {
            title: 'Fecha',
            key: 'declared_at',
            responsive: ['lg'] as ('lg')[],
            render: (_: unknown, record?: Record<string, unknown>) => {
                const collection = record as unknown as RouteReconciliationCollection;
                return formatDateShort(collection.declared_at);
            },
        },
        ...(readOnly
            ? []
            : [
                  {
                      title: 'Acciones',
                      key: 'actions',
                      width: 120,
                      render: (_: unknown, record?: Record<string, unknown>) => {
                          const collection = record as unknown as RouteReconciliationCollection;
                          if (collection.status !== 'declared') {
                              return null;
                          }
                          const isLoading = actionLoading === collection.id;
                          return (
                              <Space size="small">
                                  <Popconfirm
                                      title="¿Confirmar verificación del cobro?"
                                      description="El monto declarado se marcará como verificado."
                                      onConfirm={() => handleVerify(collection.id)}
                                      okText="Verificar"
                                      cancelText="Cancelar"
                                      okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981' } }}
                                  >
                                      <AntButton
                                          type="primary"
                                          size="small"
                                          icon={<CheckOutlined />}
                                          loading={isLoading}
                                          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                          aria-label="Verificar cobro"
                                      />
                                  </Popconfirm>
                                  <AntButton
                                      danger
                                      size="small"
                                      icon={<CloseOutlined />}
                                      loading={isLoading}
                                      onClick={() => openRejectModal(collection.id)}
                                      aria-label="Rechazar cobro"
                                  />
                              </Space>
                          );
                      },
                  },
              ]),
    ];

    if ((!collections || collections.length === 0) && !loading) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay cobranzas declaradas para esta ruta."
            />
        );
    }

    return (
        <>
            <Table
                columns={columns}
                dataSource={collections as unknown as Record<string, unknown>[]}
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
            />

            <RejectCollectionModal
                open={rejectModalOpen}
                loading={actionLoading === selectedCollectionId}
                onClose={closeRejectModal}
                onConfirm={handleReject}
            />
        </>
    );
};
