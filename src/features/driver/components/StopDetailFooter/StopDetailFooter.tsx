import { Button } from 'antd';
import './StopDetailFooter.css';

export interface StopDetailFooterProps {
    canDeliver: boolean;
    canConfirm: boolean;
    completing: boolean;
    isCompleted: boolean;
    buttonLabel: string;
    onPrimaryClick: () => void;
    onFailedDeliveryClick: () => void;
    onExtraSaleClick: () => void;
    showExtraSale: boolean;
}

export const StopDetailFooter = ({
    canDeliver,
    canConfirm,
    completing,
    isCompleted,
    buttonLabel,
    onPrimaryClick,
    onFailedDeliveryClick,
    onExtraSaleClick,
    showExtraSale,
}: StopDetailFooterProps) => {
    const isPrimaryDisabled = !canDeliver || !canConfirm;

    return (
        <div className="stopDetailBottomBar">
            <div className="stopDetailButtonsRow">
                {/* Secondary — "Venta Extra" */}
                {showExtraSale && (
                    <div className="stopDetailSecondaryWrapper">
                        <Button
                            size="middle"
                            onClick={onExtraSaleClick}
                            className="stopDetailVentaExtraBtn"
                        >
                            Venta Extra
                        </Button>
                    </div>
                )}

                {/* Primary — "Entregar todo" / "Confirmar entrega parcial" */}
                <div className={`stopDetailPrimaryWrapper ${isPrimaryDisabled ? 'stopDetailPrimaryWrapper--disabled' : ''}`}>
                    <Button
                        type="primary"
                        size="large"
                        disabled={isPrimaryDisabled}
                        loading={completing}
                        onClick={onPrimaryClick}
                        className="stopDetailDeliverBtn"
                    >
                        {buttonLabel}
                    </Button>
                </div>

                {/* Tertiary — "No se pudo entregar" */}
                {!isCompleted && (
                    <div className="stopDetailTertiaryWrapper">
                        <button
                            className="stopDetailFailedLink"
                            onClick={onFailedDeliveryClick}
                            disabled={!canDeliver}
                            type="button"
                        >
                            No se pudo entregar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
