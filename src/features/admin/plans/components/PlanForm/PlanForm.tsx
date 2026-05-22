import { Form, Row, Col, Switch, InputNumber, Input as AntInput, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { requiredStringRules, planPriceRules, planBillingCycleRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { CreatePlanDto } from '../../types/plan.types';

interface PlanFormProps {
    formId?: string;
    form?: FormInstance;
    loading: boolean;
    onSubmit: (values: CreatePlanDto) => Promise<void>;
}

interface PlanFormValues extends CreatePlanDto {
    is_active: boolean;
    is_trial: boolean;
}

const billingCycleOptions = [
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'yearly' },
];

const colResponsive = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 12 },
    xl: { span: 12 },
};

export const PlanForm: React.FC<PlanFormProps> = ({
    formId,
    form: externalForm,
    loading,
    onSubmit,
}) => {
    const [internalForm] = Form.useForm<PlanFormValues>();
    const form = externalForm ?? internalForm;

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: PlanFormValues) => {
        try {
            const payload: CreatePlanDto = {
                name: values.name,
                description: values.description,
                price: values.price,
                billing_cycle: values.billing_cycle,
                is_trial: values.is_trial,
                is_active: values.is_active,
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

    return (
        <Form
            form={form}
            id={formId}
            layout="vertical"
            className="pb-2"
            initialValues={{ is_active: true, is_trial: false, billing_cycle: 'monthly' }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="name"
                        label="Nombre"
                        placeholder="Ingresá el nombre del plan"
                        rules={requiredStringRules('El nombre')}
                        disabled={loading}
                    />
                </Col>
                <Col {...colResponsive}>
                    <Form.Item
                        name="price"
                        label="Precio"
                        rules={planPriceRules()}
                        labelCol={{ style: { paddingBottom: 1 } }}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="0.00"
                            disabled={loading}
                            min={0}
                            precision={2}
                            prefix="$"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        name="description"
                        label="Descripción"
                        rules={requiredStringRules('La descripción')}
                        labelCol={{ style: { paddingBottom: 1 } }}
                    >
                        <AntInput.TextArea
                            placeholder="Describí el plan"
                            rows={3}
                            disabled={loading}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <SelectField
                        name="billing_cycle"
                        label="Ciclo de facturación"
                        placeholder="Seleccionar"
                        options={billingCycleOptions}
                        rules={planBillingCycleRules()}
                        disabled={loading}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <Form.Item name="is_trial" label="Plan de prueba" valuePropName="checked">
                        <Switch
                            checkedChildren="Sí"
                            unCheckedChildren="No"
                            disabled={loading}
                        />
                    </Form.Item>
                </Col>
                <Col {...colResponsive}>
                    <Form.Item name="is_active" label="Estado" valuePropName="checked">
                        <Switch
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                            disabled={loading}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};
