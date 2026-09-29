import { Form, Row, Col, Switch, InputNumber, message, Spin } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import Input from '@/components/Input/Input';
import SelectField from '@/components/SelectField/SelectField';
import { Button } from '@/components/Button';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateProductDto, MeasurementUnit, Product } from '../../interfaces/product.interface';
import type { Category } from '@/features/store/categories/interfaces/category.interface';
import './ProductForm.css';
import type { DecimalString } from '@/types/decimal';
import { compareDecimalStrings, formatQuantityForDisplay, normalizeDecimalString } from '@/utils/quantity';

interface ProductFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    categories: Category[];
    categoriesLoading: boolean;
    measurementUnits: MeasurementUnit[];
    measurementUnitsLoading: boolean;
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
    is_active: boolean;
    category_id: string;
}

const colResponsive = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 12 },
    xl: { span: 12 },
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
    measurementUnits,
    measurementUnitsLoading,
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
                stock: isEditing ? undefined : normalizeDecimalString(values.stock ?? '0'),
                stock_min: normalizeDecimalString(values.stock_min ?? '0'),
                stock_measurement_unit_id: values.stock_measurement_unit_id ?? defaultMeasurementUnitId ?? '',
                sale_quantity_step: normalizeDecimalString(values.sale_quantity_step ?? '1'),
                is_active: values.is_active,
                category_id: values.category_id,
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

    return (
        <Form
            form={form}
            id={formId}
            layout="vertical"
            initialValues={{
                is_active: true,
                stock: null,
                stock_min: null,
                stock_measurement_unit_id: defaultMeasurementUnitId,
                sale_quantity_step: '1.0000',
                cost: null,
                price: null,
            }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="name"
                        label="Nombre"
                        placeholder="Nombre del producto"
                        rules={requiredStringRules('El nombre')}
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <SelectField
                        name="category_id"
                        label="Categoría"
                        placeholder="Seleccionar"
                        options={categoryOptions}
                        rules={[{ required: true, message: 'La categoría es obligatoria.' }]}
                        disabled={isDisabled}
                        loading={categoriesLoading}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <Form.Item
                        name="sku"
                        label="Código Interno (SKU)"
                        rules={requiredStringRules('El SKU')}
                    >
                        <Input
                            placeholder="Código interno"
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
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="barcode"
                        label="Código de Barras"
                        placeholder="Opcional"
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="description"
                        label="Descripción"
                        placeholder="Descripción del producto (opcional)"
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
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
                </Col>
                <Col {...colResponsive}>
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
                </Col>
            </Row>

            <Row gutter={16}>
                {!isEditing && (
                    <Col {...colResponsive}>
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
                    </Col>
                )}
                <Col {...colResponsive}>
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
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <SelectField
                        name="stock_measurement_unit_id"
                        label="Unidad de medida"
                        placeholder="Seleccionar unidad"
                        options={measurementUnitOptions}
                        rules={[{ required: true, message: 'La unidad de medida es obligatoria.' }]}
                        disabled={isDisabled || measurementUnitOptions.length === 0}
                        loading={measurementUnitsLoading}
                    />
                </Col>
                <Col {...colResponsive}>
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
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <Form.Item name="is_active" label="Estado" valuePropName="checked">
                        <Switch
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};
