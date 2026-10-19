import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    Button as AntButton,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Table,
    Tag,
    message,
} from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import ActionButton from '@/components/ActionButton/ActionButton';
import { CanDo } from '@/components/auth/CanDo';
import { ProductsService } from '@/features/store/products/services/products.service';
import type { ProductSourceCandidate } from '@/features/store/products/interfaces/product.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { Supplier } from '../../suppliers.service';
import {
    SupplierProductsService,
    type SupplierProduct,
    type SupplierProductsListResponse,
} from '../../supplierProducts.service';
import './SupplierProductsModal.css';

interface SupplierProductsModalProps {
    open: boolean;
    supplier: Supplier | null;
    onClose: () => void;
}

interface AssociationFormValues {
    product_id?: string;
    supplier_code?: string;
    supplier_product_name?: string;
}

const EMPTY_LIST: SupplierProductsListResponse = {
    items: [],
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
};

const apiMessage = (error: unknown, fallback: string) => {
    const apiError = error as ApiError;
    return apiError.errors?.product_id?.[0] || apiError.message || fallback;
};

export const SupplierProductsModal = ({ open, supplier, onClose }: SupplierProductsModalProps) => {
    const [result, setResult] = useState<SupplierProductsListResponse>(EMPTY_LIST);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<SupplierProduct | null>(null);
    const [candidates, setCandidates] = useState<ProductSourceCandidate[]>([]);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [form] = Form.useForm<AssociationFormValues>();

    const load = useCallback(
        async (page = 1, nextSearch = '') => {
            if (!supplier) return;
            setLoading(true);
            try {
                setResult(
                    await SupplierProductsService.getAll(supplier.id, {
                        search: nextSearch || undefined,
                        page,
                        per_page: 15,
                    })
                );
            } catch (error) {
                message.error(
                    apiMessage(error, 'No se pudieron cargar los productos del proveedor.')
                );
            } finally {
                setLoading(false);
            }
        },
        [supplier]
    );

    useEffect(() => {
        if (!open || !supplier) return;
        setSearch('');
        void load(1, '');
    }, [open, supplier, load]);

    const debouncedSearch = useMemo(
        () => debounce((value: string) => void load(1, value), 300),
        [load]
    );
    useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

    const searchCandidates = useMemo(
        () =>
            debounce(async (value: string) => {
                if (value.trim().length < 2) {
                    setCandidates([]);
                    return;
                }
                setCandidateLoading(true);
                try {
                    setCandidates(await ProductsService.searchSourceProducts(value));
                } catch {
                    setCandidates([]);
                } finally {
                    setCandidateLoading(false);
                }
            }, 300),
        []
    );
    useEffect(() => () => searchCandidates.cancel(), [searchCandidates]);

    const closeAssociationForm = () => {
        setAddOpen(false);
        setEditing(null);
        setCandidates([]);
        form.resetFields();
    };

    const openAdd = () => {
        setEditing(null);
        form.resetFields();
        setCandidates([]);
        setAddOpen(true);
    };

    const openEdit = (association: SupplierProduct) => {
        setEditing(association);
        form.setFieldsValue({
            supplier_code: association.supplier_code ?? undefined,
            supplier_product_name: association.supplier_product_name ?? undefined,
        });
        setAddOpen(true);
    };

    const saveAssociation = async () => {
        if (!supplier) return;
        try {
            const values = await form.validateFields();
            if (editing) {
                await SupplierProductsService.update(supplier.id, editing.id, {
                    supplier_code: values.supplier_code,
                    supplier_product_name: values.supplier_product_name,
                });
                message.success('Producto del proveedor actualizado correctamente.');
            } else {
                await SupplierProductsService.create(supplier.id, {
                    product_id: values.product_id as string,
                    supplier_code: values.supplier_code,
                    supplier_product_name: values.supplier_product_name,
                });
                message.success('Producto asociado al proveedor correctamente.');
            }
            closeAssociationForm();
            await load(editing ? result.current_page : 1, search);
        } catch (error) {
            if (error instanceof Error) return;
            message.error(apiMessage(error, 'No se pudo guardar el producto del proveedor.'));
        }
    };

    const deleteAssociation = async (association: SupplierProduct) => {
        if (!supplier) return;
        try {
            await SupplierProductsService.delete(supplier.id, association.id);
            message.success('Asociación eliminada correctamente.');
            await load(
                result.items.length === 1 && result.current_page > 1
                    ? result.current_page - 1
                    : result.current_page,
                search
            );
        } catch (error) {
            message.error(apiMessage(error, 'No se pudo eliminar la asociación.'));
        }
    };

    const candidateOptions = candidates.map((product) => ({
        value: product.id,
        label: `${product.name} — ${product.sku}${product.stock_measurement_unit ? ` · ${product.stock_measurement_unit.name}` : ''}`,
    }));

    return (
        <Modal
            className="supplierProductsModal"
            open={open}
            onCancel={onClose}
            footer={null}
            width="90vw"
            style={{ maxWidth: 1200, top: 24 }}
            styles={{ body: { maxHeight: '78vh', overflow: 'auto' } }}
            title={
                <div className="supplierProductsModalHeader">
                    <div>
                        <div>Productos de {supplier?.business_name}</div>
                        <div className="supplierProductsModalSubtitle">
                            Gestiona los productos asociados a este proveedor
                        </div>
                    </div>
                </div>
            }
        >
            <div className="supplierProductsToolbar">
                <Input
                    aria-label="Buscar producto"
                    className="supplierProductsModalSearch"
                    placeholder="Nombre, código interno o código proveedor"
                    allowClear
                    value={search}
                    onChange={(event) => {
                        const value = event.target.value;
                        setSearch(value);
                        debouncedSearch(value);
                    }}
                />
                <CanDo permission="suppliers.edit">
                    <Button
                        className="supplierProductsAddButton"
                        icon={<PlusOutlined />}
                        label="Agregar producto"
                        action={openAdd}
                    />
                </CanDo>
            </div>
            {result.items.length === 0 && !loading ? (
                <div className="supplierProductsEmpty">
                    Este proveedor todavía no tiene productos asociados.
                    <br />
                    <CanDo permission="suppliers.edit">
                        <Button
                            className="mt-4"
                            icon={<PlusOutlined />}
                            label="Agregar producto"
                            action={openAdd}
                        />
                    </CanDo>
                </div>
            ) : (
                <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={result.items}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: result.current_page,
                        pageSize: result.per_page,
                        total: result.total,
                        showSizeChanger: true,
                        pageSizeOptions: ['15', '25', '50'],
                        showTotal: (total, range) => `${range[0]} - ${range[1]} de ${total}`,
                    }}
                    onChange={(pagination) => void load(pagination.current ?? 1, search)}
                    columns={[
                        {
                            title: 'Producto',
                            render: (_, item: SupplierProduct) => item.product.name,
                        },
                        {
                            title: 'Código interno',
                            render: (_, item: SupplierProduct) => item.product.sku,
                        },
                        {
                            title: 'Código proveedor',
                            render: (_, item: SupplierProduct) => item.supplier_code || '—',
                        },
                        {
                            title: 'Nombre según proveedor',
                            render: (_, item: SupplierProduct) => item.supplier_product_name || '—',
                        },
                        {
                            title: 'Estado',
                            render: (_, item: SupplierProduct) => (
                                <Tag color={item.product.is_active ? 'green' : 'red'}>
                                    {item.product.is_active ? 'Activo' : 'Inactivo'}
                                </Tag>
                            ),
                        },
                        {
                            title: 'Acciones',
                            render: (_, item: SupplierProduct) => (
                                <div className="supplierProductsActions">
                                    <CanDo permission="suppliers.edit">
                                        <ActionButton
                                            icon={<EditOutlined />}
                                            label="Editar producto del proveedor"
                                            action={() => openEdit(item)}
                                        />
                                    </CanDo>
                                    <CanDo permission="suppliers.edit">
                                        <Popconfirm
                                            title="¿Quitar producto del proveedor?"
                                            description="Solo se eliminará la asociación. El producto seguirá existiendo."
                                            okText="Quitar"
                                            cancelText="Cancelar"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() => deleteAssociation(item)}
                                        >
                                            <AntButton
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                aria-label="Eliminar producto del proveedor"
                                            />
                                        </Popconfirm>
                                    </CanDo>
                                </div>
                            ),
                        },
                    ]}
                />
            )}
            <Modal
                open={addOpen}
                onCancel={closeAssociationForm}
                title={editing ? 'Editar producto del proveedor' : 'Agregar producto al proveedor'}
                onOk={() => void saveAssociation()}
                okText={editing ? 'Actualizar' : 'Agregar'}
                cancelText="Cancelar"
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    {editing ? (
                        <>
                            <Form.Item label="Producto">
                                <Input value={editing.product.name} readOnly />
                            </Form.Item>
                            <Form.Item label="Código interno">
                                <Input value={editing.product.sku} readOnly />
                            </Form.Item>
                        </>
                    ) : (
                        <Form.Item
                            name="product_id"
                            label="Producto"
                            rules={[{ required: true, message: 'Seleccioná un producto.' }]}
                        >
                            <Select
                                showSearch
                                filterOption={false}
                                onSearch={searchCandidates}
                                options={candidateOptions}
                                loading={candidateLoading}
                                notFoundContent={
                                    candidateLoading
                                        ? 'Buscando...'
                                        : 'Ingresá al menos 2 caracteres'
                                }
                                placeholder="Buscar producto..."
                            />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="supplier_code"
                        label="Código del proveedor"
                        extra="Código utilizado por el proveedor para identificar este producto."
                    >
                        <Input placeholder="Opcional" />
                    </Form.Item>
                    <Form.Item
                        name="supplier_product_name"
                        label="Nombre según proveedor"
                        extra="Nombre o descripción utilizada por el proveedor."
                    >
                        <Input placeholder="Opcional" />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
};
