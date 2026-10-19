import { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PackageSearch } from 'lucide-react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import {
    Button as AntButton,
    Form,
    Input,
    Modal,
    Popconfirm,
    Switch,
    Table,
    Tag,
    message,
} from 'antd';
import { Button } from '@/components/Button';
import ActionButton from '@/components/ActionButton/ActionButton';
import { CanDo } from '@/components/auth/CanDo';
import SelectField from '@/components/SelectField/SelectField';
import { SupplierDrawer } from './components/SupplierDrawer';
import { SupplierProductsModal } from './components/SupplierProductsModal';
import { SuppliersService, type Supplier } from './suppliers.service';
import '@/features/store/categories/components/CategoriesSearchBar/CategoriesSearchBar.css';
import '@/features/store/categories/components/CategoriesTable/CategoriesTable.css';
import './SuppliersPage.css';

export const SuppliersPage = () => {
    const [items, setItems] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<{ search?: string; is_active?: string }>({});
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [viewingSupplierId, setViewingSupplierId] = useState<string>();
    const [productsSupplier, setProductsSupplier] = useState<Supplier | null>(null);
    const [form] = Form.useForm<Supplier>();
    const [filtersForm] = Form.useForm();

    const load = useCallback(async (currentFilters: { search?: string; is_active?: string }) => {
        setLoading(true);
        try {
            setItems(
                await SuppliersService.getAll({
                    search: currentFilters.search,
                    is_active:
                        currentFilters.is_active === '' || currentFilters.is_active === undefined
                            ? undefined
                            : currentFilters.is_active === 'true',
                })
            );
        } catch {
            message.error('No se pudieron cargar los proveedores.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load({});
    }, [load]);

    const openEdit = (supplier: Supplier) => {
        setEditing(supplier);
        form.setFieldsValue(supplier);
        setFormOpen(true);
    };

    const save = async () => {
        try {
            const values = await form.validateFields();
            if (editing) await SuppliersService.update(editing.id, values);
            else await SuppliersService.create(values);
            message.success('Proveedor guardado correctamente.');
            setFormOpen(false);
            await load(filters);
        } catch {
            message.error('No se pudo guardar el proveedor.');
        }
    };

    return (
        <div className="w-full suppliersPage">
            <div className="mb-6">
                <Breadcrumb
                    className="mb-2"
                    items={[
                        { title: <Link to="/tienda/dashboard">Tienda</Link> },
                        { title: 'Proveedores' },
                    ]}
                />
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="m-0 text-2xl font-bold text-centra-primary">Proveedores</h1>
                        <p className="m-0 text-sm text-centra-text/60">
                            Administra los proveedores de tu tienda
                        </p>
                    </div>
                    <CanDo permission="suppliers.create">
                        <Button
                            icon={<PlusOutlined />}
                            label="Nuevo Proveedor"
                            action={() => {
                                setEditing(null);
                                form.resetFields();
                                form.setFieldValue('is_active', true);
                                setFormOpen(true);
                            }}
                        />
                    </CanDo>
                </div>
            </div>
            <div className="categoriesList">
                <Form
                    form={filtersForm}
                    layout="vertical"
                    className="categoriesSearchBar"
                    onValuesChange={(_, values) => {
                        setFilters(values);
                        void load(values);
                    }}
                >
                    <div className="categoriesSearchBarRow">
                        <Form.Item name="search" label="Buscar proveedor">
                            <Input placeholder="Nombre, CUIT o contacto" allowClear />
                        </Form.Item>
                        <SelectField
                            name="is_active"
                            label="Estado"
                            placeholder="Seleccionar"
                            allowClear
                            options={[
                                { label: 'Todos', value: '' },
                                { label: 'Activos', value: 'true' },
                                { label: 'Inactivos', value: 'false' },
                            ]}
                        />
                        <div className="categoriesSearchBarActions">
                            <Button
                                variant="default"
                                label="Limpiar"
                                action={() => {
                                    filtersForm.resetFields();
                                    setFilters({});
                                    void load({});
                                }}
                            />
                        </div>
                    </div>
                </Form>
                <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={items}
                    pagination={false}
                    columns={[
                        { title: 'Proveedor', dataIndex: 'business_name' },
                        {
                            title: 'CUIT / ID fiscal',
                            dataIndex: 'tax_id',
                            render: (value: string | null) => value || '—',
                        },
                        {
                            title: 'Contacto',
                            dataIndex: 'contact_name',
                            render: (value: string | null) => value || '—',
                        },
                        {
                            title: 'Teléfono',
                            dataIndex: 'phone',
                            render: (value: string | null) => value || '—',
                        },
                        {
                            title: 'Estado',
                            render: (_, supplier: Supplier) => (
                                <Tag color={supplier.is_active ? 'green' : 'red'}>
                                    {supplier.is_active ? 'Activo' : 'Inactivo'}
                                </Tag>
                            ),
                        },
                        {
                            title: 'Acciones',
                            render: (_, supplier: Supplier) => (
                                <div className="categoriesTableActions">
                                    <CanDo permission="suppliers.view">
                                        <ActionButton
                                            icon={<EyeOutlined />}
                                            label="Ver detalle"
                                            action={() => setViewingSupplierId(supplier.id)}
                                        />
                                    </CanDo>
                                    <CanDo permission="suppliers.view">
                                        <ActionButton
                                            icon={<PackageSearch />}
                                            label="Productos"
                                            action={() => setProductsSupplier(supplier)}
                                        />
                                    </CanDo>
                                    <CanDo permission="suppliers.edit">
                                        <ActionButton
                                            icon={<EditOutlined />}
                                            label="Editar"
                                            action={() => openEdit(supplier)}
                                        />
                                    </CanDo>
                                    <CanDo permission="suppliers.delete">
                                        <Popconfirm
                                            title="¿Eliminar este proveedor?"
                                            onConfirm={async () => {
                                                await SuppliersService.delete(supplier.id);
                                                await load(filters);
                                            }}
                                        >
                                            <AntButton
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                aria-label="Eliminar"
                                            />
                                        </Popconfirm>
                                    </CanDo>
                                </div>
                            ),
                        },
                    ]}
                />
                <SupplierDrawer
                    open={Boolean(viewingSupplierId)}
                    supplierId={viewingSupplierId}
                    onClose={() => setViewingSupplierId(undefined)}
                    onEdit={openEdit}
                />
                <SupplierProductsModal
                    open={Boolean(productsSupplier)}
                    supplier={productsSupplier}
                    onClose={() => setProductsSupplier(null)}
                />
                <Modal
                    open={formOpen}
                    title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                    onCancel={() => setFormOpen(false)}
                    onOk={save}
                    width="min(800px, calc(100vw - 32px))"
                >
                    <Form form={form} layout="vertical" className="supplierFormGrid">
                        <Form.Item
                            name="business_name"
                            label="Razón social / Nombre"
                            rules={[{ required: true, message: 'El nombre es obligatorio.' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="tax_id" label="CUIT / Identificación fiscal">
                            <Input />
                        </Form.Item>
                        <Form.Item name="contact_name" label="Persona de contacto">
                            <Input />
                        </Form.Item>
                        <Form.Item name="phone" label="Teléfono">
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ type: 'email', message: 'Ingresá un email válido.' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="address" label="Dirección">
                            <Input />
                        </Form.Item>
                        <Form.Item className="supplierFormFullWidth" name="notes" label="Notas">
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item
                            className="supplierFormFullWidth"
                            name="is_active"
                            label="Estado"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};
