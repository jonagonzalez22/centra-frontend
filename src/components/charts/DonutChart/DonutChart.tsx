import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/Card';
import { Skeleton } from 'antd';
import { CENTRA_TOKENS } from '@/design-system/tokens';

interface DonutChartProps {
    data: Array<{ plan_name: string; store_count: number }>;
    loading?: boolean;
    title?: string;
}

const COLORS = [
    CENTRA_TOKENS.colorPrimary,
    CENTRA_TOKENS.colorSecondary,
    CENTRA_TOKENS.colorSuccess,
    CENTRA_TOKENS.colorWarning,
];

const DonutChartComponent = ({ data, loading = false, title }: DonutChartProps) => {
    const total = data.reduce((sum, item) => sum + item.store_count, 0);

    return (
        <Card title={title}>
            {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <div className="flex flex-col items-center gap-4 pt-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="store_count"
                                nameKey="plan_name"
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                formatter={(value, name) => [`${value} tiendas`, String(name)]}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {data.map((item, index) => (
                            <div key={item.plan_name} className="flex items-center gap-1 text-xs">
                                <span
                                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-gray-500">{item.plan_name}</span>
                                <span className="font-semibold text-centra-text">
                                    {total > 0 ? Math.round((item.store_count / total) * 100) : 0}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default DonutChartComponent;