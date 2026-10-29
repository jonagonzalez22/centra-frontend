import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { InputNumber, Space, Tooltip } from 'antd';
import { Button } from '@/components/Button';
import { formatQuantityForDisplay } from '@/utils/quantity';

type QuantityInputProps = {
    value: string;
    ariaLabel: string;
    onChange: (value: string | null) => void;
    onCommit: () => void;
    min?: string;
    max?: string;
    step?: string;
    onDecrease?: () => void;
    onIncrease?: () => void;
    decreaseAriaLabel?: string;
    increaseAriaLabel?: string;
    decreaseDisabled?: boolean;
    increaseDisabled?: boolean;
    disabled?: boolean;
    unitSymbol?: string | null;
    unitClassName?: string;
    className?: string;
};

/**
 * Shared quantity editing controls. Domain-specific validation, bounds and
 * increments are supplied by the caller; this component only owns the UX.
 */
export const QuantityInput = ({
    value,
    ariaLabel,
    onChange,
    onCommit,
    min,
    max,
    step,
    onDecrease,
    onIncrease,
    decreaseAriaLabel = 'Reducir cantidad',
    increaseAriaLabel = 'Aumentar cantidad',
    decreaseDisabled = false,
    increaseDisabled = false,
    disabled = false,
    unitSymbol,
    unitClassName = 'text-sm text-gray-500',
    className = 'w-16 [&_.ant-input-number-input]:text-center',
}: QuantityInputProps) => <div className="flex self-center items-center gap-2">
    <Space.Compact>
        {onDecrease && (
            <Tooltip title="Reducir cantidad">
                <Button
                    variant="primary"
                    styles={{ root: { boxShadow: 'none' } }}
                    aria-label={decreaseAriaLabel}
                    icon={<MinusOutlined />}
                    disabled={disabled || decreaseDisabled}
                    action={onDecrease}
                />
            </Tooltip>
        )}
        <InputNumber<string>
            stringMode
            aria-label={ariaLabel}
            className={className}
            controls={false}
            variant="outlined"
            styles={{ root: { boxShadow: 'none' } }}
            min={min}
            max={max}
            precision={4}
            step={step}
            value={value}
            disabled={disabled}
            formatter={(input) => input ? formatQuantityForDisplay(input) : ''}
            parser={(input) => input?.replace(',', '.') ?? ''}
            onChange={onChange}
            onBlur={onCommit}
            onPressEnter={onCommit}
        />
        {onIncrease && (
            <Tooltip title="Aumentar cantidad">
                <Button
                    variant="primary"
                    styles={{ root: { boxShadow: 'none' } }}
                    aria-label={increaseAriaLabel}
                    icon={<PlusOutlined />}
                    disabled={disabled || increaseDisabled}
                    action={onIncrease}
                />
            </Tooltip>
        )}
    </Space.Compact>
    {unitSymbol && <span className={unitClassName}>{unitSymbol}</span>}
</div>;
