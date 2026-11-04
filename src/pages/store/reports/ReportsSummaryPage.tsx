import {
    AccountBookOutlined,
    CalculatorOutlined,
    CheckCircleOutlined,
    FileAddOutlined,
    MoneyCollectOutlined,
    QuestionCircleOutlined,
    ShopOutlined,
    TruckOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Alert, Breadcrumb, DatePicker, Popover, Select, Skeleton, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import React from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
    reportMetricHelp,
    type ReportMetricHelpKey,
} from '@/features/store/reports/reportMetricHelp';
import { useReportsSummary } from '@/features/store/reports/hooks/useReportsSummary';
import { useReportsAnalytics } from '@/features/store/reports/hooks/useReportsAnalytics';
import { useAuthStore } from '@/store/useAuthStore.store';
import { hasFeature } from '@/utils/features';
import { formatCompactCurrency } from '@/utils/formatters';
import { ReportsAnalyticsSection } from './ReportsAnalyticsSection';
import { rangeForQuickPeriod, type DateRange, type QuickPeriod } from './reportsPeriod';
import './ReportsSummaryPage.css';

type PeriodSelection = QuickPeriod | 'custom';

const quickPeriodOptions: { label: string; value: QuickPeriod }[] = [
    { label: 'Hoy', value: 'today' },
    { label: 'Ayer', value: 'yesterday' },
    { label: 'Esta semana', value: 'week' },
    { label: 'Este mes', value: 'month' },
    { label: 'Mes anterior', value: 'previous_month' },
];

const periodOptions: { label: string; value: PeriodSelection }[] = [
    ...quickPeriodOptions,
    { label: 'Personalizado', value: 'custom' },
];

const MetricHelp = ({ metric }: { metric: ReportMetricHelpKey }) => (
    <Popover
        content={reportMetricHelp[metric]}
        trigger="click"
        placement="top"
        autoAdjustOverflow
        styles={{
            container: { width: 'min(240px, calc(100vw - 32px))', padding: '10px 12px' },
            content: { fontSize: 13, lineHeight: 1.4, overflowWrap: 'anywhere' },
        }}
    >
        <button
            type="button"
            className="reportsSummaryHelpButton"
            aria-label={`Ayuda sobre ${metric}`}
        >
            <QuestionCircleOutlined aria-hidden="true" />
        </button>
    </Popover>
);

const MetricCard = ({
    label,
    value,
    detail,
    icon: Icon,
    metric,
    loading,
}: {
    label: string;
    value: React.ReactNode;
    detail: React.ReactNode;
    icon: React.ElementType;
    metric: ReportMetricHelpKey;
    loading: boolean;
}) => (
    <Card className="reportsSummaryCard">
        <div className="reportsSummaryMetricHeader">
            <span className="reportsSummaryMetricLabel">
                {label} <MetricHelp metric={metric} />
            </span>
            <Icon aria-hidden="true" style={{ fontSize: 19 }} />
        </div>
        {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '55%' }} />
        ) : (
            <>
                <strong className="reportsSummaryMetricValue tabular-nums">{value}</strong>
                <span className="reportsSummaryMetricDetail">{detail}</span>
            </>
        )}
    </Card>
);

const CompactMoney = ({ value }: { value: number }) => {
    const formatted = formatCompactCurrency(value);
    const amount = <span aria-label={formatted.exact}>{formatted.display}</span>;

    return formatted.compact ? (
        <Tooltip title={formatted.exact} trigger={['hover', 'click']}>
            <span className="reportsSummaryCompactAmount">{amount}</span>
        </Tooltip>
    ) : (
        amount
    );
};

const ChannelBreakdown = ({
    pos,
    orders,
    showOrders,
}: {
    pos: number;
    orders: number;
    showOrders: boolean;
}) => {
    if (!showOrders) return null;
    const total = pos + orders;
    const percentage = (amount: number) => (total === 0 ? 0 : Math.round((amount / total) * 100));

    return (
        <div className="reportsSummaryChannelBreakdown">
            <div>
                <span>Mostrador</span>
                <small>{percentage(pos)}%</small>
                <strong>
                    <CompactMoney value={pos} />
                </strong>
            </div>
            <div>
                <span>Pedidos</span>
                <small>{percentage(orders)}%</small>
                <strong>
                    <CompactMoney value={orders} />
                </strong>
            </div>
        </div>
    );
};

export const ReportsSummaryPage = () => {
    const user = useAuthStore((state) => state.user);
    const initialRange = React.useMemo(() => rangeForQuickPeriod('month'), []);
    const [appliedRange, setAppliedRange] = React.useState<DateRange>(initialRange);
    const [selection, setSelection] = React.useState<PeriodSelection>('month');
    const [lastCustomRange, setLastCustomRange] = React.useState<DateRange>(initialRange);
    const [draftRange, setDraftRange] = React.useState<DateRange>(initialRange);
    const { data, isLoading, isError, refetch, isFetching } = useReportsSummary({
        date_from: appliedRange[0].format('YYYY-MM-DD'),
        date_to: appliedRange[1].format('YYYY-MM-DD'),
    });
    const analytics = useReportsAnalytics({
        date_from: appliedRange[0].format('YYYY-MM-DD'),
        date_to: appliedRange[1].format('YYYY-MM-DD'),
    });
    const updateDraftDate = (index: 0 | 1, value: Dayjs | null) => {
        if (!value) return;
        setDraftRange((current) => {
            const next: DateRange = [...current] as DateRange;
            next[index] = value;
            return next;
        });
    };
    const handlePeriodChange = (value: PeriodSelection) => {
        setSelection(value);
        if (value === 'custom') {
            setDraftRange(lastCustomRange);
            return;
        }
        setAppliedRange(rangeForQuickPeriod(value));
    };
    const applyCustomRange = () => {
        setLastCustomRange(draftRange);
        setAppliedRange(draftRange);
    };
    const canApply = !draftRange[0].isAfter(draftRange[1], 'day');
    const inventory = data?.current.inventory_alerts;
    const attention = data?.current.attention;
    const hasOutOfStock = (inventory?.out_of_stock_count ?? 0) > 0;
    const hasLowStock = (inventory?.low_stock_count ?? 0) > 0;
    const collectedAmount = data?.metrics.collected.amount ?? 0;
    const posSalesCount = data?.metrics.pos_sales.count ?? 0;

    return (
        <main className="reportsSummaryPage">
            <header className="reportsSummaryHeader">
                <div>
                    <Breadcrumb
                        className="reportsSummaryBreadcrumb"
                        items={[{ title: 'Informes' }, { title: 'Resumen' }]}
                    />
                    <h1>Informes</h1>
                    <p>Conocé el estado de tu negocio y su evolución.</p>
                </div>
            </header>
            <section className="reportsSummaryPeriod" aria-label="Período del informe">
                <label className="reportsSummaryPeriodSelect">
                    <span>Período</span>
                    <Select
                        value={selection}
                        options={periodOptions}
                        onChange={(value) => handlePeriodChange(value as PeriodSelection)}
                    />
                </label>
                {selection === 'custom' && (
                    <div className="reportsSummaryDateFields">
                        <label htmlFor="reports-date-from">
                            <span>Desde</span>
                            <DatePicker
                                id="reports-date-from"
                                value={draftRange[0]}
                                onChange={(value) => updateDraftDate(0, value)}
                                format="DD/MM/YYYY"
                                allowClear={false}
                            />
                        </label>
                        <label htmlFor="reports-date-to">
                            <span>Hasta</span>
                            <DatePicker
                                id="reports-date-to"
                                value={draftRange[1]}
                                onChange={(value) => updateDraftDate(1, value)}
                                format="DD/MM/YYYY"
                                allowClear={false}
                            />
                        </label>
                        <Button
                            className="reportsSummaryApplyButton"
                            disabled={!canApply}
                            action={applyCustomRange}
                        >
                            Aplicar
                        </Button>
                    </div>
                )}
            </section>
            {isError ? (
                <Alert
                    className="reportsSummaryError"
                    type="error"
                    showIcon
                    title="No pudimos cargar el resumen del negocio."
                    action={
                        <Button variant="default" action={() => refetch()} loading={isFetching}>
                            Reintentar
                        </Button>
                    }
                />
            ) : (
                <>
                    <section aria-labelledby="activity-heading">
                        <div className="reportsSummarySectionHeading">
                            <h2 id="activity-heading">Actividad del período</h2>
                            <p>Resultados correspondientes al período seleccionado.</p>
                        </div>
                        <div className="reportsSummaryMetricsGrid">
                            <MetricCard
                                label="Ventas de mostrador"
                                value={<CompactMoney value={data?.metrics.pos_sales.amount ?? 0} />}
                                detail={`${data?.metrics.pos_sales.count ?? 0} operaciones`}
                                icon={ShopOutlined}
                                metric="pos_sales"
                                loading={isLoading}
                            />
                            <MetricCard
                                label="Pagos recibidos"
                                value={<CompactMoney value={collectedAmount} />}
                                detail={
                                    collectedAmount === 0 ? (
                                        'Sin pagos en el período'
                                    ) : (
                                        <ChannelBreakdown
                                            pos={data?.metrics.collected.channels?.pos_amount ?? 0}
                                            orders={
                                                data?.metrics.collected.channels?.orders_amount ?? 0
                                            }
                                            showOrders={hasFeature(user, 'pos')}
                                        />
                                    )
                                }
                                icon={MoneyCollectOutlined}
                                metric="collected"
                                loading={isLoading}
                            />
                            <MetricCard
                                label="Promedio en mostrador"
                                value={
                                    posSalesCount === 0 ? (
                                        '—'
                                    ) : (
                                        <CompactMoney
                                            value={data?.metrics.pos_sales.average_ticket ?? 0}
                                        />
                                    )
                                }
                                detail={
                                    posSalesCount === 0
                                        ? 'Sin ventas de mostrador'
                                        : 'Por venta de mostrador'
                                }
                                icon={CalculatorOutlined}
                                metric="average_sale"
                                loading={isLoading}
                            />
                            <MetricCard
                                label="Pedidos tomados"
                                value={data?.metrics.orders_taken.count ?? 0}
                                detail="En el período"
                                icon={FileAddOutlined}
                                metric="orders_taken"
                                loading={isLoading}
                            />
                            <MetricCard
                                label="Entregas realizadas"
                                value={data?.metrics.deliveries_completed.count ?? 0}
                                detail="En el período"
                                icon={TruckOutlined}
                                metric="deliveries_completed"
                                loading={isLoading}
                            />
                        </div>
                    </section>
                    <section aria-labelledby="current-heading" className="reportsSummaryCurrent">
                        <div className="reportsSummarySectionHeading">
                            <h2 id="current-heading">Estado actual</h2>
                        </div>
                        <Alert
                            className="reportsSummaryCurrentInfo"
                            type="info"
                            showIcon
                            title="Estos indicadores muestran la situación actual del negocio y no cambian según el período seleccionado."
                        />
                        <div className="reportsSummaryCurrentGrid">
                            <MetricCard
                                label="Saldo pendiente"
                                value={
                                    <CompactMoney
                                        value={data?.current.pending_balance.amount ?? 0}
                                    />
                                }
                                detail="Pendiente de cobro"
                                icon={AccountBookOutlined}
                                metric="pending_balance"
                                loading={isLoading}
                            />
                            <Card className="reportsSummaryCard reportsSummaryStockCard">
                                <div className="reportsSummaryMetricHeader">
                                    <span className="reportsSummaryMetricLabel">
                                        Alertas de stock <MetricHelp metric="inventory_alerts" />
                                    </span>
                                    <WarningOutlined aria-hidden="true" style={{ fontSize: 19 }} />
                                </div>
                                {isLoading ? (
                                    <Skeleton
                                        active
                                        paragraph={{ rows: 1 }}
                                        title={{ width: '55%' }}
                                    />
                                ) : (
                                    <div className="reportsSummaryStockItems">
                                        <div className={hasLowStock ? 'isWarning' : ''}>
                                            <strong className="tabular-nums">
                                                {inventory?.low_stock_count ?? 0}
                                            </strong>
                                            <span>Bajo stock</span>
                                        </div>
                                        <div className={hasOutOfStock ? 'isError' : ''}>
                                            <strong className="tabular-nums">
                                                {inventory?.out_of_stock_count ?? 0}
                                            </strong>
                                            <span>Sin stock</span>
                                        </div>
                                        {!hasLowStock && !hasOutOfStock && (
                                            <span className="reportsSummaryStockHealthy">
                                                <CheckCircleOutlined aria-hidden="true" /> Sin
                                                alertas de stock
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </section>
                    <section
                        aria-labelledby="attention-heading"
                        className="reportsSummaryAttention"
                    >
                        <div className="reportsSummarySectionHeading">
                            <h2 id="attention-heading">Requiere atención</h2>
                            <p>Situaciones actuales que pueden necesitar seguimiento.</p>
                        </div>
                        <Card className="reportsSummaryAttentionCard">
                            {isLoading ? (
                                <Skeleton active paragraph={{ rows: 1 }} title={{ width: '55%' }} />
                            ) : (
                                <div className="reportsSummaryAttentionItems">
                                    <div>
                                        <strong className="tabular-nums">
                                            {attention?.partially_delivered_orders ?? 0}
                                        </strong>
                                        <span>
                                            Pedidos con entrega parcial{' '}
                                            <MetricHelp metric="partially_delivered_orders" />
                                        </span>
                                    </div>
                                    <div>
                                        <strong className="tabular-nums">
                                            {attention?.delivered_with_balance ?? 0}
                                        </strong>
                                        <span>
                                            Pedidos entregados con saldo{' '}
                                            <MetricHelp metric="delivered_with_balance" />
                                        </span>
                                    </div>
                                    <div>
                                        <strong className="tabular-nums">
                                            {attention?.routes_pending_reconciliation ?? 0}
                                        </strong>
                                        <span>
                                            Rutas pendientes de conciliación{' '}
                                            <MetricHelp metric="routes_pending_reconciliation" />
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </section>
                    <ReportsAnalyticsSection
                        data={analytics.data}
                        loading={analytics.isLoading}
                        error={analytics.isError}
                        retry={() => analytics.refetch()}
                        retrying={analytics.isFetching}
                        ordersAvailable={hasFeature(user, 'pos')}
                    />
                </>
            )}
        </main>
    );
};
