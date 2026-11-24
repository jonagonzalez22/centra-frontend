import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Alert,
    Breadcrumb,
    Checkbox,
    Empty,
    Input,
    Modal,
    Pagination,
    Radio,
    Select,
    Spin,
    Switch,
    Tag,
    message,
} from 'antd';
import { DownloadOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { CategoriesService } from '@/features/store/categories/services/categories.service';
import { BrandsService } from '@/features/store/brands/services/brands.service';
import { ProductsService } from '@/features/store/products/services/products.service';
import { printA4PdfBlob } from '@/features/store/sales/documents/a4-pdf.service';
import { PriceListsService } from '@/features/store/price-lists/services/priceLists.service';
import type {
    PriceListExportData,
    PriceListExportFilters,
    PriceListExportPricingMode,
    PriceListExportSelectionMode,
} from '@/features/store/price-lists/types/priceList.types';
import { formatDiscountPercentage } from '@/features/store/price-lists/types/priceList.types';
import { createPriceListPdf } from '@/features/store/price-lists/documents/priceListPdf.service';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import './GeneratePriceListPage.css';

const PAGE_SIZE = 20;
const GENERAL_PRICE_OPTION = '__general_prices__';
const emptyFilters: PriceListExportFilters = { include_out_of_stock: true };
type PreparedPriceListPdf = { blob: Blob; data: PriceListExportData };

export const GeneratePriceListPage = () => {
    const { can } = usePermissions();
    const [pricingMode, setPricingMode] = useState<PriceListExportPricingMode>('general');
    const [priceListId, setPriceListId] = useState<string>();
    const [selectionMode, setSelectionMode] = useState<PriceListExportSelectionMode>('filtered');
    const [filters, setFilters] = useState<PriceListExportFilters>(emptyFilters);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [previewData, setPreviewData] = useState<PriceListExportData | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [preparing, setPreparing] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const generationRef = useRef(0);
    const generatingRef = useRef(false);
    const preparedPdfRef = useRef<PreparedPriceListPdf | null>(null);
    const generationPromiseRef = useRef<Promise<PreparedPriceListPdf | null> | null>(null);

    const { data: lists = [], isLoading: loadingLists } = useQuery({
        queryKey: ['price-lists', 'active-for-export'],
        queryFn: () => PriceListsService.getAll({ is_active: true, per_page: 100 }),
        select: (response) => response.items,
    });
    const { data: categories = [] } = useQuery({
        queryKey: ['product-categories', 'export'],
        queryFn: () => CategoriesService.getOperationalOptions(),
    });
    const { data: brands = [] } = useQuery({
        queryKey: ['product-brands', 'export'],
        queryFn: () => BrandsService.getOperationalOptions(),
    });
    const canBrowseProducts = can('inventory.view');
    const { data: productPage, isFetching: loadingProducts } = useQuery({
        queryKey: [
            'products',
            'price-list-export',
            filters.search,
            filters.category_id,
            filters.brand_id,
            page,
        ],
        queryFn: () =>
            ProductsService.getAll({
                q: filters.search,
                category_id: filters.category_id,
                brand_id: filters.brand_id,
                is_active: true,
                is_sellable: true,
                page,
                per_page: PAGE_SIZE,
                sort_by: 'name',
                sort_dir: 'asc',
            }),
        enabled: selectionMode === 'selected' && canBrowseProducts,
    });

    const invalidatePreview = () => {
        generationRef.current += 1;
        generatingRef.current = false;
        preparedPdfRef.current = null;
        generationPromiseRef.current = null;
        setPreparing(false);
        setPreviewData(null);
        setPreviewOpen(false);
        setPreviewUrl((url) => {
            if (url) URL.revokeObjectURL(url);
            return null;
        });
    };
    const updateFilters = (next: Partial<PriceListExportFilters>) => {
        invalidatePreview();
        setFilters((previous) => ({ ...previous, ...next }));
        setPage(1);
    };
    const toggleSelection = (id: string, selected: boolean) => {
        invalidatePreview();
        setSelectedIds((ids) =>
            selected ? [...new Set([...ids, id])] : ids.filter((value) => value !== id)
        );
    };
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [previewUrl]
    );

    const preparePdf = async (): Promise<PreparedPriceListPdf | null> => {
        if (preparedPdfRef.current) return preparedPdfRef.current;
        if (generationPromiseRef.current) return generationPromiseRef.current;
        if (pricingMode === 'price_list' && !priceListId) {
            message.warning('Seleccioná una lista comercial para continuar.');
            return null;
        }
        if (selectionMode === 'selected' && selectedIds.length === 0) {
            message.warning('Seleccioná al menos un producto para generar la lista.');
            return null;
        }
        const generation = generationRef.current + 1;
        generationRef.current = generation;
        generatingRef.current = true;
        setPreparing(true);
        const task = (async (): Promise<PreparedPriceListPdf | null> => {
            try {
                const data = await PriceListsService.exportData({
                    pricing_mode: pricingMode,
                    ...(pricingMode === 'price_list' ? { price_list_id: priceListId } : {}),
                    selection_mode: selectionMode,
                    ...(selectionMode === 'selected' ? { product_ids: selectedIds } : {}),
                    filters:
                        selectionMode === 'selected'
                            ? { include_out_of_stock: filters.include_out_of_stock }
                            : filters,
                });
                if (generationRef.current !== generation) return null;
                if (data.products.length === 0) {
                    setPreviewData(data);
                    message.info('No hay productos elegibles para la configuración seleccionada.');
                    return null;
                }
                const blob = await createPriceListPdf(data, { groupByCategory: groupByCategory });
                if (generationRef.current !== generation) return null;
                const prepared = { blob, data };
                preparedPdfRef.current = prepared;
                setPreviewData(data);
                if (data.excluded_product_ids.length > 0)
                    message.warning(
                        'Algunos productos seleccionados ya no están disponibles y fueron excluidos.'
                    );
                return prepared;
            } catch (error) {
                if (generationRef.current !== generation) return null;
                const apiError = error as ApiError;
                message.error(apiError.message || 'No se pudo preparar la lista de precios.');
                return null;
            } finally {
                if (generationRef.current === generation) {
                    generatingRef.current = false;
                    setPreparing(false);
                }
            }
        })();
        generationPromiseRef.current = task;
        try {
            return await task;
        } finally {
            if (generationPromiseRef.current === task) generationPromiseRef.current = null;
        }
    };
    const [groupByCategory, setGroupByCategory] = useState(true);
    const changeOption = (value: boolean) => {
        invalidatePreview();
        setGroupByCategory(value);
    };
    const download = async () => {
        const prepared = await preparePdf();
        if (!prepared) return;
        const url = URL.createObjectURL(prepared.blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `lista-de-precios-${prepared.data.price_list?.name ?? 'precios-generales'}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
    };
    const preview = async () => {
        const prepared = await preparePdf();
        if (!prepared) return;
        setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return URL.createObjectURL(prepared.blob);
        });
        setPreviewOpen(true);
    };
    const print = async () => {
        const prepared = await preparePdf();
        if (!prepared) return;
        try {
            await printA4PdfBlob(prepared.blob);
        } catch {
            message.error(
                'No se pudo iniciar la impresión. Verificá que el navegador permita el diálogo de impresión.'
            );
        }
    };

    return (
        <div className="priceListExportPage">
            <Breadcrumb
                className="mb-2"
                items={[
                    { title: <Link to="/tienda/dashboard">Tienda</Link> },
                    {
                        title: (
                            <Link to="/tienda/configuraciones/listas-de-precios">
                                Listas de precios
                            </Link>
                        ),
                    },
                    { title: 'Generar lista' },
                ]}
            />
            <h1>Generar lista de precios</h1>
            <p className="priceListExportLead">
                Prepará una lista comercial para compartir con tus clientes.
            </p>

            <section className="priceListExportSection">
                <h2>A. Precios</h2>
                <Select
                    aria-label="Precios"
                    loading={loadingLists}
                    value={pricingMode === 'general' ? GENERAL_PRICE_OPTION : priceListId}
                    onChange={(value) => {
                        invalidatePreview();
                        if (value === GENERAL_PRICE_OPTION) {
                            setPricingMode('general');
                            setPriceListId(undefined);
                            return;
                        }
                        setPricingMode('price_list');
                        setPriceListId(value);
                    }}
                    options={[
                        { value: GENERAL_PRICE_OPTION, label: 'Precios generales (sin descuento)' },
                        ...lists.map((list) => ({
                            value: list.id,
                            label: `${list.name} · ${formatDiscountPercentage(list.discount_percentage)}`,
                        })),
                    ]}
                    className="priceListExportControl"
                />
            </section>
            <section className="priceListExportSection">
                <h2>B. Selección de productos</h2>
                <Radio.Group
                    value={selectionMode}
                    onChange={(event) => {
                        invalidatePreview();
                        setSelectionMode(event.target.value);
                    }}
                >
                    <Radio value="filtered">Todos los productos filtrados</Radio>
                    <Radio value="selected">Selección personalizada</Radio>
                </Radio.Group>
                <p className="priceListExportHint">
                    {selectionMode === 'filtered'
                        ? 'Se exportarán todos los resultados coincidentes, no sólo los que se vean en una página.'
                        : `${selectedIds.length} producto${selectedIds.length === 1 ? '' : 's'} seleccionado${selectedIds.length === 1 ? '' : 's'}.`}
                </p>
                {selectionMode === 'selected' && !canBrowseProducts && (
                    <Alert
                        type="info"
                        showIcon
                        title="La selección personalizada requiere permiso para ver Productos."
                        description="Con tu acceso actual podés exportar todos los productos filtrados."
                    />
                )}
                <div className="priceListExportFilters">
                    <Input
                        value={filters.search}
                        onChange={(event) =>
                            updateFilters({ search: event.target.value || undefined })
                        }
                        placeholder="Buscar por nombre o código"
                        allowClear
                    />
                    <Select
                        value={filters.category_id}
                        onChange={(value) => updateFilters({ category_id: value })}
                        allowClear
                        placeholder="Categoría"
                        options={categories.map((category) => ({
                            value: category.id,
                            label: category.name,
                        }))}
                    />
                    <Select
                        value={filters.brand_id}
                        onChange={(value) => updateFilters({ brand_id: value })}
                        allowClear
                        placeholder="Marca"
                        options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
                    />
                </div>
                {selectionMode === 'selected' && canBrowseProducts && (
                    <>
                        <div className="priceListExportSelectionActions">
                            <Button
                                variant="link"
                                label="Limpiar selección"
                                disabled={!selectedIds.length}
                                action={() => {
                                    invalidatePreview();
                                    setSelectedIds([]);
                                }}
                            />
                            <Tag>
                                {selectedIds.length} seleccionado
                                {selectedIds.length === 1 ? '' : 's'}
                            </Tag>
                        </div>
                        <div className="priceListExportProducts">
                            {loadingProducts ? (
                                <Spin />
                            ) : (
                                productPage?.items.map((product) => (
                                    <Checkbox
                                        key={product.id}
                                        checked={selectedSet.has(product.id)}
                                        onChange={(event) =>
                                            toggleSelection(product.id, event.target.checked)
                                        }
                                    >
                                        <strong>{product.name}</strong>
                                        <span>Código: {product.sku}</span>
                                    </Checkbox>
                                ))
                            )}
                        </div>
                        <Pagination
                            current={page}
                            total={productPage?.total ?? 0}
                            pageSize={PAGE_SIZE}
                            onChange={setPage}
                            size="small"
                            showSizeChanger={false}
                        />
                    </>
                )}
            </section>
            <section className="priceListExportSection">
                <h2>C. Opciones del documento</h2>
                <div className="priceListExportOptions">
                    <label>
                        <Switch
                            checked={filters.include_out_of_stock}
                            onChange={(checked) => updateFilters({ include_out_of_stock: checked })}
                        />{' '}
                        Incluir productos sin stock
                    </label>
                    <label>
                        <Switch checked={groupByCategory} onChange={changeOption} /> Agrupar por
                        categoría
                    </label>
                    <span>Orden: Nombre A-Z</span>
                </div>
            </section>
            <section className="priceListExportSection">
                <h2>D. Vista previa y generación</h2>
                {previewData && !preparedPdfRef.current && (
                    <Empty description="No hay productos elegibles para generar el documento." />
                )}
                {previewData?.excluded_product_ids.length ? (
                    <Alert
                        type="warning"
                        showIcon
                        title={`${previewData.excluded_product_ids.length} producto(s) quedaron excluidos por no estar disponibles.`}
                    />
                ) : null}
                <div className="priceListExportActions">
                    <Button
                        icon={<DownloadOutlined />}
                        label="Descargar PDF"
                        action={download}
                        loading={preparing}
                        disabled={preparing}
                    />
                    <Button
                        variant="default"
                        icon={<EyeOutlined />}
                        label="Vista previa"
                        action={preview}
                        loading={preparing}
                        disabled={preparing}
                    />
                    <Button
                        variant="default"
                        icon={<PrinterOutlined />}
                        label="Imprimir"
                        action={print}
                        loading={preparing}
                        disabled={preparing}
                    />
                </div>
            </section>
            <Modal
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
                width="min(1100px, 96vw)"
                title="Vista previa de lista de precios"
                destroyOnHidden={false}
            >
                {previewUrl ? (
                    <iframe
                        className="priceListExportPreview"
                        title="Vista previa del PDF"
                        src={previewUrl}
                    />
                ) : (
                    <Spin />
                )}
            </Modal>
        </div>
    );
};
