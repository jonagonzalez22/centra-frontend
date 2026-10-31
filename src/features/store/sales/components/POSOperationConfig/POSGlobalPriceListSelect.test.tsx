import { fireEvent, render, screen } from '@testing-library/react';
import { usePOSStore } from '../../stores/usePOSStore';
import { POSGlobalPriceListSelect } from './POSGlobalPriceListSelect';

vi.mock('antd', () => ({
  Select: ({ 'aria-label': ariaLabel, value, options, onChange }: {
    'aria-label': string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ),
}));

beforeEach(() => {
  usePOSStore.getState().resetPOS();
  usePOSStore.getState().setAvailablePriceLists([
    { id: 'wholesale', name: 'Mayorista', discount_percentage: '10.00', is_active: true, created_at: '', updated_at: '' },
  ]);
});

test('uses the existing global POS state instead of an independent default-list state', () => {
  render(<POSGlobalPriceListSelect />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Lista de precios global' }), {
    target: { value: 'wholesale' },
  });

  expect(usePOSStore.getState()).toMatchObject({
    selected_price_list_id: 'wholesale',
    selected_price_list_name: 'Mayorista',
    selected_discount_percentage: 10,
  });
});
