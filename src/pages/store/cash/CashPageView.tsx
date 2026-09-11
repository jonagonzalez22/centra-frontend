import { Alert, Descriptions, Empty, List, Spin, Tag, Typography } from 'antd';
import { Button } from '@/components/Button';
import Card from '@/components/Card/Card';
import Table from '@/components/Table/Table';
import type { CashOverview, CashPendingPage, CashSessionBlind } from '@/entities/CashSession';
import { formatCurrency, formatDate, formatDateShort } from '@/utils/formatters';

interface CashPageViewProps {
    loading: boolean;
    error: string | null;
    overview: CashOverview | null;
    canOpen: boolean;
    canSubmit: boolean;
    canClose: boolean;
    pending: CashPendingPage | null;
    pendingLoading: boolean;
    currentUserId?: number;
    onOpenCash: () => void;
    onSubmitCash: (session: CashSessionBlind) => void;
    onReconcile: (sessionId: string) => void;
    onPendingPageChange: (page: number) => void;
    onRetry: () => void;
}

const BlindSessionDetails = ({ session }: { session: CashSessionBlind }) => (
    <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
        <Descriptions.Item label="Estado">
            <Tag color={session.status === 'open' ? 'green' : 'gold'}>
                {session.status === 'open' ? 'Abierta' : 'Pendiente de control'}
            </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Jornada">
            {formatDateShort(session.business_date)}
        </Descriptions.Item>
        <Descriptions.Item label="Monto inicial">
            {formatCurrency(session.opening_amount)}
        </Descriptions.Item>
        <Descriptions.Item label="Apertura">{formatDate(session.opened_at)}</Descriptions.Item>
        {session.notes && (
            <Descriptions.Item label="Nota" span={2}>
                {session.notes}
            </Descriptions.Item>
        )}
    </Descriptions>
);

export const CashPageView = ({
    loading,
    error,
    overview,
    canOpen,
    canSubmit,
    canClose,
    pending,
    pendingLoading,
    currentUserId,
    onOpenCash,
    onSubmitCash,
    onReconcile,
    onPendingPageChange,
    onRetry,
}: CashPageViewProps) => {
    if (loading)
        return (
            <div className="flex justify-center py-20">
                <Spin size="large" />
            </div>
        );
    if (error)
        return (
            <Alert
                type="error"
                showIcon
                message="No se pudo cargar Gestión de caja"
                description={error}
                action={<Button variant="default" label="Reintentar" action={onRetry} />}
            />
        );
    if (!overview) return null;

    return (
        <div className="space-y-5">
            <Typography.Title level={3}>Gestión de caja</Typography.Title>

            {overview.stale_open.length > 0 && (
                <Card title="Cajas anteriores por regularizar">
                    <Alert
                        className="mb-4"
                        type="warning"
                        showIcon
                        message="Tenés una o más cajas de jornadas anteriores pendientes de regularización."
                        description="Podés regularizarlas sin impedir la apertura de una caja para la jornada actual."
                    />
                    <List
                        dataSource={overview.stale_open}
                        renderItem={(session) => (
                            <List.Item
                                actions={
                                    canSubmit
                                        ? [
                                              <Button
                                                  key="submit"
                                                  variant="default"
                                                  label="Regularizar caja"
                                                  action={() => onSubmitCash(session)}
                                              />,
                                          ]
                                        : undefined
                                }
                            >
                                <List.Item.Meta
                                    title={`Jornada ${formatDateShort(session.business_date)}`}
                                    description={`Abierta: ${formatDate(session.opened_at)}`}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            <Card
                title="Mi caja actual"
                extra={
                    overview.current && canSubmit ? (
                        <Button
                            label="Finalizar turno"
                            action={() => onSubmitCash(overview.current!)}
                        />
                    ) : undefined
                }
            >
                {overview.current ? (
                    <BlindSessionDetails session={overview.current} />
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No hay una caja abierta para la jornada actual."
                    >
                        {canOpen && <Button label="Abrir caja" action={onOpenCash} />}
                    </Empty>
                )}
            </Card>

            <Card title="Mis cajas pendientes de arqueo">
                <List
                    locale={{ emptyText: 'No tenés cajas pendientes de control.' }}
                    dataSource={overview.pending_reconciliation}
                    renderItem={(session) => (
                        <List.Item extra={<Tag color="gold">Pendiente de control</Tag>}>
                            <List.Item.Meta
                                title={`Jornada ${formatDateShort(session.business_date)}`}
                                description={
                                    <>
                                        <div>
                                            Declarado:{' '}
                                            {session.declared_amount === null
                                                ? '—'
                                                : formatCurrency(session.declared_amount)}
                                        </div>
                                        <div>Enviado: {formatDate(session.submitted_at)}</div>
                                        {session.declaration_notes && (
                                            <div>Observaciones: {session.declaration_notes}</div>
                                        )}
                                    </>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>

            {canClose && (
                <Card title="Pendientes de arqueo de la tienda">
                    <Table
                        size="small"
                        loading={pendingLoading}
                        dataSource={(pending?.items ?? []) as unknown as Record<string, unknown>[]}
                        emptyText="No hay cajas pendientes de arqueo."
                        columns={[
                            {
                                title: 'Cajero',
                                key: 'cashier',
                                render: (_, row) =>
                                    (row?.cashier as { name: string } | undefined)?.name ?? '—',
                            },
                            {
                                title: 'Jornada',
                                dataIndex: 'business_date',
                                key: 'business_date',
                                render: (value) => formatDateShort(value as string | null),
                            },
                            {
                                title: 'Declarado',
                                dataIndex: 'declared_amount',
                                key: 'declared_amount',
                                render: (value) => formatCurrency(Number(value)),
                            },
                            {
                                title: 'Enviado',
                                dataIndex: 'submitted_at',
                                key: 'submitted_at',
                                responsive: ['md'],
                                render: (value) => formatDate(value as string | null),
                            },
                            {
                                title: 'Acción',
                                key: 'action',
                                render: (_, row) =>
                                    String((row?.cashier as { id: string } | undefined)?.id) ===
                                    String(currentUserId) ? (
                                        <Tag>Tu caja</Tag>
                                    ) : (
                                        <Button
                                            variant="default"
                                            label="Realizar arqueo"
                                            size="small"
                                            action={() => row?.id && onReconcile(String(row.id))}
                                        />
                                    ),
                            },
                        ]}
                        pagination={
                            pending
                                ? {
                                      current: pending.current_page,
                                      pageSize: pending.per_page,
                                      total: pending.total,
                                      onChange: onPendingPageChange,
                                      showSizeChanger: false,
                                  }
                                : false
                        }
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            )}
        </div>
    );
};
