import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
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
