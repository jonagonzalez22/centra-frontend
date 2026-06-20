import { Form, Row, Col, Switch, InputNumber, message, Spin } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import Input from '@/components/Input/Input';
import SelectField from '@/components/SelectField/SelectField';
import { Button } from '@/components/Button';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateProductDto, Product } from '../../interfaces/product.interface';
import type { Category } from '@/features/store/categories/interfaces/category.interface';
import './ProductForm.css';

interface ProductFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    categories: Category[];
    categoriesLoading: boolean;
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
    stock: number | null;
    stock_min: number | null;
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

const requiredNumberRules = (fieldName: string): { required: boolean; message: string }[] => [
    { required: true, message: `${fieldName} es obligatorio.` },
];

export const ProductForm = ({
    formId,
    form: externalForm,
    loading,
    categories,
    categoriesLoading,
    onSubmit,
    skuGenerating = false,
    handleGenerateSku,
}: ProductFormProps) => {
    const [internalForm] = Form.useForm<ProductFormValues>();
    const form = externalForm ?? internalForm;

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
                stock: values.stock ?? 0,
                stock_min: values.stock_min ?? 0,
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
    const isDisabled = loading || categoriesLoading;
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
                <Col {...colResponsive}>
                    <Form.Item
                        name="stock"
                        label="Stock Inicial"
                        rules={requiredNumberRules('El stock inicial')}
                    >
                        <InputNumber
                            placeholder="0"
                            style={{ width: '100%' }}
                            min={0}
                            precision={0}
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </Col>
                <Col {...colResponsive}>
                    <Form.Item
                        name="stock_min"
                        label="Stock Mínimo"
                        rules={requiredNumberRules('El stock mínimo')}
                    >
                        <InputNumber
                            placeholder="0"
                            style={{ width: '100%' }}
                            min={0}
                            precision={0}
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
