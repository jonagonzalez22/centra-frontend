import { Alert, Form, Row, Col, Switch, InputNumber, message, Spin, Select, Checkbox } from 'antd';
import { useEffect } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import Input from '@/components/Input/Input';
import SelectField from '@/components/SelectField/SelectField';
import { Button } from '@/components/Button';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateProductDto, MeasurementUnit, Product, ProductSourceCandidate, InitialProductSupplierDto } from '../../interfaces/product.interface';
import type { Category } from '@/features/store/categories/interfaces/category.interface';
import './ProductForm.css';
import type { DecimalString } from '@/types/decimal';
import { compareDecimalStrings, formatQuantityForDisplay, normalizeDecimalString } from '@/utils/quantity';
import { buildStockConsumptionDescription, sourceOptionMatches } from '../../utils/stockSourcePresentation';
import type { ProductBrand } from '../../interfaces/product.interface';
import type { Supplier } from '@/features/store/suppliers/suppliers.service';

type ActiveSupplierOption = Pick<Supplier, 'id' | 'business_name' | 'is_active'>;

interface ProductFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    categories: Category[];
    categoriesLoading: boolean;
    brands?: ProductBrand[];
    brandsLoading?: boolean;
    suppliers?: ActiveSupplierOption[];
    suppliersLoading?: boolean;
    measurementUnits: MeasurementUnit[];
    measurementUnitsLoading: boolean;
    sourceProducts?: ProductSourceCandidate[];
    onSearchSourceProducts?: (query: string) => void;
    defaultMeasurementUnitId?: string;
    onSubmit: (values: CreateProductDto) => Promise<void>;
    product?: Product;
    skuGenerating?: boolean;
    handleGenerateSku?: () => void;
}

interface ProductFormValues {
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    price: number | null;
    cost: number | null;
    stock: DecimalString | null;
    stock_min: DecimalString | null;
    stock_measurement_unit_id?: string;
    sale_quantity_step: DecimalString | null;
    uses_external_stock?: boolean;
    stock_source_product_id?: string | null;
    stock_consumption_quantity?: DecimalString | null;
    is_active: boolean;
    is_sellable: boolean;
    category_id: string;
    brand_id?: string | null;
    suppliers?: InitialProductSupplierDto[];
}

const colFullWidth = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 24 },
    lg: { span: 24 },
    xl: { span: 24 },
};

const buildCategoryOptions = (categories: Category[]) =>
    categories.map((c) => ({
        label: c.name,
        value: c.id,
    }));

const buildMeasurementUnitOptions = (units: MeasurementUnit[]) =>
    units.map((unit) => ({
        label: `${unit.name} (${unit.symbol})`,
        value: unit.id,
    }));

const parseFormattedQuantity = (value: string | undefined): string => {
    const raw = value ?? '';

    return raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
};

const saleQuantityStepRules = [
    { required: true, message: 'El paso de venta es obligatorio.' },
    {
        validator: (_: unknown, value: DecimalString | null | undefined) => {
            if (value === null || value === undefined || value === '') {
                return Promise.resolve();
            }

            try {
                if (compareDecimalStrings(value, '0.0000') <= 0) {
                    return Promise.reject(new Error('El paso de venta debe ser mayor a cero.'));
                }

                normalizeDecimalString(value);
                return Promise.resolve();
            } catch {
                return Promise.reject(new Error('El paso de venta debe tener hasta 4 decimales.'));
            }
        },
    },
];

const requiredNumberRules = (fieldName: string): { required: boolean; message: string }[] => [
    { required: true, message: `${fieldName} es obligatorio.` },
];

export const ProductForm = ({
    formId,
    form: externalForm,
    loading,
    categories,
    categoriesLoading,
    brands = [],
    brandsLoading = false,
    suppliers = [],
    suppliersLoading = false,
    measurementUnits,
    measurementUnitsLoading,
    sourceProducts = [],
    onSearchSourceProducts,
    defaultMeasurementUnitId,
    onSubmit,
    product,
    skuGenerating = false,
    handleGenerateSku,
}: ProductFormProps) => {
    const [internalForm] = Form.useForm<ProductFormValues>();
    const form = externalForm ?? internalForm;

    const isEditing = !!product;


    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: ProductFormValues) => {
        try {
            const payload: CreateProductDto = {
                name: values.name,
                sku: values.sku,
                barcode: values.barcode,
                description: values.description,
                price: values.price ?? 0,
                cost: values.cost,
                stock: isEditing || values.uses_external_stock ? undefined : normalizeDecimalString(values.stock ?? '0'),
                stock_min: values.uses_external_stock ? '0.0000' : normalizeDecimalString(values.stock_min ?? '0'),
                stock_measurement_unit_id: values.stock_measurement_unit_id ?? defaultMeasurementUnitId ?? '',
                sale_quantity_step: normalizeDecimalString(values.sale_quantity_step ?? '1'),
                stock_source_product_id: values.uses_external_stock ? values.stock_source_product_id ?? null : null,
                stock_consumption_quantity: values.uses_external_stock
                    ? normalizeDecimalString(values.stock_consumption_quantity ?? '0')
                    : null,
                is_active: values.is_active,
                is_sellable: values.is_sellable,
                category_id: values.category_id,
                brand_id: values.brand_id ?? null,
                suppliers: isEditing || values.uses_external_stock
                    ? undefined
                    : (values.suppliers ?? []).map((supplier) => ({
                        supplier_id: supplier.supplier_id,
                        supplier_code: supplier.supplier_code?.trim() || null,
                        supplier_product_name: supplier.supplier_product_name?.trim() || null,
                        is_preferred: supplier.is_preferred ?? false,
                    })),
            };
            await onSubmit(payload);
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                const fieldErrors = Object.entries(apiError.errors).map(([field, messages]) => ({
                    name: [field],
                    errors: messages,
                }));
                form.setFields(fieldErrors as Parameters<FormInstance['setFields']>[0]);
            }
        }
    };

    const categoryOptions = buildCategoryOptions(categories);
    const measurementUnitOptions = buildMeasurementUnitOptions(measurementUnits);
    const isDisabled = loading || categoriesLoading || measurementUnitsLoading;
    const nameValue = Form.useWatch('name', form);
    const categoryValue = Form.useWatch('category_id', form);
    const canGenerateSku = !!nameValue || !!categoryValue;
    const usesExternalStock = Form.useWatch('uses_external_stock', form) ?? false;
    const selectedSourceId = Form.useWatch('stock_source_product_id', form);
    const selectedMeasurementUnitId = Form.useWatch('stock_measurement_unit_id', form);
    const stockConsumptionQuantity = Form.useWatch('stock_consumption_quantity', form);
    const selectedSource = sourceProducts.find((candidate) => candidate.id === selectedSourceId);
    const selectedChildUnit = measurementUnits.find((unit) => unit.id === selectedMeasurementUnitId);
    const sourceOptions = sourceProducts
        .filter((candidate) => candidate.id !== product?.id && candidate.stock_source_product_id === null)
        .map((candidate) => ({
            value: candidate.id,
            label: `${candidate.name}${candidate.sku ? ` · ${candidate.sku}` : ''} · ${candidate.stock_measurement_unit?.symbol ?? '—'}`,
        }));
    const consumptionDescription = buildStockConsumptionDescription(
        selectedSource,
        stockConsumptionQuantity,
        selectedChildUnit?.symbol,
    );
    const selectedSuppliers = Form.useWatch('suppliers', form) ?? [];

    useEffect(() => {
        if (usesExternalStock) {
            form.setFieldValue('suppliers', []);
        }
    }, [form, usesExternalStock]);

    return (
        <Form
            form={form}
            id={formId}
            className="productForm"
            layout="vertical"
            initialValues={{
                is_active: true,
                stock: null,
                stock_min: null,
                stock_measurement_unit_id: defaultMeasurementUnitId,
                sale_quantity_step: '1.0000',
                cost: null,
                uses_external_stock: false,
                is_sellable: true,
                price: null,
            }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <Row gutter={16}>
                <Col {...colFullWidth}>
                    <Form.Item name="uses_external_stock" label="Usa stock de otro producto" valuePropName="checked">
                        <Switch checkedChildren="Sí" unCheckedChildren="No" disabled={isDisabled} />
                    </Form.Item>
                </Col>
            </Row>

            {usesExternalStock && (
                <>
                    <div className="productFormGrid productFormGrid--shared-stock">
                        <div>
                            <SelectField
                                name="stock_source_product_id"
                                label="Producto fuente"
                                placeholder="Seleccionar producto fuente"
                                options={sourceOptions}
                                rules={[{ required: true, message: 'El producto fuente es obligatorio.' }]}
                                disabled={isDisabled}
                                showSearch
                                filterOption={sourceOptionMatches}
                                onSearch={onSearchSourceProducts}
                                notFoundContent="Buscá por nombre o código"
                            />
                        </div>
                        <div>
                            <Form.Item
                                name="stock_consumption_quantity"
                                label="Consumo de stock por unidad vendida"
                                rules={saleQuantityStepRules}
                                extra={selectedSource
                                    ? `La unidad de consumo es ${selectedSource.stock_measurement_unit?.symbol ?? 'la unidad de la fuente'}.`
                                    : 'Seleccioná una fuente para ver su unidad.'}
                            >
                                <InputNumber<string>
                                    stringMode
                                    min="0.0001"
                                    precision={4}
                                    step="1"
                                    style={{ width: '100%' }}
                                    parser={parseFormattedQuantity}
                                    formatter={(value) => value ? formatQuantityForDisplay(value) : ''}
                                />
                            </Form.Item>
                        </div>
                    </div>
                    <Alert
                        className="productFormSharedStockAlert mb-3"
                        type="info"
                        showIcon
                        title="Stock compartido"
                        description={(
                            <>
                                <div>El stock de este producto se administra desde su producto fuente.</div>
                                <div>{consumptionDescription}</div>
                            </>
                        )}
                    />
                </>
            )}

            <div className="productFormGrid productFormGrid--three">
                <div>
                    <InputField
                        name="name"
                        label="Nombre"
                        placeholder="Nombre del producto"
                        rules={requiredStringRules('El nombre')}
                        disabled={isDisabled}
                    />
                </div>
                <div>
                    <SelectField
                        name="brand_id"
                        label="Marca"
                        placeholder="Sin marca"
                        options={brands.map((brand) => ({ label: brand.name, value: brand.id }))}
                        allowClear
                        showSearch
                        disabled={isDisabled || brandsLoading}
                        loading={brandsLoading}
                    />
                </div>
                <div>
                    <SelectField
                        name="category_id"
                        label="Categoría"
                        placeholder="Seleccionar"
                        options={categoryOptions}
                        rules={[{ required: true, message: 'La categoría es obligatoria.' }]}
                        disabled={isDisabled}
                        loading={categoriesLoading}
                    />
                </div>
            </div>

            <div className="productFormGrid productFormGrid--three">
                <div>
                    <Form.Item
                        name="sku"
                        label="Código"
                        rules={requiredStringRules('El código')}
                    >
                        <Input
                            placeholder="Ingresar código"
                            disabled={isDisabled}
                            suffix={
                                <div className="flex items-center gap-1">
                                    {skuGenerating ? (
                                        <Spin size="small" />
                                    ) : (
                                        <Button
                                            variant="link"
                                            size="small"
                                            label="Generar"
                                            action={handleGenerateSku}
                                            disabled={!canGenerateSku || isDisabled}
                                        />
                                    )}
                                </div>
                            }
                        />
                    </Form.Item>
                </div>
                <div>
                    <InputField
                        name="barcode"
                        label="Código de Barras"
                        placeholder="Opcional"
                        disabled={isDisabled}
                    />
                </div>
                <div>
                    <InputField
                        name="description"
                        label="Descripción"
                        placeholder="Descripción del producto (opcional)"
                        disabled={isDisabled}
                    />
                </div>
            </div>

            {!isEditing && !usesExternalStock && (
                <section className="productFormSuppliers" aria-labelledby="productFormSuppliersTitle">
                    <div className="productFormSuppliersHeader">
                        <div>
                            <div className="productFormSuppliersTitle" id="productFormSuppliersTitle">
                                Proveedores <span>Opcional</span>
                            </div>
                            <div className="productFormSuppliersHelp">
                                Asociá proveedores sólo si este producto se compra a terceros.
                            </div>
                        </div>
                    </div>

                    <Form.List name="suppliers">
                        {(fields, { add, remove }) => (
                            <div className="productFormSuppliersList">
                                {fields.map((field) => {
                                    const { key: fieldKey, ...fieldProps } = field;
                                    const selectedSupplierIds = selectedSuppliers
                                        .map((supplier: InitialProductSupplierDto | undefined) => supplier?.supplier_id)
                                        .filter((supplierId: string | undefined): supplierId is string => !!supplierId);
                                    const currentSupplierId = selectedSuppliers[field.name]?.supplier_id;
                                    const supplierOptions = suppliers
                                        .filter((supplier) => supplier.id === currentSupplierId || !selectedSupplierIds.includes(supplier.id))
                                        .map((supplier) => ({ label: supplier.business_name, value: supplier.id }));

                                    return (
                                        <div className="productFormSupplierRow" key={fieldKey}>
                                            <Row gutter={12} align="bottom">
                                                <Col xs={24} md={12}>
                                                    <Form.Item
                                                        {...fieldProps}
                                                        name={[field.name, 'supplier_id']}
                                                        label="Proveedor"
                                                        rules={[{ required: true, message: 'Seleccioná un proveedor.' }]}
                                                    >
                                                        <Select
                                                            placeholder="Seleccionar proveedor"
                                                            options={supplierOptions}
                                                            showSearch
                                                            optionFilterProp="label"
                                                            loading={suppliersLoading}
                                                            disabled={isDisabled || suppliersLoading}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item {...fieldProps} name={[field.name, 'supplier_code']} label="Código proveedor">
                                                        <Input placeholder="Opcional" disabled={isDisabled} />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={24} md={6}>
                                                    <Form.Item {...fieldProps} name={[field.name, 'supplier_product_name']} label="Nombre según proveedor">
                                                        <Input placeholder="Opcional" disabled={isDisabled} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <div className="productFormSupplierActions">
                                                <Form.Item {...fieldProps} name={[field.name, 'is_preferred']} valuePropName="checked" noStyle>
                                                    <Checkbox
                                                        disabled={isDisabled}
                                                        onChange={(event) => {
                                                            if (!event.target.checked) return;
                                                            const nextSuppliers = selectedSuppliers.map((supplier: InitialProductSupplierDto, index: number) => ({
                                                                ...supplier,
                                                                is_preferred: index === field.name,
                                                            }));
                                                            form.setFieldValue('suppliers', nextSuppliers);
                                                        }}
                                                    >
                                                        Proveedor preferido
                                                    </Checkbox>
                                                </Form.Item>
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    aria-label="Quitar proveedor"
                                                    label="Quitar proveedor"
                                                    action={() => remove(field.name)}
                                                    disabled={isDisabled}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <Button
                                    variant="default"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    label={fields.length === 0 ? 'Agregar proveedor' : 'Agregar otro proveedor'}
                                    aria-label={fields.length === 0 ? 'Agregar proveedor' : 'Agregar otro proveedor'}
                                    action={() => add({ is_preferred: false })}
                                    disabled={isDisabled || suppliersLoading || fields.length >= suppliers.length}
                                />
                            </div>
                        )}
                    </Form.List>
                </section>
            )}

            <div className={`productFormGrid ${usesExternalStock || isEditing ? 'productFormGrid--two' : 'productFormGrid--three'}`}>
                <div>
                    <Form.Item
                        name="price"
                        label="Precio"
                        rules={requiredNumberRules('El precio')}
                    >
                        <InputNumber
                            placeholder="0"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </div>
                <div>
                    <Form.Item
                        name="cost"
                        label="Costo"
                        rules={requiredNumberRules('El costo')}
                    >
                        <InputNumber
                            placeholder="0"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </div>
                {!usesExternalStock && !isEditing && (
                    <div>
                        <Form.Item
                            name="stock"
                            label="Stock Inicial"
                            rules={requiredNumberRules('El stock inicial')}
                        >
                            <InputNumber<string>
                                stringMode
                                placeholder="0"
                                style={{ width: '100%' }}
                                min="0"
                                precision={4}
                                step="1"
                                formatter={(value) => value ? formatQuantityForDisplay(value) : ''}
                                parser={parseFormattedQuantity}
                                disabled={isDisabled}
                            />
                        </Form.Item>
                    </div>
                )}
            </div>

            <div className={`productFormGrid ${usesExternalStock ? 'productFormGrid--two' : 'productFormGrid--three'}`}>
                {!usesExternalStock && (
                    <div>
                        <Form.Item
                            name="stock_min"
                            label="Stock Mínimo"
                            rules={requiredNumberRules('El stock mínimo')}
                        >
                            <InputNumber<string>
                                stringMode
                                placeholder="0"
                                style={{ width: '100%' }}
                                min="0"
                                precision={4}
                                step="1"
                                formatter={(value) => value ? formatQuantityForDisplay(value) : ''}
                                parser={parseFormattedQuantity}
                                disabled={isDisabled}
                            />
                        </Form.Item>
                    </div>
                )}
                <div>
                    <SelectField
                        name="stock_measurement_unit_id"
                        label="Unidad de medida"
                        placeholder="Seleccionar unidad"
                        options={measurementUnitOptions}
                        rules={[{ required: true, message: 'La unidad de medida es obligatoria.' }]}
                        disabled={isDisabled || measurementUnitOptions.length === 0}
                        loading={measurementUnitsLoading}
                    />
                </div>
                <div>
                    <Form.Item
                        name="sale_quantity_step"
                        label="Cantidad mínima de venta"
                        extra="Define la cantidad mínima en la que se puede vender o pedir este producto."
                        rules={saleQuantityStepRules}
                    >
                        <InputNumber<string>
                            stringMode
                            placeholder="1"
                            style={{ width: '100%' }}
                            min="0.0001"
                            precision={4}
                            step="1"
                            formatter={(value) => value ? formatQuantityForDisplay(value) : ''}
                            parser={parseFormattedQuantity}
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </div>
            </div>

            <div className="productFormGrid productFormGrid--two">
                <div>
                    <Form.Item name="is_active" label="Estado" valuePropName="checked">
                        <Switch
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </div>
                <div>
                    <Form.Item
                        name="is_sellable"
                        label="Disponible para venta"
                        valuePropName="checked"
                        extra="Si está desactivado, el producto seguirá disponible para inventario y gestión, pero no podrá seleccionarse en nuevas ventas o pedidos."
                    >
                        <Switch
                            checkedChildren="Sí"
                            unCheckedChildren="No"
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </div>
            </div>
        </Form>
    );
};
