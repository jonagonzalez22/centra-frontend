import { useEffect, useMemo, useState } from 'react';
import { Form, InputNumber, message, notification } from 'antd';
import type { FormInstance } from 'antd';
import { Button } from '@/components/Button';
import Card from '@/components/Card/Card';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import InputField from '@/components/InputField/InputField';
import { InventoryMovementsService } from '../../services/inventoryMovements.service';
import type { Product } from '@/features/store/products/interfaces/product.interface';
import type { CreateStockMovementDto } from '../../interfaces/inventory-movement.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './StockAdjustmentModal.css';
import type { DecimalString } from '@/types/decimal';
import { addDecimalStrings, compareDecimalStrings, formatQuantityForDisplay, isZeroDecimal, normalizeDecimalString, subtractDecimalStrings } from '@/utils/quantity';

interface StockAdjustmentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (response?: unknown) => void;
    product: Product;
}

interface AdjustmentFormValues {
    type: 'input' | 'output' | 'adjustment';
    quantity: DecimalString;
    concept: string;
}

const TYPE_OPTIONS = [
    { label: 'Entrada', value: 'input' },
    { label: 'Salida', value: 'output' },
    { label: 'Ajuste', value: 'adjustment' },
];

export const StockAdjustmentModal = ({
    open,
    onClose,
    onSuccess,
    product,
}: StockAdjustmentModalProps) => {
    const onSuccessCb = onSuccess ?? (() => {});
    const [form] = Form.useForm<AdjustmentFormValues>();
    const [loading, setLoading] = useState(false);

    const typeValue = Form.useWatch('type', form);
    const quantityValue = Form.useWatch('quantity', form);

    const stockResultante = useMemo(() => {
        if (!typeValue || !quantityValue || isZeroDecimal(quantityValue)) {
            return product.available_stock;
        }

        if (typeValue === 'input') {
            return addDecimalStrings(product.available_stock, quantityValue);
        }
        if (typeValue === 'output') {
            return subtractDecimalStrings(product.available_stock, quantityValue);
        }
        if (typeValue === 'adjustment') {
            return addDecimalStrings(product.available_stock, quantityValue);
        }
        return product.available_stock;
    }, [typeValue, quantityValue, product.available_stock]);

    const isStockResultanteValid = compareDecimalStrings(stockResultante, '0.0000') >= 0;
    const stockIncreased = compareDecimalStrings(stockResultante, product.available_stock) > 0;
    const stockDecreased = compareDecimalStrings(stockResultante, product.available_stock) < 0;

    const isSaveDisabled = loading || !isStockResultanteValid || !quantityValue || isZeroDecimal(quantityValue);

    const quantityMin = typeValue === 'adjustment' ? undefined : '1';
    const quantityMax = undefined;

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleSubmit = async (values: AdjustmentFormValues) => {
        setLoading(true);
        try {
            const dto: CreateStockMovementDto = {
                product_id: product.id,
                type: values.type,
                quantity: normalizeDecimalString(values.quantity),
                concept: values.concept,
            };
            const response = await InventoryMovementsService.create(dto);
            notification.success({ message: 'Stock actualizado correctamente.' });
            onSuccessCb(response);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al realizar el ajuste de stock.');
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages,
                }));
                form.setFields(fieldErrors as Parameters<FormInstance['setFields']>[0]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={`Ajustar Stock - ${product.name}`}
            width={480}
            loading={loading}
            footer={
                <div className="stockAdjustmentModalFooter">
                    <Button
                        variant="default"
                        label="Cancelar"
                        action={handleClose}
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        label="Guardar"
                        loading={loading}
                        disabled={isSaveDisabled}
                        htmlType="button"
                        action={() => {
                            const formEl = document.getElementById(
                                'stockAdjustmentForm'
                            ) as HTMLFormElement | null;
                            if (formEl) {
                                formEl.dispatchEvent(
                                    new Event('submit', { cancelable: true, bubbles: true })
                                );
                            }
                        }}
                    />
                </div>
            }
            destroyOnClose={false}
        >
            <Card className="stockAdjustmentCard">
                <div className="stockAdjustmentCardRow">
                    <div className="stockAdjustmentCardItem">
                        <span className="stockAdjustmentCardLabel">Stock Actual</span>
                        <span className="stockAdjustmentCardValue">{formatQuantityForDisplay(product.available_stock)}</span>
                    </div>
                    <span className="stockAdjustmentCardArrow">→</span>
                    <div className="stockAdjustmentCardItem">
                        <span className="stockAdjustmentCardLabel">Stock Resultante</span>
                        <span
                            className={`stockAdjustmentCardValue ${
                                stockIncreased
                                    ? 'stockAdjustmentCardValue--increased'
                                    : stockDecreased
                                      ? 'stockAdjustmentCardValue--decreased'
                                      : ''
                            }`}
                        >
                            {formatQuantityForDisplay(stockResultante)}
                        </span>
                    </div>
                </div>
            </Card>

            {!isStockResultanteValid && (
                <div className="stockAdjustmentError">
                    El stock resultante no puede ser menor a 0.
                </div>
            )}

            <Form
                form={form}
                id="stockAdjustmentForm"
                layout="vertical"
                onFinish={handleSubmit}
                validateTrigger="onBlur"
            >
                <SelectField
                    name="type"
                    label="Tipo de Ajuste"
                    options={TYPE_OPTIONS}
                    rules={[{ required: true, message: 'El tipo de ajuste es obligatorio.' }]}
                />

                <Form.Item
                    name="quantity"
                    label="Cantidad"
                    rules={[{ required: true, message: 'La cantidad es obligatoria.' }]}
                >
                    <InputNumber<string>
                        stringMode
                        placeholder="0"
                        style={{ width: '100%' }}
                        min={quantityMin}
                        max={quantityMax}
                        precision={4}
                        step="1"
                    />
                </Form.Item>

                <InputField
                    name="concept"
                    label="Motivo / Concepto"
                    placeholder="Ej: Reposición por faltante, Ajuste de inventario..."
                    rules={[{ required: true, message: 'El concepto es obligatorio.' }]}
                />
            </Form>
        </Modal>
    );
};
