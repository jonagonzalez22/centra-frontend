import { render, screen } from '@testing-library/react';
import { ProductForm } from './ProductForm';

describe('ProductForm UOM configuration', () => {
    it('renders the measurement unit selector and sale step with safe defaults', () => {
        render(
            <ProductForm
                loading={false}
                categories={[{ id: 'category-1', name: 'Herramientas', description: null, is_active: true }]}
                categoriesLoading={false}
                measurementUnits={[
                    { id: 'unit-1', code: 'unit', name: 'Unidad', symbol: 'u', category: 'unit' },
                    { id: 'kg-1', code: 'kg', name: 'Kilogramo', symbol: 'kg', category: 'weight' },
                ]}
                measurementUnitsLoading={false}
                defaultMeasurementUnitId="unit-1"
                onSubmit={vi.fn().mockResolvedValue(undefined)}
            />,
        );

        expect(screen.getByText('Unidad de medida')).toBeInTheDocument();
        expect(screen.getByText('Cantidad mínima de venta')).toBeInTheDocument();
        expect(screen.getByText('Define la cantidad mínima en la que se puede vender o pedir este producto.')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(2);
    });
});
