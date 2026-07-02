import { useEffect } from 'react';
import { Form, Row, Col, Switch, Input, message } from 'antd';
import type { FormInstance } from 'antd';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { requiredStringRules } from '@/utils/validationRules';
import { Button } from '@/components/Button';
import type { Customer, UpdateCustomerDto } from '../../types/customer.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface CustomerInfoFormProps {
    form: FormInstance;
    customer: Customer;
    loading: boolean;
    commercialGroupOptions: { label: string; value: string }[];
    groupsLoading: boolean;
    onSubmit: (values: UpdateCustomerDto) => Promise<void>;
}

const colResponsive = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 12 },
    xl: { span: 12 },
};

export const CustomerInfoForm = ({
    form,
    customer,
    loading,
    commercialGroupOptions,
    groupsLoading,
    onSubmit,
}: CustomerInfoFormProps) => {
    const isDisabled = loading;

    const documentTypeOptions = customer
        ? [{ label: customer.document_type.name, value: customer.document_type.id }]
        : [];

    useEffect(() => {
        if (customer) {
            form.setFieldsValue({
                customer_code: customer.customer_code,
                display_name: customer.display_name,
                first_name: customer.first_name ?? undefined,
                last_name: customer.last_name ?? undefined,
                company_name: customer.company_name ?? undefined,
                document_type_id: customer.document_type.id,
                document_number: customer.document_number,
                commercial_group_id: customer.commercial_group?.id ?? undefined,
                status: customer.status === 'active',
                notes: customer.notes ?? undefined,
            });
        }
    }, [customer, form]);

    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: Record<string, unknown>) => {
        const normalizedDocNumber = (values.document_number as string).replace(/[.-]/g, '');
        const payload: UpdateCustomerDto = {
            display_name: values.display_name as string,
            first_name: (values.first_name as string) || null,
            last_name: (values.last_name as string) || null,
            company_name: (values.company_name as string) || null,
            document_type_id: values.document_type_id as string,
            document_number: normalizedDocNumber,
            commercial_group_id: (values.commercial_group_id as string) || null,
            status: values.status ? 'active' : 'inactive',
            notes: (values.notes as string) || null,
        };
        try {
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
            layout="vertical"
            initialValues={{ status: true }}
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            validateTrigger="onBlur"
        >
            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="customer_code"
                        label="Código de Cliente"
                        disabled
                    />
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="display_name"
                        label="Nombre de Visualización"
                        placeholder="Ingresá el nombre"
                        rules={requiredStringRules('El nombre de visualización')}
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="first_name"
                        label="Nombres"
                        placeholder="Ingresá los nombres"
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <InputField
                        name="last_name"
                        label="Apellidos"
                        placeholder="Ingresá los apellidos"
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="company_name"
                        label="Razón Social"
                        placeholder="Ingresá la razón social"
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <SelectField
                        name="document_type_id"
                        label="Tipo de Documento"
                        placeholder="Seleccionar"
                        options={documentTypeOptions}
                        rules={requiredStringRules('El tipo de documento')}
                        disabled={isDisabled}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <InputField
                        name="document_number"
                        label="Número de Documento"
                        placeholder="Ingresá el número"
                        rules={requiredStringRules('El número de documento')}
                        disabled={isDisabled}
                    />
                </Col>
                <Col {...colResponsive}>
                    <SelectField
                        name="commercial_group_id"
                        label="Grupo Comercial"
                        placeholder="Seleccionar"
                        options={commercialGroupOptions}
                        allowClear
                        disabled={isDisabled || groupsLoading}
                        loading={groupsLoading}
                    />
                </Col>
            </Row>

            <Row gutter={16}>
                <Col {...colResponsive}>
                    <Form.Item
                        name="status"
                        label="Estado"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Activo"
                            unCheckedChildren="Inactivo"
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item name="notes" label="Notas">
                        <Input.TextArea
                            rows={3}
                            placeholder="Notas adicionales..."
                            disabled={isDisabled}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Button
                        variant="primary"
                        label="Guardar Cambios"
                        htmlType="submit"
                        loading={isDisabled}
                    />
                </Col>
            </Row>
        </Form>
    );
};
