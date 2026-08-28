import { useState } from 'react';
import { Breadcrumb, Tag, Typography, Modal, Tooltip, Button as AntButton } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import Tabs from '@/components/Tabs/Tabs';
import { CollectionsTable } from '@/features/store/logistics/components/CollectionsTable';
import { DiscrepanciesTable } from '@/features/store/logistics/components/DiscrepanciesTable';
import type { RouteReconciliationSummary, RouteReconciliationCollection, RouteReconciliationStopItem, RouteReconciliationStop, DiscrepancyResolutionType } from '@/features/store/logistics/interfaces/reconciliation.interface';
import './RouteReconciliationPage.css';

const { Text } = Typography;

const safeNumber = (val: unknown): number => {
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
};

const statusColors: Record<string, string> = {
    awaiting_reconciliation: 'purple',
    completed: 'green',
};

const statusLabels: Record<string, string> = {
    awaiting_reconciliation: 'Pend. Conciliación',
    completed: 'Completada',
};

interface RouteReconciliationPageViewProps {
    summary: RouteReconciliationSummary | null;
    collections: RouteReconciliationCollection[];
    stops: RouteReconciliationStop[];
    discrepancies: RouteReconciliationStopItem[];
    pendingCollectionsCount: number;
    pendingDiscrepanciesCount: number;
    loading: boolean;
    actionLoading: string | false;
    routeId?: string;
    onVerify: (collectionId: string) => Promise<void>;
    onReject: (collectionId: string, reason: string) => Promise<void>;
    onResolveDiscrepancy: (discrepancyId: string, resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => Promise<void>;
    onFinalize: () => Promise<void>;
    onBack: () => void;
}

export const RouteReconciliationPageView = ({
    summary,
    collections,
    stops,
    discrepancies,
    pendingCollectionsCount,
    pendingDiscrepanciesCount,
    loading,
    actionLoading,
    routeId,
    onVerify,
    onReject,
    onResolveDiscrepancy,
    onFinalize,
    onBack,
}: RouteReconciliationPageViewProps) => {
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);

    const isReadOnly = summary?.status === 'completed';
    const canFinalize = summary?.status === 'awaiting_reconciliation'
        && pendingCollectionsCount === 0
        && pendingDiscrepanciesCount === 0;
    const routeNumber = routeId ? `#${routeId.substring(0, 8).toUpperCase()}` : '';

    const formatCurrency = (amount: unknown) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(safeNumber(amount));
    };

    const handleFinalize = async () => {
        setFinalizeModalOpen(false);
        await onFinalize();
    };



    return (
        <div className="routeReconciliationPage">
            <div className="routeReconciliationHeader">
                <Breadcrumb
                    className="routeReconciliationBreadcrumb"
                    items={[
                        { title: <Link to="/tienda">Tienda</Link> },
                        { title: <Link to="/tienda/logistica/rutas">Logística</Link> },
                        { title: <Link to="/tienda/logistica/rutas">Rutas</Link> },
                        { title: routeNumber },
                        { title: 'Rendición y Conciliación' },
                    ]}
                />

                <div className="routeReconciliationHeaderTop">
                    <div className="routeReconciliationTitleRow">
                        <h1 className="routeReconciliationTitle">{routeNumber}</h1>
                        {summary?.status && (
                            <Tag color={statusColors[summary.status] || 'default'}>
                                {statusLabels[summary.status] || summary.status}
                            </Tag>
                        )}
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                        {!isReadOnly && (
                            canFinalize ? (
                                <AntButton
                                    type="primary"
                                    size="large"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => setFinalizeModalOpen(true)}
                                    loading={actionLoading === 'finalize'}
                                >
                                    Finalizar Rendición
                                </AntButton>
                            ) : (
                                <Tooltip title="Debe auditar todas las cobranzas y resolver todas las discrepancias antes de finalizar la rendición.">
                                    <div>
                                        <AntButton
                                            type="primary"
                                            size="large"
                                            icon={<CheckCircleOutlined />}
                                            disabled
                                        >
                                            Finalizar Rendición
                                        </AntButton>
                                    </div>
                                </Tooltip>
                            )
                        )}
                        <Button
                            variant="default"
                            label="Volver al Detalle"
                            icon={<ArrowLeftOutlined />}
                            action={onBack}
                        />
                    </div>
                </div>
            </div>

            {summary && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 routeReconciliationMetrics">
                        <div className="metricCard">
                            <Text type="secondary" className="text-xs md:text-sm">Total Declarado</Text>
                            <div className="metricValue">
                                {formatCurrency(summary.totals.declared_amount)}
                            </div>
                        </div>
                        <div className="metricCard metricCardVerified">
                            <Text type="secondary" className="text-xs md:text-sm">Total Verificado</Text>
                            <div className="metricValue metricValueSuccess">
                                {formatCurrency(summary.totals.verified_amount)}
                            </div>
                        </div>
                        <div className="metricCard metricCardRejected">
                            <Text type="secondary" className="text-xs md:text-sm">Total Rechazado</Text>
                            <div className="metricValue metricValueError">
                                {formatCurrency(summary.totals.rejected_amount)}
                            </div>
                        </div>
                        <div className="metricCard metricCardPending">
                            <Text type="secondary" className="text-xs md:text-sm">Pendientes</Text>
                            <div className="metricValue">
                                {pendingCollectionsCount}
                            </div>
                        </div>
                    </div>

                    <Tabs
                        defaultActiveKey="collections"
                        items={[
                            {
                                key: 'collections',
                                label: pendingCollectionsCount > 0
                                    ? `Cobranzas Declaradas (${pendingCollectionsCount})`
                                    : 'Cobranzas Declaradas',
                                children: (
                                    <div className="routeReconciliationSection">
                                        <CollectionsTable
                                            collections={collections}
                                            stops={stops}
                                            loading={loading}
                                            actionLoading={actionLoading}
                                            onVerify={onVerify}
                                            onReject={onReject}
                                            readOnly={isReadOnly}
                                        />
                                    </div>
                                ),
                            },
                            {
                                key: 'discrepancies',
                                label: pendingDiscrepanciesCount > 0
                                    ? `Discrepancias de Stock (${pendingDiscrepanciesCount})`
                                    : 'Discrepancias de Stock',
                                children: (
                                    <div className="routeReconciliationSection">
                                        <DiscrepanciesTable
                                            discrepancies={discrepancies}
                                            loading={loading}
                                            actionLoading={actionLoading}
                                            onResolve={onResolveDiscrepancy}
                                            readOnly={isReadOnly}
                                        />
                                    </div>
                                ),
                            },
                        ]}
                    />
                </>
            )}

            <Modal
                title="¿Deseas finalizar la rendición de la ruta?"
                open={finalizeModalOpen}
                onCancel={() => setFinalizeModalOpen(false)}
                onOk={handleFinalize}
                okText="Confirmar y Cerrar Ruta"
                cancelText="Cancelar"
                okButtonProps={{ type: 'primary', loading: actionLoading === 'finalize' }}
            >
                <p>
                    Esta acción cerrará la ruta de forma permanente, aplicará los movimientos
                    de inventario correspondientes a las resoluciones de stock y actualizará
                    el estado de los pedidos asociados.
                </p>
            </Modal>
        </div>
    );
};
