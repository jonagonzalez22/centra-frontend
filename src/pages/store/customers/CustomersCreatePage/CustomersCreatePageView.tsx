import { Breadcrumb, Row, Col, Switch, Input, Form, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { FormInstance } from 'antd';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import { requiredStringRules } from '@/utils/validationRules';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './CustomersCreatePage.css';

interface CustomersCreatePageViewProps {
    form: FormInstance;
    loading: boolean;
    commercialGroupOptions: { label: string; value: string }[];
    groupsLoading: boolean;
    documentTypeOptions: { label: string; value: string }[];
    documentTypesLoading: boolean;
    onSubmit: (values: Record<string, unknown>) => Promise<void>;
    onBack: () => void;
}

const colResponsive = {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 12 },
    xl: { span: 12 },
};

export const CustomersCreatePageView = ({
    form,
    loading,
    commercialGroupOptions,
    groupsLoading,
    documentTypeOptions,
    documentTypesLoading,
    onSubmit,
    onBack,
}: CustomersCreatePageViewProps) => {
    const handleFinishFailed = () => {
        message.error('Por favor, revisá los campos marcados en rojo.');
    };

    const handleFinish = async (values: Record<string, unknown>) => {
        try {
            await onSubmit(values);
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
        <div className="customersCreatePage">
            <div className="customersCreatePageHeader">
                <Breadcrumb
                    className="customersCreatePageBreadcrumb"
                    items={[
                        { title: <Link to="/tienda/dashboard">Tienda</Link> },
                        { title: <Link to="/tienda/clientes">Clientes</Link> },
                        { title: 'Nuevo Cliente' },
                    ]}
                />
                <div className="customersCreatePageHeaderTop">
                    <Button
                        variant="default"
                        label="Volver"
                        icon={<ArrowLeftOutlined />}
                        action={onBack}
                    />
                </div>
            </div>

            <Card>
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
                                name="display_name"
                                label="Nombre de Visualización"
                                placeholder="Ingresá el nombre"
                                rules={requiredStringRules('El nombre de visualización')}
                                disabled={loading}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col {...colResponsive}>
                            <InputField
                                name="first_name"
                                label="Nombres"
                                placeholder="Ingresá los nombres"
                                disabled={loading}
                            />
                        </Col>
                        <Col {...colResponsive}>
                            <InputField
                                name="last_name"
                                label="Apellidos"
                                placeholder="Ingresá los apellidos"
                                disabled={loading}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col {...colResponsive}>
                            <InputField
                                name="company_name"
                                label="Razón Social"
                                placeholder="Ingresá la razón social"
                                disabled={loading}
                            />
                        </Col>
                        <Col {...colResponsive}>
                            <SelectField
                                name="document_type_id"
                                label="Tipo de Documento"
                                placeholder="Seleccionar"
                                options={documentTypeOptions}
                                rules={requiredStringRules('El tipo de documento')}
                                disabled={loading || documentTypesLoading}
                                loading={documentTypesLoading}
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
                                disabled={loading}
                            />
                        </Col>
                        <Col {...colResponsive}>
                            <SelectField
                                name="commercial_group_id"
                                label="Grupo Comercial"
                                placeholder="Seleccionar"
                                options={commercialGroupOptions}
                                allowClear
                                disabled={loading || groupsLoading}
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Button
                                variant="primary"
                                label="Crear Cliente"
                                htmlType="submit"
                                loading={loading}
                            />
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};
