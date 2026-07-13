import { Switch } from 'antd';
import { SettingOutlined, EyeOutlined } from '@ant-design/icons';
import Table from '@/components/Table/Table';
import { ActionButton } from '@/components/ActionButton';
import { Tag } from '@/components/Tag';
import { CanDo } from '@/components/auth/CanDo';
import type { StorePaymentMethod } from '../../interfaces/store-payment-method.interface';

interface StorePaymentMethodsTableProps {
    paymentMethods: StorePaymentMethod[];
    loading: boolean;
    onConfigure: (method: StorePaymentMethod) => void;
    onToggleEnabled: (method: StorePaymentMethod, enabled: boolean) => void;
}

export const StorePaymentMethodsTable: React.FC<StorePaymentMethodsTableProps> = ({
    paymentMethods,
    loading,
    onConfigure,
    onToggleEnabled,
}) => {
    const columns = [
        {
            title: 'Nombre',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Nombre visible',
            dataIndex: 'custom_name',
            key: 'custom_name',
            responsive: ['md'] as ('md')[],
            render: (customName: unknown) => (
                <span>{(customName as string) || '-'}</span>
            ),
        },
        {
            title: 'Estado',
            dataIndex: 'is_enabled',
            key: 'is_enabled',
            render: (_enabled: unknown, record: unknown) => {
                const method = record as StorePaymentMethod;
                return (
                    <CanDo
                        permission="store_payment_methods.configure"
                        fallback={
                            <Tag color={method.is_enabled ? 'green' : 'default'}>
                                {method.is_enabled ? 'Habilitado' : 'Deshabilitado'}
                            </Tag>
                        }
                    >
                        <Switch
                            checked={method.is_enabled}
                            checkedChildren="Habilitado"
                            unCheckedChildren="Deshabilitado"
                            onChange={(checked) => onToggleEnabled(method, checked)}
                        />
                    </CanDo>
                );
            },
        },
        {
            title: 'Orden POS',
            dataIndex: 'sort_order',
            key: 'sort_order',
            responsive: ['md'] as ('md')[],
        },
        {
            title: 'Acción',
            key: 'actions',
            render: (_actions: unknown, record: unknown) => {
                const method = record as StorePaymentMethod;
                return (
                    <CanDo
                        permission="store_payment_methods.configure"
                        fallback={
                            <ActionButton
                                icon={<EyeOutlined />}
                                label="Ver"
                                action={() => onConfigure(method)}
                            />
                        }
                    >
                        <ActionButton
                            icon={<SettingOutlined />}
                            label="Configurar"
                            action={() => onConfigure(method)}
                        />
                    </CanDo>
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={paymentMethods as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyText="No hay medios de pago disponibles."
            scroll={{ x: 'max-content' }}
            size="small"
        />
    );
};
