import { Tooltip } from 'antd';
import type { TooltipProps } from 'antd';
import { Link } from 'react-router-dom';
import './ActionButton.css';

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    action?: () => void;
    href?: string;
    tooltipPlacement?: TooltipProps['placement'];
    disabled?: boolean;
    loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    icon,
    label,
    action,
    href,
    tooltipPlacement = 'top',
    disabled,
    loading,
}) => {
    const button = (
        <button
            type="button"
            className="actionButton"
            onClick={action}
            disabled={disabled || loading}
            aria-label={label}
        >
            {icon}
        </button>
    );

    if (href) {
        return (
            <Tooltip title={label} placement={tooltipPlacement}>
                <Link to={href} className="actionButtonLink" aria-label={label}>
                    {icon}
                </Link>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={label} placement={tooltipPlacement}>
            {button}
        </Tooltip>
    );
};

export default ActionButton;