import { Alert, Breadcrumb, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { EyeOutlined } from '@ant-design/icons';
import { Store, Users, DollarSign, CreditCard } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { Card } from '@/components/Card';
import { Table } from '@/components/Table';
import { AreaChart, BarChart } from '@/components/charts';
import type { DashboardStats, LatestStore } from '@/features/admin/dashboard/interfaces/dashboard.interface';
import type { PageBreadcrumbItem } from '@/router/router.utils';
import { formatCurrency, formatDateBrief } from '@/utils/formatters';
import './DashboardPage.css';

interface DashboardPageViewProps {
    data: DashboardStats | null;
    loading: boolean;
    error: string | null;
    title: string;
    description: string;
    breadcrumbs: PageBreadcrumbItem[];
}

export const DashboardPageView = ({
    data,
    loading,
    error,
    title,
    description,
    breadcrumbs,
}: DashboardPageViewProps) => {
    const navigate = useNavigate();

    const handleViewStore = (store: LatestStore) => {
        navigate(`/admin/tiendas/${store.id}`);
    };

    const latestStoresColumns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Fecha de creación',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (dateString: unknown) => formatDateBrief(String(dateString)),
        },
        {
            title: 'Acción',
            key: 'action',
            width: 80,
            render: (_: unknown, record: unknown) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewStore(record as LatestStore)}
                >
                    Ver
                </Button>
            ),
        },
    ];

    return (
        <div className="dashboardPage">
            <div className="dashboardPageHeader">
                <Breadcrumb
                    className="dashboardPageBreadcrumb"
                    items={breadcrumbs.map((item) => ({
                        title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
                    }))}
                />

                <div className="dashboardPageHeaderTop">
                    <div className="dashboardPageHeaderText">
                        <h1 className="dashboardPageTitle">{title}</h1>
                        <p className="dashboardPageDescription">{description}</p>
                    </div>
                </div>
            </div>

            {error && (
                <Alert className="dashboardPageAlert" type="error" description={error} showIcon />
            )}

            <section className="dashboardPageMetrics">
                <MetricCard
                    title="Total Tiendas"
                    value={data?.metrics.total_stores ?? 0}
                    icon={Store}
                    loading={loading}
                />
                <MetricCard
                    title="Total Usuarios"
                    value={data?.metrics.total_users ?? 0}
                    icon={Users}
                    loading={loading}
                />
                <MetricCard
                    title="Ingresos Proyectados"
                    value={formatCurrency(data?.metrics.estimated_mrr ?? 0)}
                    icon={DollarSign}
                    loading={loading}
                />
                <MetricCard
                    title="Planes Activos"
                    value={data?.metrics.active_plans_count ?? 0}
                    icon={CreditCard}
                    loading={loading}
                />
            </section>

            <section className="dashboardPageCharts">
                <AreaChart
                    data={data?.charts.growth_last_6_months ?? []}
                    loading={loading}
                    title="Crecimiento de Tiendas"
                />
                <BarChart
                    data={data?.charts.stores_by_plan ?? []}
                    loading={loading}
                    title="Distribución por Plan"
                />
            </section>

            <section className="dashboardPageRecentActivity">
                <Card title="Actividad Reciente">
                    {loading ? (
                        <div className="dashboardPageTableSkeleton">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="dashboardPageTableSkeletonRow" />
                            ))}
                        </div>
                    ) : (
                        <Table
                            dataSource={(data?.recent_activity.latest_stores ?? []) as unknown as Record<string, unknown>[]}
                            columns={latestStoresColumns}
                            size="small"
                        />
                    )}
                </Card>
            </section>
        </div>
    );
};