import { Tag, Select } from 'antd';
import { CheckCircleOutlined, CheckCircleFilled, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { StopDetailItem } from '../../interfaces/driver.interface';
import type { RejectionReason } from '../../services/driver.service';
import type { StopItem } from '../../hooks/useStopDetailItems';
import { formatCurrency } from '@/utils/formatters';
import './StopDetailCard.css';

export interface StopDetailCardProps {
    item: StopDetailItem;
    data: StopItem;
    rejectionReasonId?: string;
    reasonOptions: RejectionReason[];
    canDeliver: boolean;
    onSetQuantity: (itemId: string, value: number) => void;
    onToggleConfirm: (itemId: string) => void;
    onSetRejectionReason: (itemId: string, reasonId: string | undefined) => void;
    onMarkReasonTouched: (itemId: string) => void;
}

export const StopDetailCard = ({
    item,
    data,
    reasonOptions,
    canDeliver,
    rejectionReasonId,
    onSetQuantity,
    onToggleConfirm,
    onSetRejectionReason,
    onMarkReasonTouched,
}: StopDetailCardProps) => {
    const {
        originalQty,
        deliveredQty,
        isReduced,
        isNotLoaded,
        isConfirmed,
        showReasonError,
        cardState,
        canDecrement,
        canIncrement,
    } = data;

    const reasonSelectOptions = reasonOptions.map((r) => ({ label: r.label, value: r.id }));

    return (
        <div className={`stopDetailCard stopDetailCard--${cardState}`}>
            {/* ── Top right: indicator per card state ── */}
            <div className="stopDetailCardCheck">
                {isNotLoaded ? (
                    <div className="stopDetailCheckInfo" title="No cargado en depósito">
                        <InfoCircleOutlined />
                    </div>
                ) : isReduced ? (
                    <div className="stopDetailCheckWarning" title="Cantidad reducida">
                        <WarningOutlined />
                    </div>
                ) : isConfirmed ? (
                    <button
                        className="stopDetailCheckBtn stopDetailCheckBtn--confirmed"
                        onClick={() => onToggleConfirm(item.id)}
                        disabled={!canDeliver}
                        title="Confirmado — tocar para desmarcar"
                        type="button"
                    >
                        <CheckCircleFilled />
                    </button>
                ) : (
                    <button
                        className="stopDetailCheckBtn"
                        onClick={() => onToggleConfirm(item.id)}
                        disabled={!canDeliver}
                        title="Tocar para confirmar"
                        type="button"
                    >
                        <CheckCircleOutlined />
                    </button>
                )}
            </div>

            {/* ── Section 1: Stepper (hidden for not-loaded items) ── */}
            {!isNotLoaded && (
                <div className="stopDetailCardStepper">
                    <button
                        className={`stopDetailStepperBtn ${!canDecrement ? 'stopDetailStepperBtn--disabled' : ''}`}
                        disabled={!canDecrement}
                        onClick={() => onSetQuantity(item.id, deliveredQty - 1)}
                        type="button"
                    >
                        −
                    </button>
                    <span className="stopDetailStepperValue">
                        {deliveredQty}/{originalQty}
                    </span>
                    <button
                        className={`stopDetailStepperBtn ${!canIncrement ? 'stopDetailStepperBtn--disabled' : ''}`}
                        disabled={!canIncrement}
                        onClick={() => onSetQuantity(item.id, deliveredQty + 1)}
                        type="button"
                    >
                        +
                    </button>
                </div>
            )}

            {/* ── Section 2: Product detail ── */}
            <div className="stopDetailCardDetail">
                <div className="stopDetailCardProductName">{item.product_name}</div>
                <div className="stopDetailCardProductMeta">
                    {item.sku && <span>SKU: {item.sku}</span>}
                    {item.unit_price > 0 && (
                        <span className="stopDetailUnitPrice">{formatCurrency(item.unit_price)}/u</span>
                    )}
                    {item.is_extra && (
                        <Tag color="orange" className="stopDetailExtraTag">
                            Extra
                        </Tag>
                    )}
                    {isNotLoaded && (
                        <Tag className="stopDetailNotLoadedTag">No cargado</Tag>
                    )}
                </div>
            </div>

            {/* ── Section 3: Rejection reason (only when reduced) ── */}
            {isReduced && (
                <div className="stopDetailCardReason">
                    <Select
                        className={`stopDetailReasonSelect ${showReasonError ? 'stopDetailReasonSelect--error' : ''}`}
                        placeholder="Motivo del rechazo"
                        value={rejectionReasonId || undefined}
                        onChange={(val) => onSetRejectionReason(item.id, val)}
                        onBlur={() => onMarkReasonTouched(item.id)}
                        options={reasonSelectOptions}
                        disabled={!canDeliver}
                        allowClear
                        popupMatchSelectWidth={false}
                    />
                    {showReasonError && (
                        <div className="stopDetailReasonError">Requerido para continuar</div>
                    )}
                </div>
            )}
        </div>
    );
};
