import { QuestionCircleOutlined } from '@ant-design/icons';
import { Alert, Empty, Popover, Skeleton } from 'antd';
import dayjs from 'dayjs';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { ReportsAnalytics } from '@/features/store/reports/interfaces/reports.interface';
import { formatCurrency } from '@/utils/formatters';

const colors = ['#093764', '#2f7cbb', '#52c41a', '#faad14', '#722ed1', '#eb2f96'];
const formatDate = (date: string) => dayjs(date).format('DD/MM');

const Heading = ({ title, help }: { title: string; help: string }) => (
    <div className="reportsSummarySectionHeading">
        <h3 className="reportsAnalyticsTitle">
            {title}
            <Popover content={help} trigger="click" placement="top">
                <button
                    type="button"
                    className="reportsSummaryHelpButton"
                    aria-label={`Ayuda sobre ${title}`}
                >
                    <QuestionCircleOutlined aria-hidden="true" />
                </button>
            </Popover>
        </h3>
    </div>
);

const AnalyticsEmpty = ({ description }: { description: string }) => (
    <div className="reportsAnalyticsEmpty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </div>
);

export const ReportsAnalyticsSection = ({
    data,
    loading,
    error,
    retry,
    retrying,
    ordersAvailable,
}: {
    data?: ReportsAnalytics;
    loading: boolean;
    error: boolean;
    retry: () => void;
    retrying: boolean;
    ordersAvailable: boolean;
}) => {
    if (error) {
        return (
            <section className="reportsAnalytics" aria-labelledby="analytics-heading">
                <h2 id="analytics-heading">Análisis del período</h2>
                <Alert
                    type="error"
                    showIcon
                    title="No pudimos cargar el análisis del período."
                    action={
                        <Button variant="default" action={retry} loading={retrying}>
                            Reintentar
                        </Button>
                    }
                />
            </section>
        );
    }

    const paymentTotal =
        data?.payment_methods.reduce((total, method) => total + method.amount, 0) ?? 0;
    const hasPayments = (data?.payment_methods.length ?? 0) > 0;
    const hasPaymentsActivity =
        data?.payments_series.some((point) => point.collected_amount !== 0) ?? false;
    const hasOrdersActivity =
        data?.orders_series.some(
            (point) => point.orders_taken_count !== 0 || point.deliveries_count !== 0
        ) ?? false;
    const hasPaymentMethodsActivity =
        data?.payment_methods.some((method) => method.amount > 0) ?? false;
    const isAnalyticsEmpty =
        !hasPaymentsActivity && !hasOrdersActivity && !hasPaymentMethodsActivity;

    return (
        <section className="reportsAnalytics" aria-labelledby="analytics-heading">
            <div className="reportsSummarySectionHeading">
                <h2 id="analytics-heading">Análisis del período</h2>
                <p>
                    {data
                        ? `${dayjs(data.period.date_from).format('DD/MM/YYYY')} – ${dayjs(data.period.date_to).format('DD/MM/YYYY')}`
                        : 'Explorá cómo se comportó el negocio dentro del período seleccionado.'}
                </p>
            </div>
            {loading ? (
                <Card className="reportsAnalyticsLoading">
                    <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
            ) : isAnalyticsEmpty ? (
                <Card className="reportsAnalyticsCard">
                    <AnalyticsEmpty description="Todavía no hay actividad para analizar en este período." />
                </Card>
            ) : (
                <div className="reportsAnalyticsGrid">
                    <Card className="reportsAnalyticsCard reportsAnalyticsWide">
                        <Heading
                            title="Pagos recibidos"
                            help="Incluye pagos activos de ventas de mostrador, señas, pagos de pedidos y cobranzas de ruta. No incluye pagos anulados."
                        />
                        <p>Dinero efectivamente cobrado durante el período.</p>
                        {hasPaymentsActivity ? (
                            <div className="reportsAnalyticsChart">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data?.payments_series}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
                                            minTickGap={28}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => formatCurrency(value)}
                                            width={72}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value))}
                                            labelFormatter={(date) =>
                                                dayjs(String(date)).format('DD/MM/YYYY')
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="collected_amount"
                                            name="Pagos recibidos"
                                            stroke={colors[1]}
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <AnalyticsEmpty description="No hubo pagos recibidos en este período." />
                        )}
                    </Card>
                    {ordersAvailable && (
                        <Card className="reportsAnalyticsCard reportsAnalyticsWide">
                            <Heading
                                title="Actividad de pedidos"
                                help="Compara diariamente los pedidos registrados con las entregas físicas realizadas."
                            />
                            <p>Compará los pedidos registrados con las entregas realizadas.</p>
                            {hasOrdersActivity ? (
                                <div className="reportsAnalyticsChart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data?.orders_series}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatDate}
                                                minTickGap={28}
                                            />
                                            <YAxis allowDecimals={false} width={32} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar
                                                dataKey="orders_taken_count"
                                                name="Pedidos tomados"
                                                fill={colors[0]}
                                            />
                                            <Bar
                                                dataKey="deliveries_count"
                                                name="Entregas realizadas"
                                                fill={colors[2]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <AnalyticsEmpty description="No hubo actividad de pedidos en este período." />
                            )}
                        </Card>
                    )}
                    <Card className="reportsAnalyticsCard reportsAnalyticsWide">
                        <Heading
                            title="Medios de pago"
                            help="Distribución del dinero cobrado durante el período."
                        />
                        <p>Distribución del dinero cobrado durante el período.</p>
                        {!hasPayments ? (
                            <AnalyticsEmpty description="No hubo pagos registrados en este período." />
                        ) : (
                            <>
                                <div className="reportsAnalyticsDonut">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data?.payment_methods}
                                                dataKey="amount"
                                                nameKey="name"
                                                innerRadius={48}
                                                outerRadius={76}
                                                paddingAngle={2}
                                            >
                                                {data?.payment_methods.map((method, index) => (
                                                    <Cell
                                                        key={method.payment_method_id}
                                                        fill={colors[index % colors.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatCurrency(Number(value))}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="reportsAnalyticsBreakdown">
                                    {data?.payment_methods.map((method, index) => (
                                        <div key={method.payment_method_id}>
                                            <i
                                                style={{
                                                    backgroundColor: colors[index % colors.length],
                                                }}
                                            />
                                            <span>{method.name}</span>
                                            <strong>{formatCurrency(method.amount)}</strong>
                                            <small>
                                                {paymentTotal
                                                    ? Math.round(
                                                          (method.amount / paymentTotal) * 100
                                                      )
                                                    : 0}
                                                %
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>
                </div>
            )}
        </section>
    );
};
