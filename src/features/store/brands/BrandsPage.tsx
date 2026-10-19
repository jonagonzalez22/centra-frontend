import { useEffect, useState } from 'react';
import { Button as AntButton, Form, Input, Modal, Popconfirm, Switch, Table, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { CanDo } from '@/components/auth/CanDo';
import { Button } from '@/components/Button';
import SelectField from '@/components/SelectField/SelectField';
import { BrandsService } from './services/brands.service';
import type { ProductBrand } from '@/features/store/products/interfaces/product.interface';
import './BrandsPage.css';
import '@/features/store/categories/components/CategoriesSearchBar/CategoriesSearchBar.css';
import '@/features/store/categories/components/CategoriesTable/CategoriesTable.css';

type FilterValues = { name?: string; is_active?: string };

export const BrandsPage = () => {
    const [items, setItems] = useState<ProductBrand[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterValues>({});
    const [editing, setEditing] = useState<ProductBrand | null>(null);
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm<ProductBrand>();
    const [filtersForm] = Form.useForm<FilterValues>();

    const load = async (next = filters) => {
        setLoading(true);
        try {
            setItems(await BrandsService.getAll({
                per_page: 100,
                name: next.name || undefined,
                is_active: next.is_active === undefined || next.is_active === '' ? undefined : next.is_active === 'true',
            }));
        } catch { message.error('No se pudieron cargar las marcas.'); }
        finally { setLoading(false); }
    };

    // Initial fetch only; subsequent filter changes call load directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void load({}); }, []);

    const handleFiltersChange = (_: unknown, values: FilterValues) => {
        setFilters(values);
        void load(values);
    };
    const clearFilters = () => { filtersForm.resetFields(); setFilters({}); void load({}); };
    const save = async () => {
        const values = await form.validateFields();
        try {
            if (editing) await BrandsService.update(editing.id, values); else await BrandsService.create(values);
            message.success(editing ? 'Marca actualizada correctamente.' : 'Marca creada correctamente.');
            setOpen(false); await load();
        } catch { message.error('No se pudo guardar la marca.'); }
    };
    const remove = async (id: string) => {
        try { await BrandsService.delete(id); message.success('Marca eliminada correctamente.'); await load(); }
        catch (error: unknown) { const response = error as { response?: { data?: { message?: string } } }; message.error(response.response?.data?.message ?? 'No se pudo eliminar la marca.'); }
    };

    return <div className="categoriesList">
        <div className="categoriesListHeader"><CanDo permission="brands.create"><Button icon={<PlusOutlined />} label="Nueva Marca" action={() => { setEditing(null); form.setFieldsValue({ name: '', is_active: true }); setOpen(true); }} /></CanDo></div>
        <Form form={filtersForm} layout="vertical" className="categoriesSearchBar" onValuesChange={handleFiltersChange}>
            <div className="categoriesSearchBarRow">
                <Form.Item label="Nombre" name="name"><Input allowClear placeholder="Buscar marca" /></Form.Item>
                <SelectField name="is_active" label="Estado" placeholder="Seleccionar" options={[{ label: 'Todos', value: '' }, { label: 'Activas', value: 'true' }, { label: 'Inactivas', value: 'false' }]} allowClear />
                <div className="categoriesSearchBarActions"><Button variant="default" label="Limpiar" disabled={!filters.name && !filters.is_active} action={clearFilters} /></div>
            </div>
        </Form>
        <Table rowKey="id" loading={loading} dataSource={items} pagination={false} style={{ marginTop: 16 }} columns={[{ title: 'Nombre', dataIndex: 'name' }, { title: 'Estado', render: (_, b: ProductBrand) => <Tag color={b.is_active ? 'green' : 'red'}>{b.is_active ? 'Activa' : 'Inactiva'}</Tag> }, { title: 'Acciones', render: (_, b: ProductBrand) => <div className="categoriesTableActions"><CanDo permission="brands.edit"><Button variant="text" size="small" icon={<EditOutlined />} action={() => { setEditing(b); form.setFieldsValue(b); setOpen(true); }} /></CanDo><CanDo permission="brands.delete"><Popconfirm title="¿Eliminar marca?" description="Esta acción no se puede deshacer." onConfirm={() => remove(b.id)} okText="Eliminar" cancelText="Cancelar" okButtonProps={{ danger: true }}><AntButton type="text" danger size="small" icon={<DeleteOutlined />} /></Popconfirm></CanDo></div> }]} />
        <Modal open={open} title={editing ? 'Editar Marca' : 'Nueva Marca'} onCancel={() => setOpen(false)} footer={<div className="brandFormModalFooter"><Button variant="default" label="Cancelar" action={() => setOpen(false)} disabled={loading} /><Button variant="primary" label={editing ? 'Actualizar' : 'Crear'} loading={loading} action={save} /></div>}><Form form={form} layout="vertical"><Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio.' }]}><Input maxLength={100} /></Form.Item><Form.Item name="is_active" label="Estado" valuePropName="checked"><Switch checkedChildren="Activa" unCheckedChildren="Inactiva" /></Form.Item></Form></Modal>
    </div>;
};
