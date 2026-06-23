import { useEffect, useState } from 'react';
import { Form, InputNumber, message } from 'antd';
import type { FormInstance } from 'antd';
import { Button } from '@/components/Button';
import Modal from '@/components/Modal/Modal';
import SelectField from '@/components/SelectField/SelectField';
import InputField from '@/components/InputField/InputField';
import { InventoryMovementsService } from '../../services/inventoryMovements.service';
import type { Product } from '@/features/store/products/interfaces/product.interface';
import type { CreateStockMovementDto } from '../../interfaces/inventory-movement.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './StockAdjustmentModal.css';

interface StockAdjustmentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: Product;
}

interface AdjustmentFormValues {
    type: 'input' | 'output' | 'adjustment';
    quantity: number;
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
    const [form] = Form.useForm<AdjustmentFormValues>();
    const [loading, setLoading] = useState(false);

    const typeValue = Form.useWatch('type', form);

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
                quantity: values.quantity,
                concept: values.concept,
            };
            await InventoryMovementsService.create(dto);
            message.success('Ajuste de stock realizado correctamente.');
            onSuccess();
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

    const validateQuantity = (_: unknown, value: number) => {
        if (!value || value === 0) {
            return Promise.reject(new Error('La cantidad no puede ser 0.'));
        }

        if (typeValue === 'input' && value <= 0) {
            return Promise.reject(new Error('Para entrada, la cantidad debe ser positiva.'));
        }

        if (typeValue === 'output' && value >= 0) {
            return Promise.reject(new Error('Para salida, la cantidad debe ser negativa.'));
        }

        if (typeValue === 'output' && Math.abs(value) > product.available_stock) {
            return Promise.reject(
                new Error(`No puedes retirar más stock del disponible (${product.available_stock}).`)
            );
        }

        return Promise.resolve();
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
            <div className="stockAdjustmentModalInfo">
                <span className="stockAdjustmentModalLabel">Stock disponible actual:</span>
                <span className="stockAdjustmentModalValue">{product.available_stock}</span>
            </div>

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
                    rules={[{ required: true, message: 'La cantidad es obligatoria.' }, { validator: validateQuantity }]}
                >
                    <InputNumber
                        placeholder="0"
                        style={{ width: '100%' }}
                        min={typeValue === 'input' ? 1 : -product.available_stock}
                        precision={0}
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
