import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Breadcrumb,
    Button as AntButton,
    Empty,
    Form,
    Input,
    Popconfirm,
    Switch,
    Tag,
    message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import ActionButton from '@/components/ActionButton/ActionButton';
import InputField from '@/components/InputField/InputField';
import SelectField from '@/components/SelectField/SelectField';
import Modal from '@/components/Modal/Modal';
import Table from '@/components/Table/Table';
import { CanDo } from '@/components/auth/CanDo';
import { usePriceLists } from '@/features/store/price-lists/hooks/usePriceLists';
import { formatDiscountPercentage } from '@/features/store/price-lists/types/priceList.types';
import type {
    PriceList,
    PriceListPayload,
    PriceListsFilters,
} from '@/features/store/price-lists/types/priceList.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './PriceListsPage.css';

type FilterValues = { search?: string; is_active?: 'all' | 'true' | 'false' };
type FormValues = { name: string; discount_percentage: string; is_active: boolean };

const toFilters = (values: FilterValues): PriceListsFilters => ({
    search: values.search || undefined,
    is_active:
        values.is_active === 'true' ? true : values.is_active === 'false' ? false : undefined,
});

const normalizePercentage = (value: string): string => value.trim().replace(',', '.');

export const PriceListsPage = () => {
    const { items, loading, fetching, filters, applyFilters, save, remove } = usePriceLists();
    const [filtersForm] = Form.useForm<FilterValues>();
    const [form] = Form.useForm<FormValues>();
    const [editing, setEditing] = useState<PriceList | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [isActiveInput, setIsActiveInput] = useState<FilterValues['is_active']>('all');

    const hasFilters = Boolean(searchInput || isActiveInput !== 'all');
    const isFilteredEmpty =
        items.length === 0 && Boolean(filters.search || filters.is_active !== undefined);

    const debouncedApplyFilters = useMemo(
        () => debounce((nextFilters: PriceListsFilters) => applyFilters(nextFilters), 350),
        [applyFilters]
    );

    useEffect(() => () => debouncedApplyFilters.cancel(), [debouncedApplyFilters]);

    const clearFilters = useCallback(() => {
        debouncedApplyFilters.cancel();
        setSearchInput('');
        setIsActiveInput('all');
        filtersForm.resetFields();
        applyFilters({});
    }, [applyFilters, debouncedApplyFilters, filtersForm]);

    const handleFiltersChange = useCallback(
        (changedValues: Partial<FilterValues>, allValues: FilterValues) => {
            const nextSearchInput = allValues.search ?? '';
            const nextIsActiveInput = allValues.is_active ?? 'all';
            setSearchInput(nextSearchInput);
            setIsActiveInput(nextIsActiveInput);
            const nextFilters = toFilters(allValues);

            if ('search' in changedValues) {
                debouncedApplyFilters(nextFilters);
                return;
            }

            debouncedApplyFilters.cancel();
            applyFilters(nextFilters);
        },
        [applyFilters, debouncedApplyFilters]
    );

    const openCreate = () => {
        setEditing(null);
        form.setFieldsValue({ name: '', discount_percentage: '', is_active: true });
        setModalOpen(true);
    };

    const openEdit = (priceList: PriceList) => {
        setEditing(priceList);
        form.setFieldsValue(priceList);
        setModalOpen(true);
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        const payload: PriceListPayload = {
            name: values.name.trim(),
            discount_percentage: normalizePercentage(values.discount_percentage),
            is_active: values.is_active,
        };
        setSaving(true);
        try {
            await save(editing, payload);
            message.success(
                editing
                    ? 'Lista de precios actualizada correctamente.'
                    : 'Lista de precios creada correctamente.'
            );
            setModalOpen(false);
        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.errors) {
                form.setFields(
                    Object.entries(apiError.errors).map(([name, errors]) => ({
                        name: [name],
                        errors,
                    })) as Parameters<typeof form.setFields>[0]
                );
            } else {
                message.error(apiError.message || 'No se pudo guardar la lista de precios.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (priceList: PriceList) => {
        try {
            await remove(priceList.id);
            message.success('Lista de precios eliminada correctamente.');
        } catch (error) {
            message.error(
                (error as ApiError).message || 'No se pudo eliminar la lista de precios.'
            );
        }
    };

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        {
            title: 'Descuento',
            key: 'discount_percentage',
            render: (_: unknown, record?: Record<string, unknown>) =>
                formatDiscountPercentage((record as unknown as PriceList).discount_percentage),
        },
        {
            title: 'Estado',
            key: 'is_active',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const priceList = record as unknown as PriceList;
                return (
                    <Tag color={priceList.is_active ? 'green' : 'default'}>
                        {priceList.is_active ? 'Activa' : 'Inactiva'}
                    </Tag>
                );
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: unknown, record?: Record<string, unknown>) => {
                const priceList = record as unknown as PriceList;
                return (
                    <div className="priceListsActions">
                        <CanDo permission="price_lists.edit">
                            <ActionButton
                                icon={<EditOutlined />}
                                label="Editar"
                                action={() => openEdit(priceList)}
                            />
                        </CanDo>
                        <CanDo permission="price_lists.delete">
                            <Popconfirm
                                title={`¿Eliminar la lista «${priceList.name}»?`}
                                onConfirm={() => handleDelete(priceList)}
                                okText="Eliminar"
                                cancelText="Cancelar"
                                okButtonProps={{ danger: true }}
                            >
                                <AntButton
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    aria-label="Eliminar"
                                />
                            </Popconfirm>
                        </CanDo>
                    </div>
                );
            },
        },
    ];

    const empty = (
        <Empty
            description={
                isFilteredEmpty
                    ? 'No encontramos listas con esos filtros.'
                    : 'No hay listas de precios configuradas.'
            }
        >
            {isFilteredEmpty ? (
                <Button
                    variant="default"
                    label="Limpiar filtros"
                    action={clearFilters}
                />
            ) : null}
        </Empty>
    );

    return (
        <div className="w-full priceListsPage">
            <div className="mb-6">
                <Breadcrumb
                    className="mb-2"
                    items={[
                        { title: <Link to="/tienda/dashboard">Tienda</Link> },
                        { title: 'Configuraciones' },
                        { title: 'Listas de precios' },
                    ]}
                />
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="m-0 text-2xl font-bold text-centra-primary">
                            Listas de precios
                        </h1>
                        <p className="m-0 text-sm text-centra-text/60">
                            Configurá descuentos predefinidos para usar en Caja y Pedidos.
                        </p>
                    </div>
                    <CanDo permission="price_lists.create">
                        <Button icon={<PlusOutlined />} label="Nueva lista" action={openCreate} />
                    </CanDo>
                </div>
            </div>
            <Form
                form={filtersForm}
                layout="vertical"
                className="priceListsFilters"
                initialValues={{ search: '', is_active: 'all' }}
                onValuesChange={handleFiltersChange}
            >
                <div className="priceListsFiltersRow">
                    <InputField
                        name="search"
                        label="Búsqueda"
                        placeholder="Buscar por nombre"
                        allowClear
                        disabled={loading}
                    />
                    <SelectField
                        name="is_active"
                        label="Estado"
                        placeholder="Todos"
                        options={[
                            { label: 'Todos', value: 'all' },
                            { label: 'Activas', value: 'true' },
                            { label: 'Inactivas', value: 'false' },
                        ]}
                        disabled={loading}
                    />
                    <div className="priceListsFilterAction">
                        <Button
                            variant="default"
                            label="Limpiar"
                            disabled={!hasFilters || loading}
                            action={clearFilters}
                        />
                    </div>
                </div>
            </Form>
            <div className="priceListsDesktop">
                <Table
                    columns={columns as Parameters<typeof Table>[0]['columns']}
                    dataSource={items as unknown as Record<string, unknown>[]}
                    loading={loading || fetching}
                    pagination={false}
                    emptyText={empty}
                    scroll={{ x: 'max-content' }}
                />
            </div>
            <div className="priceListsMobile">
                {!loading && !fetching && items.length === 0
                    ? empty
                    : items.map((priceList) => (
                          <div key={priceList.id} className="priceListCard">
                              <div>
                                  <strong>{priceList.name}</strong>
                                  <div className="priceListCardDiscount">
                                      {formatDiscountPercentage(priceList.discount_percentage)}
                                  </div>
                              </div>
                              <div className="priceListCardActions">
                                  <Tag color={priceList.is_active ? 'green' : 'default'}>
                                      {priceList.is_active ? 'Activa' : 'Inactiva'}
                                  </Tag>
                                  <CanDo permission="price_lists.edit">
                                      <ActionButton
                                          icon={<EditOutlined />}
                                          label="Editar"
                                          action={() => openEdit(priceList)}
                                      />
                                  </CanDo>
                                  <CanDo permission="price_lists.delete">
                                      <Popconfirm
                                          title={`¿Eliminar la lista «${priceList.name}»?`}
                                          onConfirm={() => handleDelete(priceList)}
                                          okText="Eliminar"
                                          cancelText="Cancelar"
                                      >
                                          <AntButton
                                              type="text"
                                              danger
                                              size="small"
                                              icon={<DeleteOutlined />}
                                              aria-label="Eliminar"
                                          />
                                      </Popconfirm>
                                  </CanDo>
                              </div>
                          </div>
                      ))}
            </div>
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar lista de precios' : 'Nueva lista de precios'}
                loading={saving}
                width={540}
                className="priceListsFormModal"
                footer={
                    <>
                        <Button
                            variant="default"
                            label="Cancelar"
                            action={() => setModalOpen(false)}
                            disabled={saving}
                        />
                        <Button
                            label={editing ? 'Guardar cambios' : 'Crear lista'}
                            action={handleSave}
                            loading={saving}
                        />
                    </>
                }
            >
                <Form form={form} layout="vertical" initialValues={{ is_active: true }}>
                    <InputField
                        name="name"
                        label="Nombre"
                        placeholder="Mayorista"
                        rules={[
                            { required: true, message: 'El nombre es obligatorio.' },
                            { max: 100, message: 'El nombre no puede exceder 100 caracteres.' },
                        ]}
                        disabled={saving}
                    />
                    <Form.Item
                        name="discount_percentage"
                        label="Descuento"
                        rules={[
                            { required: true, message: 'El descuento es obligatorio.' },
                            {
                                validator: (_, value: string) => {
                                    const normalized = normalizePercentage(value || '');
                                    return /^\d{1,3}(\.\d{1,2})?$/.test(normalized) &&
                                        Number(normalized) <= 100
                                        ? Promise.resolve()
                                        : Promise.reject(
                                              new Error(
                                                  'Ingresá un porcentaje entre 0 y 100 con hasta dos decimales.'
                                              )
                                          );
                                },
                            },
                        ]}
                    >
                        <Input inputMode="decimal" placeholder="10" suffix="%" disabled={saving} />
                    </Form.Item>
                    <Form.Item name="is_active" label="Estado" valuePropName="checked">
                        <Switch
                            checkedChildren="Activa"
                            unCheckedChildren="Inactiva"
                            disabled={saving}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
