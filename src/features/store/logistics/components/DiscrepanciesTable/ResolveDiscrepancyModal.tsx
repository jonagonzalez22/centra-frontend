import { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Tag, Divider } from 'antd';
import type { DiscrepancyResolutionType, RouteReconciliationStopItem } from '../../interfaces/reconciliation.interface';

const resolutionOptions: { value: DiscrepancyResolutionType; label: string }[] = [
    { value: 'returned', label: 'Devuelto a depósito' },
    { value: 'rejected_by_customer', label: 'Rechazado por cliente' },
    { value: 'missing', label: 'Faltante / extraviado' },
    { value: 'damaged', label: 'Dañado / merma' },
    { value: 'pending_redelivery', label: 'Pendiente de reenvío' },
    { value: 'other', label: 'Otro' },
];

const getDifferenceTag = (difference: number) => {
    if (difference > 0) {
        return <Tag color="error" className="text-sm font-semibold">+{difference}</Tag>;
    } else if (difference < 0) {
        return <Tag color="warning" className="text-sm font-semibold">{difference}</Tag>;
    }
    return <Tag color="default" className="text-sm font-semibold">0</Tag>;
};

interface ResolveDiscrepancyModalProps {
    open: boolean;
    item: RouteReconciliationStopItem;
    loading: boolean;
    onClose: () => void;
    onConfirm: (resolutionType: DiscrepancyResolutionType, quantityToResolve: number, notes?: string) => Promise<void>;
}

export const ResolveDiscrepancyModal = ({
    open,
    item,
    loading,
    onClose,
    onConfirm,
}: ResolveDiscrepancyModalProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (item.discrepancy?.resolution_type) {
                form.setFieldsValue({
                    resolution_type: item.discrepancy.resolution_type,
                    notes: item.discrepancy.notes || '',
                });
            }
        }
    }, [open, item, form]);

    const handleConfirm = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            await onConfirm(values.resolution_type, Math.abs(item.difference), values.notes);
        } catch {
            // Validation failed
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Resolver Discrepancia"
            open={open}
            onCancel={onClose}
            confirmLoading={submitting || loading}
            onOk={handleConfirm}
            okText="Guardar resolución"
            cancelText="Cancelar"
            destroyOnClose
            width={480}
        >
            <div className="mb-4">
                <div className="font-medium text-base mb-2">{item.product_name}</div>

                <div className="bg-gray-50 rounded p-3 mb-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-xs text-gray-500">Cargado</div>
                            <div className="font-semibold">{item.quantity_loaded}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Entregado</div>
                            <div className="font-semibold">{item.quantity_delivered}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Diferencia</div>
                            <div className="font-semibold">{getDifferenceTag(item.difference)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <Divider className="my-3" />

            <Form form={form} layout="vertical" preserve={false}>
                <Form.Item
                    name="resolution_type"
                    label="Tipo de resolución"
                    rules={[{ required: true, message: 'Seleccione un tipo de resolución.' }]}
                >
                    <Select
                        placeholder="Seleccione una opción"
                        options={resolutionOptions}
                        size="middle"
                    />
                </Form.Item>

                <Form.Item
                    name="notes"
                    label="Observaciones"
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Agregar una observación opcional..."
                        maxLength={500}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
