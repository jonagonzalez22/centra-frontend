import { Form, Tag, theme } from 'antd';
import { Filter } from 'lucide-react';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '@/components/Button';
import Drawer from '@/components/Drawer/Drawer';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { useProductsContext } from '../../context/ProductsContext';
import type { ProductsFilters, ProductsSearchValues } from '../../interfaces/product.interface';
import './ProductsSearchBar.css';

type StatusValue = 'all' | 'true' | 'false';
type StockTypeValue = 'all' | 'own' | 'shared';
type SellableValue = 'all' | 'true' | 'false';
type StockStatusValue = 'all' | 'low' | 'out';
interface Values {
    q?: string;
    category_id?: string;
    brand_id?: string;
    is_active?: StatusValue;
    stock_type?: StockTypeValue;
    is_sellable?: SellableValue;
    stock_status?: StockStatusValue;
}

const statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'true' },
    { label: 'Inactivos', value: 'false' },
];
const stockTypeOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Propio', value: 'own' },
    { label: 'Compartido', value: 'shared' },
];
const sellableOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Habilitados', value: 'true' },
    { label: 'Deshabilitados', value: 'false' },
];
const stockStatusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Stock bajo', value: 'low' },
    { label: 'Sin stock', value: 'out' },
];
const advancedKeys = ['brand_id', 'stock_type', 'is_sellable', 'stock_status'] as const;

const asValues = (filters: ProductsFilters): Values => ({
    q: filters.q,
    category_id: filters.category_id,
    brand_id: filters.brand_id,
    is_active: filters.is_active === undefined ? 'all' : (String(filters.is_active) as StatusValue),
    stock_type: filters.stock_type ?? 'all',
    is_sellable:
        filters.is_sellable === undefined ? 'all' : (String(filters.is_sellable) as SellableValue),
    stock_status: filters.stock_status ?? 'all',
});
const toFilters = (values: Partial<Values>): ProductsSearchValues => ({
    ...(values.q?.trim() && { q: values.q.trim() }),
    ...(values.category_id && { category_id: values.category_id }),
    ...(values.brand_id && { brand_id: values.brand_id }),
    ...(values.is_active &&
        values.is_active !== 'all' && { is_active: values.is_active === 'true' }),
    ...(values.stock_type && values.stock_type !== 'all' && { stock_type: values.stock_type }),
    ...(values.is_sellable &&
        values.is_sellable !== 'all' && { is_sellable: values.is_sellable === 'true' }),
    ...(values.stock_status &&
        values.stock_status !== 'all' && { stock_status: values.stock_status }),
});

const AdvancedFields = ({
    brandOptions,
    disabled,
}: {
    brandOptions: { label: string; value: string }[];
    disabled: boolean;
}) => (
    <>
        <SelectField
            name="brand_id"
            label="Marca"
            placeholder="Todas"
            options={brandOptions}
            allowClear
            showSearch
            disabled={disabled}
        />
        <SelectField
            name="stock_type"
            label="Tipo de stock"
            placeholder="Todos"
            options={stockTypeOptions}
            allowClear
            disabled={disabled}
        />
        <SelectField
            name="is_sellable"
            label="Disponibilidad para venta"
            placeholder="Todos"
            options={sellableOptions}
            allowClear
            disabled={disabled}
        />
        <SelectField
            name="stock_status"
            label="Situación de stock"
            placeholder="Todos"
            options={stockStatusOptions}
            allowClear
            disabled={disabled}
        />
    </>
);

export const ProductsSearchBar = () => {
    const { token } = theme.useToken();
    const {
        setFilters,
        filters,
        categories,
        categoriesLoading,
        brands = [],
    } = useProductsContext();
    const [primaryForm] = Form.useForm<Values>();
    const [advancedForm] = Form.useForm<Values>();
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const categoryOptions = categories.map((category) => ({
        label: category.name,
        value: category.id,
    }));
    const brandOptions = brands.map((brand) => ({ label: brand.name, value: brand.id }));
    const advancedCount = advancedKeys.filter((key) => filters[key] !== undefined).length;
    const activeCount = Object.entries(filters).filter(
        ([key, value]) => !['page', 'per_page'].includes(key) && value !== undefined && value !== ''
    ).length;

    useEffect(() => {
        primaryForm.setFieldsValue(asValues(filters));
    }, [filters, primaryForm]);
    const applyPrimary = useCallback(
        (values: Values) => {
            const advanced = advancedKeys.reduce<ProductsFilters>(
                (result, key) =>
                    filters[key] === undefined ? result : { ...result, [key]: filters[key] },
                {}
            );
            setFilters({ ...advanced, ...toFilters(values) });
        },
        [filters, setFilters]
    );
    const debouncedApplyPrimary = useMemo(() => debounce(applyPrimary, 400), [applyPrimary]);
    useEffect(() => () => debouncedApplyPrimary.cancel(), [debouncedApplyPrimary]);

    const openAdvanced = () => {
        advancedForm.setFieldsValue(asValues(filters));
        setAdvancedOpen(true);
    };
    const applyAdvanced = () => {
        debouncedApplyPrimary.cancel();
        setFilters({
            ...toFilters(primaryForm.getFieldsValue()),
            ...toFilters(advancedForm.getFieldsValue()),
        });
        setAdvancedOpen(false);
    };
    const clearAdvanced = () => {
        debouncedApplyPrimary.cancel();
        advancedForm.setFieldsValue({
            brand_id: undefined,
            stock_type: 'all',
            is_sellable: 'all',
            stock_status: 'all',
        });
        setFilters(toFilters(primaryForm.getFieldsValue()));
    };
    const clearAll = () => {
        debouncedApplyPrimary.cancel();
        primaryForm.resetFields();
        advancedForm.resetFields();
        setFilters({});
    };
    const clearFilter = (key: keyof ProductsFilters) => {
        debouncedApplyPrimary.cancel();
        const next = { ...filters };
        delete next[key];
        setFilters(next);
    };

    const category = categories.find((item) => item.id === filters.category_id);
    const brand = brands.find((item) => item.id === filters.brand_id);
    const chips: { key: keyof ProductsFilters; label: string; value: string }[] = [];
    if (filters.q) chips.push({ key: 'q', label: 'Búsqueda', value: filters.q });
    if (filters.category_id)
        chips.push({
            key: 'category_id',
            label: 'Categoría',
            value: category?.name ?? filters.category_id,
        });
    if (filters.is_active !== undefined)
        chips.push({
            key: 'is_active',
            label: 'Estado',
            value: filters.is_active ? 'Activo' : 'Inactivo',
        });
    if (filters.brand_id)
        chips.push({ key: 'brand_id', label: 'Marca', value: brand?.name ?? filters.brand_id });
    if (filters.stock_type)
        chips.push({
            key: 'stock_type',
            label: 'Tipo de stock',
            value: filters.stock_type === 'own' ? 'Propio' : 'Compartido',
        });
    if (filters.is_sellable !== undefined)
        chips.push({
            key: 'is_sellable',
            label: 'Venta',
            value: filters.is_sellable ? 'Habilitada' : 'Deshabilitada',
        });
    if (filters.stock_status)
        chips.push({
            key: 'stock_status',
            label: 'Stock',
            value: filters.stock_status === 'low' ? 'Bajo' : 'Sin stock',
        });

    return (
        <Form
            form={primaryForm}
            layout="vertical"
            className="productsSearchBar"
            onValuesChange={(_, values) => debouncedApplyPrimary(values)}
        >
            <div className="productsSearchBarToolbar">
                <div className="productsSearchBarPrimaryFilters">
                    <InputField
                        name="q"
                        label="Buscar"
                        placeholder="Buscar por nombre o código"
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
                        options={statusOptions}
                        allowClear
                        disabled={categoriesLoading}
                    />
                </div>
                <div className="productsSearchBarActions">
                    <div className="ant-form-item-label" aria-hidden="true">
                        <label>&nbsp;</label>
                    </div>
                    <div className="productsSearchBarActionsControls">
                        <Button
                            variant="default"
                            label={`Más filtros${advancedCount ? ` (${advancedCount})` : ''}`}
                            icon={<Filter size={16} />}
                            aria-expanded={advancedOpen}
                            action={openAdvanced}
                            disabled={categoriesLoading}
                        />
                        {activeCount > 0 && (
                            <Button variant="default" label="Limpiar" action={clearAll} />
                        )}
                    </div>
                </div>
            </div>
            <Drawer
                open={advancedOpen}
                onClose={() => setAdvancedOpen(false)}
                title="Más filtros"
                width={450}
                destroyOnClose={false}
                footer={
                    <div className="flex justify-between gap-3">
                        <Button variant="default" label="Limpiar filtros" action={clearAdvanced} />
                        <Button variant="primary" label="Aplicar filtros" action={applyAdvanced} />
                    </div>
                }
            >
                <Form form={advancedForm} layout="vertical">
                    <AdvancedFields brandOptions={brandOptions} disabled={categoriesLoading} />
                </Form>
            </Drawer>
            {chips.length > 0 && (
                <div className="productsSearchBarChips" aria-label="Filtros aplicados">
                    {chips.map((chip) => (
                        <Tag
                            key={chip.key}
                            closable
                            onClose={() => clearFilter(chip.key)}
                            className="productsSearchBarChip !m-0 !flex !h-7 !max-w-full !items-center !rounded-full !px-2 !text-sm"
                            style={
                                {
                                    background: token.colorPrimary,
                                    borderColor: token.colorPrimary,
                                    color: token.colorTextLightSolid,
                                    '--products-filter-chip-close-bg': token.colorTextLightSolid,
                                    '--products-filter-chip-close-color': token.colorPrimary,
                                    '--products-filter-chip-close-hover': token.colorPrimaryBg,
                                    '--products-filter-chip-close-focus': token.colorTextLightSolid,
                                } as CSSProperties
                            }
                        >
                            <span style={{ color: token.colorTextLightSolid }}>{chip.label}</span>
                            <span className="mx-1" style={{ color: token.colorTextLightSolid }}>
                                ·
                            </span>
                            <span className="truncate" style={{ color: token.colorTextLightSolid }}>
                                {chip.value}
                            </span>
                        </Tag>
                    ))}
                </div>
            )}
        </Form>
    );
};
