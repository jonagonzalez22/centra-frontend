import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { ProductForm } from './ProductForm';
import { buildStockConsumptionDescription, sourceOptionMatches } from '../../utils/stockSourcePresentation';

const measurementUnits = [
    { id: 'unit-1', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
    { id: 'kg-1', code: 'kg', name: 'Kilogramo', symbol: 'kg', category: 'weight' },
    { id: 'l-1', code: 'l', name: 'Litro', symbol: 'L', category: 'volume' },
];

const renderForm = (overrides: Partial<ComponentProps<typeof ProductForm>> = {}) => render(
    <ProductForm
        loading={false}
        categories={[{ id: 'category-1', name: 'Herramientas', description: null, is_active: true }]}
        categoriesLoading={false}
        measurementUnits={measurementUnits}
        measurementUnitsLoading={false}
        defaultMeasurementUnitId="unit-1"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        {...overrides}
    />,
);

const ProductFormHarness = ({
    onReady,
    ...props
}: ComponentProps<typeof ProductForm> & { onReady: (form: FormInstance) => void }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        onReady(form);
    }, [form, onReady]);

    return <ProductForm {...props} form={form} />;
};

const renderControlledForm = (overrides: Partial<ComponentProps<typeof ProductForm>> = {}) => {
    let controlledForm: FormInstance | undefined;
    const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);

    render(
        <ProductFormHarness
            loading={false}
            categories={[{ id: 'category-1', name: 'Herramientas', description: null, is_active: true }]}
            categoriesLoading={false}
            measurementUnits={measurementUnits}
            measurementUnitsLoading={false}
            defaultMeasurementUnitId="unit-1"
            onSubmit={onSubmit}
            onReady={(form) => { controlledForm = form; }}
            {...overrides}
        />,
    );

    return {
        form: () => controlledForm as FormInstance,
        onSubmit,
    };
};

describe('ProductForm UOM configuration', () => {
    it('renders the measurement unit selector and sale step with safe defaults', () => {
        renderForm();

        expect(screen.getByText('Código')).toBeInTheDocument();
        expect(screen.getByText('Disponible para venta')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.queryByText('Código Interno (SKU)')).not.toBeInTheDocument();
        expect(screen.getByText('Unidad de medida')).toBeInTheDocument();
        expect(screen.getByText('Cantidad mínima de venta')).toBeInTheDocument();
        expect(screen.getByText('Define la cantidad mínima en la que se puede vender o pedir este producto.')).toBeInTheDocument();
        expect(screen.getByText('Marca')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(3);
    });

    it('matches source options by name or code', () => {
        const option = { label: 'Jabón Ariel granel · ARIEL-GR · L' };

        expect(sourceOptionMatches('ariel', option)).toBe(true);
        expect(sourceOptionMatches('ARIEL-GR', option)).toBe(true);
        expect(sourceOptionMatches('detergente', option)).toBe(false);
    });

    it('formats the contextual consumption copy without technical trailing zeroes', () => {
        const source = {
            id: 'source-1',
            name: 'Producto fuente',
            sku: 'FUENTE-1',
            stock_source_product_id: null,
            stock_measurement_unit: measurementUnits[1],
        };

        expect(buildStockConsumptionDescription(source, '1.0000', 'u'))
            .toBe('Consumo: 1 kg de Producto fuente por cada 1 u de este producto.');
        expect(buildStockConsumptionDescription(source, '0.5000', 'u'))
            .toBe('Consumo: 0,5 kg de Producto fuente por cada 1 u de este producto.');
    });
});

describe('ProductForm initial suppliers', () => {
    const suppliers = [
        { id: 'supplier-1', business_name: 'Proveedor uno', is_active: true },
        { id: 'supplier-2', business_name: 'Proveedor dos', is_active: true },
    ];

    it('renders an optional supplier section without implying it is required', () => {
        renderForm({ suppliers });

        expect(screen.getByText('Proveedores')).toBeInTheDocument();
        expect(screen.getByText('Opcional')).toBeInTheDocument();
        expect(screen.getByText('Asociá proveedores sólo si este producto se compra a terceros.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Agregar proveedor' })).toBeInTheDocument();
    });

    it('adds and removes an initial supplier relation', () => {
        renderForm({ suppliers });

        fireEvent.click(screen.getByRole('button', { name: 'Agregar proveedor' }));
        expect(screen.getByText('Proveedor')).toBeInTheDocument();
        expect(screen.getByText('Código proveedor')).toBeInTheDocument();
        expect(screen.getByText('Nombre según proveedor')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: 'Proveedor preferido' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Quitar proveedor' }));
        expect(screen.queryByRole('checkbox', { name: 'Proveedor preferido' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Agregar proveedor' })).toBeInTheDocument();
    }, 10000);

    it('hides and clears suppliers when changing to shared stock, then restores an empty section for own stock', async () => {
        const { form } = renderControlledForm({ suppliers });

        await waitFor(() => expect(form()).toBeDefined());
        act(() => {
            form().setFieldValue('suppliers', [{ supplier_id: 'supplier-1', is_preferred: true }]);
        });

        fireEvent.click(screen.getByRole('switch', { name: 'Usa stock de otro producto' }));

        await waitFor(() => {
            expect(screen.queryByText('Proveedores')).not.toBeInTheDocument();
            expect(form().getFieldValue('suppliers')).toEqual([]);
        });

        fireEvent.click(screen.getByRole('switch', { name: 'Usa stock de otro producto' }));

        await waitFor(() => {
            expect(screen.getByText('Proveedores')).toBeInTheDocument();
            expect(form().getFieldValue('suppliers')).toEqual([]);
        });
    });

    it('omits supplier associations from a shared-stock create payload', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const { form } = renderControlledForm({ suppliers, onSubmit });

        await waitFor(() => expect(form()).toBeDefined());
        act(() => {
            form().setFieldsValue({
                name: 'Producto compartido',
                sku: 'SHARED-001',
                category_id: 'category-1',
                price: 100,
                cost: 50,
                stock_measurement_unit_id: 'unit-1',
                sale_quantity_step: '1.0000',
                stock_source_product_id: 'source-1',
                stock_consumption_quantity: '1.0000',
                suppliers: [{ supplier_id: 'supplier-1' }],
            });
        });

        fireEvent.click(screen.getByRole('switch', { name: 'Usa stock de otro producto' }));
        await waitFor(() => expect(form().getFieldValue('suppliers')).toEqual([]));

        await act(async () => {
            form().submit();
        });

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(onSubmit.mock.calls[0][0].suppliers).toBeUndefined();
    }, 10000);
});
