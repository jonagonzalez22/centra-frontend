import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/Card';
import { Skeleton } from 'antd';
import { CENTRA_TOKENS } from '@/design-system/tokens';

interface BarChartProps {
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

const BarChartComponent = ({ data, loading = false, title }: BarChartProps) => {
    return (
        <Card title={title}>
            {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <div className="w-full pt-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="plan_name"
                                tick={{ fontSize: 11, fill: '#666' }}
                                axisLine={{ stroke: '#d9d9d9' }}
                                tickLine={{ stroke: '#d9d9d9' }}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={{ stroke: '#d9d9d9' }}
                                tickLine={{ stroke: '#d9d9d9' }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #f0f0f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                formatter={(value) => [`${value} tiendas`, 'Cantidad']}
                            />
                            <Bar dataKey="store_count" radius={[4, 4, 0, 0]}>
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};

export default BarChartComponent;