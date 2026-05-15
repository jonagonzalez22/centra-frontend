import { Card as AntCard } from 'antd';
import type { CardProps as AntCardProps } from 'antd';

interface CardProps {
    title?: React.ReactNode;
    children: React.ReactNode;
    extra?: React.ReactNode;
    loading?: boolean;
    className?: string;
    styles?: AntCardProps['styles'];
}

const Card: React.FC<CardProps> = ({
    title,
    children,
    extra,
    loading,
    className,
    styles,
}) => {
    return (
        <AntCard
            title={title}
            extra={extra}
            loading={loading}
            className={className}
            styles={styles}
        >
            {children}
        </AntCard>
    );
};

export default Card;