import { useCallback, useMemo, useState, useEffect } from 'react';
import { Form, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import SelectField from '@/components/SelectField/SelectField';
import { DatePickerField } from '@/components/DatePickerField';
import { Button } from '@/components/Button';
import { useInventoryMovementsContext } from '../../context/InventoryMovementsContext';
import { StoreUsersService } from '../../../users/services/storeUsers.service';
import { ProductsService } from '../../../products/services/products.service';
import type {
    InventoryMovementsFilters,
    MovementType,
} from '../../interfaces/inventory-movement.interface';
import type { User } from '@/entities/User';
import './MovementsSearchBar.css';

type StatusValue = 'all' | MovementType;

interface MovementsSearchFormValues {
    type: StatusValue;
    user_id: string;
    date_from?: Date | null;
    date_to?: Date | null;
    product_id?: string;
}

const TYPE_OPTIONS = [
    { label: 'Todos', value: 'all' },
    { label: 'Entrada', value: 'input' },
    { label: 'Salida', value: 'output' },
    { label: 'Ajuste', value: 'adjustment' },
];

const formatDateToString = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const MovementsSearchBar = () => {
    const { setFilters } = useInventoryMovementsContext();
    const [form] = Form.useForm<MovementsSearchFormValues>();
    const [users, setUsers] = useState<User[]>([]);
    const [productOptions, setProductOptions] = useState<{ label: string; value: string }[]>([]);
    const [productLoading, setProductLoading] = useState(false);

    const typeValue = Form.useWatch('type', form);
    const userValue = Form.useWatch('user_id', form);
    const dateFromValue = Form.useWatch('date_from', form);
    const dateToValue = Form.useWatch('date_to', form);
    const productIdValue = Form.useWatch('product_id', form);

    const hasActiveFilters =
        !!(typeValue && typeValue !== 'all') ||
        !!userValue ||
        !!dateFromValue ||
        !!dateToValue ||
        !!productIdValue;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await StoreUsersService.getAll();
                setUsers(response.items);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };
        fetchUsers();
    }, []);

    const debouncedProductSearch = useMemo(
        () =>
            debounce(async (q: string) => {
                if (q.length < 2) {
                    setProductOptions([]);
                    return;
                }
                setProductLoading(true);
                try {
                    const products = await ProductsService.searchProducts(q);
                    setProductOptions(
                        products.map((p) => ({ label: `${p.name} — ${p.sku}`, value: p.id }))
                    );
                } catch {
                    setProductOptions([]);
                } finally {
                    setProductLoading(false);
                }
            }, 300),
        []
    );

    const handleProductSearch = useCallback(
        (value: string) => {
            debouncedProductSearch(value);
        },
        [debouncedProductSearch]
    );

    const buildFilters = useCallback(
        (values: MovementsSearchFormValues): InventoryMovementsFilters => {
            const filters: InventoryMovementsFilters = {};

            if (values.type && values.type !== 'all') {
                filters.type = values.type as MovementType;
            }
            if (values.user_id) {
                filters.user_id = values.user_id;
            }
            if (values.date_from) {
                filters.date_from = formatDateToString(values.date_from);
            }
            if (values.date_to) {
                filters.date_to = formatDateToString(values.date_to);
            }
            if (values.product_id) {
                filters.product_id = values.product_id;
            }

            return filters;
        },
        []
    );

    const debouncedSetFilters = useMemo(
        () =>
            debounce((values: MovementsSearchFormValues) => {
                setFilters(buildFilters(values));
            }, 500),
        [setFilters, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: MovementsSearchFormValues) => {
            debouncedSetFilters(allValues);
        },
        [debouncedSetFilters]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        setProductOptions([]);
        setFilters({});
    }, [form, setFilters]);

    const userOptions = [
        { label: 'Todos los usuarios', value: '' },
        ...users.map((user) => ({
            label: user.name,
            value: user.id,
        })),
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            className="movementsSearchBar"
            onValuesChange={handleValuesChange}
        >
            <div className="movementsSearchBarRow">
                <SelectField
                    name="product_id"
                    label={
                        <span>
                            Producto{' '}
                            <Tooltip title="Busca por nombre de producto o SKU">
                                <QuestionCircleOutlined className="text-gray-400 cursor-help" />
                            </Tooltip>
                        </span>
                    }
                    placeholder="Buscar producto..."
                    showSearch
                    onSearch={handleProductSearch}
                    filterOption={false}
                    notFoundContent={productLoading ? 'Buscando...' : 'Sin resultados'}
                    options={productOptions}
                    loading={productLoading}
                    allowClear
                    onClear={() => setProductOptions([])}
                />

                <SelectField
                    name="type"
                    label="Tipo"
                    placeholder="Todos"
                    options={TYPE_OPTIONS}
                    allowClear
                />

                <SelectField
                    name="user_id"
                    label="Usuario"
                    placeholder="Todos los usuarios"
                    options={userOptions}
                    allowClear
                />

                <DatePickerField
                    name="date_from"
                    label="Desde"
                    placeholder="Fecha inicio"
                    allowClear
                    rules={[
                        ({ getFieldValue }) => ({
                            validator: (_: unknown, value: Date | null) => {
                                const dateTo = getFieldValue('date_to') as Date | null;
                                if (!value || !dateTo || value <= dateTo) return Promise.resolve();
                                return Promise.reject(
                                    new Error(
                                        'La fecha desde debe ser igual o anterior a la fecha de fin.'
                                    )
                                );
                            },
                        }),
                    ]}
                />

                <DatePickerField
                    name="date_to"
                    label="Hasta"
                    placeholder="Fecha fin"
                    allowClear
                    rules={[
                        ({ getFieldValue }) => ({
                            validator: (_: unknown, value: Date | null) => {
                                const dateFrom = getFieldValue('date_from') as Date | null;
                                if (!value || !dateFrom || value >= dateFrom)
                                    return Promise.resolve();
                                return Promise.reject(
                                    new Error(
                                        'La fecha hasta debe ser igual o posterior a la fecha de inicio.'
                                    )
                                );
                            },
                        }),
                    ]}
                />

                <div className="movementsSearchBarActions">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={!hasActiveFilters}
                    />
                </div>
            </div>
        </Form>
    );
};
