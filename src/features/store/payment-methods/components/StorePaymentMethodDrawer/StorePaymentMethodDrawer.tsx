import { useEffect } from 'react';
import { Form, Input, InputNumber, Switch } from 'antd';
import Drawer from '@/components/Drawer/Drawer';
import { Button } from '@/components/Button';
import { usePermissions } from '@/hooks/usePermissions';
import type { StorePaymentMethod, UpdateStorePaymentMethodDto, AccountDetails } from '../../interfaces/store-payment-method.interface';

interface StorePaymentMethodDrawerProps {
    open: boolean;
    method: StorePaymentMethod | null;
    saving: boolean;
    onClose: () => void;
    onSave: (id: string, dto: UpdateStorePaymentMethodDto) => Promise<void>;
}

const CODES_WITH_ACCOUNT_DETAILS = ['transfer'];
const CODES_WITHOUT_REFERENCE = ['cash'];

const hasAccountDetails = (code: string): boolean => {
    return CODES_WITH_ACCOUNT_DETAILS.includes(code);
};

const showRequiresReference = (code: string): boolean => {
    return !CODES_WITHOUT_REFERENCE.includes(code);
};

export const StorePaymentMethodDrawer: React.FC<StorePaymentMethodDrawerProps> = ({
    open,
    method,
    saving,
    onClose,
    onSave,
}) => {
    const [form] = Form.useForm();
    const { can } = usePermissions();
    const canConfigure = can('store_payment_methods.configure');

    useEffect(() => {
        if (open && method) {
            const values: Record<string, unknown> = {
                custom_name: method.custom_name ?? '',
                sort_order: method.sort_order,
                requires_reference: method.requires_reference,
                is_enabled: method.is_enabled,
            };

            if (hasAccountDetails(method.code)) {
                values.account_details = method.account_details ?? {
                    bank: null,
                    account_number: null,
                    alias: null,
                    holder_name: null,
                    cuit_rut: null,
                };
            }

            form.setFieldsValue(values);
        }
    }, [open, method, form]);

    const handleFinish = async (values: {
        custom_name: string;
        sort_order: number;
        requires_reference: boolean;
        is_enabled: boolean;
        account_details?: AccountDetails;
    }) => {
        if (!method) return;

        const dto: UpdateStorePaymentMethodDto = {
            is_enabled: values.is_enabled,
            custom_name: values.custom_name || null,
            sort_order: values.sort_order,
        };

        if (showRequiresReference(method.code)) {
            dto.requires_reference = values.requires_reference;
        }

        if (hasAccountDetails(method.code)) {
            dto.account_details = {
                bank: values.account_details?.bank || null,
                account_number: values.account_details?.account_number || null,
                alias: values.account_details?.alias || null,
                holder_name: values.account_details?.holder_name || null,
                cuit_rut: values.account_details?.cuit_rut || null,
            };
        } else {
            dto.account_details = null;
        }

        await onSave(method.id, dto);
    };

    const handleSubmit = () => {
        form.submit();
    };

    if (!method) return null;

    const showAccountSection = hasAccountDetails(method.code);
    const showReference = showRequiresReference(method.code);

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={method.custom_name || method.name}
            width={560}
            destroyOnClose={false}
            footer={
                canConfigure ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button variant="default" label="Cancelar" action={onClose} disabled={saving} />
                        <Button variant="primary" label="Guardar" loading={saving} action={handleSubmit} />
                    </div>
                ) : undefined
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                disabled={!canConfigure}
            >
                <Form.Item label="Nombre visible en POS" name="custom_name">
                    <Input placeholder="Ej: Mercado Pago" />
                </Form.Item>

                <Form.Item label="Prioridad de aparición" name="sort_order">
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                {showReference && (
                    <Form.Item
                        label="Solicitar número de comprobante"
                        name="requires_reference"
                        valuePropName="checked"
                        help="Al cobrar con este medio, el vendedor deberá registrar un número de operación o comprobante."
                    >
                        <Switch />
                    </Form.Item>
                )}

                <Form.Item label="Habilitado" name="is_enabled" valuePropName="checked">
                    <Switch checkedChildren="Habilitado" unCheckedChildren="Deshabilitado" />
                </Form.Item>

                {showAccountSection && (
                    <div style={{ marginTop: 24 }}>
                        <h4 style={{ marginBottom: 16 }}>Datos para recibir pagos/transferencias</h4>

                        <Form.Item label="Banco" name={['account_details', 'bank']}>
                            <Input placeholder="Nombre del banco" />
                        </Form.Item>

                        <Form.Item label="CBU / CVU" name={['account_details', 'account_number']}>
                            <Input placeholder="CBU o CVU de la cuenta" />
                        </Form.Item>

                        <Form.Item label="Alias" name={['account_details', 'alias']}>
                            <Input placeholder="Alias de la cuenta" />
                        </Form.Item>

                        <Form.Item label="Titular" name={['account_details', 'holder_name']}>
                            <Input placeholder="Nombre del titular" />
                        </Form.Item>

                        <Form.Item label="CUIT / RUT" name={['account_details', 'cuit_rut']}>
                            <Input placeholder="CUIT o RUT del titular" />
                        </Form.Item>
                    </div>
                )}
            </Form>
        </Drawer>
    );
};
