import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    StarFilled,
    StarOutlined,
} from '@ant-design/icons';
import {
    Button as AntButton,
    Checkbox,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Table,
    Tag,
    Tooltip,
    message,
} from 'antd';
import { debounce } from 'lodash';
import { Button } from '@/components/Button';
import ActionButton from '@/components/ActionButton/ActionButton';
import { CanDo } from '@/components/auth/CanDo';
import { ProductsService } from '@/features/store/products/services/products.service';
import type { ProductSourceCandidate } from '@/features/store/products/interfaces/product.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import { SuppliersService, type Supplier } from '../../suppliers.service';
import {
    SupplierProductsService,
    type SupplierProduct,
    type SupplierProductCandidate,
    type SupplierProductCandidatesResponse,
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
    is_preferred?: boolean;
}

const EMPTY_LIST: SupplierProductsListResponse = {
    items: [],
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
};

const EMPTY_CANDIDATES: SupplierProductCandidatesResponse = {
    items: [],
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
};

const apiMessage = (error: unknown, fallback: string) => {
    const apiError = error as ApiError;
    return apiError.errors?.product_id?.[0]
        || apiError.errors?.supplier_product?.[0]
        || apiError.message
        || fallback;
};

export const SupplierProductsModal = ({ open, supplier, onClose }: SupplierProductsModalProps) => {
    const [result, setResult] = useState<SupplierProductsListResponse>(EMPTY_LIST);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState<SupplierProduct | null>(null);
    const [candidates, setCandidates] = useState<ProductSourceCandidate[]>([]);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkResult, setBulkResult] = useState<SupplierProductCandidatesResponse>(EMPTY_CANDIDATES);
    const [bulkSearch, setBulkSearch] = useState('');
    const [bulkPerPage, setBulkPerPage] = useState(20);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkSaving, setBulkSaving] = useState(false);
    const [bulkSelection, setBulkSelection] = useState<Record<string, SupplierProductCandidate>>({});
    const [sourceSupplierId, setSourceSupplierId] = useState<string | undefined>();
    const sourceSupplierIdRef = useRef<string | undefined>(undefined);
    const [sourceSupplierSearch, setSourceSupplierSearch] = useState('');
    const [sourceSuppliers, setSourceSuppliers] = useState<Supplier[]>([]);
    const [sourceSuppliersLoading, setSourceSuppliersLoading] = useState(false);
    const [markBulkAsPreferred, setMarkBulkAsPreferred] = useState(false);
    const [updatingPreferredId, setUpdatingPreferredId] = useState<string | null>(null);
    const [form] = Form.useForm<AssociationFormValues>();

    const load = useCallback(
        async (page = 1, nextSearch = '', nextPerPage = 15) => {
            if (!supplier) return;
            setLoading(true);
            try {
                setResult(
                    await SupplierProductsService.getAll(supplier.id, {
                        search: nextSearch || undefined,
                        page,
                        per_page: nextPerPage,
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

    const loadBulkCandidates = useCallback(
        async (
            page = 1,
            nextSearch = '',
            nextPerPage = bulkPerPage,
            nextSourceSupplierId?: string
        ) => {
            if (!supplier) return;
            setBulkLoading(true);
            try {
                setBulkResult(
                    await SupplierProductsService.getCandidates(supplier.id, {
                        search: nextSearch || undefined,
                        source_supplier_id: nextSourceSupplierId,
                        page,
                        per_page: nextPerPage,
                    })
                );
            } catch (error) {
                message.error(apiMessage(error, 'No se pudieron cargar los productos disponibles.'));
            } finally {
                setBulkLoading(false);
            }
        },
        [supplier, bulkPerPage]
    );

    const debouncedBulkSearch = useMemo(
        () =>
            debounce(
                (value: string) =>
                    void loadBulkCandidates(1, value, bulkPerPage, sourceSupplierId),
                300
            ),
        [loadBulkCandidates, bulkPerPage, sourceSupplierId]
    );
    useEffect(() => () => debouncedBulkSearch.cancel(), [debouncedBulkSearch]);

    const searchSourceSuppliers = useMemo(
        () =>
            debounce(async (value: string) => {
                if (value.trim().length < 2) {
                    setSourceSuppliers([]);
                    return;
                }
                setSourceSuppliersLoading(true);
                try {
                    setSourceSuppliers(
                        (await SuppliersService.getAll({ search: value })).filter(
                            (candidate) => candidate.id !== supplier?.id
                        )
                    );
                } catch {
                    setSourceSuppliers([]);
                } finally {
                    setSourceSuppliersLoading(false);
                }
            }, 300),
        [supplier?.id]
    );
    useEffect(() => () => searchSourceSuppliers.cancel(), [searchSourceSuppliers]);

    const loadInitialSourceSuppliers = async () => {
        setSourceSuppliersLoading(true);
        try {
            setSourceSuppliers(
                (await SuppliersService.getAll()).filter((candidate) => candidate.id !== supplier?.id)
            );
        } catch {
            setSourceSuppliers([]);
        } finally {
            setSourceSuppliersLoading(false);
        }
    };

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
        form.setFieldsValue({ is_preferred: false });
        setCandidates([]);
        setAddOpen(true);
    };

    const openBulk = () => {
        setBulkSelection({});
        setBulkSearch('');
        setBulkPerPage(20);
        setSourceSupplierId(undefined);
        sourceSupplierIdRef.current = undefined;
        setSourceSupplierSearch('');
        setSourceSuppliers([]);
        setMarkBulkAsPreferred(false);
        setBulkOpen(true);
        void loadBulkCandidates(1, '', 20, undefined);
    };

    const closeBulk = () => {
        setBulkOpen(false);
        setBulkSelection({});
        setBulkSearch('');
        setBulkResult(EMPTY_CANDIDATES);
        setSourceSupplierId(undefined);
        sourceSupplierIdRef.current = undefined;
        setSourceSupplierSearch('');
        setSourceSuppliers([]);
        setMarkBulkAsPreferred(false);
    };

    const openEdit = (association: SupplierProduct) => {
        setEditing(association);
        form.setFieldsValue({
            supplier_code: association.supplier_code ?? undefined,
            supplier_product_name: association.supplier_product_name ?? undefined,
            is_preferred: association.is_preferred,
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
                    is_preferred: values.is_preferred,
                });
                message.success('Producto del proveedor actualizado correctamente.');
            } else {
                await SupplierProductsService.create(supplier.id, {
                    product_id: values.product_id as string,
                    supplier_code: values.supplier_code,
                    supplier_product_name: values.supplier_product_name,
                    is_preferred: values.is_preferred,
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

    const updatePreferred = async (association: SupplierProduct) => {
        if (!supplier || updatingPreferredId) return;
        setUpdatingPreferredId(association.id);
        try {
            await SupplierProductsService.update(supplier.id, association.id, {
                is_preferred: !association.is_preferred,
            });
            message.success('Proveedor preferido actualizado.');
            await load(result.current_page, search);
        } catch (error) {
            message.error(apiMessage(error, 'No se pudo actualizar el proveedor preferido.'));
        } finally {
            setUpdatingPreferredId(null);
        }
    };

    const saveBulk = async () => {
        if (!supplier || Object.keys(bulkSelection).length === 0) return;
        setBulkSaving(true);
        try {
            const response = await SupplierProductsService.bulkCreate(
                supplier.id,
                Object.keys(bulkSelection),
                markBulkAsPreferred
            );
            if (response.created_count > 0) {
                message.success(`${response.created_count} productos asociados correctamente.`);
            }
            if (response.skipped_existing_count > 0) {
                message.info(`${response.skipped_existing_count} ya estaban asociados al proveedor.`);
            }
            if (response.preferred_updated_count > 0) {
                message.info(
                    `${response.preferred_updated_count} asociaciones existentes se actualizaron como preferidas.`
                );
            }
            closeBulk();
            await load(1, search);
        } catch (error) {
            message.error(apiMessage(error, 'No se pudieron asociar los productos seleccionados.'));
        } finally {
            setBulkSaving(false);
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

    const changeSourceSupplier = (nextSourceSupplierId: string | undefined) => {
        if (nextSourceSupplierId === sourceSupplierIdRef.current) return;

        sourceSupplierIdRef.current = nextSourceSupplierId;
        setBulkSelection({});
        setSourceSupplierId(nextSourceSupplierId);
        setSourceSupplierSearch('');
        if (!nextSourceSupplierId) {
            void loadInitialSourceSuppliers();
        }
        void loadBulkCandidates(1, bulkSearch, bulkPerPage, nextSourceSupplierId);
    };

    const sourceSupplierOptions = sourceSuppliers.map((candidate) => ({
        value: candidate.id,
        label: candidate.is_active
            ? candidate.business_name
            : `${candidate.business_name} · Inactivo`,
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
                    <AntButton className="supplierProductsBulkButton" onClick={openBulk}>
                        Asociar varios
                    </AntButton>
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
                    onChange={(pagination) => {
                        const nextPerPage = pagination.pageSize ?? result.per_page;
                        void load(pagination.current ?? 1, search, nextPerPage);
                    }}
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
                            title: 'Preferido',
                            align: 'center',
                            render: (_, item: SupplierProduct) => (
                                <CanDo
                                    permission="suppliers.edit"
                                    fallback={
                                        item.is_preferred ? <StarFilled /> : <StarOutlined />
                                    }
                                >
                                    <Tooltip
                                        title={
                                            item.is_preferred
                                                ? 'Quitar como preferido'
                                                : 'Marcar como preferido'
                                        }
                                    >
                                        <AntButton
                                            type="text"
                                            size="middle"
                                            className={
                                                item.is_preferred
                                                    ? 'supplierProductsPreferredActive'
                                                    : 'supplierProductsPreferred'
                                            }
                                            icon={
                                                item.is_preferred ? <StarFilled /> : <StarOutlined />
                                            }
                                            aria-label={
                                                item.is_preferred
                                                    ? 'Quitar como preferido'
                                                    : 'Marcar como preferido'
                                            }
                                            loading={updatingPreferredId === item.id}
                                            disabled={updatingPreferredId !== null}
                                            onClick={() => void updatePreferred(item)}
                                        />
                                    </Tooltip>
                                </CanDo>
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
                    <Form.Item
                        name="is_preferred"
                        valuePropName="checked"
                        extra="Se usará como proveedor habitual de este producto."
                    >
                        <Checkbox>Proveedor preferido para este producto</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                className="supplierProductsBulkModal"
                open={bulkOpen}
                onCancel={closeBulk}
                width="85vw"
                style={{ maxWidth: 1000, top: 32 }}
                styles={{ body: { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' } }}
                destroyOnHidden
                title={
                    <div className="supplierProductsBulkHeader">
                        <div>Asociar productos</div>
                        <div className="supplierProductsModalSubtitle">
                            Selecciona los productos que provee {supplier?.business_name}
                        </div>
                    </div>
                }
                footer={[
                    <AntButton key="cancel" onClick={closeBulk} disabled={bulkSaving}>
                        Cancelar
                    </AntButton>,
                    <AntButton
                        key="submit"
                        type="primary"
                        loading={bulkSaving}
                        disabled={Object.keys(bulkSelection).length === 0}
                        onClick={() => void saveBulk()}
                    >
                        Asociar {Object.keys(bulkSelection).length} productos
                    </AntButton>,
                ]}
            >
                <div className="supplierProductsBulkFilters">
                    <div className="supplierProductsSearchFilter">
                        <label htmlFor="bulk-product-search">Buscar productos</label>
                        <Input
                            id="bulk-product-search"
                            aria-label="Buscar productos"
                            placeholder="Nombre o código"
                            allowClear
                            value={bulkSearch}
                            onChange={(event) => {
                                const value = event.target.value;
                                setBulkSearch(value);
                                debouncedBulkSearch(value);
                            }}
                        />
                    </div>
                    <div className="supplierProductsSourceFilter">
                        <label htmlFor="source-supplier">Proveedor de origen</label>
                        <Select
                            id="source-supplier"
                            aria-label="Proveedor de origen"
                            showSearch
                            allowClear
                            defaultActiveFirstOption={false}
                            filterOption={false}
                            value={sourceSupplierId ?? null}
                            searchValue={sourceSupplierSearch}
                            options={sourceSupplierOptions}
                            loading={sourceSuppliersLoading}
                            placeholder="Todos los proveedores"
                            notFoundContent={
                                sourceSuppliersLoading
                                    ? 'Buscando...'
                                    : 'Ingresá al menos 2 caracteres'
                            }
                            onSearch={(value) => {
                                setSourceSupplierSearch(value);
                                searchSourceSuppliers(value);
                            }}
                            onOpenChange={(nextOpen) => {
                                if (nextOpen && !sourceSupplierSearch && sourceSuppliers.length === 0) {
                                    void loadInitialSourceSuppliers();
                                }
                            }}
                            onChange={(value) => {
                                changeSourceSupplier(value as string | undefined);
                            }}
                            onClear={() => changeSourceSupplier(undefined)}
                        />
                    </div>
                </div>
                <div className="supplierProductsBulkOptions">
                    <span aria-live="polite" className="supplierProductsSelectedCount">
                        {Object.keys(bulkSelection).length} productos seleccionados
                    </span>
                    <div className="supplierProductsPreferredOption">
                        <Checkbox
                            checked={markBulkAsPreferred}
                            onChange={(event) => setMarkBulkAsPreferred(event.target.checked)}
                        >
                            Marcar este proveedor como preferido
                        </Checkbox>
                        <span className="supplierProductsBulkHelp">
                            Si otro proveedor era el preferido, será reemplazado. La asociación anterior se conservará.
                        </span>
                    </div>
                </div>
                <div className="supplierProductsBulkTableRegion">
                    {bulkResult.items.length === 0 && !bulkLoading ? (
                        <div className="supplierProductsEmpty">
                            {bulkSearch
                                ? 'No encontramos productos con esa búsqueda.'
                                : sourceSupplierId
                                  ? 'No hay productos de este proveedor disponibles para asociar.'
                                  : 'No hay productos disponibles para asociar.'}
                        </div>
                    ) : (
                        <Table<SupplierProductCandidate>
                        rowKey="id"
                        loading={bulkLoading}
                        dataSource={bulkResult.items}
                        scroll={{ x: 'max-content', y: 'calc(100vh - 500px)' }}
                        rowSelection={{
                            selectedRowKeys: Object.keys(bulkSelection),
                            preserveSelectedRowKeys: true,
                            onChange: (selectedRowKeys) => {
                                const visibleKeys = new Set(selectedRowKeys.map(String));
                                setBulkSelection((current) => {
                                    const next = { ...current };
                                    bulkResult.items.forEach((item) => {
                                        if (visibleKeys.has(item.id)) next[item.id] = item;
                                        else delete next[item.id];
                                    });
                                    return next;
                                });
                            },
                        }}
                        pagination={{
                            current: bulkResult.current_page,
                            pageSize: bulkResult.per_page,
                            total: bulkResult.total,
                            showSizeChanger: true,
                            pageSizeOptions: ['20', '50', '100'],
                            showTotal: (total, range) => `${range[0]} - ${range[1]} de ${total}`,
                        }}
                        onChange={(pagination) => {
                            const nextPerPage = pagination.pageSize ?? bulkPerPage;
                            setBulkPerPage(nextPerPage);
                            void loadBulkCandidates(
                                pagination.current ?? 1,
                                bulkSearch,
                                nextPerPage,
                                sourceSupplierId
                            );
                        }}
                        columns={[
                            { title: 'Producto', dataIndex: 'name' },
                            { title: 'Código', dataIndex: 'sku' },
                            {
                                title: 'Marca',
                                render: (_, item) => item.brand?.name ?? '—',
                            },
                            {
                                title: 'Unidad',
                                render: (_, item) =>
                                    item.stock_measurement_unit?.symbol ??
                                    item.stock_measurement_unit?.name ??
                                    '—',
                            },
                        ]}
                        />
                    )}
                </div>
            </Modal>
        </Modal>
    );
};
