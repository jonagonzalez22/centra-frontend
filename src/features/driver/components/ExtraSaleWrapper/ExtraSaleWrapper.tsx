import { useEffect } from 'react';
import { Drawer, Spin, Empty, Input } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';
import { useExtraSale } from '../../hooks/useExtraSale';
import type { SurplusProduct } from '../../interfaces/driver.interface';
import { formatCurrency } from '@/utils/formatters';
import './ExtraSaleWrapper.css';

interface ExtraSaleWrapperProps {
    open: boolean;
    routeId: string;
    stopId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ExtraSaleProductCard: React.FC<{
    product: SurplusProduct;
    quantity: number;
    onDecrement: () => void;
    onIncrement: () => void;
}> = ({ product, quantity, onDecrement, onIncrement }) => {
    const canDecrement = quantity > 0;
    const canIncrement = quantity < product.available_quantity;

    return (
        <div className="extraSaleCard">
            <div className="extraSaleCardTop">
                <div className="extraSaleCardInfo">
                    <div className="extraSaleCardName">{product.product_name}</div>
                    <div className="extraSaleCardMeta">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        <span className="extraSaleCardPrice">
                            {formatCurrency(product.unit_price)} c/u
                        </span>
                    </div>
                </div>
                <div className="extraSaleCardStock">
                    Disponible: {product.available_quantity}
                </div>
            </div>
            <div className="extraSaleCardStepper">
                <button
                    className={`extraSaleStepperBtn ${!canDecrement ? 'extraSaleStepperBtn--disabled' : ''}`}
                    disabled={!canDecrement}
                    onClick={onDecrement}
                    type="button"
                >
                    −
                </button>
                <span className="extraSaleStepperValue">{quantity}</span>
                <button
                    className={`extraSaleStepperBtn ${!canIncrement ? 'extraSaleStepperBtn--disabled' : ''}`}
                    disabled={!canIncrement}
                    onClick={onIncrement}
                    type="button"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export const ExtraSaleWrapper: React.FC<ExtraSaleWrapperProps> = ({
    open,
    routeId,
    stopId,
    onClose,
    onSuccess,
}) => {
    const {
        loadingSurplus,
        submitting,
        selectedQuantities,
        searchQuery,
        filteredProducts,
        summary,
        isValid,
        loadSurplus,
        changeQuantity,
        setSearchQuery,
        submitExtraSale,
        resetSelections,
    } = useExtraSale();

    useEffect(() => {
        if (open && routeId) {
            loadSurplus(routeId);
        }
    }, [open, routeId, loadSurplus]);

    const handleClose = () => {
        resetSelections();
        onClose();
    };

    const handleSubmit = async () => {
        await submitExtraSale(stopId);
        handleClose();
        onSuccess();
    };

    const summaryText =
        summary.totalUnits === 0
            ? 'Sin productos seleccionados'
            : `${summary.totalUnits} unidad${summary.totalUnits !== 1 ? 'es' : ''} en ${summary.totalProducts} producto${summary.totalProducts !== 1 ? 's' : ''}`;

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            width="100%"
            closable={false}
            destroyOnClose
            maskClosable={!submitting}
            keyboard={!submitting}
            className="extraSaleDrawer"
            styles={{
                body: { padding: '0', display: 'flex', flexDirection: 'column', height: '100%' },
            }}
        >
            {/* Header */}
            <div className="extraSaleHeader">
                <button
                    className="extraSaleBackBtn"
                    onClick={handleClose}
                    disabled={submitting}
                    type="button"
                >
                    <LeftOutlined />
                </button>
                <span className="extraSaleHeaderTitle">Venta Extra</span>
                <div className="extraSaleHeaderSpacer" />
            </div>

            <div className="extraSaleBody">
                {/* Search */}
                <div className="extraSaleSearch">
                    <Input.Search
                        value={searchQuery}
                        placeholder="Buscar por nombre o código"
                        allowClear
                        onSearch={setSearchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Subtitle */}
                <div className="extraSaleSubtitle">
                    {loadingSurplus ? (
                        <span>Buscando productos…</span>
                    ) : filteredProducts.length === 0 ? (
                        <span>No se encontraron productos disponibles</span>
                    ) : (
                        <span>
                            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}{' '}
                            disponible{filteredProducts.length !== 1 ? 's' : ''} para vender
                        </span>
                    )}
                </div>

                {/* Product list */}
                <div className="extraSaleList">
                    {loadingSurplus ? (
                        <div className="extraSaleLoading">
                            <Spin size="large" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No hay productos disponibles para venta extra"
                        />
                    ) : (
                        filteredProducts.map((product) => (
                            <ExtraSaleProductCard
                                key={product.product_id}
                                product={product}
                                quantity={selectedQuantities[product.product_id] ?? 0}
                                onDecrement={() => changeQuantity(product.product_id, -1)}
                                onIncrement={() => changeQuantity(product.product_id, 1)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="extraSaleFooter">
                <div className="extraSaleSummary">
                    <span className="extraSaleSummaryText">{summaryText}</span>
                    <span className="extraSaleSummaryAmount">
                        {formatCurrency(summary.totalAmount)}
                    </span>
                </div>
                <Button
                    variant="primary"
                    block
                    disabled={!isValid}
                    loading={submitting}
                    action={handleSubmit}
                    className="extraSaleSubmitBtn"
                >
                    Agregar
                </Button>
            </div>
        </Drawer>
    );
};

export default ExtraSaleWrapper;
