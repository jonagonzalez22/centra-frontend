import { Form, Row, Col, Switch, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { emailRules } from '@/utils/validationRules';
import { storeNameRules, storePhoneRules, requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreateStoreDto, FilterOptions } from '../../types/store.types';
import './StoreForm.css';

interface StoreFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    filterOptions: FilterOptions | null;
    filterOptionsLoading: boolean;
    onSubmit: (values: CreateStoreDto) => Promise<void>;
}

interface StoreFormValues extends CreateStoreDto {
    is_active: boolean;
}

const buildBusinessTypeOptions = (filterOptions: FilterOptions | null) =>
    filterOptions?.business_types.map((bt) => ({
        label: bt.name,
        value: bt.id,
    })) ?? [];

const buildPlanOptions = (filterOptions: FilterOptions | null) =>
    filterOptions?.plans.map((p) => ({
        label: p.name,
        value: p.id,
    })) ?? [];

const colResponsive = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 12 },
    xl: { span: 12 },
};

export const StoreForm: React.FC<StoreFormProps> = ({
    formId,
    form: externalForm,
    loading,
    filterOptions,
    filterOptionsLoading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<StoreFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: StoreFormValues) => {
        try {
            const payload: CreateStoreDto = {
                ...values,
                inactive_at: values.is_active ? null : new Date().toISOString(),
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

    const businessTypeOptions = buildBusinessTypeOptions(filterOptions);
    const planOptions = buildPlanOptions(filterOptions);

    const isDisabled = loading || filterOptionsLoading;

    return (
        <Form
            form={form}
            id={formId}
            layout="vertical"
            initialValues={{ is_active: true }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="name"
                        label="Nombre de la tienda"
                        placeholder="Ingresá el nombre"
                        rules={storeNameRules()}
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="cuit"
                        label="CUIT"
                        placeholder="11 dígitos sin guiones"
                        rules={[{ required: true, message: 'El CUIT es obligatorio' }]}
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="email"
                        label="Email"
                        placeholder="email@ejemplo.com"
                        rules={emailRules()}
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="phone"
                        label="Teléfono"
                        placeholder="+54XXX XXXXXXX"
                        rules={storePhoneRules()}
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="address"
                        label="Dirección"
                        placeholder="Calle y número"
                        rules={requiredStringRules('La dirección')}
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="city"
                        label="Ciudad"
                        placeholder="Ciudad"
                        rules={requiredStringRules('La ciudad')}
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="state"
                        label="Provincia / Estado"
                        placeholder="Provincia o estado"
                        rules={requiredStringRules('La provincia/estado')}
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="country"
                        label="País"
                        placeholder="País"
                        rules={requiredStringRules('El país')}
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <SelectField
                        name="business_type_id"
                        label="Tipo de Negocio"
                        placeholder="Seleccionar"
                        options={businessTypeOptions}
                        rules={[{ required: true, message: 'El tipo de negocio es obligatorio.' }]}
                        disabled={isDisabled}
                        loading={filterOptionsLoading}
                    />
                </Col>
                <Col {...colResponsive}>
                    <SelectField
                        name="plan_id"
                        label="Plan"
                        placeholder="Seleccionar"
                        options={planOptions}
                        disabled={isDisabled}
                        loading={filterOptionsLoading}
                        allowClear
                    />
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