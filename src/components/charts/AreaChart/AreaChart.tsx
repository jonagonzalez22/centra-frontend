import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/Card';
import { Skeleton } from 'antd';
import { CENTRA_TOKENS } from '@/design-system/tokens';
import { formatMonthShort } from '@/utils/formatters';

interface AreaChartProps {
    data: Array<{ month: string; store_count: number }>;
    loading?: boolean;
    title?: string;
}

const AreaChartComponent = ({ data, loading = false, title }: AreaChartProps) => {
    const formattedData = data.map((item) => ({
        ...item,
        monthFormatted: formatMonthShort(item.month),
    }));

    return (
        <Card title={title}>
            {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <div className="w-full pt-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsAreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStoreCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CENTRA_TOKENS.colorPrimary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CENTRA_TOKENS.colorPrimary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="monthFormatted"
                                tick={{ fontSize: 12, fill: '#666' }}
                                axisLine={{ stroke: '#d9d9d9' }}
                                tickLine={{ stroke: '#d9d9d9' }}
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
                            <Area
                                type="monotone"
                                dataKey="store_count"
                                stroke={CENTRA_TOKENS.colorPrimary}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorStoreCount)"
                            />
                        </RechartsAreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};

export default AreaChartComponent;