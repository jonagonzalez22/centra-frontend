import { useCallback, useMemo } from 'react';
import { Form } from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useProductsContext } from '../../context/ProductsContext';
import type { ProductsSearchValues } from '../../interfaces/product.interface';
import './ProductsSearchBar.css';

type StatusValue = 'all' | 'true' | 'false';
type StockTypeValue = 'all' | 'own' | 'shared';
type SellableValue = 'all' | 'true' | 'false';

interface ProductsSearchFormValues {
    name?: string;
    sku?: string;
    category_id?: string;
    is_active: StatusValue;
    stock_type: StockTypeValue;
    is_sellable: SellableValue;
}

const STATUS_OPTIONS = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'true' },
    { label: 'Inactivos', value: 'false' },
];

const STOCK_TYPE_OPTIONS = [
    { label: 'Todos', value: 'all' },
    { label: 'Propio', value: 'own' },
    { label: 'Compartido', value: 'shared' },
];

const SELLABLE_OPTIONS = [
    { label: 'Todos', value: 'all' },
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' },
];

export const ProductsSearchBar = () => {
    const { setFilters, categories, categoriesLoading } = useProductsContext();
    const [form] = Form.useForm<ProductsSearchFormValues>();

    const nameValue = Form.useWatch('name', form);
    const skuValue = Form.useWatch('sku', form);
    const categoryValue = Form.useWatch('category_id', form);
    const statusValue = Form.useWatch('is_active', form);
    const stockTypeValue = Form.useWatch('stock_type', form);
    const sellableValue = Form.useWatch('is_sellable', form);

    const hasActiveFilters = nameValue || skuValue || categoryValue
        || (statusValue && statusValue !== 'all')
        || (stockTypeValue && stockTypeValue !== 'all')
        || (sellableValue && sellableValue !== 'all');

    const buildFilters = useCallback((values: ProductsSearchFormValues): ProductsSearchValues => {
        const filters: ProductsSearchValues = {};

        if (values.name) filters.name = values.name;
        if (values.sku) filters.sku = values.sku;
        if (values.category_id) filters.category_id = values.category_id;
        if (values.is_active && values.is_active !== 'all') {
            filters.is_active = values.is_active === 'true';
        }
        if (values.stock_type && values.stock_type !== 'all') {
            filters.stock_type = values.stock_type;
        }
        if (values.is_sellable && values.is_sellable !== 'all') {
            filters.is_sellable = values.is_sellable === 'true';
        }

        return filters;
    }, []);

    const debouncedSetFilters = useMemo(
        () =>
            debounce((values: ProductsSearchFormValues) => {
                setFilters(buildFilters(values));
            }, 500),
        [setFilters, buildFilters]
    );

    const handleValuesChange = useCallback(
        (_: unknown, allValues: ProductsSearchFormValues) => {
            debouncedSetFilters(allValues);
        },
        [debouncedSetFilters]
    );

    const handleReset = useCallback(() => {
        form.resetFields();
        setFilters({});
    }, [form, setFilters]);

    const categoryOptions = categories.map((c) => ({
        label: c.name,
        value: c.id,
    }));

    return (
        <Form
            form={form}
            layout="vertical"
            className="productsSearchBar"
            onValuesChange={handleValuesChange}
        >
            <div className="productsSearchBarRow">
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={categoriesLoading}
                />

                <InputField
                    name="sku"
                    label="Código"
                    placeholder="Buscar por código"
                    allowClear
                    disabled={categoriesLoading}
                />

                <SelectField
                    name="category_id"
                    label="Categoría"
                    placeholder="Todas"
                    options={categoryOptions}
                    allowClear
                    disabled={categoriesLoading}
                    loading={categoriesLoading}
                />

                <SelectField
                    name="is_active"
                    label="Estado"
                    placeholder="Todos"
                    options={STATUS_OPTIONS}
                    allowClear
                    disabled={categoriesLoading}
                />

                <SelectField
                    name="stock_type"
                    label="Tipo de stock"
                    placeholder="Todos"
                    options={STOCK_TYPE_OPTIONS}
                    allowClear
                    disabled={categoriesLoading}
                />

                <SelectField
                    name="is_sellable"
                    label="Disponible para venta"
                    placeholder="Todos"
                    options={SELLABLE_OPTIONS}
                    allowClear
                    disabled={categoriesLoading}
                />

                <div className="productsSearchBarActions">
                    <Button
                        variant="default"
                        label="Limpiar"
                        action={handleReset}
                        disabled={!hasActiveFilters || categoriesLoading}
                    />
                </div>
            </div>
        </Form>
    );
};
