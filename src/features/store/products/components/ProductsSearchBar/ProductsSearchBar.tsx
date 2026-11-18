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
interface Values {
    name?: string;
    sku?: string;
    category_id?: string;
    brand_id?: string;
    is_active?: StatusValue;
    stock_type?: StockTypeValue;
    is_sellable?: SellableValue;
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
    { label: 'Sí', value: 'true' },
    { label: 'No', value: 'false' },
];
const primaryKeys = ['name', 'sku', 'category_id', 'is_active'] as const;
const advancedKeys = ['brand_id', 'stock_type', 'is_sellable'] as const;

const asValues = (filters: ProductsFilters): Values => ({
    name: filters.name,
    sku: filters.sku,
    category_id: filters.category_id,
    brand_id: filters.brand_id,
    is_active: filters.is_active === undefined ? 'all' : (String(filters.is_active) as StatusValue),
    stock_type: filters.stock_type ?? 'all',
    is_sellable:
        filters.is_sellable === undefined ? 'all' : (String(filters.is_sellable) as SellableValue),
});
const toFilters = (values: Partial<Values>): ProductsSearchValues => ({
    ...(values.name && { name: values.name }),
    ...(values.sku && { sku: values.sku }),
    ...(values.category_id && { category_id: values.category_id }),
    ...(values.brand_id && { brand_id: values.brand_id }),
    ...(values.is_active &&
        values.is_active !== 'all' && { is_active: values.is_active === 'true' }),
    ...(values.stock_type && values.stock_type !== 'all' && { stock_type: values.stock_type }),
    ...(values.is_sellable &&
        values.is_sellable !== 'all' && { is_sellable: values.is_sellable === 'true' }),
});

const Fields = ({
    primary = true,
    advanced = true,
    categoryOptions,
    brandOptions,
    disabled,
}: {
    primary?: boolean;
    advanced?: boolean;
    categoryOptions: { label: string; value: string }[];
    brandOptions: { label: string; value: string }[];
    disabled: boolean;
}) => (
    <>
        {primary && (
            <>
                <InputField
                    name="name"
                    label="Nombre"
                    placeholder="Buscar por nombre"
                    allowClear
                    disabled={disabled}
                />
                <InputField
                    name="sku"
                    label="Código"
                    placeholder="Buscar por código"
                    allowClear
                    disabled={disabled}
                />
                <SelectField
                    name="category_id"
                    label="Categoría"
                    placeholder="Todas"
                    options={categoryOptions}
                    allowClear
                    disabled={disabled}
                    loading={disabled}
                />
                <SelectField
                    name="is_active"
                    label="Estado"
                    placeholder="Todos"
                    options={statusOptions}
                    allowClear
                    disabled={disabled}
                />
            </>
        )}
        {advanced && (
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
                    label="Disponible para venta"
                    placeholder="Todos"
                    options={sellableOptions}
                    allowClear
                    disabled={disabled}
                />
            </>
        )}
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
    useEffect(() => {
        if (advancedOpen) advancedForm.setFieldsValue(asValues(filters));
    }, [advancedForm, advancedOpen, filters]);

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
    const debouncedApplyPrimary = useMemo(() => debounce(applyPrimary, 500), [applyPrimary]);
    useEffect(() => () => debouncedApplyPrimary.cancel(), [debouncedApplyPrimary]);

    const applyAdvanced = () => {
        debouncedApplyPrimary.cancel();
        const primary = primaryKeys.reduce<ProductsFilters>(
            (result, key) =>
                filters[key] === undefined ? result : { ...result, [key]: filters[key] },
            {}
        );
        setFilters({ ...primary, ...toFilters(advancedForm.getFieldsValue()) });
        setAdvancedOpen(false);
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
    if (filters.name) chips.push({ key: 'name', label: 'Nombre', value: filters.name });
    if (filters.sku) chips.push({ key: 'sku', label: 'Código', value: filters.sku });
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
            label: 'Disponible para venta',
            value: filters.is_sellable ? 'Sí' : 'No',
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
                    <Fields
                        categoryOptions={categoryOptions}
                        brandOptions={brandOptions}
                        disabled={categoriesLoading}
                        advanced={false}
                    />
                </div>
                <div className="productsSearchBarActions">
                    <div className="ant-form-item-label" aria-hidden="true">
                        <label>&nbsp;</label>
                    </div>
                    <div className="productsSearchBarActionsControls">
                        <Button
                            variant="default"
                            label={`Más filtros${advancedCount > 0 ? ` ${advancedCount}` : ''}`}
                            icon={<Filter size={16} />}
                            aria-expanded={advancedOpen}
                            action={() => setAdvancedOpen(true)}
                            disabled={categoriesLoading}
                        >
                            <span>Más filtros</span>
                            {advancedCount > 0 && (
                                <span className="ml-2 rounded-full bg-centra-primary px-2 py-0.5 text-xs text-white">
                                    {advancedCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="default"
                            label="Limpiar"
                            action={clearAll}
                            disabled={activeCount === 0 || categoriesLoading}
                        />
                    </div>
                </div>
            </div>
            <Drawer
                open={advancedOpen}
                onClose={() => setAdvancedOpen(false)}
                title="Más filtros"
                width={450}
                footer={
                    <div className="flex justify-between gap-3">
                        <Button
                            variant="default"
                            label="Limpiar"
                            action={() => advancedForm.resetFields()}
                        />
                        <Button variant="primary" label="Aplicar filtros" action={applyAdvanced} />
                    </div>
                }
            >
                <Form form={advancedForm} layout="vertical">
                    <Fields
                        categoryOptions={categoryOptions}
                        brandOptions={brandOptions}
                        disabled={categoriesLoading}
                        primary={false}
                    />
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
                                    '--products-chip-close-bg': token.colorTextLightSolid,
                                    '--products-chip-close-color': token.colorPrimary,
                                    '--products-chip-close-hover': token.colorPrimaryBg,
                                    '--products-chip-close-focus': token.colorTextLightSolid,
                                } as CSSProperties
                            }
                        >
                            <span>{chip.label}</span>
                            <span className="mx-1">·</span>
                            <span className="truncate">{chip.value}</span>
                        </Tag>
                    ))}
                </div>
            )}
        </Form>
    );
};
