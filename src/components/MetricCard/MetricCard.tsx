import { Skeleton } from 'antd';
import type { LucideIcon } from 'lucide-react';
import './MetricCard.css';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    loading?: boolean;
}

const MetricCard = ({ title, value, icon: Icon, loading = false }: MetricCardProps) => {
    return (
        <div className="metricCard">
            <div className="metricCardIcon">
                <Icon size={24} />
            </div>
            <div className="metricCardContent">
                <span className="metricCardTitle">{title}</span>
                {loading ? (
                    <Skeleton.Input size="small" active />
                ) : (
                    <span className="metricCardValue">{value}</span>
                )}
            </div>
        </div>
    );
};

export default MetricCard;